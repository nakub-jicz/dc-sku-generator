import React, { useState } from "react";
import {
    Card,
    Text,
    BlockStack,
    Button,
    InlineStack,
    Banner,
    List,
    Icon,
} from "@shopify/polaris";
import {
    CheckCircleIcon,
    InfoIcon,
    PlayCircleIcon,
} from "@shopify/polaris-icons";

interface KartaOnboardingProps {
    onDismiss: () => void;
}

export function KartaOnboarding({ onDismiss }: KartaOnboardingProps) {
    const [currentStep, setCurrentStep] = useState(0);

    const steps = [
        {
            title: "Welcome to DC SKU Generator!",
            content: (
                <BlockStack gap="300">
                    <Text as="p">
                        This tool helps you automatically generate consistent SKU codes for
                        all products in your Shopify store, saving time and ensuring uniformity.
                    </Text>
                    <Banner tone="info">
                        <Text as="p">
                            Well-designed SKU codes help with inventory management,
                            sales tracking, and product organization.
                        </Text>
                    </Banner>
                </BlockStack>
            ),
        },
        {
            title: "How does it work?",
            content: (
                <BlockStack gap="300">
                    <Text as="h3" variant="headingMd">3 simple steps:</Text>
                    <List type="number">
                        <List.Item>
                            <strong>Set up rules:</strong> Define prefixes, separators, and numbering methods
                        </List.Item>
                        <List.Item>
                            <strong>Select products:</strong> Choose which products should receive new SKUs
                        </List.Item>
                        <List.Item>
                            <strong>Generate:</strong> Automatically apply new SKU codes
                        </List.Item>
                    </List>
                </BlockStack>
            ),
        },
        {
            title: "SKU Code Examples",
            content: (
                <BlockStack gap="300">
                    <Text as="p">
                        Here are examples of SKU codes you can generate:
                    </Text>
                    <Card background="bg-surface-secondary">
                        <BlockStack gap="200">
                            <Text as="p"><strong>SKU-001</strong> - Basic format</Text>
                            <Text as="p"><strong>TEE-M-BLU-001</strong> - T-shirt, size M, blue</Text>
                            <Text as="p"><strong>SHOE_42_2025_001</strong> - Shoes, size 42, year 2025</Text>
                        </BlockStack>
                    </Card>
                </BlockStack>
            ),
        },
    ];

    const nextStep = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            onDismiss();
        }
    };

    const prevStep = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

    return (
        <Card>
            <BlockStack gap="400">
                <InlineStack align="space-between" blockAlign="center">
                    <Text as="h2" variant="headingMd">
                        <InlineStack gap="200" blockAlign="center">
                            <Icon source={PlayCircleIcon} tone="base" />
                            {steps[currentStep].title}
                        </InlineStack>
                    </Text>
                    <Text as="p" tone="subdued">
                        {currentStep + 1} z {steps.length}
                    </Text>
                </InlineStack>

                {steps[currentStep].content}

                <InlineStack align="space-between">
                    <Button
                        onClick={prevStep}
                        disabled={currentStep === 0}
                        variant="secondary"
                    >
                        Back
                    </Button>
                    <InlineStack gap="200">
                        <Button onClick={onDismiss} variant="plain">
                            Skip introduction
                        </Button>
                        <Button
                            onClick={nextStep}
                            variant="primary"
                            accessibilityLabel="Next onboarding step"
                        >
                            {currentStep === steps.length - 1 ? "Get started" : "Next"}
                        </Button>
                    </InlineStack>
                </InlineStack>
            </BlockStack>
        </Card>
    );
} 