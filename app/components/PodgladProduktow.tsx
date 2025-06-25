import { useState, useMemo, useEffect, useRef } from "react";
import { useAppBridge } from "@shopify/app-bridge-react";
import { Form, useNavigate } from "@remix-run/react";
import {
    Card,
    Button,
    BlockStack,
    Text,
    InlineStack,
    Checkbox,
    Thumbnail,
    Badge,
    Divider,
    EmptyState,
    Toast,
} from "@shopify/polaris";
import { ImageIcon, XIcon } from "@shopify/polaris-icons";
import styles from './PodgladProduktow.module.css';
import type { Dispatch, SetStateAction } from "react";

import type { ZasadyGeneratora } from "../types/ZasadyGeneratora";
import { generujPojedynczeSKU } from "../services/generatorSKU";

// Import the ProductVariant type from the generator service
interface ProductVariant {
    id: string;
    title: string;
    sku: string | null;
    product: {
        id: string;
        title: string;
        vendor: string;
        productType: string;
        images?: Array<{
            id: string;
            url: string;
            altText?: string;
        }>;
    };
    selectedOptions: Array<{
        name: string;
        value: string;
    }>;
}

interface PodgladProduktowProps {
    zasady: ZasadyGeneratora;
    products: ProductVariant[];
    selectedVariantIds: string[];
    setSelectedVariantIds: Dispatch<SetStateAction<string[]>>;
    scope?: string;
}

/**
 * Komponent do wyświetlania produktów w kompaktowej formie z możliwością wyboru
 * i podglądu generowanych SKU.
 */
export function PodgladProduktow({ zasady, products, selectedVariantIds, setSelectedVariantIds, scope }: PodgladProduktowProps) {
    const shopify = useAppBridge();
    const navigate = useNavigate();
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [pickedVariants, setPickedVariants] = useState<ProductVariant[] | null>(null);
    const [, setPickedProducts] = useState<any[]>([]);
    const hasAutoSelectedRef = useRef(false);

    // Use pickedVariants if set, otherwise fallback to loader products
    const displayVariants = pickedVariants ?? products;

    // Reset pickedVariants only when scope changes to 'all'
    useEffect(() => {
        console.log('PodgladProduktow useEffect:', { scope, productsLength: products.length, pickedVariants: pickedVariants?.length });
        if (scope === 'all' && pickedVariants !== null) {
            console.log('Resetting pickedVariants because scope=all');
            setPickedVariants(null);
        }
        // Gdy scope='products' albo 'none' - nie resetuj pickedVariants
    }, [scope]); // Usuwam products.length i pickedVariants z dependencies żeby uniknąć niepotrzebnych re-renderów



    // Grupowanie wariantów po produkcie z rozróżnieniem na produkty z wariantami i bez
    const groupedByProduct = useMemo(() => {
        const map = new Map<string, {
            product: ProductVariant["product"],
            variants: ProductVariant[],
            hasRealVariants: boolean
        }>();

        for (const variant of displayVariants) {
            const pid = variant.product.id;
            if (!map.has(pid)) {
                map.set(pid, { product: variant.product, variants: [], hasRealVariants: false });
            }
            map.get(pid)!.variants.push(variant);
        }

        // Sprawdź które produkty mają rzeczywiste warianty (więcej niż 1 lub nie "Default Title")
        for (const group of map.values()) {
            const hasMultipleVariants = group.variants.length > 1;
            const hasDefaultTitleOnly = group.variants.length === 1 &&
                group.variants[0].title === "Default Title";

            group.hasRealVariants = hasMultipleVariants || !hasDefaultTitleOnly;
        }

        return Array.from(map.values());
    }, [displayVariants]);

    // Fetch variants for picked products
    const fetchVariantsForProducts = async (productIds: string[]) => {
        setIsLoading(true);
        try {
            // Use a secure Remix API route instead of direct admin API fetch
            const res = await fetch("/api/get-variants", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ productIds }),
                credentials: "include",
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.error || `HTTP ${res.status}: ${res.statusText}`);
            }

            const products = await res.json();

            if (products.error) {
                throw new Error(products.error);
            }

            const variants: ProductVariant[] = products.flatMap((product: any) =>
                product.variants.nodes.map((variant: any) => ({
                    id: variant.id,
                    title: variant.title,
                    sku: variant.sku,
                    product: {
                        id: product.id,
                        title: product.title,
                        vendor: product.vendor,
                        productType: product.productType,
                        images: product.images.nodes,
                    },
                    selectedOptions: variant.selectedOptions,
                }))
            );

            setPickedVariants(variants);
            hasAutoSelectedRef.current = false; // Reset so new products get auto-selected
            setShowToast(true);
            setToastMessage(`Loaded ${variants.length} variants from ${productIds.length} product${productIds.length > 1 ? 's' : ''}`);
        } catch (error) {
            console.error("Error loading product variants:", error);
            setShowToast(true);
            setToastMessage(`Error loading product variants: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setIsLoading(false);
        }
    };

    // Handle ResourcePicker
    const handleProductSelection = async () => {
        setIsLoading(true);
        try {
            const result = await shopify.resourcePicker({
                type: "product",
                action: "select",
                multiple: true,
            });

            if (result && Array.isArray(result) && result.length > 0) {
                setPickedProducts(result);
                const productIds = result.map((product: any) => product.id).filter(Boolean);

                if (productIds.length === 0) {
                    throw new Error("No valid product IDs found");
                }

                await fetchVariantsForProducts(productIds);
            } else {
                setShowToast(true);
                setToastMessage("No products selected");
            }
        } catch (error) {
            console.error("ResourcePicker error:", error);
            setShowToast(true);
            setToastMessage(`Product selection error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setIsLoading(false);
        }
    };

    // Reset to all products - przekieruj do scope=all
    const handleReset = () => {
        // Wyczyść wybrane produkty i przekieruj do scope=all
        setPickedVariants(null);
        setPickedProducts([]);
        hasAutoSelectedRef.current = false; // Reset so all products get auto-selected
        navigate("?scope=all", { replace: true });
    };

    const allVariantIds = displayVariants.map(v => v.id);

    // Auto-select all variants on first load only
    useEffect(() => {
        if (allVariantIds.length > 0 && !hasAutoSelectedRef.current) {
            console.log('Auto-selecting all variants on first load:', allVariantIds.length);
            setSelectedVariantIds(allVariantIds);
            hasAutoSelectedRef.current = true;
        }
    }, [allVariantIds.length > 0]); // Trigger when we have variants for the first time

    // Synchronizacja: usuń zaznaczenia dla wariantów, które już nie istnieją
    useEffect(() => {
        const validSelectedIds = selectedVariantIds.filter(id => allVariantIds.includes(id));
        if (validSelectedIds.length !== selectedVariantIds.length) {
            console.log('Cleaning up selectedVariantIds:', {
                before: selectedVariantIds.length,
                after: validSelectedIds.length,
                removed: selectedVariantIds.filter(id => !allVariantIds.includes(id))
            });
            setSelectedVariantIds(validSelectedIds);
        }
    }, [allVariantIds, selectedVariantIds, setSelectedVariantIds]);

    const allItemsSelected = allVariantIds.length > 0 && selectedVariantIds.length === allVariantIds.length;
    const someItemsSelected = selectedVariantIds.length > 0 && !allItemsSelected;

    // Policz produkty z wariantami vs. bez wariantów
    const productsWithVariants = groupedByProduct.filter(g => g.hasRealVariants).length;
    const productsWithoutVariants = groupedByProduct.filter(g => !g.hasRealVariants).length;

    // Ujednolicona logika opisu produktów
    const getStatusDescription = () => {
        if (displayVariants.length === 0) return "No products loaded";

        const selectedCount = selectedVariantIds.filter(id => allVariantIds.includes(id)).length;
        const totalProducts = groupedByProduct.length;
        const totalVariants = allVariantIds.length;

        if (totalProducts === 1) {
            // Jeden produkt
            return `${selectedCount} of ${totalVariants} ${totalVariants === 1 ? 'item' : 'variants'} selected`;
        } else {
            // Wiele produktów
            if (productsWithVariants > 0 && productsWithoutVariants === 0) {
                return `${selectedCount} of ${totalVariants} variants selected from ${totalProducts} products`;
            } else if (productsWithVariants === 0 && productsWithoutVariants > 0) {
                return `${selectedCount} of ${totalProducts} products selected`;
            } else {
                return `${selectedCount} of ${totalVariants} items selected from ${totalProducts} products`;
            }
        }
    };

    // Obsługa zaznaczania pojedynczego wariantu
    const handleVariantCheckbox = (variantId: string, checked: boolean) => {
        setSelectedVariantIds((prev: string[]) => {
            if (checked) {
                return [...prev, variantId];
            } else {
                return prev.filter((id: string) => id !== variantId);
            }
        });
    };

    // Obsługa zaznaczania wszystkich wariantów produktu
    const handleProductCheckbox = (product: ProductVariant["product"], checked: boolean) => {
        const variantIds = groupedByProduct.find(g => g.product.id === product.id)?.variants.map(v => v.id) || [];
        setSelectedVariantIds((prev: string[]) => {
            if (checked) {
                return Array.from(new Set([...prev, ...variantIds]));
            } else {
                return prev.filter((id: string) => !variantIds.includes(id));
            }
        });
    };

    // Obsługa select all
    const handleSelectAll = (checked: boolean) => {
        setSelectedVariantIds(() => (checked ? allVariantIds : []));
    };

    // Usuwanie całego produktu (wszystkich jego wariantów)
    const handleRemoveProduct = (productId: string) => {
        console.log('handleRemoveProduct called:', {
            productId,
            pickedVariants: !!pickedVariants,
            displayVariantsCount: displayVariants.length
        });

        // Najpierw znajdź warianty do usunięcia PRZED filtrowaniem
        const sourceVariants = pickedVariants ?? products;
        const removedVariantIds = sourceVariants
            .filter(variant => variant.product.id === productId)
            .map(variant => variant.id);

        if (pickedVariants) {
            // Jeśli mamy wybrane produkty, usuń z nich
            const updatedVariants = pickedVariants.filter(variant => variant.product.id !== productId);
            setPickedVariants(updatedVariants);
            console.log('Removed from pickedVariants, new count:', updatedVariants.length);
        } else {
            // Jeśli pokazujemy wszystkie produkty, przekonwertuj na selected products
            console.log('Converting from All Products to Selected Products, removing:', productId);
            const remainingVariants = products.filter(variant => variant.product.id !== productId);
            setPickedVariants(remainingVariants);
            console.log('Set pickedVariants to remaining products, count:', remainingVariants.length);

            // Zmień scope na products, żeby UI się zaktualizowało
            navigate("?scope=products", { replace: true });
        }

        // Usuń także zaznaczenia dla usuniętych wariantów
        setSelectedVariantIds(prev => {
            const newSelected = prev.filter(id => !removedVariantIds.includes(id));
            console.log('Updated selectedVariantIds after product removal:', {
                removed: removedVariantIds,
                before: prev.length,
                after: newSelected.length
            });
            return newSelected;
        });

        setShowToast(true);
        setToastMessage("Product removed from selection");
    };

    // Usuwanie pojedynczego wariantu
    const handleRemoveVariant = (variantId: string) => {
        if (pickedVariants) {
            // Jeśli mamy wybrane produkty, usuń z nich
            const updatedVariants = pickedVariants.filter(variant => variant.id !== variantId);
            setPickedVariants(updatedVariants);
        } else {
            // Jeśli pokazujemy wszystkie produkty, przekonwertuj na selected products
            console.log('Converting from All Products to Selected Products, removing variant:', variantId);
            const remainingVariants = products.filter(variant => variant.id !== variantId);
            setPickedVariants(remainingVariants);
            console.log('Set pickedVariants to remaining variants, count:', remainingVariants.length);

            // Zmień scope na products, żeby UI się zaktualizowało
            navigate("?scope=products", { replace: true });
        }

        // Zawsze usuń zaznaczenie dla usuniętego wariantu
        setSelectedVariantIds(prev => {
            const newSelected = prev.filter(id => id !== variantId);
            console.log('Updated selectedVariantIds after variant removal:', {
                removedVariant: variantId,
                before: prev.length,
                after: newSelected.length
            });
            return newSelected;
        });

        setShowToast(true);
        setToastMessage("Variant removed from selection");
    };

    const wybraneWariantyDoZapisu = displayVariants.filter(v => selectedVariantIds.includes(v.id));

    return (
        <>
            <Card>
                <Form method="post">
                    <input type="hidden" name="zasady" value={JSON.stringify(zasady)} />
                    <input type="hidden" name="warianty" value={JSON.stringify(wybraneWariantyDoZapisu)} />
                    <BlockStack gap="400">
                        <div className={styles.headerSection}>
                            <InlineStack align="space-between" blockAlign="center" gap="600">
                                <InlineStack gap="300" blockAlign="baseline">
                                    <Text variant="headingMd" as="h2">
                                        Product Preview
                                    </Text>
                                    <div className={styles.statusContainer}>
                                        <Text as="span" variant="bodySm" tone="subdued">
                                            {getStatusDescription()}
                                        </Text>
                                    </div>
                                </InlineStack>
                                <div className={styles.buttonContainer}>
                                    <InlineStack gap="200" blockAlign="center">
                                        <Button
                                            onClick={handleProductSelection}
                                            variant="secondary"
                                            loading={isLoading}
                                            size="medium"
                                        >
                                            Select Products
                                        </Button>
                                        <Button
                                            onClick={handleReset}
                                            variant="tertiary"
                                            size="medium"
                                        >
                                            All Products
                                        </Button>
                                        <Button
                                            onClick={() => {
                                                setPickedVariants([]);
                                                setSelectedVariantIds([]);
                                                navigate("?scope=products", { replace: true });
                                            }}
                                            variant="tertiary"
                                            size="medium"
                                            disabled={displayVariants.length === 0}
                                        >
                                            Clear Products
                                        </Button>
                                        <Button
                                            variant="primary"
                                            submit
                                            disabled={wybraneWariantyDoZapisu.length === 0}
                                            size="medium"
                                        >
                                            {`Generate SKUs (${wybraneWariantyDoZapisu.length})`}
                                        </Button>
                                    </InlineStack>
                                </div>
                            </InlineStack>
                        </div>
                        <Divider />

                        {displayVariants.length === 0 ? (
                            <EmptyState
                                heading="No products selected"
                                image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
                            >
                                <p>Select products to generate SKUs for them using the buttons above.</p>
                            </EmptyState>
                        ) : (
                            <>
                                <InlineStack gap="200" blockAlign="center">
                                    <Checkbox
                                        label="Select all variants"
                                        checked={allItemsSelected ? true : (someItemsSelected ? 'indeterminate' : false)}
                                        onChange={handleSelectAll}
                                    />
                                    <Text as="span" variant="bodySm" tone="subdued">
                                        Select all {groupedByProduct.length === 1
                                            ? (allVariantIds.length === 1 ? 'item' : 'variants')
                                            : `${allVariantIds.length} items`
                                        }
                                    </Text>
                                </InlineStack>
                                <Divider />
                                <BlockStack gap="400">
                                    {(() => {
                                        let globalVariantIndex = 0;
                                        return groupedByProduct.map((group) => {
                                            const variantIds = group.variants.map(v => v.id);
                                            const selectedCount = variantIds.filter(id => selectedVariantIds.includes(id)).length;
                                            const allSelected = selectedCount === variantIds.length && variantIds.length > 0;
                                            const indeterminate = selectedCount > 0 && selectedCount < variantIds.length;
                                            return (
                                                <div key={group.product.id} className={styles.productCard}>
                                                    <Card padding={"400" as any}>
                                                        <BlockStack gap="300">
                                                            <div className={styles.productHeader}>
                                                                <div
                                                                    onClick={() => handleProductCheckbox(group.product, !allSelected)}
                                                                    className={styles.clickableRow}
                                                                >
                                                                    <InlineStack align="space-between" blockAlign="center">
                                                                        <InlineStack gap="300" blockAlign="center">
                                                                            <div onClick={(e) => e.stopPropagation()}>
                                                                                <Checkbox
                                                                                    checked={allSelected ? true : (indeterminate ? 'indeterminate' : false)}
                                                                                    onChange={checked => handleProductCheckbox(group.product, checked)}
                                                                                    label=""
                                                                                    labelHidden
                                                                                />
                                                                            </div>
                                                                            <div className={styles.productImage}>
                                                                                <Thumbnail
                                                                                    source={group.product.images?.[0]?.url ? group.product.images[0].url : ImageIcon}
                                                                                    alt={group.product.images?.[0]?.altText ? group.product.images[0].altText : group.product.title}
                                                                                    size="small"
                                                                                />
                                                                            </div>
                                                                            <BlockStack gap="100">
                                                                                <Text variant="bodyMd" as="h3" fontWeight="semibold">
                                                                                    {group.product.title}
                                                                                </Text>
                                                                                <Text as="span" variant="bodySm" tone="subdued">
                                                                                    {group.product.vendor} • {group.product.productType}
                                                                                </Text>
                                                                            </BlockStack>
                                                                        </InlineStack>
                                                                        <InlineStack gap="200" blockAlign="center">
                                                                            <Badge tone="info">
                                                                                {group.hasRealVariants
                                                                                    ? `${selectedCount} of ${variantIds.length} variants`
                                                                                    : selectedCount > 0 ? "Selected" : "Not selected"
                                                                                }
                                                                            </Badge>
                                                                            <div className={styles.removeButton}>
                                                                                <Button
                                                                                    variant="plain"
                                                                                    size="micro"
                                                                                    icon={XIcon}
                                                                                    onClick={() => handleRemoveProduct(group.product.id)}
                                                                                    accessibilityLabel="Remove product"
                                                                                    tone="critical"
                                                                                />
                                                                            </div>
                                                                        </InlineStack>
                                                                    </InlineStack>
                                                                </div>
                                                            </div>

                                                            {/* Dla produktów bez rzeczywistych wariantów pokazuj jako pojedynczy "wariant" */}
                                                            {!group.hasRealVariants ? (
                                                                (() => {
                                                                    const variant = group.variants[0];
                                                                    const isChecked = selectedVariantIds.includes(variant.id);
                                                                    const newSku = generujPojedynczeSKU(zasady, variant, globalVariantIndex);
                                                                    globalVariantIndex++;
                                                                    return (
                                                                        <BlockStack gap="200">
                                                                            <div className={styles.variantCard}>
                                                                                <Card padding="300" background="bg-surface-secondary">
                                                                                    <div
                                                                                        onClick={() => handleVariantCheckbox(variant.id, !isChecked)}
                                                                                        className={styles.clickableRow}
                                                                                    >
                                                                                        <InlineStack align="space-between" blockAlign="center">
                                                                                            <InlineStack gap="300" blockAlign="center">
                                                                                                <div onClick={(e) => e.stopPropagation()}>
                                                                                                    <Checkbox
                                                                                                        checked={isChecked}
                                                                                                        onChange={checked => handleVariantCheckbox(variant.id, checked)}
                                                                                                        label=""
                                                                                                        labelHidden
                                                                                                    />
                                                                                                </div>
                                                                                                <BlockStack gap="100">
                                                                                                    <Text variant="bodySm" as="span" fontWeight="medium">
                                                                                                        Product SKU
                                                                                                    </Text>
                                                                                                    <div className={styles.variantOptions}>
                                                                                                        <Text as="span" variant="bodySm" tone="subdued">
                                                                                                            Simple product (no variants)
                                                                                                        </Text>
                                                                                                    </div>
                                                                                                </BlockStack>
                                                                                            </InlineStack>
                                                                                            <InlineStack gap="200" blockAlign="center">
                                                                                                <div className={styles.skuComparison}>
                                                                                                    <BlockStack gap="100" align="end">
                                                                                                        <InlineStack gap="200" blockAlign="center">
                                                                                                            <div className={styles.currentSku}>
                                                                                                                <Text as="span" variant="bodySm" tone="subdued">
                                                                                                                    Current:
                                                                                                                </Text>
                                                                                                            </div>
                                                                                                            <Text as="span" variant="bodySm" fontWeight="medium">
                                                                                                                {variant.sku || "No SKU"}
                                                                                                            </Text>
                                                                                                        </InlineStack>
                                                                                                        <InlineStack gap="200" blockAlign="center">
                                                                                                            <Text as="span" variant="bodySm" tone="subdued">
                                                                                                                New:
                                                                                                            </Text>
                                                                                                            <div className={styles.newSku}>
                                                                                                                <Text as="span" variant="bodySm" fontWeight="semibold" tone="success">
                                                                                                                    {newSku}
                                                                                                                </Text>
                                                                                                            </div>
                                                                                                        </InlineStack>
                                                                                                    </BlockStack>
                                                                                                </div>
                                                                                                <div className={styles.removeButton}>
                                                                                                    <Button
                                                                                                        variant="plain"
                                                                                                        size="micro"
                                                                                                        icon={XIcon}
                                                                                                        onClick={() => handleRemoveVariant(variant.id)}
                                                                                                        accessibilityLabel="Remove product"
                                                                                                        tone="critical"
                                                                                                    />
                                                                                                </div>
                                                                                            </InlineStack>
                                                                                        </InlineStack>
                                                                                    </div>
                                                                                </Card>
                                                                            </div>
                                                                        </BlockStack>
                                                                    );
                                                                })()
                                                            ) : (
                                                                /* Dla produktów z rzeczywistymi wariantami pokazuj listę wariantów */
                                                                <BlockStack gap="200">
                                                                    {group.variants.map((variant) => {
                                                                        const isChecked = selectedVariantIds.includes(variant.id);
                                                                        const newSku = generujPojedynczeSKU(zasady, variant, globalVariantIndex);
                                                                        const variantOptions = variant.selectedOptions
                                                                            .map(opt => `${opt.name}: ${opt.value}`)
                                                                            .join(', ');
                                                                        globalVariantIndex++;
                                                                        return (
                                                                            <div key={variant.id} className={styles.variantCard}>
                                                                                <Card padding="300" background="bg-surface-secondary">
                                                                                    <div
                                                                                        onClick={() => handleVariantCheckbox(variant.id, !isChecked)}
                                                                                        className={styles.clickableRow}
                                                                                    >
                                                                                        <InlineStack align="space-between" blockAlign="center">
                                                                                            <InlineStack gap="300" blockAlign="center">
                                                                                                <div onClick={(e) => e.stopPropagation()}>
                                                                                                    <Checkbox
                                                                                                        checked={isChecked}
                                                                                                        onChange={checked => handleVariantCheckbox(variant.id, checked)}
                                                                                                        label=""
                                                                                                        labelHidden
                                                                                                    />
                                                                                                </div>
                                                                                                <BlockStack gap="100">
                                                                                                    <Text variant="bodySm" as="span" fontWeight="medium">
                                                                                                        {variant.title}
                                                                                                    </Text>
                                                                                                    {variantOptions && (
                                                                                                        <div className={styles.variantOptions}>
                                                                                                            <Text as="span" variant="bodySm" tone="subdued">
                                                                                                                {variantOptions}
                                                                                                            </Text>
                                                                                                        </div>
                                                                                                    )}
                                                                                                </BlockStack>
                                                                                            </InlineStack>
                                                                                            <InlineStack gap="200" blockAlign="center">
                                                                                                <div className={styles.skuComparison}>
                                                                                                    <BlockStack gap="100" align="end">
                                                                                                        <InlineStack gap="200" blockAlign="center">
                                                                                                            <div className={styles.currentSku}>
                                                                                                                <Text as="span" variant="bodySm" tone="subdued">
                                                                                                                    Current:
                                                                                                                </Text>
                                                                                                            </div>
                                                                                                            <Text as="span" variant="bodySm" fontWeight="medium">
                                                                                                                {variant.sku || "No SKU"}
                                                                                                            </Text>
                                                                                                        </InlineStack>
                                                                                                        <InlineStack gap="200" blockAlign="center">
                                                                                                            <Text as="span" variant="bodySm" tone="subdued">
                                                                                                                New:
                                                                                                            </Text>
                                                                                                            <div className={styles.newSku}>
                                                                                                                <Text as="span" variant="bodySm" fontWeight="semibold" tone="success">
                                                                                                                    {newSku}
                                                                                                                </Text>
                                                                                                            </div>
                                                                                                        </InlineStack>
                                                                                                    </BlockStack>
                                                                                                </div>
                                                                                                <div className={styles.removeButton}>
                                                                                                    <Button
                                                                                                        variant="plain"
                                                                                                        size="micro"
                                                                                                        icon={XIcon}
                                                                                                        onClick={() => handleRemoveVariant(variant.id)}
                                                                                                        accessibilityLabel="Remove variant"
                                                                                                        tone="critical"
                                                                                                    />
                                                                                                </div>
                                                                                            </InlineStack>
                                                                                        </InlineStack>
                                                                                    </div>
                                                                                </Card>
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </BlockStack>
                                                            )}
                                                        </BlockStack>
                                                    </Card>
                                                </div>
                                            );
                                        });
                                    })()}
                                </BlockStack>
                            </>
                        )}


                    </BlockStack>
                </Form>
            </Card>
            {showToast && (
                <Toast
                    content={toastMessage}
                    onDismiss={() => setShowToast(false)}
                />
            )}
        </>
    );
} 