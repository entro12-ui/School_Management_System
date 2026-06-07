export * from "./landing-content.types";
export { EN_CONTENT } from "./landing-content.en";
export { AM_CONTENT } from "./landing-content.am";
import type { LandingContent, LandingContentLanguage } from "./landing-content.types";
import { EN_CONTENT } from "./landing-content.en";
import { AM_CONTENT } from "./landing-content.am";

export const LANDING_CONTENT: Record<LandingContentLanguage, LandingContent> = {
  en: EN_CONTENT,
  am: AM_CONTENT,
};
