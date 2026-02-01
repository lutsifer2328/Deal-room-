import { StandardDocument } from './types';

export const MOCK_STANDARD_DOCUMENTS: StandardDocument[] = [
    {
        id: 'std-doc-001',
        name: 'Данъчна оценка Tax Valuation Certificate',
        description: 'Издава се от общината за данъчни цели. / Issued by the municipality for tax and fee calculations.',
        usageCount: 2,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'u_lawyer',
        isActive: true
    },
    {
        id: 'std-doc-002',
        name: 'Декларация за "Видна политическа личност" (PEP) / Declaration for Politically Exposed Person',
        description: 'Попълва се от двете страни като част от мерките срещу изпирането на пари.',
        usageCount: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'u_lawyer',
        isActive: true
    },
    {
        id: 'std-doc-003',
        name: 'Декларация за гражданство и гражданско състояние (чл. 25 от ЗННД) / Declaration of Citizenship',
        description: 'В нея описвате съпруг/а и режим на имуществена общност.',
        usageCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'u_lawyer',
        isActive: true
    },
    {
        id: 'std-doc-004',
        name: 'Декларация за произход на средствата / Declaration of Origin of Funds',
        description: 'Задължителна за купувача при сделки над 30 000 лв. (по закона срещу изпирането на пари). Трябва да посочите дали парите са от заплата, заем, наследство или спестявания.',
        usageCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'u_lawyer',
        isActive: true
    },
    {
        id: 'std-doc-005',
        name: 'Декларация за съгласие по чл. 26 от Семейния кодекс / Declaration of Consent',
        description: 'Ако имотът е лична собственост на единия съпруг (напр. наследен), но в него живее семейството, другият съпруг трябва да даде писмено съгласие за продажбата.',
        usageCount: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'u_lawyer',
        isActive: true
    },
    {
        id: 'std-doc-006',
        name: 'Декларация по чл. 264 Declaration under Art. 264',
        description: 'Удостоверява липсата на държавни дългове. / Certifies that the seller has no unpaid taxes or social security.',
        usageCount: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'u_lawyer',
        isActive: true
    },
    {
        id: 'std-doc-007',
        name: 'Лична карта / Паспорт ID Card / Passport',
        description: 'За удостоверяване на самоличността пред нотариуса. / To verify identity before the notary.',
        usageCount: 5,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'u_lawyer',
        isActive: true
    },
    {
        id: 'std-doc-008',
        name: 'Нотариален акт:/Proof of Ownership (Notary Deed)',
        description: 'Основният документ, който доказва кой е собственикът на имота. При сделка се съставя нов акт, който ви легитимира като новия притежател./Notarized ownership document',
        usageCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'u_lawyer',
        isActive: true
    },
    {
        id: 'std-doc-009',
        name: 'Предварителен договор Preliminary Contract',
        description: 'Урежда условията преди финалната сделка. / Outlines the terms and price before the final transfer. purchase contract',
        usageCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'u_lawyer',
        isActive: true
    },
    {
        id: 'std-doc-010',
        name: 'Пълномощно/Power of Attorney (PoA)',
        description: 'Ако една от страните не присъства лично. Трябва да е нотариално заверено. / If a party is not present. It must be notarized.',
        usageCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'u_lawyer',
        isActive: true
    },
    {
        id: 'std-doc-011',
        name: 'Скица / Схема (Кадастър)Cadastral Sketch / Schema',
        description: 'Технически чертеж на имота от АГКК. / Official technical drawing showing boundaries and location.',
        usageCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'u_lawyer',
        isActive: true
    },
    {
        id: 'std-doc-012',
        name: 'Удостоверение за наследници / Certificate of Heirs',
        description: 'Ако продавачът е получил имота/колата чрез наследство. Този документ описва кои са всички законни собственици след смъртта на наследодателя.',
        usageCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'u_lawyer',
        isActive: true
    },
    {
        id: 'std-doc-013',
        name: 'Удостоверение за семейно положение/Certificate of Marital Status',
        description: 'Доказва дали продавачът е ерген/мома, женен или разведен. Критично при имоти! / Proves if the seller is single, married, or divorced. Crucial for real estate.',
        usageCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'u_lawyer',
        isActive: true
    },
    {
        id: 'std-doc-014',
        name: 'Удостоверение за сключен граждански брак/Marriage Certificate',
        description: 'Ако имотът е придобит по време на брака, той е обща собственост. / If the property was bought during marriage, it is joint property.',
        usageCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'u_lawyer',
        isActive: true
    },
    {
        id: 'std-doc-015',
        name: 'Удостоверение за тежести Certificate of Encumbrances',
        description: 'Показва дали имотът има ипотеки или запори. / Shows if the property has mortgages, liens, or legal claims.',
        usageCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'u_lawyer',
        isActive: true
    }
];
