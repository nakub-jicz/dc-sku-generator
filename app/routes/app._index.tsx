import { useState } from "react";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, redirect, json } from "@remix-run/react";
import {
  Page,
  Frame,
  BlockStack,
  Text,
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import type { ZasadyGeneratora } from "../types/ZasadyGeneratora";
import { TypBody } from "../types/ZasadyGeneratora";
import { generujPojedynczeSKU } from "../services/generatorSKU";
import styles from "./_index/styles.module.css";

// Import GraphQL
import {
  GET_ALL_PRODUCTS,
  GET_SPECIFIC_PRODUCTS,
  UPDATE_PRODUCT_SET_SYNC,
  UPDATE_PRODUCT_SET_ASYNC,
  type LoaderData,
  type ProductVariant,
  type GetAllProductsResponse,
  type GetSpecificProductsResponse,
  transformProductsToVariants,
  buildProductIdsQuery,
  fetchAllProductsPaginated,
} from "../graphql";

// Import naszych komponentów
import { KartaPodstawowychZasad } from "../components/KartaPodstawowychZasad";
import { KartaUstawienBody } from "../components/KartaUstawienBody";
import { PodgladSKU } from "../components/PodgladSKU";
import { PodgladProduktow } from "../components/PodgladProduktow";
import { KartaKinetycznegoUkladu } from "../components/KartaKinetycznegoUkladu";
import { KartaOnboarding } from "../components/KartaOnboarding";
import { PrzyciskGenerowania } from "../components/PrzyciskGenerowania";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);
  const { admin } = await authenticate.admin(request);

  const url = new URL(request.url);
  const scope = url.searchParams.get("scope") || "none";
  const ids = url.searchParams.get("ids")?.split(",").filter(Boolean) || [];

  let products: ProductVariant[] = [];

  switch (scope) {
    case 'all':
      // Pobierz wszystkie produkty z paginacją
      products = await fetchAllProductsPaginated(admin, GET_ALL_PRODUCTS);
      break;

    case 'products':
      // Pobierz konkretne produkty po ID z paginacją
      if (ids.length > 0) {
        const query = buildProductIdsQuery(ids);
        products = await fetchAllProductsPaginated(admin, GET_SPECIFIC_PRODUCTS, { query });
      }
      break;

    case 'none':
    default:
      // Domyślnie nie pobieramy żadnych produktów - pusty stan
      products = [];
      break;
  }

  return {
    products,
    scope,
    ids: ids.length > 0 ? ids : undefined,
  };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { admin } = await authenticate.admin(request);

  const formData = await request.formData();
  const zasadyJson = formData.get("zasady") as string;
  const wariantyJson = formData.get("warianty") as string;

  if (!zasadyJson || !wariantyJson) {
    return json({
      success: false,
      error: "Missing required data"
    }, { status: 400 });
  }

  try {
    const zasady: ZasadyGeneratora = JSON.parse(zasadyJson);
    const warianty: ProductVariant[] = JSON.parse(wariantyJson);

    if (!warianty || warianty.length === 0) {
      return json({
        success: false,
        error: "No variants selected for SKU generation"
      }, { status: 400 });
    }

    // Grupujemy warianty według produktu
    const variantsByProduct = warianty.reduce((acc, variant) => {
      const productId = variant.product.id;
      if (!acc[productId]) {
        acc[productId] = [];
      }
      acc[productId].push(variant);
      return acc;
    }, {} as Record<string, ProductVariant[]>);

    let updatedProductsCount = 0;
    let updatedVariantsCount = 0;
    const errors: string[] = [];

    // Przetwarzamy każdy produkt osobno
    for (const [productId, variants] of Object.entries(variantsByProduct)) {
      try {
        // Sprawdzamy czy to jest produkt z jedną opcją (single-option)
        const isSingleOption = variants.length === 1 &&
          (variants[0].selectedOptions.length === 0 ||
            (variants[0].selectedOptions.length === 1 && variants[0].selectedOptions[0].name === "Title"));

        // Generujemy nowe SKU dla każdego wariantu z właściwymi optionValues
        const variantsWithNewSku = variants.map((variant, index) => {
          let optionValues: Array<{ name: string; optionName: string }>;

          if (isSingleOption) {
            // Dla produktów z jedną opcją używamy "Title" i "Default Title"
            optionValues = [{ name: "Default Title", optionName: "Title" }];
          } else {
            // Dla produktów z wieloma opcjami używamy rzeczywistych opcji
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

          // Konwertujemy na format wymagany przez API
          productOptionsInput = Array.from(productOptions.entries()).map(([name, values]) => ({
            name: name,
            values: Array.from(values).map(value => ({ name: value }))
          }));
        }

        // Wybieramy synchroniczną lub asynchroniczną mutację na podstawie liczby wariantów
        const useSynchronous = variants.length <= 100;
        const mutation = useSynchronous ? UPDATE_PRODUCT_SET_SYNC : UPDATE_PRODUCT_SET_ASYNC;

        const inputData = {
          id: productId,
          productOptions: productOptionsInput,
          variants: variantsWithNewSku
        };

        // DEBUG: Logujemy co wysyłamy
        console.log(`[INDEX DEBUG] Product ${productId} - ${isSingleOption ? 'single-option' : 'multi-option'}:`, JSON.stringify(inputData, null, 2));

        // Wykonujemy mutację productSet
        const response = await admin.graphql(mutation, {
          variables: {
            input: inputData
          }
        });

        const data = await response.json();

        if ((data as any).errors) {
          console.error("GraphQL errors:", (data as any).errors);
          errors.push(`Product ${productId}: ${(data as any).errors.map((e: any) => e.message).join(', ')}`);
          continue;
        }

        const result = data.data?.productSet;

        if (result?.userErrors && result.userErrors.length > 0) {
          console.error("User errors:", result.userErrors);
          errors.push(`Product ${productId}: ${result.userErrors.map((e: any) => e.message).join(', ')}`);
          continue;
        }

        if (result?.product?.variants?.edges) {
          updatedProductsCount++;
          updatedVariantsCount += result.product.variants.edges.length;
        }

      } catch (error) {
        console.error(`Error updating product ${productId}:`, error);
        errors.push(`Product ${productId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    if (updatedVariantsCount === 0 && errors.length > 0) {
      return json({
        success: false,
        error: "Failed to update any SKUs",
        details: errors
      }, { status: 500 });
    }

    return json({
      success: true,
      updatedProductsCount,
      updatedVariantsCount,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error("Action error:", error);
    return json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred"
    }, { status: 500 });
  }
};

export default function Index() {
  const loaderData = useLoaderData<LoaderData>();
  const { products, scope } = loaderData;

  // Centrum dowodzenia stanem. Domyślna konfiguracja startowa.
  const [zasady, setZasady] = useState<ZasadyGeneratora>({
    prefix: "SKU",
    poczatekNumeracji: 1,
    sufix: "END",
    typBody: TypBody.KOLEJNY_NUMER,
    separator: "-",
    customSeparator: "",
    randomMin: 1000,
    randomMax: 9999,
    uzyjNumeracjiZZerami: false,
    iloscCyfrWNumeracji: 3,
    dodatkoweKomponenty: [],
    // Na start mamy tylko podstawowe, niezmienne bloki w naszym układzie.
    ukladSKU: ["prefix", "body", "sufix"],
  });

  // Nowy stan: wybrane warianty
  const [selectedVariantIds, setSelectedVariantIds] = useState<string[]>([]);

  // Stan dla onboarding
  const [showOnboarding, setShowOnboarding] = useState(
    typeof window !== 'undefined' ? !localStorage.getItem('dc-sku-onboarding-completed') : false
  );

  const aktualizujZasady = (noweZasady: Partial<ZasadyGeneratora>) => {
    setZasady((prev: ZasadyGeneratora) => ({ ...prev, ...noweZasady }));
  };

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    if (typeof window !== 'undefined') {
      localStorage.setItem('dc-sku-onboarding-completed', 'true');
    }
  };

  // Funkcja do obsługi generowania SKU - automatycznie wybiera bulk lub zwykłe API
  const handleGenerateSKU = async () => {
    const selectedVariants = products.filter(p => selectedVariantIds.includes(p.id));

    if (selectedVariants.length === 0) {
      return;
    }

    // Sprawdzamy czy użyć bulk operations (>10 wariantów) czy zwykłe API
    const shouldUseBulkAPI = selectedVariants.length > 10;

    if (shouldUseBulkAPI) {
      // Przekieruj do bulk API
      const response = await fetch('/api/bulk-update-sku', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          zasady,
          warianty: selectedVariants
        })
      });

      const result = await response.json();
      console.log('Bulk operation started:', result);
    } else {
      // Użyj zwykłego API przez form submission
      const form = new FormData();
      form.append('zasady', JSON.stringify(zasady));
      form.append('warianty', JSON.stringify(selectedVariants));

      const response = await fetch(window.location.pathname, {
        method: 'POST',
        body: form
      });

      const result = await response.json();
      console.log('Regular API result:', result);

      if (result.success) {
        window.location.reload();
      }
    }
  };

  return (
    <Frame>
      <Page fullWidth>
        <TitleBar title="DC SKU Generator">
          <button onClick={() => setShowOnboarding(true)}>
            Guide
          </button>
        </TitleBar>
        <div className={styles.layoutContainer}>
          <div className={styles.mainContent}>
            {showOnboarding && (
              <div style={{ marginBottom: '24px' }}>
                <KartaOnboarding onDismiss={handleOnboardingComplete} />
              </div>
            )}

            <div className={styles.gridCards}>
              <BlockStack gap="400">
                <KartaPodstawowychZasad zasady={zasady} aktualizuj={aktualizujZasady} />
                <KartaUstawienBody zasady={zasady} aktualizuj={aktualizujZasady} />
              </BlockStack>
              <div className={styles.gridColumnSticky}>
                <BlockStack gap="400">
                  <PodgladSKU zasady={zasady} />
                  <KartaKinetycznegoUkladu zasady={zasady} aktualizuj={aktualizujZasady} />
                </BlockStack>
              </div>
            </div>
          </div>
          <div className={styles.sidebar}>
            <BlockStack gap="400">
              <PodgladProduktow
                zasady={zasady}
                products={products}
                selectedVariantIds={selectedVariantIds}
                setSelectedVariantIds={setSelectedVariantIds}
                scope={scope}
              />
              {products.length > 0 && selectedVariantIds.length > 0 && (
                <PrzyciskGenerowania
                  zasady={zasady}
                  selectedCount={selectedVariantIds.length}
                  onGeneruj={handleGenerateSKU}
                />
              )}
            </BlockStack>
          </div>
        </div>
      </Page>
    </Frame>
  );
}
