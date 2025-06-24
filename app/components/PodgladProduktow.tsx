import { useState, useMemo } from "react";
import { useAppBridge } from "@shopify/app-bridge-react";
import { Form } from "@remix-run/react";
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
    SkeletonBodyText,
    SkeletonThumbnail,
} from "@shopify/polaris";
import { ImageIcon } from "@shopify/polaris-icons";
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

    // Grupowanie wariantów po produkcie
    const groupedByProduct = useMemo(() => {
        const map = new Map<string, { product: ProductVariant["product"], variants: ProductVariant[] }>();
        for (const variant of products) {
            const pid = variant.product.id;
            if (!map.has(pid)) {
                map.set(pid, { product: variant.product, variants: [] });
            }
            map.get(pid)!.variants.push(variant);
        }
        return Array.from(map.values());
    }, [products]);

    const handleProductSelection = async () => {
        try {
            const produkty = await shopify.resourcePicker({
                type: "product",
                action: "select",
                multiple: true,
            });

            if (produkty) {
                // Handle selected products - this would need to be integrated with the form submission
                console.log("Selected products:", produkty);
            }
        } catch (error) {
            console.error("ResourcePicker error:", error);
        }
    };

    const allVariantIds = products.map(v => v.id);
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

    const wybraneWariantyDoZapisu = products.filter(v => selectedVariantIds.includes(v.id));

    // Renderowanie pustego stanu
    if (products.length === 0) {
        return (
            <Card>
                <EmptyState
                    heading="No products selected"
                    image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
                >
                    <p>Select products to generate SKUs for them.</p>
                    <Button onClick={handleProductSelection} variant="primary">
                        Select Products
                    </Button>
                </EmptyState>
            </Card>
        );
    }

    return (
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
                        <Button onClick={handleProductSelection} variant="secondary">
                            Select Products
                        </Button>
                    </InlineStack>

                    <Divider />

                    {/* Select All Checkbox */}
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

                    {/* Products List */}
                    <BlockStack gap="400">
                        {groupedByProduct.map((group) => {
                            const variantIds = group.variants.map(v => v.id);
                            const selectedCount = variantIds.filter(id => selectedVariantIds.includes(id)).length;
                            const allSelected = selectedCount === variantIds.length && variantIds.length > 0;
                            const indeterminate = selectedCount > 0 && selectedCount < variantIds.length;

                            return (
                                <div key={group.product.id} className={styles.productCard}>
                                    <Card padding="400">
                                        <BlockStack gap="300">
                                            {/* Product Header */}
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
                                                                    source={group.product.images?.[0]?.url || ImageIcon}
                                                                    alt={group.product.images?.[0]?.altText || group.product.title}
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
                                                        <Badge tone="info">
                                                            {selectedCount} of {variantIds.length} variants
                                                        </Badge>
                                                    </InlineStack>
                                                </div>
                                            </div>

                                            {/* Variants List */}
                                            <BlockStack gap="200">
                                                {group.variants.map((variant, variantIndex) => {
                                                    const isChecked = selectedVariantIds.includes(variant.id);
                                                    const newSku = generujPojedynczeSKU(zasady, variant, variantIndex);
                                                    const variantOptions = variant.selectedOptions
                                                        .map(opt => `${opt.name}: ${opt.value}`)
                                                        .join(', ');

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
                        })}
                    </BlockStack>

                    <Divider />

                    {/* Generate Button */}
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
    );
} 