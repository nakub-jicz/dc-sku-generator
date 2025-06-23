import { useState } from "react";
import { useAppBridge } from "@shopify/app-bridge-react";
import { Form } from "@remix-run/react";
import {
    Card,
    Button,
    BlockStack,
    Text,
    IndexTable,
    InlineStack,
    Checkbox,
} from "@shopify/polaris";
import { DeleteIcon } from "@shopify/polaris-icons";

import type { ZasadyGeneratora } from "../types/ZasadyGeneratora";
import { generujPojedynczeSKU } from "../services/generatorSKU";

// Uproszczone typy, żeby uniknąć problemów z App Bridge
interface AppBridgeVariant {
    id: string;
    title: string;
    sku: string | null;
}

interface AppBridgeProduct {
    id: string;
    title: string;
    variants: AppBridgeVariant[];
}

interface PodgladProduktowProps {
    zasady: ZasadyGeneratora;
}

// Typ dla wariantu produktu - na razie uproszczony
interface ProductVariant {
    id: string;
    title: string;
    sku: string | null;
    product: {
        id: string;
        title: string;
        vendor: string;
        productType: string;
    };
    selectedOptions: Array<{
        name: string;
        value: string;
    }>;
}

interface AppBridgeProduct {
    id: string;
    title: string;
    vendor: string;
    productType: string;
    variants: Omit<ProductVariant, 'product' | 'selectedOptions'>[];
}

/**
 * Komponent do wyboru produktów i podglądu, jak zmienią się ich SKU.
 *
 * MISJA: Umożliwia wybór produktów za pomocą natywnego ResourcePicker'a Shopify
 * i wyświetla tabelę z obecnymi i przyszłymi SKU.
 *
 * TAKTYKA: Używa App Bridge do otwarcia selektora produktów. Tabela na razie
 * pokazuje tylko szkielet danych, który wkrótce zostanie wypełniony
 * dynamicznie generowanymi SKU.
 */
export function PodgladProduktow({ zasady }: PodgladProduktowProps) {
    const [wybraneProdukty, setWybraneProdukty] = useState<AppBridgeProduct[]>([]);
    const [selectedVariants, setSelectedVariants] = useState<string[]>([]);
    const shopify = useAppBridge();

    const handleProductSelection = async () => {
        try {
            const produkty = await shopify.resourcePicker({
                type: "product",
                action: "select",
                multiple: true,
            });

            if (produkty) {
                setWybraneProdukty((currentProducts) => {
                    const currentIds = new Set(currentProducts.map((p) => p.id));
                    const newProducts = (produkty as AppBridgeProduct[]).filter(
                        (p) => !currentIds.has(p.id)
                    );
                    return [...currentProducts, ...newProducts];
                });
            }
        } catch (error) {
            console.error("ResourcePicker error:", error);
        }
    };

    const handleRemoveProduct = (productId: string) => {
        setWybraneProdukty((currentProducts) =>
            currentProducts.filter((p) => p.id !== productId)
        );
    };

    const handleRemoveVariant = (variantId: string) => {
        setWybraneProdukty((currentProducts) =>
            currentProducts.map((product) => ({
                ...product,
                variants: product.variants.filter((v) => v.id !== variantId),
            }))
        );
    };

    const allVariants = wybraneProdukty.flatMap((product) =>
        product.variants.map((variant) => ({
            ...variant,
            product: {
                id: product.id,
                title: product.title,
                vendor: product.vendor,
                productType: product.productType,
            },
            selectedOptions: variant.title.split(' / ').map(opt => ({ name: 'Option', value: opt }))
        }))
    );
    const allVariantIds = allVariants.map(v => v.id);

    // Obsługa zaznaczania pojedynczego wariantu
    const handleVariantCheckbox = (variantId: string, checked: boolean) => {
        setSelectedVariants(prev => {
            if (checked) {
                return [...prev, variantId];
            } else {
                return prev.filter(id => id !== variantId);
            }
        });
    };

    // Obsługa zaznaczania wszystkich wariantów produktu
    const handleProductCheckbox = (product: AppBridgeProduct, checked: boolean) => {
        const variantIds = product.variants.map(v => v.id);
        setSelectedVariants(prev => {
            if (checked) {
                // Dodaj wszystkie warianty produktu, bez duplikatów
                return Array.from(new Set([...prev, ...variantIds]));
            } else {
                // Usuń wszystkie warianty produktu
                return prev.filter(id => !variantIds.includes(id));
            }
        });
    };

    // Obsługa select all
    const handleSelectAll = (checked: boolean) => {
        setSelectedVariants(checked ? allVariantIds : []);
    };

    // Wyliczanie stanu globalnego checkboxa
    const allItemsSelected = allVariantIds.length > 0 && selectedVariants.length === allVariantIds.length;
    const someItemsSelected = selectedVariants.length > 0 && !allItemsSelected;

    let flatIndex = -1;
    const rowMarkup = wybraneProdukty.flatMap(product => {
        const variantIds = product.variants.map(v => v.id);
        const selectedCount = variantIds.filter(id => selectedVariants.includes(id)).length;
        const allSelected = selectedCount === variantIds.length && variantIds.length > 0;
        const indeterminate = selectedCount > 0 && selectedCount < variantIds.length;

        // Nagłówek produktu z własnym checkboxem
        flatIndex++;
        const productRow = (
            <IndexTable.Row key={product.id} id={product.id} position={flatIndex}>
                <IndexTable.Cell colSpan={4}>
                    <div style={{ display: 'flex', alignItems: 'center', fontWeight: 600, background: '#fafbfc', borderRadius: 4, padding: '0.5rem 0.75rem', margin: '0.25rem 0' }}>
                        <span style={{ marginRight: '1rem' }}>
                            <Checkbox
                                checked={allSelected ? true : (indeterminate ? 'indeterminate' : false)}
                                onChange={checked => handleProductCheckbox(product, checked)}
                                label={product.title}
                                labelHidden
                            />
                        </span>
                        <span style={{ flex: 1 }}>{product.title}</span>
                        <Button
                            variant="plain"
                            tone="critical"
                            icon={DeleteIcon}
                            onClick={() => handleRemoveProduct(product.id)}
                            accessibilityLabel={`Remove product ${product.title}`}
                        >Usuń produkt</Button>
                    </div>
                </IndexTable.Cell>
            </IndexTable.Row>
        );
        // Warianty pod produktem
        const variantRows = product.variants.map((variant) => {
            flatIndex++;
            return (
                <IndexTable.Row key={variant.id} id={variant.id} position={flatIndex} selected={selectedVariants.includes(variant.id)}>
                    <IndexTable.Cell>
                        <div style={{ paddingLeft: '2.5rem', display: 'flex', alignItems: 'center' }}>
                            <Checkbox
                                checked={selectedVariants.includes(variant.id)}
                                onChange={checked => handleVariantCheckbox(variant.id, checked)}
                                label={variant.title}
                                labelHidden
                            />
                            <span style={{ marginLeft: '0.75rem', color: '#666' }}>{variant.title}</span>
                        </div>
                    </IndexTable.Cell>
                    <IndexTable.Cell>{variant.sku || "No SKU"}</IndexTable.Cell>
                    <IndexTable.Cell>
                        {generujPojedynczeSKU(zasady, {
                            ...variant,
                            product: {
                                id: product.id,
                                title: product.title,
                                vendor: product.vendor,
                                productType: product.productType,
                            },
                            selectedOptions: variant.title.split(' / ').map(opt => ({ name: 'Option', value: opt }))
                        }, flatIndex)}
                    </IndexTable.Cell>
                    <IndexTable.Cell>
                        <Button
                            variant="plain"
                            tone="critical"
                            icon={DeleteIcon}
                            onClick={() => handleRemoveVariant(variant.id)}
                            accessibilityLabel={`Remove variant ${variant.title}`}
                        />
                    </IndexTable.Cell>
                </IndexTable.Row>
            );
        });
        return [productRow, ...variantRows];
    });

    const wybraneWariantyDoZapisu = allVariants.filter(v => selectedVariants.includes(v.id));

    return (
        <Card>
            <Form method="post">
                <input type="hidden" name="zasady" value={JSON.stringify(zasady)} />
                <input type="hidden" name="warianty" value={JSON.stringify(wybraneWariantyDoZapisu)} />
                <BlockStack gap="400">
                    <InlineStack align="space-between">
                        <Text variant="headingMd" as="h2">
                            Product Preview
                        </Text>
                        <Button onClick={handleProductSelection}>Add Products</Button>
                    </InlineStack>
                    {wybraneProdukty.length > 0 && (
                        <IndexTable
                            resourceName={{ singular: "variant", plural: "variants" }}
                            itemCount={allVariants.length}
                            selectedItemsCount={allItemsSelected ? "All" : selectedVariants.length}
                            selectable={false}
                            headings={[
                                {
                                    id: 'product',
                                    title: (
                                        <InlineStack gap="400" blockAlign="center" wrap={false}>
                                            <Checkbox
                                                label="Select all variants"
                                                labelHidden
                                                checked={allItemsSelected ? true : (someItemsSelected ? 'indeterminate' : false)}
                                                onChange={handleSelectAll}
                                            />
                                            <Text as="span">Product / Variant</Text>
                                        </InlineStack>
                                    )
                                },
                                { title: "Current SKU" },
                                { title: "New SKU" },
                                { title: "Actions" },
                            ]}
                        >
                            {rowMarkup}
                        </IndexTable>
                    )}
                    <BlockStack>
                        <Button
                            variant="primary"
                            size="large"
                            submit
                            disabled={wybraneWariantyDoZapisu.length === 0}
                        >
                            Generate SKUs for {`${wybraneWariantyDoZapisu.length}`} variant{wybraneWariantyDoZapisu.length === 1 ? '' : 's'}
                        </Button>
                    </BlockStack>
                </BlockStack>
            </Form>
        </Card>
    );
} 