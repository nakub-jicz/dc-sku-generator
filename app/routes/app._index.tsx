import { useState } from "react";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, redirect } from "@remix-run/react";
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
import styles from "./_index/styles.module.css";

// Import GraphQL
import {
  GET_ALL_PRODUCTS,
  GET_SPECIFIC_PRODUCTS,
  type LoaderData,
  type ProductVariant,
  type GetAllProductsResponse,
  type GetSpecificProductsResponse,
  transformProductsToVariants,
  buildProductIdsQuery,
} from "../graphql";

// Import naszych komponentów
import { KartaPodstawowychZasad } from "../components/KartaPodstawowychZasad";
import { KartaUstawienBody } from "../components/KartaUstawienBody";
import { PodgladSKU } from "../components/PodgladSKU";
import { PodgladProduktow } from "../components/PodgladProduktow";
import { KartaKinetycznegoUkladu } from "../components/KartaKinetycznegoUkladu";
import { KartaOnboarding } from "../components/KartaOnboarding";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);
  const { admin } = await authenticate.admin(request);

  const url = new URL(request.url);
  const scope = url.searchParams.get("scope") || "none";
  const ids = url.searchParams.get("ids")?.split(",").filter(Boolean) || [];

  let products: ProductVariant[] = [];

  switch (scope) {
    case 'all':
      // Pobierz wszystkie produkty
      const allProductsResponse = await admin.graphql(GET_ALL_PRODUCTS);
      const allProductsData = await allProductsResponse.json() as GetAllProductsResponse;
      products = transformProductsToVariants(allProductsData.data.products.nodes);
      break;

    case 'products':
      // Pobierz konkretne produkty po ID
      if (ids.length > 0) {
        const query = buildProductIdsQuery(ids);
        const specificProductsResponse = await admin.graphql(GET_SPECIFIC_PRODUCTS, {
          variables: { query }
        });
        const specificProductsData = await specificProductsResponse.json() as GetSpecificProductsResponse;
        products = transformProductsToVariants(specificProductsData.data.products.nodes);
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
  await authenticate.admin(request);

  const formData = await request.formData();
  const scope = formData.get("scope") as string;
  const ids = formData.get("ids") as string;

  // Buduj URLSearchParams na podstawie scope
  const params = new URLSearchParams();
  params.set("scope", scope);

  if (ids) {
    params.set("ids", ids);
  }

  // Wykonaj redirect z nowymi parametrami
  return redirect(`?${params.toString()}`);
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
            <PodgladProduktow
              zasady={zasady}
              products={products}
              selectedVariantIds={selectedVariantIds}
              setSelectedVariantIds={setSelectedVariantIds}
              scope={scope}
            />
          </div>
        </div>
      </Page>
    </Frame>
  );
}
