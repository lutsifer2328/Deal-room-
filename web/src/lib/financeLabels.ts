// Translation-key helpers for the finance enums. Keeping the cast in one place
// lets components call t(catKey(c)) without sprinkling `as TranslationKey` around.
import { TranslationKey } from './translations';
import { IncomeCategory, IncomeStatus, IncomeSide, PropertyType } from './financeTypes';

export const catKey = (c: IncomeCategory): TranslationKey => `fin.cat.${c}` as TranslationKey;
export const statusKey = (s: IncomeStatus): TranslationKey => `fin.status.${s}` as TranslationKey;
export const ptypeKey = (p: PropertyType): TranslationKey => `fin.ptype.${p}` as TranslationKey;
// 'n/a' isn't a valid key segment, so map it to a plain "client" label.
export const sideKey = (s: IncomeSide): TranslationKey =>
    (s === 'n/a' ? 'fin.side.na' : `fin.side.${s}`) as TranslationKey;
