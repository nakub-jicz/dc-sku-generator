import { Card, BlockStack, Text, InlineStack, Badge } from "@shopify/polaris";
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
 * Każda część SKU jest wizualnie oddzielona i opisana, zgodnie z ukladSKU.
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
                return "";
        }
    };

    const getWartoscById = (id: string): { wartosc: string, opis: string, typBadge: "success" | "info" | "warning" | "critical" } => {
        switch (id) {
            case "prefix":
                return { wartosc: zasady.prefix, opis: "Prefix", typBadge: "success" };
            case "sufix":
                return { wartosc: zasady.sufix, opis: "Sufix", typBadge: "success" };
            case "body": {
                let wartosc;
                switch (zasady.typBody) {
                    case "consecutive": wartosc = zasady.poczatekNumeracji.toString(); break;
                    case "product_id": wartosc = przykladoweDane.idProduktu; break;
                    case "variant_id": wartosc = przykladoweDane.idWariantu; break;
                    case "random": wartosc = Math.floor(Math.random() * 1000).toString(); break;
                    default: wartosc = "";
                }
                return { wartosc, opis: "Główna część", typBadge: "info" };
            }
            default: {
                const komponent = zasady.dodatkoweKomponenty.find(k => k.id === id);
                if (!komponent) return { wartosc: "", opis: "", typBadge: "critical" };
                return {
                    wartosc: getWartoscKomponentu(komponent.typ),
                    opis: komponent.typ.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
                    typBadge: "warning"
                };
            }
        }
    };

    // Budowanie części SKU na podstawie ukladSKU
    const czesciSKU = zasady.ukladSKU
        .map(id => ({ id, ...getWartoscById(id) }))
        .filter(czesc => czesc.wartosc);

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
                                        <Badge tone={czesc.typBadge}>
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