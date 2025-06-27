import { useState, useEffect } from "react";
import { Card, Button, Text, ProgressBar, Banner, List, Spinner } from "@shopify/polaris";
import type { ZasadyGeneratora } from "../types/ZasadyGeneratora";
import type { ProductVariant } from "../graphql/types";

interface BulkOperationManagerProps {
    zasady: ZasadyGeneratora;
    warianty: ProductVariant[];
    onComplete?: (results: any) => void;
}

interface BulkOperationStatus {
    id: string;
    status: 'CREATED' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELED';
    createdAt: string;
    completedAt?: string;
    objectCount?: string;
    fileSize?: string;
    errorCode?: string;
    type: string;
}

interface BulkOperationResponse {
    success: boolean;
    bulkOperation?: BulkOperationStatus;
    results?: any[];
    resultsCount?: number;
    summary?: {
        total: number;
        successful: number;
        failed: number;
        successRate: string;
    };
    error?: string;
}

export function BulkOperationManager({ zasady, warianty, onComplete }: BulkOperationManagerProps) {
    const [isStarting, setIsStarting] = useState(false);
    const [currentOperation, setCurrentOperation] = useState<BulkOperationStatus | null>(null);
    const [operationResults, setOperationResults] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [pollInterval, setPollInterval] = useState<NodeJS.Timeout | null>(null);

    // Sprawdzamy czy już jest uruchomiona operacja przy załadowaniu komponentu
    useEffect(() => {
        checkCurrentOperation();
        return () => {
            if (pollInterval) {
                clearInterval(pollInterval);
            }
        };
    }, []);

    const checkCurrentOperation = async () => {
        try {
            const response = await fetch("/api/bulk-status");
            if (response.ok) {
                const data: BulkOperationResponse = await response.json();
                if (data.success && data.bulkOperation) {
                    setCurrentOperation(data.bulkOperation);

                    // Jeśli operacja jest w toku, uruchom polling
                    if (['CREATED', 'RUNNING'].includes(data.bulkOperation.status)) {
                        startPolling(data.bulkOperation.id);
                    } else if (data.bulkOperation.status === 'COMPLETED') {
                        // Jeśli operacja się zakończyła, pobierz wyniki
                        await fetchResults(data.bulkOperation.id);
                    }
                }
            }
        } catch (error) {
            console.error("Failed to check current operation:", error);
        }
    };

    const startBulkOperation = async () => {
        setIsStarting(true);
        setError(null);

        try {
            const response = await fetch("/api/bulk-update-sku", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    zasady,
                    warianty
                })
            });

            const data = await response.json();

            if (data.success) {
                setCurrentOperation({
                    id: data.bulkOperationId,
                    status: data.status,
                    createdAt: data.createdAt,
                    objectCount: data.objectCount,
                    type: "MUTATION"
                });

                // Uruchom polling statusu
                startPolling(data.bulkOperationId);
            } else {
                setError(data.error);
            }
        } catch (error) {
            setError(error instanceof Error ? error.message : "Wystąpił nieznany błąd");
        } finally {
            setIsStarting(false);
        }
    };

    const startPolling = (operationId: string) => {
        const interval = setInterval(async () => {
            await checkOperationStatus(operationId);
        }, 3000); // Sprawdzaj co 3 sekundy

        setPollInterval(interval);
    };

    const checkOperationStatus = async (operationId: string) => {
        try {
            const response = await fetch(`/api/bulk-status?id=${operationId}`);
            if (response.ok) {
                const data: BulkOperationResponse = await response.json();
                if (data.success && data.bulkOperation) {
                    setCurrentOperation(data.bulkOperation);

                    // Jeśli operacja się zakończyła, zatrzymaj polling i pobierz wyniki
                    if (!['CREATED', 'RUNNING'].includes(data.bulkOperation.status)) {
                        if (pollInterval) {
                            clearInterval(pollInterval);
                            setPollInterval(null);
                        }

                        if (data.bulkOperation.status === 'COMPLETED') {
                            await fetchResults(operationId);
                        } else if (data.bulkOperation.status === 'FAILED') {
                            setError(`Operacja nie powiodła się. Kod błędu: ${data.bulkOperation.errorCode}`);
                        }
                    }
                }
            }
        } catch (error) {
            console.error("Failed to check operation status:", error);
        }
    };

    const fetchResults = async (operationId: string) => {
        try {
            const response = await fetch(`/api/bulk-status?id=${operationId}&includeResults=true`);
            if (response.ok) {
                const data: BulkOperationResponse = await response.json();
                if (data.success) {
                    setOperationResults(data);
                    if (onComplete) {
                        onComplete(data);
                    }
                }
            }
        } catch (error) {
            console.error("Failed to fetch results:", error);
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'CREATED': return 'Utworzona';
            case 'RUNNING': return 'W trakcie wykonywania';
            case 'COMPLETED': return 'Zakończona pomyślnie';
            case 'FAILED': return 'Nieudana';
            case 'CANCELED': return 'Anulowana';
            default: return status;
        }
    };

    const getProgressPercentage = () => {
        if (!currentOperation) return 0;
        if (currentOperation.status === 'COMPLETED') return 100;
        if (currentOperation.status === 'RUNNING') return 50; // Przybliżony postęp
        if (currentOperation.status === 'CREATED') return 10;
        return 0;
    };

    const canStartNewOperation = !currentOperation || !['CREATED', 'RUNNING'].includes(currentOperation.status);

    return (
        <Card>
            <div style={{ padding: '1rem' }}>
                <Text variant="headingMd" as="h3">
                    Operacja Masowa - Aktualizacja SKU
                </Text>

                <div style={{ marginTop: '1rem' }}>
                    <Text variant="bodyMd" as="p">
                        Zaktualizuj SKU dla {warianty.length} wariantów w {new Set(warianty.map(v => v.product.id)).size} produktach
                    </Text>
                </div>

                {error && (
                    <div style={{ marginTop: '1rem' }}>
                        <Banner tone="critical">
                            <p>{error}</p>
                        </Banner>
                    </div>
                )}

                {currentOperation && (
                    <div style={{ marginTop: '1rem' }}>
                        <Card>
                            <div style={{ padding: '1rem' }}>
                                <Text variant="headingSm" as="h4">
                                    Status Operacji
                                </Text>
                                <div style={{ marginTop: '0.5rem' }}>
                                    <Text variant="bodyMd" as="p">
                                        <strong>ID:</strong> {currentOperation.id}
                                    </Text>
                                    <Text variant="bodyMd" as="p">
                                        <strong>Status:</strong> {getStatusText(currentOperation.status)}
                                    </Text>
                                    <Text variant="bodyMd" as="p">
                                        <strong>Utworzona:</strong> {new Date(currentOperation.createdAt).toLocaleString('pl-PL')}
                                    </Text>
                                    {currentOperation.completedAt && (
                                        <Text variant="bodyMd" as="p">
                                            <strong>Zakończona:</strong> {new Date(currentOperation.completedAt).toLocaleString('pl-PL')}
                                        </Text>
                                    )}
                                    {currentOperation.objectCount && (
                                        <Text variant="bodyMd" as="p">
                                            <strong>Liczba obiektów:</strong> {currentOperation.objectCount}
                                        </Text>
                                    )}
                                </div>

                                <div style={{ marginTop: '1rem' }}>
                                    <ProgressBar
                                        progress={getProgressPercentage()}
                                        size="medium"
                                    />
                                </div>
                            </div>
                        </Card>
                    </div>
                )}

                {operationResults && operationResults.summary && (
                    <div style={{ marginTop: '1rem' }}>
                        <Card>
                            <div style={{ padding: '1rem' }}>
                                <Text variant="headingSm" as="h4">
                                    Wyniki Operacji
                                </Text>
                                <div style={{ marginTop: '0.5rem' }}>
                                    <List type="bullet">
                                        <List.Item>Łącznie przetworzonych: {operationResults.summary.total}</List.Item>
                                        <List.Item>Pomyślnie zaktualizowanych: {operationResults.summary.successful}</List.Item>
                                        <List.Item>Błędów: {operationResults.summary.failed}</List.Item>
                                        <List.Item>Skuteczność: {operationResults.summary.successRate}%</List.Item>
                                    </List>
                                </div>
                            </div>
                        </Card>
                    </div>
                )}

                <div style={{ marginTop: '1rem' }}>
                    <Button
                        variant="primary"
                        size="large"
                        onClick={startBulkOperation}
                        disabled={!canStartNewOperation || isStarting}
                        loading={isStarting}
                    >
                        {isStarting ? 'Uruchamiam...' : 'Uruchom Operację Masową'}
                    </Button>

                    {!canStartNewOperation && (
                        <div style={{ marginTop: '0.5rem' }}>
                            <Text variant="bodyMd" as="p" tone="subdued">
                                Operacja masowa jest już w trakcie wykonywania
                            </Text>
                        </div>
                    )}
                </div>

                {['CREATED', 'RUNNING'].includes(currentOperation?.status || '') && (
                    <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Spinner size="small" />
                        <Text variant="bodyMd" as="p">
                            Monitoruję postęp operacji...
                        </Text>
                    </div>
                )}
            </div>
        </Card>
    );
} 