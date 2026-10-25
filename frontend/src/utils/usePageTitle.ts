import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'

/**
 * Sets the document title dynamically.
 * Usage: usePageTitle('login') → "Đăng nhập — NexusLearn AI"
 */
export function usePageTitle(key?: string) {
  const { t } = useTranslation()

  useEffect(() => {
    const base = 'NexusLearn AI'
    if (key) {
      const translated = t(`page_title.${key}`, { defaultValue: '' })
      document.title = translated ? `${translated} — ${base}` : base
    } else {
      document.title = base
    }
    return () => { document.title = base }
  }, [key, t])
}
