/* eslint-disable import/no-named-as-default-member -- `i18n.use()` is i18next's documented API. */
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import zhCN from './locales/zh-CN';

export const defaultNS = 'translation' as const;

export const resources = {
  'zh-CN': { translation: zhCN },
} as const;

let initialized = false;

/**
 * MVP is zh-CN only (see `docs/prd.md` §2.2). Additional locales are a Phase 2
 * item and must not be wired up here.
 */
export function initI18n(): void {
  if (initialized) {
    return;
  }
  void i18n.use(initReactI18next).init({
    lng: 'zh-CN',
    fallbackLng: 'zh-CN',
    supportedLngs: ['zh-CN'],
    resources,
    defaultNS,
    initAsync: false,
    interpolation: { escapeValue: false },
    returnNull: false,
  });
  initialized = true;
}

initI18n();

export { i18n };
export { useTranslation } from 'react-i18next';
