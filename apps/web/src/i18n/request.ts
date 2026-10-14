import { getRequestConfig } from 'next-intl/server';

const LOCALES = ['es', 'en', 'pt'] as const;
const DEFAULT_LOCALE = 'es';

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = LOCALES.includes(requested as (typeof LOCALES)[number]) ? requested! : DEFAULT_LOCALE;
  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
