// Finance module types — mirror the phase8 schema (income_entries / income_lines).

export type IncomeCategory =
    | 'sale'
    | 'rent'
    | 'credit_referral'
    | 'construction_referral'
    | 'interior_design_referral'
    | 'insurance';

export type IncomeStatus =
    | 'referred'
    | 'in_progress'
    | 'won'
    | 'paid'
    | 'partially_paid'
    | 'lost'
    | 'cancelled';

export type IncomeSide = 'buyer' | 'seller' | 'tenant' | 'landlord' | 'n/a';

export type CommissionFrom = 'both' | 'buyer' | 'seller';

export type PropertyType =
    | 'apartment'
    | 'house'
    | 'studio'
    | 'office'
    | 'shop'
    | 'warehouse'
    | 'land'
    | 'garage'
    | 'other';

// Common Bulgarian insurance lines — offered as suggestions in a datalist so the
// agent can pick fast but still type anything (policy_type is stored as free text).
export const POLICY_TYPE_SUGGESTIONS: string[] = [
    'Motor — MTPL (Гражданска отговорност)',
    'Motor — Casco (Каско)',
    'Property (Имущество)',
    'Life (Живот)',
    'Health (Здравна)',
    'Travel (Пътуване в чужбина)',
    'Accident (Злополука)',
    'Liability (Отговорност)',
    'Other',
];

export const PROPERTY_TYPE_LABELS: Record<PropertyType, string> = {
    apartment: 'Apartment',
    house: 'House',
    studio: 'Studio',
    office: 'Office',
    shop: 'Shop / retail',
    warehouse: 'Warehouse / industrial',
    land: 'Land / plot',
    garage: 'Garage / parking',
    other: 'Other',
};

// A row the agent sees on their own dashboard. Money fields are only populated
// once a manager confirms, and RLS only ever returns the agent's own rows/lines.
export interface IncomeLine {
    id: string;
    entryId: string;
    ownerId: string;
    side: IncomeSide;
    clientName: string | null;
    agencyPct: number | null;   // sales: negotiated agency rate (% of deal value)
    rentMonths: number | null;  // rentals: commission as a multiple of monthly rent
    grossAmount: number | null;
    amountCash: number | null;
    amountBank: number | null;
    brokerPct: number | null;
    brokerCut: number | null;
    agencyCut: number | null;
    receivedDate: string | null;
    invoiceNo: string | null;
}

export interface IncomeEntry {
    id: string;
    ownerId: string;
    category: IncomeCategory;
    status: IncomeStatus;
    clientName: string | null;
    propertyType: PropertyType | null;
    dealValue: number | null;   // sale price, or monthly rent for rentals
    dealDate: string | null;
    partnerId: string | null;
    dealId: string | null;
    propertyRef: string | null;
    propertyAddress: string | null;
    listingSource: 'portfolio' | 'external' | null;
    cobroke: 'none' | 'internal' | 'external';
    houseDeal: boolean;             // agency closed it with no broker — 100% agency
    externalShare: number | null;   // paid away to the outside agency (before our split)
    externalAgency: string | null;  // which outside agency, on a co-broke
    renewalDate: string | null;
    renewedFrom: string | null; // set on a renewal, points at the prior entry
    expectedAmount: number | null;
    // Insurance policy details (all nullable; only meaningful for category 'insurance')
    policyNumber: string | null;
    policyType: string | null;      // free text, suggested from POLICY_TYPE_SUGGESTIONS
    policyValidFrom: string | null; // ISO date
    policyValidTo: string | null;   // ISO date; mirrored into renewalDate for reminders
    policyCostGross: number | null; // premium bruto (with tax)
    policyCostNet: number | null;   // premium neto (without tax)
    insuredIdent: string | null;    // client's ЕГН (personal) or ЕИК (company) number
    currency: string;
    notes: string | null;
    createdAt: string;
    lines: IncomeLine[];
}

// What the register wizard collects from an agent. Money is intentionally absent —
// agents never enter amounts; a manager confirms those later.
export interface RegisterEntryInput {
    category: IncomeCategory;
    clientName: string;         // primary/buyer-side client
    secondClientName?: string;  // seller/landlord side, for both-sides deals
    commissionFrom: CommissionFrom;
    houseDeal?: boolean;        // manager-only: agency deal, no broker cut
    dealDate: string;           // ISO date
    propertyAddress?: string;
    propertyRef?: string;   // CRM number
    propertyType?: PropertyType | null;
    partnerId?: string;
    dealValue?: number | null;      // sale price, or monthly rent for rentals
    agencyPct?: number | null;      // sales: agency % for the first side
    secondAgencyPct?: number | null; // sales: agency % for the second side
    rentMonths?: number | null;      // rentals: months of rent for the first side
    secondRentMonths?: number | null; // rentals: months of rent for the second side
    expectedAmount?: number | null; // referrals/insurance: direct expected amount
    renewalDate?: string;       // insurance (auto-set from policyValidTo when present)
    // Insurance policy details
    policyNumber?: string;
    policyType?: string;
    policyValidFrom?: string;   // ISO date
    policyValidTo?: string;     // ISO date; drives the renewal reminder
    policyCostGross?: number | null; // premium bruto
    policyCostNet?: number | null;   // premium neto
    insuredIdent?: string;      // ЕГН / ЕИК
    notes?: string;
}

export const CATEGORY_LABELS: Record<IncomeCategory, string> = {
    sale: 'Property sale',
    rent: 'Rental',
    credit_referral: 'Credit referral',
    construction_referral: 'Construction referral',
    interior_design_referral: 'Interior design referral',
    insurance: 'Insurance',
};

export const STATUS_LABELS: Record<IncomeStatus, string> = {
    referred: 'Registered',
    in_progress: 'In progress',
    won: 'Awaiting payment',
    paid: 'Paid',
    partially_paid: 'Partially paid',
    lost: 'Lost',
    cancelled: 'Cancelled',
};

export const PROPERTY_CATEGORIES: IncomeCategory[] = ['sale', 'rent'];
export const REFERRAL_CATEGORIES: IncomeCategory[] = [
    'credit_referral',
    'construction_referral',
    'interior_design_referral',
];

export function isReferral(category: IncomeCategory): boolean {
    return REFERRAL_CATEGORIES.includes(category);
}

export function isProperty(category: IncomeCategory): boolean {
    return PROPERTY_CATEGORIES.includes(category);
}
