/// <reference types="vite/client" />
/// <reference types="react-router" />
/// <reference types="@shopify/oxygen-workers-types" />
/// <reference types="@shopify/hydrogen/react-router-types" />

// Enhance TypeScript's built-in typings.
import '@total-typescript/ts-reset';

import type {HydrogenEnv} from '@shopify/hydrogen';

declare global {
  interface Env extends HydrogenEnv {
    /**
     * Judge.me private API token (server-side only).
     * Find it in Judge.me admin: Settings > Integrations > View API token.
     */
    JUDGEME_PRIVATE_API_TOKEN?: string;
    /**
     * When true, only logged-in customers can submit reviews from the Hydrogen form.
     * Set to "true" or "1" to enable.
     */
    JUDGEME_REQUIRE_LOGIN_FOR_REVIEW?: string;
  }
}

export {};
