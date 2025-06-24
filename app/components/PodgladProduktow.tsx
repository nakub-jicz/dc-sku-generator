import { useState, useMemo } from "react";
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
import styles from './PodgladProduktow.module.css';
import type { Dispatch, SetStateAction } from "react";

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
    products: ProductVariant[];
    selectedVariantIds: string[];
    setSelectedVariantIds: Dispatch<SetStateAction<string[]>>;
    scope?: string;
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
export function PodgladProduktow({ zasady, products, selectedVariantIds, setSelectedVariantIds, scope }: PodgladProduktowProps) {
    const [wybraneProdukty, setWybraneProdukty] = useState<AppBridgeProduct[]>([]);
    const shopify = useAppBridge();

    // Picker logic only for 'products' or 'variants' scope
    const handleAdd = async () => {
        if (scope === 'products') {
            const produkty = await shopify.resourcePicker({
                type: "product",
                action: "select",
                multiple: true,
            });
            // Tu można dodać logikę do obsługi wybranych produktów
            // (np. fetcher.submit lub przekierowanie)
        } else if (scope === 'variants') {
            const warianty = await shopify.resourcePicker({
                type: "variant",
                action: "select",
                multiple: true,
            });
            // Tu można dodać logikę do obsługi wybranych wariantów
            // (np. fetcher.submit lub przekierowanie)
        }
    };

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

    const handleRemoveVariant = (productId: string, variantId: string) => {
        setWybraneProdukty(prev => {
            return prev.reduce<AppBridgeProduct[]>((acc, product) => {
                if (product.id !== productId) {
                    acc.push(product);
                } else {
                    const newVariants = product.variants.filter(v => v.id !== variantId);
                    if (newVariants.length > 0) {
                        acc.push({ ...product, variants: newVariants });
                    }
                    // jeśli newVariants.length === 0, nie dodawaj produktu do acc (usuń produkt)
                }
                return acc;
            }, []);
        });
        setSelectedVariantIds(prev => prev.filter(id => id !== variantId));
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

    // Renderowanie tabeli
    let flatIndex = -1;
    const rowMarkup = groupedByProduct.flatMap(group => {
        const variantIds = group.variants.map(v => v.id);
        const selectedCount = variantIds.filter(id => selectedVariantIds.includes(id)).length;
        const allSelected = selectedCount === variantIds.length && variantIds.length > 0;
        const indeterminate = selectedCount > 0 && selectedCount < variantIds.length;

        // Nagłówek produktu z własnym checkboxem
        flatIndex++;
        const productRow = (
            <IndexTable.Row key={group.product.id} id={group.product.id} position={flatIndex} onClick={() => handleProductCheckbox(group.product, !allSelected)} data-row-selected={allSelected}>
                <IndexTable.Cell>
                    <span style={{ marginRight: '1rem' }} onClick={e => e.stopPropagation()}>
                        <Checkbox
                            checked={allSelected ? true : (indeterminate ? 'indeterminate' : false)}
                            onChange={checked => handleProductCheckbox(group.product, checked)}
                            label=""
                            labelHidden
                        />
                    </span>
                    <span style={{ flex: 1 }}>{group.product.title}</span>
                </IndexTable.Cell>
                <IndexTable.Cell />
                <IndexTable.Cell />
                <IndexTable.Cell />
            </IndexTable.Row>
        );
        // Warianty pod produktem
        const variantRows = group.variants.map((variant) => {
            flatIndex++;
            const isChecked = selectedVariantIds.includes(variant.id);
            return (
                <IndexTable.Row key={variant.id} id={variant.id} position={flatIndex} selected={isChecked} onClick={() => handleVariantCheckbox(variant.id, !isChecked)} data-row-selected={isChecked}>
                    <IndexTable.Cell>
                        <div style={{ paddingLeft: '2.5rem', display: 'flex', alignItems: 'center' }}>
                            <span onClick={e => e.stopPropagation()}>
                                <Checkbox
                                    checked={isChecked}
                                    onChange={checked => handleVariantCheckbox(variant.id, checked)}
                                    label={variant.title}
                                    labelHidden
                                />
                            </span>
                            <span style={{ marginLeft: '0.75rem', color: '#666' }}>{variant.title}</span>
                        </div>
                    </IndexTable.Cell>
                    <IndexTable.Cell>{variant.sku || "No SKU"}</IndexTable.Cell>
                    <IndexTable.Cell>
                        {generujPojedynczeSKU(zasady, variant, flatIndex)}
                    </IndexTable.Cell>
                    <IndexTable.Cell />
                </IndexTable.Row>
            );
        });
        return [productRow, ...variantRows];
    });

    const wybraneWariantyDoZapisu = products.filter(v => selectedVariantIds.includes(v.id));

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
                        {(scope === 'products' || scope === 'variants') && (
                            <Button onClick={handleAdd} variant="primary">
                                {scope === 'products' ? 'Add Products' : 'Add Variants'}
                            </Button>
                        )}
                    </InlineStack>
                    {products.length > 0 && (
                        <>
                            <div style={{ marginBottom: 8, display: 'block' }}>
                                <Text as="span" variant="bodySm" tone="subdued">
                                    {`${selectedVariantIds.length} of ${allVariantIds.length} variants selected`}
                                </Text>
                            </div>
                            <IndexTable
                                resourceName={{ singular: "variant", plural: "variants" }}
                                itemCount={allVariantIds.length}
                                selectedItemsCount={allItemsSelected ? "All" : selectedVariantIds.length}
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
                        </>
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