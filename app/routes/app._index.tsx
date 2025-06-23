import { useEffect, useState } from "react";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { useFetcher } from "@remix-run/react";
import {
  Page,
  Layout,
  Text,
  Card,
  Button,
  BlockStack,
  Box,
  List,
  Link,
  InlineStack,
} from "@shopify/polaris";
import { TitleBar, useAppBridge } from "@shopify/app-bridge-react";
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

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);

  return null;
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { admin } = await authenticate.admin(request);
  const color = ["Red", "Orange", "Yellow", "Green"][
    Math.floor(Math.random() * 4)
  ];
  const response = await admin.graphql(
    `#graphql
      mutation populateProduct($product: ProductCreateInput!) {
        productCreate(product: $product) {
          product {
            id
            title
            handle
            status
            variants(first: 10) {
              edges {
                node {
                  id
                  price
                  barcode
                  createdAt
                }
              }
            }
          }
        }
      }`,
    {
      variables: {
        product: {
          title: `${color} Snowboard`,
        },
      },
    },
  );
  const responseJson = await response.json();

  const product = responseJson.data!.productCreate!.product!;
  const variantId = product.variants.edges[0]!.node!.id!;

  const variantResponse = await admin.graphql(
    `#graphql
    mutation shopifyRemixTemplateUpdateVariant($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
      productVariantsBulkUpdate(productId: $productId, variants: $variants) {
        productVariants {
          id
          price
          barcode
          createdAt
        }
      }
    }`,
    {
      variables: {
        productId: product.id,
        variants: [{ id: variantId, price: "100.00" }],
      },
    },
  );

  const variantResponseJson = await variantResponse.json();

  return {
    product: responseJson!.data!.productCreate!.product,
    variant:
      variantResponseJson!.data!.productVariantsBulkUpdate!.productVariants,
  };
};

export default function Index() {
  const fetcher = useFetcher<typeof action>();

  const shopify = useAppBridge();
  const isLoading =
    ["loading", "submitting"].includes(fetcher.state) &&
    fetcher.formMethod === "POST";
  const productId = fetcher.data?.product?.id.replace(
    "gid://shopify/Product/",
    "",
  );

  useEffect(() => {
    if (productId) {
      shopify.toast.show("Product created");
    }
  }, [productId, shopify]);

  // Funkcja obsługująca generowanie produktów z aktualnymi ustawieniami SKU
  const handleGeneruj = () => {
    // Na razie używamy istniejącej funkcji generateProduct
    // W przyszłości będzie to integracja z naszym systemem SKU
    generateProduct();
  };

  const generateProduct = () => fetcher.submit({}, { method: "POST" });

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

  // Oficer łącznikowy. Jedyny sposób, w jaki podrzędne komponenty
  // mogą prosić o zmianę w głównym stanie. Czysto i bezpiecznie.
  const aktualizujZasady = (noweZasady: Partial<ZasadyGeneratora>) => {
    setZasady((prev: ZasadyGeneratora) => ({ ...prev, ...noweZasady }));
  };

  return (
    <Page fullWidth>
      <TitleBar title="SKU Generator" />

      <div className={styles.layoutContainer}>
        {/* Main content area - left side */}
        <div className={styles.mainContent}>
          <BlockStack gap="500">
            <KartaPodstawowychZasad zasady={zasady} aktualizuj={aktualizujZasady} />
            <KartaUstawienBody zasady={zasady} aktualizuj={aktualizujZasady} />
            <KartaKinetycznegoUkladu zasady={zasady} aktualizuj={aktualizujZasady} />
            <PodgladProduktow zasady={zasady} />
          </BlockStack>
        </div>

        {/* Sticky sidebar - right side */}
        <div className={styles.sidebar}>
          <PodgladSKU zasady={zasady} />
        </div>
      </div>
    </Page>
  );
}
