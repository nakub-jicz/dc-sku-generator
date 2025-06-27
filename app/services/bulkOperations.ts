import type { ZasadyGeneratora } from "../types/ZasadyGeneratora";
import { generujPojedynczeSKU } from "./generatorSKU";

// Importujemy typ ProductVariant z głównej definicji
import type { ProductVariant } from "../graphql/types";

// Re-export typu dla wygody
export type { ProductVariant };

export interface BulkOperationStatus {
    id: string;
    status: 'CREATED' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELED';
    createdAt: string;
    completedAt?: string;
    objectCount?: string;
    fileSize?: string;
    url?: string;
    partialDataUrl?: string;
    errorCode?: string;
    type: string;
}

export interface StagedUploadTarget {
    url: string;
    resourceUrl: string;
    parameters: Array<{
        name: string;
        value: string;
    }>;
}

/**
 * Generuje plik JSONL z aktualizacjami SKU dla operacji masowej
 * Każda linia to obiekt zgodny z ProductSetInput dla mutacji productSet
 */
export function generateBulkUpdateJSONL(
    zasady: ZasadyGeneratora,
    warianty: ProductVariant[]
): string {
    // Grupujemy warianty według produktu
    const variantsByProduct = warianty.reduce((acc, variant) => {
        const productId = variant.product.id;
        if (!acc[productId]) {
            acc[productId] = {
                product: variant.product,
                variants: []
            };
        }
        acc[productId].variants.push(variant);
        return acc;
    }, {} as Record<string, { product: ProductVariant["product"], variants: ProductVariant[] }>);

    const jsonlLines: string[] = [];

    // Generujemy linie JSONL dla każdego produktu
    Object.entries(variantsByProduct).forEach(([productId, { product, variants }]) => {
        // Sprawdzamy czy to jest produkt z jedną opcją (single-option)
        const isSingleOption = variants.length === 1 &&
            (variants[0].selectedOptions.length === 0 ||
                (variants[0].selectedOptions.length === 1 && variants[0].selectedOptions[0].name === "Title"));

        // Generujemy opcje produktu - POPRAWKA: używamy productOptions zamiast options
        let productOptionsInput: Array<{ name: string; values: Array<{ name: string }> }>;

        if (isSingleOption) {
            // Dla produktów z jedną opcją używamy "Title" i "Default Title"
            productOptionsInput = [
                { name: "Title", values: [{ name: "Default Title" }] }
            ];
        } else {
            // Dla produktów z wieloma opcjami zbieramy wszystkie unikalne opcje
            const productOptions = new Map<string, Set<string>>();

            variants.forEach(variant => {
                variant.selectedOptions.forEach(option => {
                    if (!productOptions.has(option.name)) {
                        productOptions.set(option.name, new Set());
                    }
                    productOptions.get(option.name)!.add(option.value);
                });
            });

            productOptionsInput = Array.from(productOptions.entries()).map(([name, values]) => ({
                name: name,
                values: Array.from(values).map(value => ({ name: value }))
            }));
        }

        // Generujemy warianty z nowymi SKU
        const variantsInput = variants.map((variant, index) => {
            let optionValues: Array<{ name: string; optionName: string }>;

            if (isSingleOption) {
                // Dla produktów z jedną opcją używamy "Title" i "Default Title"
                // POPRAWKA: używamy name i optionName zamiast name i value
                optionValues = [{ name: "Default Title", optionName: "Title" }];
            } else {
                // Dla produktów z wieloma opcjami używamy rzeczywistych opcji
                // POPRAWKA: używamy name i optionName zamiast name i value
                optionValues = variant.selectedOptions.map(option => ({
                    name: option.value,
                    optionName: option.name
                }));
            }

            return {
                id: variant.id,
                sku: generujPojedynczeSKU(zasady, variant, index),
                optionValues: optionValues
            };
        });

        // Tworzymy obiekt zgodny z ProductSetInput
        // POPRAWKA: używamy productOptions zamiast options
        const productSetInput = {
            id: productId,
            productOptions: productOptionsInput,
            variants: variantsInput
        };

        // Dodajemy jako linię JSONL
        jsonlLines.push(JSON.stringify(productSetInput));

        console.log(`[BULK DEBUG] Product ${productId} (${isSingleOption ? 'single-option' : 'multi-option'}):`, JSON.stringify(productSetInput, null, 2));
    });

    const result = jsonlLines.join('\n');
    console.log(`[BULK DEBUG] Generated JSONL (${jsonlLines.length} lines):`, result);
    return result;
}

/**
 * Uploaduje plik JSONL do Shopify poprzez staged upload
 */
export async function uploadBulkFile(
    admin: any,
    jsonlContent: string,
    filename: string = 'bulk-sku-update.jsonl'
): Promise<string> {
    const STAGED_UPLOADS_CREATE = `#graphql
        mutation stagedUploadsCreate($input: [StagedUploadInput!]!) {
            stagedUploadsCreate(input: $input) {
                stagedTargets {
                    url
                    resourceUrl
                    parameters {
                        name
                        value
                    }
                }
                userErrors {
                    field
                    message
                }
            }
        }
    `;

    // Krok 1: Utworzenie staged upload
    const stagedUploadResponse = await admin.graphql(STAGED_UPLOADS_CREATE, {
        variables: {
            input: [{
                filename: filename,
                mimeType: "text/jsonl",
                httpMethod: "POST",
                resource: "BULK_MUTATION_VARIABLES"
            }]
        }
    });

    const stagedUploadData = await stagedUploadResponse.json();

    if (stagedUploadData.errors || stagedUploadData.data?.stagedUploadsCreate?.userErrors?.length > 0) {
        throw new Error(`Staged upload creation failed: ${JSON.stringify(stagedUploadData.errors || stagedUploadData.data?.stagedUploadsCreate?.userErrors)}`);
    }

    const stagedTarget = stagedUploadData.data.stagedUploadsCreate.stagedTargets[0];
    if (!stagedTarget) {
        throw new Error('No staged upload target received');
    }

    // Krok 2: Upload pliku do staged URL
    const formData = new FormData();

    // Dodajemy parametry wymagane przez Shopify
    stagedTarget.parameters.forEach((param: { name: string; value: string }) => {
        formData.append(param.name, param.value);
    });

    // Dodajemy plik jako ostatni (wymagane przez Shopify)
    const blob = new Blob([jsonlContent], { type: 'text/jsonl' });
    formData.append('file', blob, filename);

    const uploadResponse = await fetch(stagedTarget.url, {
        method: 'POST',
        body: formData
    });

    if (!uploadResponse.ok) {
        throw new Error(`File upload failed: ${uploadResponse.status} ${uploadResponse.statusText}`);
    }

    // Zwracamy resourceUrl, która będzie używana w bulk operation
    return stagedTarget.resourceUrl;
}

/**
 * Uruchamia operację masową z przesłanym plikiem
 * Automatycznie wybiera synchroniczny lub asynchroniczny szablon w zależności od wielkości operacji
 */
export async function startBulkOperation(
    admin: any,
    stagedUploadPath: string,
    totalVariants: number = 0
): Promise<BulkOperationStatus> {
    const BULK_OPERATION_RUN_MUTATION = `#graphql
        mutation bulkOperationRunMutation($mutation: String!, $stagedUploadPath: String!) {
            bulkOperationRunMutation(
                mutation: $mutation,
                stagedUploadPath: $stagedUploadPath
            ) {
                bulkOperation {
                    id
                    status
                    createdAt
                    completedAt
                    objectCount
                    fileSize
                    url
                    partialDataUrl
                    type
                }
                userErrors {
                    field
                    message
                }
            }
        }
    `;

    // Inteligentny wybór szablonu mutacji na podstawie liczby wariantów
    // Synchroniczny dla ≤100 wariantów na produkt, asynchroniczny dla większych
    const useSynchronous = totalVariants <= 100;

    // Używamy właściwego formatu ProductSetInput zgodnie z dokumentacją
    const mutationTemplate = useSynchronous
        ? `mutation productSetSync($input: ProductSetInput!) {
            productSet(synchronous: true, input: $input) {
                product {
                    id
                    title
                    variants(first: 250) {
                        edges {
                            node {
                                id
                                sku
                                title
                            }
                        }
                    }
                }
                userErrors {
                    field
                    message
                    code
                }
            }
        }`
        : `mutation productSetAsync($input: ProductSetInput!) {
            productSet(synchronous: false, input: $input) {
                product {
                    id
                    title
                    variants(first: 250) {
                        edges {
                            node {
                                id
                                sku
                                title
                            }
                        }
                    }
                }
                productSetOperation {
                    id
                    status
                    userErrors {
                        field
                        message
                        code
                    }
                }
                userErrors {
                    field
                    message
                    code
                }
            }
        }`;

    console.log(`Using ${useSynchronous ? 'synchronous' : 'asynchronous'} productSet for ${totalVariants} total variants`);
    console.log(`[BULK DEBUG] Mutation template:`, mutationTemplate);
    console.log(`[BULK DEBUG] Staged upload path:`, stagedUploadPath);

    const response = await admin.graphql(BULK_OPERATION_RUN_MUTATION, {
        variables: {
            mutation: mutationTemplate,
            stagedUploadPath: stagedUploadPath
        }
    });

    const data = await response.json();

    if (data.errors || data.data?.bulkOperationRunMutation?.userErrors?.length > 0) {
        throw new Error(`Bulk operation start failed: ${JSON.stringify(data.errors || data.data?.bulkOperationRunMutation?.userErrors)}`);
    }

    return data.data.bulkOperationRunMutation.bulkOperation;
}

/**
 * Sprawdza status operacji masowej
 */
export async function getBulkOperationStatus(
    admin: any,
    operationId: string
): Promise<BulkOperationStatus> {
    const GET_BULK_OPERATION = `#graphql
        query getBulkOperation($id: ID!) {
            node(id: $id) {
                ... on BulkOperation {
                    id
                    status
                    createdAt
                    completedAt
                    objectCount
                    fileSize
                    url
                    partialDataUrl
                    errorCode
                    type
                }
            }
        }
    `;

    const response = await admin.graphql(GET_BULK_OPERATION, {
        variables: { id: operationId }
    });

    const data = await response.json();

    if (data.errors) {
        throw new Error(`Failed to get bulk operation status: ${JSON.stringify(data.errors)}`);
    }

    return data.data.node;
}

/**
 * Pobiera aktualną operację masową (jeśli jakaś jest uruchomiona)
 */
export async function getCurrentBulkOperation(admin: any): Promise<BulkOperationStatus | null> {
    const GET_CURRENT_BULK_OPERATION = `#graphql
        query getCurrentBulkOperation {
            currentBulkOperation {
                id
                status
                createdAt
                completedAt
                objectCount
                fileSize
                url
                partialDataUrl
                errorCode
                type
            }
        }
    `;

    const response = await admin.graphql(GET_CURRENT_BULK_OPERATION);
    const data = await response.json();

    if (data.errors) {
        throw new Error(`Failed to get current bulk operation: ${JSON.stringify(data.errors)}`);
    }

    return data.data.currentBulkOperation;
}

/**
 * Pobiera i parsuje wyniki operacji masowej
 */
export async function getBulkOperationResults(resultsUrl: string): Promise<any[]> {
    if (!resultsUrl) {
        throw new Error('No results URL provided');
    }

    const response = await fetch(resultsUrl);
    if (!response.ok) {
        throw new Error(`Failed to fetch results: ${response.status} ${response.statusText}`);
    }

    const jsonlContent = await response.text();
    const results: any[] = [];

    // Parsujemy każdą linię JSONL
    const lines = jsonlContent.trim().split('\n');
    for (const line of lines) {
        if (line.trim()) {
            try {
                results.push(JSON.parse(line));
            } catch (error) {
                console.error('Failed to parse JSONL line:', line, error);
            }
        }
    }

    return results;
}

/**
 * Kompletny proces operacji masowej - od generowania JSONL do monitorowania
 */
export async function executeBulkSKUUpdate(
    admin: any,
    zasady: ZasadyGeneratora,
    warianty: ProductVariant[]
): Promise<BulkOperationStatus> {
    // Sprawdzamy czy nie ma już uruchomionej operacji
    const currentOperation = await getCurrentBulkOperation(admin);
    if (currentOperation && ['CREATED', 'RUNNING'].includes(currentOperation.status)) {
        throw new Error(`Bulk operation already running: ${currentOperation.id} (status: ${currentOperation.status})`);
    }

    // Generujemy plik JSONL
    const jsonlContent = generateBulkUpdateJSONL(zasady, warianty);
    console.log(`Generated JSONL with ${jsonlContent.split('\n').length} operations`);

    // Uploadujemy plik
    const stagedUploadPath = await uploadBulkFile(admin, jsonlContent);
    console.log(`File uploaded to: ${stagedUploadPath}`);

    // Uruchamiamy operację masową z informacją o liczbie wariantów
    const bulkOperation = await startBulkOperation(admin, stagedUploadPath, warianty.length);
    console.log(`Bulk operation started: ${bulkOperation.id}`);

    return bulkOperation;
} 