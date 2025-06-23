import { useState } from "react";
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from "@dnd-kit/core";
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
    Card,
    Select,
    Button,
    BlockStack,
    Text,
    InlineStack,
    Icon,
} from "@shopify/polaris";
import {
    DragHandleIcon,
    DeleteIcon,
    PlusIcon,
} from "@shopify/polaris-icons";
import type {
    ZasadyGeneratora,
    DodatkowyKomponent,
} from "../types/ZasadyGeneratora";
import { DodatkowyKomponentTyp } from "../types/ZasadyGeneratora";

// Sub-komponent dla sortowalnego elementu listy
function SortableItem({
    id,
    zasady,
    onRemove,
}: {
    id: string;
    zasady: ZasadyGeneratora;
    onRemove: (id: string) => void;
}) {
    const { attributes, listeners, setNodeRef, transform, transition } =
        useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    const getLabelForId = (itemId: string): string => {
        if (itemId === "prefix") return "Prefix";
        if (itemId === "body") return "Main Body";
        if (itemId === "sufix") return "Suffix";
        const komponent = zasady.dodatkoweKomponenty.find(k => k.id === itemId);
        if (!komponent) return "Unknown Component";

        const opcjeKomponentow = [
            { label: "Product Name", value: DodatkowyKomponentTyp.NAZWA_PRODUKTU },
            { label: "Variant Name", value: DodatkowyKomponentTyp.NAZWA_WARIANTU },
            { label: "Vendor", value: DodatkowyKomponentTyp.DOSTAWCA },
            { label: "Product Type", value: DodatkowyKomponentTyp.TYP_PRODUKTU },
            { label: "Old SKU", value: DodatkowyKomponentTyp.STARE_SKU },
            { label: "Option 1", value: DodatkowyKomponentTyp.OPCJA_1 },
            { label: "Option 2", value: DodatkowyKomponentTyp.OPCJA_2 },
            { label: "Option 3", value: DodatkowyKomponentTyp.OPCJA_3 },
        ];
        const opcja = opcjeKomponentow.find(o => o.value === komponent.typ);
        return opcja ? opcja.label : "Unknown Component";
    };

    const isCoreComponent = ["prefix", "body", "sufix"].includes(id);

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
            <Card>
                <InlineStack align="space-between" blockAlign="center">
                    <InlineStack gap="200" blockAlign="center">
                        <Icon source={DragHandleIcon} tone="subdued" />
                        <Text variant="bodyMd" as="p">
                            {getLabelForId(id)}
                        </Text>
                    </InlineStack>

                    {!isCoreComponent && (
                        <Button
                            variant="plain"
                            icon={DeleteIcon}
                            onClick={() => onRemove(id)}
                            accessibilityLabel="Remove component"
                        />
                    )}
                </InlineStack>
            </Card>
        </div>
    );
}

// Główny komponent KartaUkladuSKU
interface KartaUkladuSKUProps {
    zasady: ZasadyGeneratora;
    aktualizuj: (noweZasady: Partial<ZasadyGeneratora>) => void;
}

export function KartaUkladuSKU({ zasady, aktualizuj }: KartaUkladuSKUProps) {
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const [selectedComponent, setSelectedComponent] = useState("");

    const opcjeKomponentow = [
        { label: "Product Name", value: DodatkowyKomponentTyp.NAZWA_PRODUKTU },
        { label: "Variant Name", value: DodatkowyKomponentTyp.NAZWA_WARIANTU },
        { label: "Vendor", value: DodatkowyKomponentTyp.DOSTAWCA },
        { label: "Product Type", value: DodatkowyKomponentTyp.TYP_PRODUKTU },
        { label: "Old SKU", value: DodatkowyKomponentTyp.STARE_SKU },
        { label: "Option 1", value: DodatkowyKomponentTyp.OPCJA_1 },
        { label: "Option 2", value: DodatkowyKomponentTyp.OPCJA_2 },
        { label: "Option 3", value: DodatkowyKomponentTyp.OPCJA_3 },
    ];

    const uzyteTypy = zasady.dodatkoweKomponenty.map(k => k.typ);
    const dostepneOpcje = opcjeKomponentow.filter(opcja => !uzyteTypy.includes(opcja.value));

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            const oldIndex = zasady.ukladSKU.indexOf(active.id as string);
            const newIndex = zasady.ukladSKU.indexOf(over.id as string);
            const nowyUklad = arrayMove(zasady.ukladSKU, oldIndex, newIndex);
            aktualizuj({ ukladSKU: nowyUklad });
        }
    };

    const dodajKomponent = () => {
        if (!selectedComponent) return;
        const typ = selectedComponent as DodatkowyKomponentTyp;

        const nowyKomponent: DodatkowyKomponent = {
            id: `${typ}_${Date.now()}`,
            typ: typ
        };

        const noweKomponenty = [...zasady.dodatkoweKomponenty, nowyKomponent];
        const nowyUklad = [...zasady.ukladSKU, nowyKomponent.id];

        aktualizuj({
            dodatkoweKomponenty: noweKomponenty,
            ukladSKU: nowyUklad
        });
        setSelectedComponent("");
    };

    const usunKomponent = (idDoUsuniecia: string) => {
        const noweKomponenty = zasady.dodatkoweKomponenty.filter(
            komponent => komponent.id !== idDoUsuniecia
        );
        const nowyUklad = zasady.ukladSKU.filter(id => id !== idDoUsuniecia);

        aktualizuj({
            dodatkoweKomponenty: noweKomponenty,
            ukladSKU: nowyUklad
        });
    };

    return (
        <Card>
            <BlockStack gap="400">
                <Text variant="headingMd" as="h2">
                    SKU Layout & Components
                </Text>

                {/* Sekcja Dodawania */}
                <InlineStack gap="200" blockAlign="end">
                    <div style={{ flexGrow: 1 }}>
                        <Select
                            label="Add component"
                            options={dostepneOpcje}
                            value={selectedComponent}
                            onChange={setSelectedComponent}
                            placeholder="Select a component to add"
                            disabled={dostepneOpcje.length === 0}
                        />
                    </div>
                    <Button
                        icon={PlusIcon}
                        onClick={dodajKomponent}
                        disabled={!selectedComponent}
                    >
                        Add
                    </Button>
                </InlineStack>

                {/* Sekcja Listy */}
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                >
                    <SortableContext
                        items={zasady.ukladSKU}
                        strategy={verticalListSortingStrategy}
                    >
                        <BlockStack gap="200">
                            {zasady.ukladSKU.map((id) => (
                                <SortableItem key={id} id={id} zasady={zasady} onRemove={usunKomponent} />
                            ))}
                        </BlockStack>
                    </SortableContext>
                </DndContext>
            </BlockStack>
        </Card>
    );
} 