import { useState } from "react";
import {
    Card,
    Text,
    BlockStack,
    InlineStack,
    Button,
    Collapsible,
    Badge,
    Divider,
    Box,
} from "@shopify/polaris";
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
        nazwaProduktu: "Cotton T-Shirt",
        nazwaWariantu: "Red / M",
        dostawca: "FashionCorp",
        typProduktu: "Apparel",
        stareSKU: "OLD-SKU-123",
        opcja1: "Red",
        opcja2: "M",
        opcja3: "Cotton",
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
                return { wartosc: zasady.sufix, opis: "Suffix", typBadge: "success" };
            case "body": {
                let wartosc;
                switch (zasady.typBody) {
                    case "consecutive":
                        if (zasady.uzyjNumeracjiZZerami) {
                            wartosc = zasady.poczatekNumeracji.toString().padStart(zasady.iloscCyfrWNumeracji, '0');
                        } else {
                            wartosc = zasady.poczatekNumeracji.toString();
                        }
                        break;
                    case "product_id": wartosc = przykladoweDane.idProduktu; break;
                    case "variant_id": wartosc = przykladoweDane.idWariantu; break;
                    case "random": wartosc = Math.floor(Math.random() * 1000).toString(); break;
                    default: wartosc = "";
                }
                return { wartosc, opis: "Main Body", typBadge: "info" };
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
                {/* Header with icon */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: 'var(--p-space-200)'
                }}>
                    <Text variant="headingMd" as="h2">
                        Live Preview
                    </Text>
                </div>

                <Divider />

                {/* Final SKU Display */}
                <BlockStack gap="300">
                    <Text variant="bodyMd" as="p" tone="subdued">
                        Preview of your SKU based on current settings:
                    </Text>

                    <Card background="bg-surface-secondary" padding="400">
                        <BlockStack gap="200">
                            <Text variant="bodyMd" as="p" fontWeight="semibold" tone="subdued">
                                Generated SKU:
                            </Text>
                            <div style={{
                                fontFamily: 'monospace',
                                fontSize: '1.25rem',
                                fontWeight: 500,
                                color: 'var(--p-text-primary)',
                                backgroundColor: 'var(--p-surface)',
                                padding: '0.75rem',
                                borderRadius: 'var(--p-border-radius-200)',
                                border: '1px solid var(--p-border-subdued)',
                                wordBreak: 'break-all'
                            }}>
                                {finalneSKU || "No data available"}
                            </div>
                        </BlockStack>
                    </Card>
                </BlockStack>

                {/* Configuration Summary */}
                <Divider />
                <BlockStack gap="200">
                    <Text variant="bodyMd" as="p" fontWeight="semibold">
                        Configuration:
                    </Text>
                    <InlineStack gap="200" wrap align="center">
                        <Badge tone="info" size="small">
                            {`Separator: "${zasady.separator}"`}
                        </Badge>
                        {zasady.separator && <Text variant="bodyMd" as="span" tone="subdued">{zasady.separator}</Text>}

                        {/* Wyświetl komponenty w kolejności z ukladSKU */}
                        {zasady.ukladSKU.map((elementId, index) => {
                            const element = getWartoscById(elementId);
                            if (!element.wartosc) return null;

                            return (
                                <div key={elementId} style={{ display: 'contents' }}>
                                    <Badge tone={element.typBadge} size="small">
                                        {`${element.opis}: "${element.wartosc}"`}
                                    </Badge>
                                    {index < zasady.ukladSKU.length - 1 && zasady.separator && (
                                        <Text variant="bodyMd" as="span" tone="subdued">{zasady.separator}</Text>
                                    )}
                                </div>
                            );
                        })}

                        {zasady.uzyjNumeracjiZZerami && (
                            <Badge tone="info" size="small">
                                {`Zero-padded: ${zasady.iloscCyfrWNumeracji} digits`}
                            </Badge>
                        )}
                    </InlineStack>
                </BlockStack>
            </BlockStack>
        </Card>
    );
} 