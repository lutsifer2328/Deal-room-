import { Role } from './types';

// Deal-type checklists: picking one in CreateDealWizard seeds the standard
// document tasks automatically instead of staff adding the same ~8 tasks by
// hand on every deal. Each item is assigned to the first participant holding
// the given role (falls back to a role-assigned task if that side isn't added
// yet). standardDocumentId links to MOCK_STANDARD_DOCUMENTS / standard_documents.

export interface DealTemplateTask {
    titleEn: string;
    titleBg: string;
    role: Role;
    standardDocumentId?: string;
}

export type DealTemplateId = 'purchase' | 'sale' | 'rental';

// Stable ids from mockStandardDocuments.ts (also seeded into standard_documents)
const STD = {
    taxValuation: '00000000-0000-0000-0000-000000000001',
    pep: '00000000-0000-0000-0000-000000000002',
    originOfFunds: '00000000-0000-0000-0000-000000000004',
    art264: '00000000-0000-0000-0000-000000000006',
    idCard: '00000000-0000-0000-0000-000000000007',
    deed: '00000000-0000-0000-0000-000000000008',
    sketch: '00000000-0000-0000-0000-000000000011',
    maritalStatus: '00000000-0000-0000-0000-000000000013',
    encumbrances: '00000000-0000-0000-0000-000000000015'
};

const DOC = {
    deed: { titleEn: 'Notary Deed (Proof of Ownership)', titleBg: 'Нотариален акт', standardDocumentId: STD.deed },
    encumbrances: { titleEn: 'Certificate of Encumbrances', titleBg: 'Удостоверение за тежести', standardDocumentId: STD.encumbrances },
    taxValuation: { titleEn: 'Tax Valuation Certificate', titleBg: 'Данъчна оценка', standardDocumentId: STD.taxValuation },
    art264: { titleEn: 'Declaration under Art. 264', titleBg: 'Декларация по чл. 264', standardDocumentId: STD.art264 },
    sketch: { titleEn: 'Cadastral Sketch / Schema', titleBg: 'Скица / Схема (Кадастър)', standardDocumentId: STD.sketch },
    idCard: { titleEn: 'ID Card / Passport', titleBg: 'Лична карта / Паспорт', standardDocumentId: STD.idCard },
    originOfFunds: { titleEn: 'Declaration of Origin of Funds', titleBg: 'Декларация за произход на средствата', standardDocumentId: STD.originOfFunds },
    pep: { titleEn: 'PEP Declaration', titleBg: 'Декларация за „Видна политическа личност" (PEP)', standardDocumentId: STD.pep },
    maritalStatus: { titleEn: 'Certificate of Marital Status', titleBg: 'Удостоверение за семейно положение', standardDocumentId: STD.maritalStatus }
};

export const DEAL_TEMPLATES: Record<DealTemplateId, DealTemplateTask[]> = {
    // Full purchase transaction — both sides
    purchase: [
        { ...DOC.deed, role: 'seller' },
        { ...DOC.encumbrances, role: 'seller' },
        { ...DOC.taxValuation, role: 'seller' },
        { ...DOC.art264, role: 'seller' },
        { ...DOC.sketch, role: 'seller' },
        { ...DOC.idCard, role: 'buyer' },
        { ...DOC.originOfFunds, role: 'buyer' },
        { ...DOC.pep, role: 'buyer' }
    ],
    // Listing/sale-side preparation — seller documents only
    sale: [
        { ...DOC.deed, role: 'seller' },
        { ...DOC.encumbrances, role: 'seller' },
        { ...DOC.taxValuation, role: 'seller' },
        { ...DOC.art264, role: 'seller' },
        { ...DOC.sketch, role: 'seller' },
        { ...DOC.maritalStatus, role: 'seller' }
    ],
    // Rental — landlord as seller, tenant as buyer
    rental: [
        { ...DOC.deed, role: 'seller' },
        { ...DOC.idCard, role: 'seller' },
        { ...DOC.idCard, role: 'buyer' }
    ]
};
