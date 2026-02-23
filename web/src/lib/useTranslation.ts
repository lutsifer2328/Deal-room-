import { useLanguage } from './LanguageContext';
import { translations, TranslationKey } from './translations';

export type { TranslationKey };

export function useTranslation() {
    const { language, setLanguage } = useLanguage();

    const t = (key: TranslationKey): string => {
        const dict = translations[language] as Record<string, string>;
        const text = dict[key];
        if (!text) {
            console.warn(`Translation missing for key: ${key} in language: ${language}`);
            return key;
        }
        return text;
    };

    return { t, language, setLanguage };
}
