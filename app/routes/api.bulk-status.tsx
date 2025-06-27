import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import {
    getBulkOperationStatus,
    getCurrentBulkOperation,
    getBulkOperationResults
} from "../services/bulkOperations";

export const loader = async ({ request }: LoaderFunctionArgs) => {
    const { admin } = await authenticate.admin(request);

    const url = new URL(request.url);
    const operationId = url.searchParams.get("id");
    const includeResults = url.searchParams.get("includeResults") === "true";

    try {
        let bulkOperation;

        if (operationId) {
            // Sprawdzamy konkretną operację
            bulkOperation = await getBulkOperationStatus(admin, operationId);
        } else {
            // Sprawdzamy aktualną operację
            bulkOperation = await getCurrentBulkOperation(admin);
        }

        if (!bulkOperation) {
            return json({
                success: false,
                error: "No bulk operation found"
            }, { status: 404 });
        }

        const response: any = {
            success: true,
            bulkOperation: {
                id: bulkOperation.id,
                status: bulkOperation.status,
                createdAt: bulkOperation.createdAt,
                completedAt: bulkOperation.completedAt,
                objectCount: bulkOperation.objectCount,
                fileSize: bulkOperation.fileSize,
                errorCode: bulkOperation.errorCode,
                type: bulkOperation.type
            }
        };

        // Jeśli operacja się zakończyła i chcemy wyniki
        if (includeResults && bulkOperation.status === 'COMPLETED' && bulkOperation.url) {
            try {
                const results = await getBulkOperationResults(bulkOperation.url);
                response.results = results;
                response.resultsCount = results.length;

                // Analizujemy wyniki - ile sukcesów vs błędów
                const successful = results.filter(r => !r.userErrors || r.userErrors.length === 0);
                const failed = results.filter(r => r.userErrors && r.userErrors.length > 0);

                response.summary = {
                    total: results.length,
                    successful: successful.length,
                    failed: failed.length,
                    successRate: results.length > 0 ? (successful.length / results.length * 100).toFixed(1) : 0
                };
            } catch (error) {
                console.error("Failed to fetch bulk operation results:", error);
                response.resultsError = error instanceof Error ? error.message : "Failed to fetch results";
            }
        }

        // Jeśli operacja się nie powiodła, dodajemy informacje o błędzie
        if (bulkOperation.status === 'FAILED' && bulkOperation.partialDataUrl) {
            try {
                const partialResults = await getBulkOperationResults(bulkOperation.partialDataUrl);
                response.partialResults = partialResults;
                response.partialResultsCount = partialResults.length;
            } catch (error) {
                console.error("Failed to fetch partial results:", error);
            }
        }

        return json(response);

    } catch (error) {
        console.error("Bulk status check error:", error);
        return json({
            success: false,
            error: error instanceof Error ? error.message : "Unknown server error"
        }, { status: 500 });
    }
}; 