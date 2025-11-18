import { LocaleProvider } from '@/contexts/LocaleContext'
import { getTranslations } from '@/lib/translations'
import '../globals.css'

const locales = ['en', 'ar', 'de', 'es', 'fr', 'sv']

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }))
}

export async function generateMetadata({ params }) {
  const { locale } = await params
  return {
    title: 'SportsClue',
    description: 'SportsClue Web Application',
    icons: {
      icon: '/favicon.ico',
    },
  }
}

export default async function LocaleLayout({ children, params }) {
  const { locale } = await params
  
  // Load translations for this locale
  const messages = await getTranslations(locale)

  // Determine text direction based on locale
  const dir = locale === 'ar' ? 'rtl' : 'ltr'

  return (
    <html lang={locale} dir={dir}>
      <body>
        <LocaleProvider locale={locale} messages={messages}>
          {children}
        </LocaleProvider>
      </body>
    </html>
  )
}
