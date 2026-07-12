import { useLanguage } from './LanguageContext';
import { translations, TranslationKey } from './translations';

export type { TranslationKey };

export function useTranslation() {
    const { language, setLanguage } = useLanguage();

    // `params` optionally fills {placeholders} in the string, e.g.
    // t('deals.stillNeeded', { needed: 2, total: 5 }) with "{needed} от {total} ...".
    const t = (key: TranslationKey, params?: Record<string, string | number>): string => {
        const dict = translations[language] as Record<string, string>;
        let text = dict[key];
        if (!text) {
            console.warn(`Translation missing for key: ${key} in language: ${language}`);
            return key;
        }
        if (params) {
            for (const [name, value] of Object.entries(params)) {
                text = text.replace(new RegExp(`\\{${name}\\}`, 'g'), String(value));
            }
        }
        return text;
    };

    return { t, language, setLanguage };
}
