/**
 * WooCommerce Monthly product checkout.
 * Override with NEXT_PUBLIC_WOO_CHECKOUT_URL on Vercel.
 */
export const WOO_CHECKOUT_URL =
  process.env.NEXT_PUBLIC_WOO_CHECKOUT_URL?.trim() ||
  'https://thestuandlaurievarietyhour.com/checkout/?add-to-cart=1928';

export const STORAGE_KEY = 'sl_pending_subscribe_v1';
