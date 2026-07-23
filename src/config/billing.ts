/**
 * Web subscribe flow (Next on Vercel) → WooCommerce checkout.
 * Override with EXPO_PUBLIC_SUBSCRIBE_WEB_URL in .env / EAS.
 */
export const SUBSCRIBE_WEB_URL =
  process.env.EXPO_PUBLIC_SUBSCRIBE_WEB_URL?.trim() ||
  'https://stu-suscription.vercel.app/subscribe';

/** Direct Woo checkout (fallback / docs). Product Monthly #1928. */
export const WOO_CHECKOUT_URL =
  'https://thestuandlaurievarietyhour.com/checkout/?add-to-cart=1928';
