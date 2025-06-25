import { useState } from "react";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, redirect } from "@remix-run/react";
import {
  Page,
  Frame,
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import type { ZasadyGeneratora } from "../types/ZasadyGeneratora";
import { TypBody } from "../types/ZasadyGeneratora";
import styles from "./_index/styles.module.css";

// Import naszych komponentów
import { KartaPodstawowychZasad } from "../components/KartaPodstawowychZasad";
import { KartaUstawienBody } from "../components/KartaUstawienBody";
import { PodgladSKU } from "../components/PodgladSKU";
import { PodgladProduktow } from "../components/PodgladProduktow";
import { KartaKinetycznegoUkladu } from "../components/KartaKinetycznegoUkladu";
import { KartaZasobowDocelowych } from "../components/KartaZasobowDocelowych";

// Typy dla danych produktów
interface ProductVariant {
  id: string;
  title: string;
  sku: string | null;
  product: {
    id: string;
    title: string;
    vendor: string;
    productType: string;
    images: Array<{
      id: string;
      url: string;
      altText: string;
    }>;
  };
  selectedOptions: Array<{
    name: string;
    value: string;
  }>;
}

interface LoaderData {
  products: ProductVariant[];
  scope: string;
  ids?: string[];
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);
  const { admin } = await authenticate.admin(request);

  const url = new URL(request.url);
  const scope = url.searchParams.get("scope") || "all";
  const ids = url.searchParams.get("ids")?.split(",").filter(Boolean) || [];

  let products: ProductVariant[] = [];

  switch (scope) {
    case 'all':
      // Pobierz wszystkie produkty
      const allProductsResponse = await admin.graphql(
        `#graphql
          query GetAllProducts {
            products(first: 10) {
              nodes {
                id
                title
                vendor
                productType
                images(first: 1) {
                  nodes {
                    id
                    url
                    altText
                  }
                }
                variants(first: 50) {
                  nodes {
                    id
                    title
                    sku
                    selectedOptions {
                      name
                      value
                    }
                  }
                }
              }
            }
          }`
      );

      const allProductsData = await allProductsResponse.json();
      products = allProductsData.data.products.nodes.flatMap((product: any) =>
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
      break;

    case 'products':
      // Pobierz konkretne produkty po ID
      if (ids.length > 0) {
        const specificProductsResponse = await admin.graphql(
          `#graphql
            query GetSpecificProducts {
              products(first: 10, query: "id:(${ids.join(' OR id:')})") {
                nodes {
                  id
                  title
                  vendor
                  productType
                  images(first: 1) {
                    nodes {
                      id
                      url
                      altText
                    }
                  }
                  variants(first: 50) {
                    nodes {
                      id
                      title
                      sku
                      selectedOptions {
                        name
                        value
                      }
                    }
                  }
                }
              }
            }`
        );

        const specificProductsData = await specificProductsResponse.json();
        products = specificProductsData.data.products.nodes.flatMap((product: any) =>
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
      }
      break;

    default:
      // Domyślnie pobierz wszystkie produkty
      const defaultResponse = await admin.graphql(
        `#graphql
          query GetDefaultProducts {
            products(first: 10) {
              nodes {
                id
                title
                vendor
                productType
                images(first: 1) {
                  nodes {
                    id
                    url
                    altText
                  }
                }
                variants(first: 50) {
                  nodes {
                    id
                    title
                    sku
                    selectedOptions {
                      name
                      value
                    }
                  }
                }
              }
            }
          }`
      );

      const defaultData = await defaultResponse.json();
      products = defaultData.data.products.nodes.flatMap((product: any) =>
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
    sufix: "",
    typBody: TypBody.KOLEJNY_NUMER,
    separator: "-",
    dodatkoweKomponenty: [],
    // Na start mamy tylko podstawowe, niezmienne bloki w naszym układzie.
    ukladSKU: ["prefix", "body", "sufix"],
  });

  // Nowy stan: wybrane warianty
  const [selectedVariantIds, setSelectedVariantIds] = useState<string[]>([]);

  const aktualizujZasady = (noweZasady: Partial<ZasadyGeneratora>) => {
    setZasady((prev: ZasadyGeneratora) => ({ ...prev, ...noweZasady }));
  };

  return (
    <Frame>
      <Page fullWidth>
        <TitleBar title="SKU Generator" />
        <div className={styles.layoutContainer}>
          <div className={styles.mainContent}>
            <div className={styles.gridCards}>
              <div>
                <KartaZasobowDocelowych />
                <KartaPodstawowychZasad zasady={zasady} aktualizuj={aktualizujZasady} />
                <KartaUstawienBody zasady={zasady} aktualizuj={aktualizujZasady} />
              </div>
              <div>
                <KartaKinetycznegoUkladu zasady={zasady} aktualizuj={aktualizujZasady} />
                <PodgladProduktow
                  zasady={zasady}
                  products={products}
                  selectedVariantIds={selectedVariantIds}
                  setSelectedVariantIds={setSelectedVariantIds}
                  scope={scope}
                />
              </div>
            </div>
          </div>
          <div className={styles.sidebar}>
            <PodgladSKU zasady={zasady} />
          </div>
        </div>
      </Page>
    </Frame>
  );
}
