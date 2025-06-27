import type { ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { executeBulkSKUUpdate } from "../services/bulkOperations";
import type { ZasadyGeneratora } from "../types/ZasadyGeneratora";
import type { ProductVariant } from "../graphql/types";

interface BulkUpdateSKURequest {
    zasady: ZasadyGeneratora;
    warianty: ProductVariant[];
}

export const action = async ({ request }: ActionFunctionArgs) => {
    const { admin } = await authenticate.admin(request);

    if (request.method !== "POST") {
        return json({ error: "Method not allowed" }, { status: 405 });
    }

    try {
        const { zasady, warianty }: BulkUpdateSKURequest = await request.json();

        if (!zasady || !warianty || !Array.isArray(warianty) || warianty.length === 0) {
            return json({
                success: false,
                error: "Invalid request: missing zasady or warianty"
            }, { status: 400 });
        }

        console.log(`Starting bulk SKU update for ${warianty.length} variants`);

        // Uruchamiamy kompletny proces operacji masowej
        const bulkOperation = await executeBulkSKUUpdate(admin, zasady, warianty);

        return json({
            success: true,
            bulkOperationId: bulkOperation.id,
            status: bulkOperation.status,
            message: `Bulk operation started successfully. Operation ID: ${bulkOperation.id}`,
            objectCount: bulkOperation.objectCount,
            createdAt: bulkOperation.createdAt
        });

    } catch (error) {
        console.error("Bulk operation error:", error);

        // Sprawdzamy czy to błąd związany z już uruchomioną operacją
        if (error instanceof Error && error.message.includes('already running')) {
            return json({
                success: false,
                error: "Bulk operation already in progress",
                details: error.message
            }, { status: 409 }); // Conflict
        }

        return json({
            success: false,
            error: error instanceof Error ? error.message : "Unknown server error"
        }, { status: 500 });
    }
}; 