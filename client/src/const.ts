export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

export const getLoginUrl = () => "/login";

export const FEATURE_FLAGS = {
  campaigns: false,
  voiceAssistant: false,
} as const;
