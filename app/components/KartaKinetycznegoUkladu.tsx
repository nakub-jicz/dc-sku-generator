import { useState, useEffect } from "react";
import { Reorder, useMotionValue } from "framer-motion";
import {
    Card,
    Text,
    BlockStack,
    InlineStack,
    Icon,
    Button,
    Box,
    Badge,
} from "@shopify/polaris";
import { DragHandleIcon, XIcon } from "@shopify/polaris-icons";
import type { ZasadyGeneratora, DodatkowyKomponent } from "../types/ZasadyGeneratora";
import { DodatkowyKomponentTyp } from "../types/ZasadyGeneratora";

const nazwyKomponentow: Record<string, string> = {
    prefix: "Prefix",
    body: "Body",
    sufix: "Suffix",
    product_name: "Product Name",
    variant_name: "Variant Name",
    vendor: "Vendor",
    product_type: "Product Type",
    old_sku: "Old SKU",
    option1: "Option 1",
    option2: "Option 2",
    option3: "Option 3",
};

interface KartaKinetycznegoUkladuProps {
    zasady: ZasadyGeneratora;
    aktualizuj: (noweZasady: Partial<ZasadyGeneratora>) => void;
}

function ReorderableItem({ id, zasady, aktualizuj }: { id: string; zasady: ZasadyGeneratora; aktualizuj: (noweZasady: Partial<ZasadyGeneratora>) => void }) {
    const y = useMotionValue(0);
    const isRemovable = !["prefix", "body", "sufix"].includes(id);
    const handleRemove = () => {
        const noweKomponenty = zasady.dodatkoweKomponenty.filter(k => k.id !== id);
        const nowyUklad = zasady.ukladSKU.filter(k => k !== id);
        aktualizuj({
            dodatkoweKomponenty: noweKomponenty,
            ukladSKU: nowyUklad,
        });
    };
    return (
        <Reorder.Item value={id} id={id} style={{ y }} as="div">
            <Box padding="300" background="bg-surface-secondary" borderRadius="200" shadow="200">
                <InlineStack gap="200" blockAlign="center" align="space-between">
                    <InlineStack gap="200" blockAlign="center">
                        <Icon source={DragHandleIcon} tone="base" />
                        <Text as="span" variant="bodyMd" fontWeight="semibold">
                            {(() => {
                                const parts = id.split('_');
                                let typ = parts.length > 2 ? parts.slice(0, 2).join('_') : parts[0];
                                let label = nazwyKomponentow[typ];
                                if (!label && parts.length > 1) {
                                    // Fallback: spróbuj ostatni segment (np. option1, vendor)
                                    label = nazwyKomponentow[parts[parts.length - 2]] || nazwyKomponentow[parts[parts.length - 1]];
                                }
                                return label || typ;
                            })()}
                        </Text>
                    </InlineStack>
                    {isRemovable && <Button variant="plain" icon={XIcon} onClick={handleRemove} />}
                </InlineStack>
            </Box>
        </Reorder.Item>
    );
}

export function KartaKinetycznegoUkladu({ zasady, aktualizuj }: KartaKinetycznegoUkladuProps) {
    const [uklad, setUklad] = useState<string[]>(zasady.ukladSKU);
    useEffect(() => {
        setUklad(zasady.ukladSKU);
    }, [zasady.ukladSKU]);

    // Dostępne typy komponentów do dodania
    const opcjeKomponentow: { typ: DodatkowyKomponentTyp; id: string }[] = [
        { typ: DodatkowyKomponentTyp.NAZWA_PRODUKTU, id: "product_name" },
        { typ: DodatkowyKomponentTyp.NAZWA_WARIANTU, id: "variant_name" },
        { typ: DodatkowyKomponentTyp.DOSTAWCA, id: "vendor" },
        { typ: DodatkowyKomponentTyp.TYP_PRODUKTU, id: "product_type" },
        { typ: DodatkowyKomponentTyp.STARE_SKU, id: "old_sku" },
        { typ: DodatkowyKomponentTyp.OPCJA_1, id: "option1" },
        { typ: DodatkowyKomponentTyp.OPCJA_2, id: "option2" },
        { typ: DodatkowyKomponentTyp.OPCJA_3, id: "option3" },
    ];
    const uzyteTypy = zasady.dodatkoweKomponenty.map(k => k.typ);
    const dostepneKomponenty = opcjeKomponentow.filter(opcja => !uzyteTypy.includes(opcja.typ));

    const handleAdd = (typ: DodatkowyKomponentTyp) => {
        const nowyKomponent: DodatkowyKomponent = {
            id: `${typ}_${Date.now()}`,
            typ: typ,
        };
        const noweKomponenty = [...zasady.dodatkoweKomponenty, nowyKomponent];
        const nowyUklad = [...zasady.ukladSKU, nowyKomponent.id];
        aktualizuj({
            dodatkoweKomponenty: noweKomponenty,
            ukladSKU: nowyUklad,
        });
        setUklad(nowyUklad);
    };

    const onReorder = (nowyUklad: string[]) => {
        setUklad(nowyUklad);
        aktualizuj({ ukladSKU: nowyUklad });
    };

    return (
        <Card>
            <BlockStack gap="400">
                <Text as="h2" variant="headingMd">SKU Assembly Line</Text>
                <InlineStack gap="200" wrap>
                    {dostepneKomponenty.map(({ typ, id }) => (
                        <div key={id} onClick={() => handleAdd(typ)} style={{ cursor: 'pointer' }}>
                            <Badge tone="info">{`+ ${nazwyKomponentow[id]}`}</Badge>
                        </div>
                    ))}
                </InlineStack>
                <Reorder.Group axis="y" values={uklad} onReorder={onReorder} as="div">
                    <BlockStack gap="200">
                        {uklad.map((id) => (
                            <ReorderableItem key={id} id={id} zasady={zasady} aktualizuj={aktualizuj} />
                        ))}
                    </BlockStack>
                </Reorder.Group>
            </BlockStack>
        </Card>
    );
} 