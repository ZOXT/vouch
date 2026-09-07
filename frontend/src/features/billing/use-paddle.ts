import { useCallback } from "react";
import { initializePaddle, type Paddle, type PricePreviewResponse } from "@paddle/paddle-js";
import { PADDLE_CLIENT_TOKEN, PADDLE_ENV } from "@/lib/config";

type PreviewLineItem = PricePreviewResponse["data"]["details"]["lineItems"][number];

export interface CheckoutPreview {
  priceId: string;
  formattedTotal: string;
  currency: string;
  lineItem: PreviewLineItem;
}

/** Passed to PricePreview; Paddle auto-detects the country when this is null. */
export type CountryHint = string | null;

let paddlePromise: Promise<Paddle | undefined> | null = null;

const ensurePaddle = async (): Promise<Paddle> => {
  if (!PADDLE_CLIENT_TOKEN) {
    throw new Error(
      "VITE_PADDLE_CLIENT_TOKEN is not set. Add it to frontend/.env to enable the pricing page.",
    );
  }
  if (!paddlePromise) {
    paddlePromise = initializePaddle({
      token: PADDLE_CLIENT_TOKEN,
      environment: PADDLE_ENV,
    });
  }
  const instance = await paddlePromise;
  if (!instance) throw new Error("Paddle failed to initialize");
  return instance;
};

/**
 * Thin wrapper around Paddle.js for the pricing page. Exposes localized price
 * previews (always Paddle-formatted strings, never retyped here) and one-page
 * overlay checkout opening.
 */
export const usePaddle = () => {
  const previewPrices = useCallback(
    async (priceIds: string[], country: CountryHint): Promise<Map<string, CheckoutPreview>> => {
      const paddle = await ensurePaddle();
      const response: PricePreviewResponse = await paddle.PricePreview({
        items: priceIds.map((priceId) => ({ priceId, quantity: 1 })),
        ...(country ? { address: { countryCode: country } } : {}),
      });

      const map = new Map<string, CheckoutPreview>();
      for (const lineItem of response.data.details.lineItems) {
        map.set(lineItem.price.id, {
          priceId: lineItem.price.id,
          formattedTotal: lineItem.formattedTotals.total,
          currency: response.data.currencyCode,
          lineItem,
        });
      }
      return map;
    },
    [],
  );

  const openCheckout = useCallback(
    async (options: {
      priceId: string;
      email?: string;
      customData?: Record<string, unknown>;
      successUrl: string;
    }): Promise<void> => {
      const paddle = await ensurePaddle();
      paddle.Checkout.open({
        items: [{ priceId: options.priceId, quantity: 1 }],
        ...(options.customData ? { customData: options.customData } : {}),
        // Pricing flow is gated on being signed in, so the email is always
        // available to prefill the checkout.
        customer: { email: options.email ?? "" },
        settings: {
          displayMode: "overlay",
          variant: "one-page",
          successUrl: options.successUrl,
        },
      });
    },
    [],
  );

  return { previewPrices, openCheckout };
};