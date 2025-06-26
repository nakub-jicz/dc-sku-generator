import { Card, ChoiceList, BlockStack, Text, TextField, InlineStack, Box, Button, Badge } from "@shopify/polaris";
import { useState } from "react";
import type { ZasadyGeneratora } from "../types/ZasadyGeneratora";
import { TypBody } from "../types/ZasadyGeneratora";

interface KartaUstawienBodyProps {
    zasady: ZasadyGeneratora;
    aktualizuj: (noweZasady: Partial<ZasadyGeneratora>) => void;
}

/**
 * Karta konfiguracji głównej, numerycznej części SKU.
 * 
 * MISJA: Panel sterowania głównym silnikiem maszyny - teraz w wersji PRO!
 * Intuicyjna, przyjazna dla merchantów konfiguracja generowania SKU.
 * 
 * STRATEGIA "MERCHANT FIRST": Wszystko proste, czytelne i przyjazne.
 */
export function KartaUstawienBody({ zasady, aktualizuj }: KartaUstawienBodyProps) {
    const [showCustomSeparator, setShowCustomSeparator] = useState(false);
    const [tempCustomSeparator, setTempCustomSeparator] = useState(zasady.customSeparator);

    const opcjeTypuBody = [
        {
            label: "Sequential Numbers (1, 2, 3...)",
            value: TypBody.KOLEJNY_NUMER,
            helpText: "Simple counting: 1, 2, 3, 4... Perfect for most stores!"
        },
        {
            label: "Shopify Product ID",
            value: TypBody.ID_PRODUKTU,
            helpText: "Uses Shopify's unique product identifier - always unique!"
        },
        {
            label: "Shopify Variant ID",
            value: TypBody.ID_WARIANTU,
            helpText: "Uses Shopify's variant identifier - perfect for variants"
        },
        {
            label: "Random Numbers",
            value: TypBody.LOSOWY_NUMER,
            helpText: "Generates random numbers within your chosen range"
        },
        {
            label: "No Main Number",
            value: TypBody.BEZ_BODY,
            helpText: "Skip the main number - use only prefix, suffix, and components"
        },
    ];

    const separatorOptions = [
        { label: "Dash (-)", value: "-" },
        { label: "No Separator", value: "" },
        { label: "Underscore (_)", value: "_" },
        { label: "Dot (.)", value: "." },
        { label: "Space ( )", value: " " },
    ];

    const handleCustomSeparatorSave = () => {
        aktualizuj({ separator: tempCustomSeparator, customSeparator: tempCustomSeparator });
        setShowCustomSeparator(false);
    };

    const getSelectedOption = () => {
        return opcjeTypuBody.find(option => option.value === zasady.typBody);
    };

    const renderRandomNumberConfig = () => {
        if (zasady.typBody !== TypBody.LOSOWY_NUMER) return null;

        return (
            <Box padding="400" background="bg-surface-secondary" borderRadius="200">
                <BlockStack gap="300">
                    <Text variant="headingSm" as="h3">
                        Random Number Range
                    </Text>
                    <Text variant="bodyMd" as="p" tone="subdued">
                        Set the minimum and maximum values for random number generation
                    </Text>
                    <InlineStack gap="400" align="center">
                        <div style={{ width: '120px' }}>
                            <TextField
                                label="From"
                                type="number"
                                value={zasady.randomMin.toString()}
                                onChange={(value) => aktualizuj({ randomMin: parseInt(value) || 1 })}
                                autoComplete="off"
                            />
                        </div>
                        <Text variant="bodyMd" as="p" tone="subdued">to</Text>
                        <div style={{ width: '120px' }}>
                            <TextField
                                label="To"
                                type="number"
                                value={zasady.randomMax.toString()}
                                onChange={(value) => aktualizuj({ randomMax: parseInt(value) || 99999 })}
                                autoComplete="off"
                            />
                        </div>
                    </InlineStack>
                    <Text variant="bodySm" as="p" tone="subdued">
                        Example range: {zasady.randomMin.toLocaleString()} - {zasady.randomMax.toLocaleString()} ({(zasady.randomMax - zasady.randomMin + 1).toLocaleString()} possible numbers)
                    </Text>
                </BlockStack>
            </Box>
        );
    };

    const renderSeparatorSelector = () => {
        return (
            <BlockStack gap="300">
                <InlineStack gap="200" align="space-between">
                    <Text variant="headingSm" as="h3">
                        SKU Separator
                    </Text>
                    <Badge tone="info">
                        {`Preview: ${zasady.prefix}${zasady.separator}123${zasady.separator}${zasady.sufix}`}
                    </Badge>
                </InlineStack>

                <Text variant="bodyMd" as="p" tone="subdued">
                    Choose what separates the parts of your SKU
                </Text>

                <InlineStack gap="200" wrap>
                    {separatorOptions.map((sep) => (
                        <Button
                            key={sep.value}
                            pressed={zasady.separator === sep.value && !showCustomSeparator ? true : false}
                            onClick={() => {
                                setShowCustomSeparator(false);
                                aktualizuj({ separator: sep.value, customSeparator: "" });
                            }}
                            size="medium"
                        >
                            {sep.label}
                        </Button>
                    ))}
                    <Button
                        pressed={showCustomSeparator || (!!zasady.customSeparator && zasady.separator === zasady.customSeparator)}
                        onClick={() => setShowCustomSeparator(true)}
                    >
                        Custom
                    </Button>
                </InlineStack>

                {showCustomSeparator && (
                    <Box padding="400" background="bg-surface-secondary" borderRadius="200">
                        <BlockStack gap="400">
                            <Text variant="headingSm" as="h3">Create Custom Separator</Text>

                            <TextField
                                label="Custom separator"
                                value={tempCustomSeparator}
                                onChange={setTempCustomSeparator}
                                placeholder="Enter any character(s)"
                                autoComplete="off"
                                helpText={`Preview: ${zasady.prefix}${tempCustomSeparator}123${tempCustomSeparator}${zasady.sufix}`}
                            />

                            <InlineStack gap="300" align="end">
                                <Button onClick={() => setShowCustomSeparator(false)}>
                                    Cancel
                                </Button>
                                <Button variant="primary" onClick={handleCustomSeparatorSave}>
                                    Apply
                                </Button>
                            </InlineStack>
                        </BlockStack>
                    </Box>
                )}
            </BlockStack>
        );
    };

    return (
        <Card>
            <BlockStack gap="500">
                <BlockStack gap="200">
                    <Text variant="headingMd" as="h2">
                        SKU Generation Strategy
                    </Text>
                    <Text variant="bodyMd" as="p" tone="subdued">
                        Choose how the main part of your SKU should be generated
                    </Text>
                </BlockStack>

                <ChoiceList
                    title=""
                    choices={opcjeTypuBody}
                    selected={[zasady.typBody]}
                    onChange={(selected) => {
                        if (selected.length > 0) {
                            aktualizuj({ typBody: selected[0] as TypBody });
                        }
                    }}
                />

                {/* Show description for selected option */}
                {getSelectedOption() && (
                    <Box padding="300" background="bg-surface-secondary" borderRadius="200">
                        <Text variant="bodyMd" as="p" tone="subdued">
                            {getSelectedOption()?.helpText}
                        </Text>
                    </Box>
                )}

                {renderRandomNumberConfig()}

                {renderSeparatorSelector()}
            </BlockStack>
        </Card>
    );
}