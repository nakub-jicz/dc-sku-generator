import type { ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { UPDATE_PRODUCT_SET_SYNC, UPDATE_PRODUCT_SET_ASYNC } from "../graphql/products";
import { generujPojedynczeSKU } from "../services/generatorSKU";
import type { ZasadyGeneratora } from "../types/ZasadyGeneratora";
import type { ProductVariant } from "../graphql/types";

interface UpdateSKURequest {
    zasady: ZasadyGeneratora;
    warianty: ProductVariant[];
}

export const action = async ({ request }: ActionFunctionArgs) => {
    const { admin } = await authenticate.admin(request);

    if (request.method !== "POST") {
        return json({ error: "Method not allowed" }, { status: 405 });
    }

    try {
        const { zasady, warianty }: UpdateSKURequest = await request.json();

        if (!zasady || !warianty || !Array.isArray(warianty) || warianty.length === 0) {
            return json({
                success: false,
                error: "Invalid request: missing zasady or warianty"
            }, { status: 400 });
        }

        // Grupujemy warianty według produktu dla optymalizacji mutacji
        const variantsByProduct = warianty.reduce((acc, variant) => {
            const productId = variant.product.id;
            if (!acc[productId]) {
                acc[productId] = {
                    product: variant.product,
                    variants: []
                };
            }
            acc[productId].variants.push(variant);
            return acc;
        }, {} as Record<string, { product: ProductVariant["product"], variants: ProductVariant[] }>);

        let updatedProductsCount = 0;
        let updatedVariantsCount = 0;
        const errors: string[] = [];
        const successfulUpdates: Array<{
            productId: string;
            productTitle: string;
            updatedVariants: number;
        }> = [];

        // Przetwarzamy każdy produkt osobno zgodnie z najlepszymi praktykami Shopify
        for (const [productId, { product, variants }] of Object.entries(variantsByProduct)) {
            try {
                // Sprawdzamy czy to jest produkt z jedną opcją (single-option)
                const isSingleOption = variants.length === 1 &&
                    (variants[0].selectedOptions.length === 0 ||
                        (variants[0].selectedOptions.length === 1 && variants[0].selectedOptions[0].name === "Title"));

                // Generujemy nowe SKU dla każdego wariantu z właściwymi optionValues
                const variantsWithNewSku = variants.map((variant, index) => {
                    let optionValues: Array<{ name: string; optionName: string }>;

                    if (isSingleOption) {
                        // Dla produktów z jedną opcją używamy "Title" i "Default Title"
                        optionValues = [{ name: "Default Title", optionName: "Title" }];
                    } else {
                        // Dla produktów z wieloma opcjami używamy rzeczywistych opcji
                        optionValues = variant.selectedOptions.map(option => ({
                            name: option.value,
                            optionName: option.name
                        }));
                    }

                    return {
                        id: variant.id,
                        sku: generujPojedynczeSKU(zasady, variant, index),
                        optionValues: optionValues
                    };
                });

                // Generujemy opcje produktu
                let productOptionsInput: Array<{ name: string; values: Array<{ name: string }> }>;

                if (isSingleOption) {
                    // Dla produktów z jedną opcją używamy "Title" i "Default Title"
                    productOptionsInput = [
                        { name: "Title", values: [{ name: "Default Title" }] }
                    ];
                } else {
                    // Dla produktów z wieloma opcjami zbieramy wszystkie unikalne opcje
                    const productOptions = new Map<string, Set<string>>();

                    variants.forEach(variant => {
                        variant.selectedOptions.forEach(option => {
                            if (!productOptions.has(option.name)) {
                                productOptions.set(option.name, new Set());
                            }
                            productOptions.get(option.name)!.add(option.value);
                        });
                    });

                    // Konwertujemy na format wymagany przez API
                    productOptionsInput = Array.from(productOptions.entries()).map(([name, values]) => ({
                        name: name,
                        values: Array.from(values).map(value => ({ name: value }))
                    }));
                }

                // Wybieramy synchroniczną lub asynchroniczną mutację na podstawie liczby wariantów
                const useSynchronous = variants.length <= 100;
                const mutation = useSynchronous ? UPDATE_PRODUCT_SET_SYNC : UPDATE_PRODUCT_SET_ASYNC;

                const inputData = {
                    id: productId,
                    productOptions: productOptionsInput,
                    variants: variantsWithNewSku
                };

                // DEBUG: Logujemy co wysyłamy
                console.log(`[API DEBUG] Product ${productId} (${product.title}) - ${isSingleOption ? 'single-option' : 'multi-option'}:`, JSON.stringify(inputData, null, 2));
                console.log(`[API DEBUG] Using ${useSynchronous ? 'sync' : 'async'} mutation`);

                // Wykonujemy mutację productSet zgodnie z API 2025-01
                const response = await admin.graphql(mutation, {
                    variables: {
                        input: inputData
                    }
                });

                const data = await response.json();

                // Sprawdzamy GraphQL errors
                if ((data as any).errors) {
                    console.error("GraphQL errors for product", productId, ":", (data as any).errors);
                    errors.push(`${product.title}: ${(data as any).errors.map((e: any) => e.message).join(', ')}`);
                    continue;
                }

                const result = data.data?.productSet;

                // Sprawdzamy user errors
                if (result?.userErrors && result.userErrors.length > 0) {
                    console.error("User errors for product", productId, ":", result.userErrors);
                    errors.push(`${product.title}: ${result.userErrors.map((e: any) => e.message).join(', ')}`);
                    continue;
                }

                // Liczymy powodzenia
                if (result?.product?.variants?.edges && result.product.variants.edges.length > 0) {
                    updatedProductsCount++;
                    updatedVariantsCount += result.product.variants.edges.length;
                    successfulUpdates.push({
                        productId: productId,
                        productTitle: product.title,
                        updatedVariants: result.product.variants.edges.length
                    });

                    console.log(`Successfully updated ${result.product.variants.edges.length} variants for product "${product.title}" using ${useSynchronous ? 'sync' : 'async'} productSet`);
                }

            } catch (error) {
                console.error(`Error updating product ${productId} (${product.title}):`, error);
                errors.push(`${product.title}: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        }

        // Sprawdzamy czy jakiekolwiek aktualizacje się powiodły
        if (updatedVariantsCount === 0) {
            return json({
                success: false,
                error: "No SKUs were updated successfully",
                details: errors,
                updatedProductsCount: 0,
                updatedVariantsCount: 0
            }, { status: 500 });
        }

        // Zwracamy sukces z detalami
        return json({
            success: true,
            updatedProductsCount,
            updatedVariantsCount,
            successfulUpdates,
            errors: errors.length > 0 ? errors : undefined,
            message: `Successfully updated ${updatedVariantsCount} SKU${updatedVariantsCount !== 1 ? 's' : ''} across ${updatedProductsCount} product${updatedProductsCount !== 1 ? 's' : ''}`
        });

    } catch (error) {
        console.error("API error in update-variants-sku:", error);
        return json({
            success: false,
            error: error instanceof Error ? error.message : "Unknown server error",
            updatedProductsCount: 0,
            updatedVariantsCount: 0
        }, { status: 500 });
    }
}; 