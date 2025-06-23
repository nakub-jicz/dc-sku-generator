import {
    Card,
    Select,
    Button,
    BlockStack,
    Text,
    InlineStack,
    Tag,
    Icon,
    Banner
} from "@shopify/polaris";
import { PlusIcon } from "@shopify/polaris-icons";
import type { ZasadyGeneratora, DodatkowyKomponent } from "../types/ZasadyGeneratora";
import { DodatkowyKomponentTyp } from "../types/ZasadyGeneratora";

interface KartaDodatkowychKomponentowProps {
    zasady: ZasadyGeneratora;
    aktualizuj: (noweZasady: Partial<ZasadyGeneratora>) => void;
}

/**
 * Karta zarządzania opcjonalnymi komponentami SKU.
 * 
 * MISJA: Umożliwia dodawanie i usuwanie dodatkowych informacji do SKU.
 * To jest nasz arsenał elastyczności - użytkownik może włączyć dowolne dane produktu.
 * 
 * TAKTYKA: Drag-and-drop będzie w przyszłości, na razie prosty add/remove.
 * Każdy komponent ma unikalne ID dla Reacta i operacji na listach.
 */
export function KartaDodatkowychKomponentow({ zasady, aktualizuj }: KartaDodatkowychKomponentowProps) {
    const opcjeKomponentow = [
        { label: "Nazwa produktu", value: DodatkowyKomponentTyp.NAZWA_PRODUKTU },
        { label: "Nazwa wariantu", value: DodatkowyKomponentTyp.NAZWA_WARIANTU },
        { label: "Dostawca", value: DodatkowyKomponentTyp.DOSTAWCA },
        { label: "Typ produktu", value: DodatkowyKomponentTyp.TYP_PRODUKTU },
        { label: "Stare SKU", value: DodatkowyKomponentTyp.STARE_SKU },
        { label: "Opcja 1", value: DodatkowyKomponentTyp.OPCJA_1 },
        { label: "Opcja 2", value: DodatkowyKomponentTyp.OPCJA_2 },
        { label: "Opcja 3", value: DodatkowyKomponentTyp.OPCJA_3 },
    ];

    const dodajKomponent = (typ: DodatkowyKomponentTyp) => {
        const nowyKomponent: DodatkowyKomponent = {
            id: `${typ}_${Date.now()}`,
            typ: typ
        };

        const noweKomponenty = [...zasady.dodatkoweKomponenty, nowyKomponent];
        aktualizuj({ dodatkoweKomponenty: noweKomponenty });
    };

    const usunKomponent = (idDoUsuniecia: string) => {
        const noweKomponenty = zasady.dodatkoweKomponenty.filter(
            komponent => komponent.id !== idDoUsuniecia
        );
        aktualizuj({ dodatkoweKomponenty: noweKomponenty });
    };

    const getLabelForTyp = (typ: DodatkowyKomponentTyp): string => {
        const opcja = opcjeKomponentow.find(o => o.value === typ);
        return opcja ? opcja.label : typ;
    };

    const uzyteTypy = zasady.dodatkoweKomponenty.map(k => k.typ);
    const dostepneOpcje = opcjeKomponentow.filter(opcja => !uzyteTypy.includes(opcja.value));

    return (
        <Card>
            <BlockStack gap="400">
                <Text variant="headingMd" as="h2">
                    Dodatkowe komponenty
                </Text>

                <Text variant="bodyMd" as="p">
                    Dodaj opcjonalne informacje do swoich SKU, takie jak nazwa produktu,
                    dostawca czy opcje wariantów.
                </Text>

                {zasady.dodatkoweKomponenty.length > 0 && (
                    <BlockStack gap="200">
                        <Text variant="bodyMd" as="p" fontWeight="semibold">
                            Aktywne komponenty:
                        </Text>
                        <InlineStack gap="200" wrap>
                            {zasady.dodatkoweKomponenty.map((komponent) => (
                                <Tag
                                    key={komponent.id}
                                    onRemove={() => usunKomponent(komponent.id)}
                                >
                                    {getLabelForTyp(komponent.typ)}
                                </Tag>
                            ))}
                        </InlineStack>
                    </BlockStack>
                )}

                {dostepneOpcje.length > 0 ? (
                    <InlineStack gap="200" align="start">
                        <Select
                            label="Dodaj komponent"
                            options={dostepneOpcje}
                            value=""
                            onChange={(value) => {
                                if (value) {
                                    dodajKomponent(value as DodatkowyKomponentTyp);
                                }
                            }}
                            placeholder="Wybierz komponent do dodania"
                        />
                    </InlineStack>
                ) : (
                    <Banner tone="success">
                        <p>Wszystkie dostępne komponenty zostały już dodane!</p>
                    </Banner>
                )}
            </BlockStack>
        </Card>
    );
} 