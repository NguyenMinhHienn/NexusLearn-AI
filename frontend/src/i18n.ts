import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import axios from 'axios'

import enTranslation from './locales/en/translation.json'
import viTranslation from './locales/vi/translation.json'

export const SUPPORTED_LANGUAGES = ['vi', 'en'] as const
export type AppLanguage = (typeof SUPPORTED_LANGUAGES)[number]

const STORAGE_KEY = 'language'

// Migrate the legacy detector key so users keep their previous choice
const legacy = localStorage.getItem('i18nextLng')
if (!localStorage.getItem(STORAGE_KEY) && legacy) {
  localStorage.setItem(STORAGE_KEY, legacy.startsWith('en') ? 'en' : 'vi')
}

const resources = {
  en: { translation: enTranslation },
  vi: { translation: viTranslation },
}

/** Keep <html lang>, axios Accept-Language (AI answers language) and storage in sync. */
const applyLanguageSideEffects = (lng: string) => {
  const lang: AppLanguage = lng?.startsWith('en') ? 'en' : 'vi'
  document.documentElement.lang = lang
  axios.defaults.headers.common['Accept-Language'] = lang
  localStorage.setItem(STORAGE_KEY, lang)
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'vi',
    supportedLngs: SUPPORTED_LANGUAGES as unknown as string[],
    nonExplicitSupportedLngs: true, // en-US -> en
    load: 'languageOnly',
    debug: false,
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: STORAGE_KEY,
      caches: ['localStorage'],
    },
    interpolation: {
      escapeValue: false, // React already safes from XSS
    },
    react: {
      useSuspense: false,
    },
  })

applyLanguageSideEffects(i18n.resolvedLanguage || i18n.language || 'vi')
i18n.on('languageChanged', applyLanguageSideEffects)

/** Current language normalised to 'vi' | 'en'. */
export const currentLanguage = (): AppLanguage =>
  (i18n.resolvedLanguage || i18n.language || 'vi').startsWith('en') ? 'en' : 'vi'

/** Locale string for Intl/Date formatting. */
export const currentLocale = () => (currentLanguage() === 'en' ? 'en-US' : 'vi-VN')

export default i18n
