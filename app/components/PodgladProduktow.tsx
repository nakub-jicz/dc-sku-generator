import { useState } from "react";
import { useAppBridge } from "@shopify/app-bridge-react";
import { Form } from "@remix-run/react";
import {
    Card,
    Button,
    BlockStack,
    Text,
    IndexTable,
    useIndexResourceState,
    InlineStack,
} from "@shopify/polaris";

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

    const { selectedResources, allResourcesSelected, handleSelectionChange } =
        useIndexResourceState(allVariants.map(v => ({ ...v, media: undefined })));

    const rowMarkup = allVariants.map((wariant, index) => {
        const isFirstVariantOfProduct =
            index === 0 || allVariants[index - 1].product.id !== wariant.product.id;

        return (
            <IndexTable.Row
                id={wariant.id}
                key={wariant.id}
                selected={selectedResources.includes(wariant.id)}
                position={index}
            >
                <IndexTable.Cell>
                    {isFirstVariantOfProduct && (
                        <Text variant="bodyMd" fontWeight="bold" as="p">
                            {wariant.product.title}
                        </Text>
                    )}
                    <div style={{ paddingLeft: "20px" }}>
                        <Text as="span" tone="subdued">
                            {wariant.title}
                        </Text>
                    </div>
                </IndexTable.Cell>
                <IndexTable.Cell>{wariant.sku || "No SKU"}</IndexTable.Cell>
                <IndexTable.Cell>
                    {generujPojedynczeSKU(zasady, wariant, index)}
                </IndexTable.Cell>
                <IndexTable.Cell>
                    {isFirstVariantOfProduct && (
                        <Button
                            variant="plain"
                            tone="critical"
                            onClick={() => handleRemoveProduct(wariant.product.id)}
                        >
                            Remove
                        </Button>
                    )}
                </IndexTable.Cell>
            </IndexTable.Row>
        );
    });

    const wybraneWariantyDoZapisu = allVariants.filter(v => selectedResources.includes(v.id));

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
                            selectedItemsCount={
                                allResourcesSelected ? "All" : selectedResources.length
                            }
                            onSelectionChange={handleSelectionChange}
                            headings={[
                                { title: "Product" },
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