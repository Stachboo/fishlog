import { getRequestConfig } from 'next-intl/server';
import { cookies } from 'next/headers';

const SUPPORTED_LOCALES = ['fr', 'en', 'ar'] as const;
type Locale = typeof SUPPORTED_LOCALES[number];

function isValidLocale(value: string | undefined): value is Locale {
  return SUPPORTED_LOCALES.includes(value as Locale);
}

export default getRequestConfig(async ({ requestLocale }) => {
  // requestLocale comes from [locale] segment if using i18n routing.
  // Without i18n routing we fall back to a cookie.
  const segmentLocale = await requestLocale;
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get('NEXT_LOCALE')?.value;

  const locale: Locale = isValidLocale(segmentLocale)
    ? segmentLocale
    : isValidLocale(cookieLocale)
    ? cookieLocale
    : 'fr';

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
