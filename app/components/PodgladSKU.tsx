import { Card, BlockStack, Text, InlineStack, Badge, Divider } from "@shopify/polaris";
import type { ZasadyGeneratora } from "../types/ZasadyGeneratora";

interface PodgladSKUProps {
    zasady: ZasadyGeneratora;
}

/**
 * Komponent podglądu wygenerowanego SKU.
 * 
 * MISJA: Pokazuje użytkownikowi, jak będzie wyglądać SKU na podstawie aktualnych ustawień.
 * To jest nasz system wczesnego ostrzegania - użytkownik widzi rezultat przed generowaniem.
 * 
 * TAKTYKA: Symulujemy generowanie SKU z przykładowymi danymi produktu.
 * Każda część SKU jest wizualnie oddzielona i opisana.
 */
export function PodgladSKU({ zasady }: PodgladSKUProps) {
    // Przykładowe dane produktu do symulacji
    const przykladoweDane = {
        nazwaProduktu: "Koszulka Bawełniana",
        nazwaWariantu: "Czerwona / M",
        dostawca: "FashionCorp",
        typProduktu: "Odzież",
        stareSKU: "OLD-SKU-123",
        opcja1: "Czerwona",
        opcja2: "M",
        opcja3: "Bawełna",
        idProduktu: "123456789",
        idWariantu: "987654321",
    };

    // Generowanie body na podstawie typu
    const generujBody = (): string => {
        switch (zasady.typBody) {
            case "consecutive":
                return zasady.poczatekNumeracji.toString();
            case "product_id":
                return przykladoweDane.idProduktu;
            case "variant_id":
                return przykladoweDane.idWariantu;
            case "random":
                return Math.floor(Math.random() * 1000).toString();
            case "disable_body":
                return "";
            default:
                return "1";
        }
    };

    // Mapowanie typów komponentów na wartości
    const getWartoscKomponentu = (typ: string): string => {
        switch (typ) {
            case "product_name":
                return przykladoweDane.nazwaProduktu;
            case "variant_name":
                return przykladoweDane.nazwaWariantu;
            case "product_vendor":
                return przykladoweDane.dostawca;
            case "product_type":
                return przykladoweDane.typProduktu;
            case "old_sku":
                return przykladoweDane.stareSKU;
            case "variant_option1":
                return przykladoweDane.opcja1;
            case "variant_option2":
                return przykladoweDane.opcja2;
            case "variant_option3":
                return przykladoweDane.opcja3;
            default:
                return "N/A";
        }
    };

    // Budowanie części SKU
    const czesciSKU: Array<{ id: string; wartosc: string; typ: string; opis: string }> = [];

    // Prefix
    if (zasady.prefix) {
        czesciSKU.push({
            id: "prefix",
            wartosc: zasady.prefix,
            typ: "prefix",
            opis: "Prefix"
        });
    }

    // Body
    const bodyWartosc = generujBody();
    if (bodyWartosc) {
        czesciSKU.push({
            id: "body",
            wartosc: bodyWartosc,
            typ: "body",
            opis: "Główna część"
        });
    }

    // Dodatkowe komponenty
    zasady.dodatkoweKomponenty.forEach((komponent) => {
        const wartosc = getWartoscKomponentu(komponent.typ);
        czesciSKU.push({
            id: komponent.id,
            wartosc: wartosc,
            typ: "dodatkowy",
            opis: komponent.typ.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
        });
    });

    // Sufix
    if (zasady.sufix) {
        czesciSKU.push({
            id: "sufix",
            wartosc: zasady.sufix,
            typ: "sufix",
            opis: "Sufix"
        });
    }

    // Finalne SKU
    const finalneSKU = czesciSKU.map(czesc => czesc.wartosc).join(zasady.separator);

    return (
        <Card>
            <BlockStack gap="400">
                <Text variant="headingMd" as="h2">
                    Podgląd SKU
                </Text>

                <BlockStack gap="300">
                    <Text variant="bodyMd" as="p">
                        Oto jak będzie wyglądać Twoje SKU na podstawie aktualnych ustawień:
                    </Text>

                    {/* Finalne SKU */}
                    <Card background="bg-surface-secondary">
                        <BlockStack gap="200">
                            <Text variant="bodyMd" as="p" fontWeight="semibold">
                                Wygenerowane SKU:
                            </Text>
                            <p style={{ fontFamily: 'monospace', fontSize: '1.5rem', margin: 0 }}>
                                {finalneSKU || "Brak danych"}
                            </p>
                        </BlockStack>
                    </Card>

                    {/* Struktura SKU */}
                    {czesciSKU.length > 0 && (
                        <BlockStack gap="200">
                            <Text variant="bodyMd" as="p" fontWeight="semibold">
                                Struktura:
                            </Text>
                            <InlineStack gap="100" wrap>
                                {czesciSKU.map((czesc, index) => (
                                    <InlineStack key={czesc.id} gap="100" align="center">
                                        <Badge tone={czesc.typ === 'prefix' ? 'success' : czesc.typ === 'body' ? 'info' : 'warning'}>
                                            {czesc.opis}
                                        </Badge>
                                        <span style={{ fontFamily: 'monospace' }}>
                                            {czesc.wartosc}
                                        </span>
                                        {index < czesciSKU.length - 1 && zasady.separator && (
                                            <Text variant="bodyMd" as="span" tone="subdued">
                                                {zasady.separator}
                                            </Text>
                                        )}
                                    </InlineStack>
                                ))}
                            </InlineStack>
                        </BlockStack>
                    )}
                </BlockStack>
            </BlockStack>
        </Card>
    );
} 