import { useState, useMemo, useEffect } from "react";
import { useAppBridge } from "@shopify/app-bridge-react";
import { Form, useNavigate } from "@remix-run/react";
import {
    Card,
    Button,
    BlockStack,
    Text,
    InlineStack,
    Checkbox,
    Thumbnail,
    Badge,
    Divider,
    EmptyState,
    Toast,
} from "@shopify/polaris";
import { ImageIcon, XIcon } from "@shopify/polaris-icons";
import styles from './PodgladProduktow.module.css';
import type { Dispatch, SetStateAction } from "react";

import type { ZasadyGeneratora } from "../types/ZasadyGeneratora";
import { generujPojedynczeSKU } from "../services/generatorSKU";

// Import the ProductVariant type from the generator service
interface ProductVariant {
    id: string;
    title: string;
    sku: string | null;
    product: {
        id: string;
        title: string;
        vendor: string;
        productType: string;
        images?: Array<{
            id: string;
            url: string;
            altText?: string;
        }>;
    };
    selectedOptions: Array<{
        name: string;
        value: string;
    }>;
}

interface PodgladProduktowProps {
    zasady: ZasadyGeneratora;
    products: ProductVariant[];
    selectedVariantIds: string[];
    setSelectedVariantIds: Dispatch<SetStateAction<string[]>>;
    scope?: string;
}

/**
 * Komponent do wyświetlania produktów w kompaktowej formie z możliwością wyboru
 * i podglądu generowanych SKU.
 */
export function PodgladProduktow({ zasady, products, selectedVariantIds, setSelectedVariantIds, scope }: PodgladProduktowProps) {
    const shopify = useAppBridge();
    const navigate = useNavigate();
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [pickedVariants, setPickedVariants] = useState<ProductVariant[] | null>(null);
    const [, setPickedProducts] = useState<any[]>([]);
    const [hiddenProductIds, setHiddenProductIds] = useState<Set<string>>(new Set());

    // Use pickedVariants if set, otherwise fallback to loader products (filtered by hidden)
    const displayVariants = (pickedVariants ?? products).filter(variant => !hiddenProductIds.has(variant.product.id));

    // Reset pickedVariants only when scope changes to 'all'
    useEffect(() => {
        console.log('PodgladProduktow useEffect:', { scope, productsLength: products.length, pickedVariants: pickedVariants?.length });
        if (scope === 'all' && pickedVariants !== null) {
            console.log('Resetting pickedVariants because scope=all');
            setPickedVariants(null);
        }
        // Reset hidden products when scope changes
        setHiddenProductIds(new Set());
        // Gdy scope='products' albo 'none' - nie resetuj pickedVariants
    }, [scope]); // Usuwam products.length i pickedVariants z dependencies żeby uniknąć niepotrzebnych re-renderów

    // Grupowanie wariantów po produkcie
    const groupedByProduct = useMemo(() => {
        const map = new Map<string, { product: ProductVariant["product"], variants: ProductVariant[] }>();
        for (const variant of displayVariants) {
            const pid = variant.product.id;
            if (!map.has(pid)) {
                map.set(pid, { product: variant.product, variants: [] });
            }
            map.get(pid)!.variants.push(variant);
        }
        return Array.from(map.values());
    }, [displayVariants]);

    // Fetch variants for picked products
    const fetchVariantsForProducts = async (productIds: string[]) => {
        setIsLoading(true);
        try {
            // Use a secure Remix API route instead of direct admin API fetch
            const res = await fetch("/api/get-variants", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ productIds }),
                credentials: "include",
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.error || `HTTP ${res.status}: ${res.statusText}`);
            }

            const products = await res.json();

            if (products.error) {
                throw new Error(products.error);
            }

            const variants: ProductVariant[] = products.flatMap((product: any) =>
                product.variants.nodes.map((variant: any) => ({
                    id: variant.id,
                    title: variant.title,
                    sku: variant.sku,
                    product: {
                        id: product.id,
                        title: product.title,
                        vendor: product.vendor,
                        productType: product.productType,
                        images: product.images.nodes,
                    },
                    selectedOptions: variant.selectedOptions,
                }))
            );

            setPickedVariants(variants);
            setShowToast(true);
            setToastMessage(`Loaded ${variants.length} variants from ${productIds.length} product${productIds.length > 1 ? 's' : ''}`);
            // Note: Nie zmieniamy scope tutaj - to będzie zrobione przez przycisk w KartaZasobowDocelowych
        } catch (error) {
            console.error("Error loading product variants:", error);
            setShowToast(true);
            setToastMessage(`Error loading product variants: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setIsLoading(false);
        }
    };

    // Handle ResourcePicker
    const handleProductSelection = async () => {
        setIsLoading(true);
        try {
            const result = await shopify.resourcePicker({
                type: "product",
                action: "select",
                multiple: true,
            });

            if (result && Array.isArray(result) && result.length > 0) {
                setPickedProducts(result);
                const productIds = result.map((product: any) => product.id).filter(Boolean);

                if (productIds.length === 0) {
                    throw new Error("No valid product IDs found");
                }

                await fetchVariantsForProducts(productIds);
            } else {
                setShowToast(true);
                setToastMessage("No products selected");
            }
        } catch (error) {
            console.error("ResourcePicker error:", error);
            setShowToast(true);
            setToastMessage(`Product selection error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setIsLoading(false);
        }
    };

    // Reset to all products - przekieruj do scope=all
    const handleReset = () => {
        // Wyczyść wybrane produkty i przekieruj do scope=all
        setPickedVariants(null);
        setPickedProducts([]);
        navigate("?scope=all", { replace: true });
    };

    const allVariantIds = displayVariants.map(v => v.id);
    const allItemsSelected = allVariantIds.length > 0 && selectedVariantIds.length === allVariantIds.length;
    const someItemsSelected = selectedVariantIds.length > 0 && !allItemsSelected;

    // Obsługa zaznaczania pojedynczego wariantu
    const handleVariantCheckbox = (variantId: string, checked: boolean) => {
        setSelectedVariantIds((prev: string[]) => {
            if (checked) {
                return [...prev, variantId];
            } else {
                return prev.filter((id: string) => id !== variantId);
            }
        });
    };

    // Obsługa zaznaczania wszystkich wariantów produktu
    const handleProductCheckbox = (product: ProductVariant["product"], checked: boolean) => {
        const variantIds = groupedByProduct.find(g => g.product.id === product.id)?.variants.map(v => v.id) || [];
        setSelectedVariantIds((prev: string[]) => {
            if (checked) {
                return Array.from(new Set([...prev, ...variantIds]));
            } else {
                return prev.filter((id: string) => !variantIds.includes(id));
            }
        });
    };

    // Obsługa select all
    const handleSelectAll = (checked: boolean) => {
        setSelectedVariantIds(() => (checked ? allVariantIds : []));
    };

    // Usuwanie całego produktu (wszystkich jego wariantów)
    const handleRemoveProduct = (productId: string) => {
        if (pickedVariants) {
            // Jeśli mamy wybrane produkty, usuń z nich
            const updatedVariants = pickedVariants.filter(variant => variant.product.id !== productId);
            setPickedVariants(updatedVariants);
        } else {
            // Jeśli pokazujemy wszystkie produkty, dodaj do ukrytych
            setHiddenProductIds(prev => new Set([...prev, productId]));
        }

        // Usuń także zaznaczenia dla usuniętych wariantów
        const removedVariantIds = displayVariants
            .filter(variant => variant.product.id === productId)
            .map(variant => variant.id);

        setSelectedVariantIds(prev => prev.filter(id => !removedVariantIds.includes(id)));

        setShowToast(true);
        setToastMessage("Product removed from selection");
    };

    // Usuwanie pojedynczego wariantu
    const handleRemoveVariant = (variantId: string) => {
        if (pickedVariants) {
            // Jeśli mamy wybrane produkty, usuń z nich
            const updatedVariants = pickedVariants.filter(variant => variant.id !== variantId);
            setPickedVariants(updatedVariants);
        } else {
            // Jeśli pokazujemy wszystkie produkty, znajdź produkt tego wariantu i ukryj go
            const variant = displayVariants.find(v => v.id === variantId);
            if (variant) {
                const productVariants = displayVariants.filter(v => v.product.id === variant.product.id);
                // Jeśli to ostatni wariant produktu, ukryj cały produkt
                if (productVariants.length === 1) {
                    setHiddenProductIds(prev => new Set([...prev, variant.product.id]));
                }
            }
        }

        // Zawsze usuń zaznaczenie dla usuniętego wariantu
        setSelectedVariantIds(prev => prev.filter(id => id !== variantId));

        setShowToast(true);
        setToastMessage("Variant removed from selection");
    };

    const wybraneWariantyDoZapisu = displayVariants.filter(v => selectedVariantIds.includes(v.id));

    // Renderowanie pustego stanu
    if (displayVariants.length === 0) {
        return (
            <Card>
                <EmptyState
                    heading="No products selected"
                    image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
                >
                    <p>Select products to generate SKUs for them.</p>
                    <Button onClick={handleProductSelection} variant="primary" loading={isLoading}>
                        Select Products
                    </Button>
                </EmptyState>
            </Card>
        );
    }

    return (
        <>
            <Card>
                <Form method="post">
                    <input type="hidden" name="zasady" value={JSON.stringify(zasady)} />
                    <input type="hidden" name="warianty" value={JSON.stringify(wybraneWariantyDoZapisu)} />
                    <BlockStack gap="400">
                        <InlineStack align="space-between">
                            <BlockStack gap="200">
                                <Text variant="headingMd" as="h2">
                                    Product Preview
                                </Text>
                                <Text as="p" variant="bodySm" tone="subdued">
                                    {`${selectedVariantIds.length} of ${allVariantIds.length} variants selected`}
                                </Text>
                            </BlockStack>
                            <InlineStack gap="200">
                                <Button onClick={handleProductSelection} variant="secondary" loading={isLoading}>
                                    Select Products
                                </Button>
                                <Button onClick={handleReset} variant="tertiary" disabled={pickedVariants === null}>
                                    All Products
                                </Button>
                            </InlineStack>
                        </InlineStack>
                        <Divider />
                        <InlineStack gap="200" blockAlign="center">
                            <Checkbox
                                label="Select all variants"
                                checked={allItemsSelected ? true : (someItemsSelected ? 'indeterminate' : false)}
                                onChange={handleSelectAll}
                            />
                            <Text as="span" variant="bodySm" tone="subdued">
                                Select all {allVariantIds.length} variants
                            </Text>
                        </InlineStack>
                        <Divider />
                        <BlockStack gap="400">
                            {(() => {
                                let globalVariantIndex = 0;
                                return groupedByProduct.map((group) => {
                                    const variantIds = group.variants.map(v => v.id);
                                    const selectedCount = variantIds.filter(id => selectedVariantIds.includes(id)).length;
                                    const allSelected = selectedCount === variantIds.length && variantIds.length > 0;
                                    const indeterminate = selectedCount > 0 && selectedCount < variantIds.length;
                                    return (
                                        <div key={group.product.id} className={styles.productCard}>
                                            <Card padding={"400" as any}>
                                                <BlockStack gap="300">
                                                    <div className={styles.productHeader}>
                                                        <div
                                                            onClick={() => handleProductCheckbox(group.product, !allSelected)}
                                                            className={styles.clickableRow}
                                                        >
                                                            <InlineStack align="space-between" blockAlign="center">
                                                                <InlineStack gap="300" blockAlign="center">
                                                                    <div onClick={(e) => e.stopPropagation()}>
                                                                        <Checkbox
                                                                            checked={allSelected ? true : (indeterminate ? 'indeterminate' : false)}
                                                                            onChange={checked => handleProductCheckbox(group.product, checked)}
                                                                            label=""
                                                                            labelHidden
                                                                        />
                                                                    </div>
                                                                    <div className={styles.productImage}>
                                                                        <Thumbnail
                                                                            source={group.product.images?.[0]?.url ? group.product.images[0].url : ImageIcon}
                                                                            alt={group.product.images?.[0]?.altText ? group.product.images[0].altText : group.product.title}
                                                                            size="small"
                                                                        />
                                                                    </div>
                                                                    <BlockStack gap="100">
                                                                        <Text variant="bodyMd" as="h3" fontWeight="semibold">
                                                                            {group.product.title}
                                                                        </Text>
                                                                        <Text as="span" variant="bodySm" tone="subdued">
                                                                            {group.product.vendor} • {group.product.productType}
                                                                        </Text>
                                                                    </BlockStack>
                                                                </InlineStack>
                                                                <InlineStack gap="200" blockAlign="center">
                                                                    <Badge tone="info">
                                                                        {selectedCount} of {variantIds.length} variants
                                                                    </Badge>
                                                                    <div className={styles.removeButton}>
                                                                        <Button
                                                                            variant="plain"
                                                                            size="micro"
                                                                            icon={XIcon}
                                                                            onClick={() => handleRemoveProduct(group.product.id)}
                                                                            accessibilityLabel="Remove product"
                                                                            tone="critical"
                                                                        />
                                                                    </div>
                                                                </InlineStack>
                                                            </InlineStack>
                                                        </div>
                                                    </div>
                                                    <BlockStack gap="200">
                                                        {group.variants.map((variant) => {
                                                            const isChecked = selectedVariantIds.includes(variant.id);
                                                            const newSku = generujPojedynczeSKU(zasady, variant, globalVariantIndex);
                                                            const variantOptions = variant.selectedOptions
                                                                .map(opt => `${opt.name}: ${opt.value}`)
                                                                .join(', ');
                                                            globalVariantIndex++;
                                                            return (
                                                                <div key={variant.id} className={styles.variantCard}>
                                                                    <Card padding="300" background="bg-surface-secondary">
                                                                        <div
                                                                            onClick={() => handleVariantCheckbox(variant.id, !isChecked)}
                                                                            className={styles.clickableRow}
                                                                        >
                                                                            <InlineStack align="space-between" blockAlign="center">
                                                                                <InlineStack gap="300" blockAlign="center">
                                                                                    <div onClick={(e) => e.stopPropagation()}>
                                                                                        <Checkbox
                                                                                            checked={isChecked}
                                                                                            onChange={checked => handleVariantCheckbox(variant.id, checked)}
                                                                                            label=""
                                                                                            labelHidden
                                                                                        />
                                                                                    </div>
                                                                                    <BlockStack gap="100">
                                                                                        <Text variant="bodySm" as="span" fontWeight="medium">
                                                                                            {variant.title}
                                                                                        </Text>
                                                                                        {variantOptions && (
                                                                                            <div className={styles.variantOptions}>
                                                                                                <Text as="span" variant="bodySm" tone="subdued">
                                                                                                    {variantOptions}
                                                                                                </Text>
                                                                                            </div>
                                                                                        )}
                                                                                    </BlockStack>
                                                                                </InlineStack>
                                                                                <InlineStack gap="200" blockAlign="center">
                                                                                    <div className={styles.skuComparison}>
                                                                                        <BlockStack gap="100" align="end">
                                                                                            <InlineStack gap="200" blockAlign="center">
                                                                                                <div className={styles.currentSku}>
                                                                                                    <Text as="span" variant="bodySm" tone="subdued">
                                                                                                        Current:
                                                                                                    </Text>
                                                                                                </div>
                                                                                                <Text as="span" variant="bodySm" fontWeight="medium">
                                                                                                    {variant.sku || "No SKU"}
                                                                                                </Text>
                                                                                            </InlineStack>
                                                                                            <InlineStack gap="200" blockAlign="center">
                                                                                                <Text as="span" variant="bodySm" tone="subdued">
                                                                                                    New:
                                                                                                </Text>
                                                                                                <div className={styles.newSku}>
                                                                                                    <Text as="span" variant="bodySm" fontWeight="semibold" tone="success">
                                                                                                        {newSku}
                                                                                                    </Text>
                                                                                                </div>
                                                                                            </InlineStack>
                                                                                        </BlockStack>
                                                                                    </div>
                                                                                    <div className={styles.removeButton}>
                                                                                        <Button
                                                                                            variant="plain"
                                                                                            size="micro"
                                                                                            icon={XIcon}
                                                                                            onClick={() => handleRemoveVariant(variant.id)}
                                                                                            accessibilityLabel="Remove variant"
                                                                                            tone="critical"
                                                                                        />
                                                                                    </div>
                                                                                </InlineStack>
                                                                            </InlineStack>
                                                                        </div>
                                                                    </Card>
                                                                </div>
                                                            );
                                                        })}
                                                    </BlockStack>
                                                </BlockStack>
                                            </Card>
                                        </div>
                                    );
                                });
                            })()}
                        </BlockStack>
                        <Divider />
                        <BlockStack>
                            <div className={styles.generateButton}>
                                <Button
                                    variant="primary"
                                    size="large"
                                    submit
                                    disabled={wybraneWariantyDoZapisu.length === 0}
                                >
                                    Generate SKUs for {wybraneWariantyDoZapisu.length} variant{wybraneWariantyDoZapisu.length === 1 ? '' : 's'}
                                </Button>
                            </div>
                        </BlockStack>
                    </BlockStack>
                </Form>
            </Card>
            {showToast && (
                <Toast
                    content={toastMessage}
                    onDismiss={() => setShowToast(false)}
                />
            )}
        </>
    );
} 