import { Card, Text, SkeletonBodyText, BlockStack } from "@shopify/polaris";
import type { ZasadyGeneratora } from "../types/ZasadyGeneratora";

interface KartaPodsumowaniaProps {
    zasady: ZasadyGeneratora;
}

export function KartaPodsumowania({ zasady }: KartaPodsumowaniaProps) {

    if (!zasady || !zasady.uklad) {
        return (
            <Card>
                <SkeletonBodyText lines={2} />
            </Card>
        )
    }

    const przykladoweSKU = [
        `${zasady.prefix || ''}`,
        `NAZWAPRODUKTU`,
        ...zasady.uklad.map(u => u.wartosc || `[${u.typ}]`),
        `${zasady.sufix || ''}`
    ].filter(Boolean).join(zasady.separator);

    return (
        <Card>
            <BlockStack gap="200">
                <Text as="h2" variant="headingMd">
                    Summary & Example
                </Text>
                <Text as="p">
                    Example SKU: <strong>{przykladoweSKU}</strong>
                </Text>
            </BlockStack>
        </Card>
    );
} 