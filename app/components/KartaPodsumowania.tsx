import { Card, Text, SkeletonBodyText, BlockStack } from "@shopify/polaris";
import type { ZasadyGeneratora } from "../types/ZasadyGeneratora";

interface KartaPodsumowaniaProps {
    zasady: ZasadyGeneratora;
}

export function KartaPodsumowania({ zasady }: KartaPodsumowaniaProps) {

    if (!zasady || !zasady.ukladSKU) {
        return (
            <Card>
                <SkeletonBodyText lines={2} />
            </Card>
        )
    }

    // Stworzenie przykładowego SKU na podstawie aktualnych zasad
    const dostepneCzesci: { [key: string]: string } = {
        prefix: zasady.prefix,
        sufix: zasady.sufix,
        body: zasady.uzyjNumeracjiZZerami
            ? zasady.poczatekNumeracji.toString().padStart(zasady.iloscCyfrWNumeracji, '0')
            : zasady.poczatekNumeracji.toString()
    };

    // Dodaj przykładowe wartości dla dodatkowych komponentów
    zasady.dodatkoweKomponenty.forEach((komponent) => {
        dostepneCzesci[komponent.id] = `[${komponent.typ.replace(/_/g, ' ').toUpperCase()}]`;
    });

    const przykladoweSKU = zasady.ukladSKU
        .map(id => dostepneCzesci[id])
        .filter(Boolean)
        .join(zasady.separator);

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