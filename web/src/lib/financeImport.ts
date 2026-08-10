// Spreadsheet import for the finance ledger. Pure, framework-free helpers so the
// parsing/validation can be reasoned about (and tested) on its own. The manager
// exports their existing sales sheet to CSV; we auto-match common column names
// (English + Bulgarian) so an unmodified export usually just works.

import { IncomeCategory, IncomeStatus } from './financeTypes';

export interface OwnerRef {
    id: string;
    name: string;
}

// A fully-resolved, valid row ready to become an entry + a commission line.
export interface PreparedImportRow {
    ownerId: string;
    category: IncomeCategory;
    status: IncomeStatus;
    clientName: string;
    dealDate: string | null;
    propertyAddress: string | null;
    propertyRef: string | null;
    notes: string | null;
    commission: number | null;
    brokerPct: number | null;
    cash: number | null;
    bank: number | null;
    // insurance
    policyNumber: string | null;
    policyType: string | null;
    insuredIdent: string | null;
    validFrom: string | null;
    validTo: string | null;
    policyGross: number | null;
    policyNet: number | null;
}

// One parsed data row plus how it landed: matched owner, resolved values, errors.
export interface ParsedRow extends PreparedImportRow {
    rowNum: number;              // 1-based, excludes the header line
    employeeRaw: string;         // what the sheet said, for display when unmatched
    categoryRaw: string;
    errors: string[];            // non-empty ⇒ excluded from import
}

// ---- Column aliases (lowercased). Order within a field doesn't matter. ----
const FIELD_ALIASES: Record<string, string[]> = {
    date: ['date', 'дата', 'deal date', 'date signed', 'дата на сделка'],
    category: ['category', 'type', 'вид', 'тип', 'segment', 'сегмент', 'вид сделка'],
    employee: ['employee', 'broker', 'agent', 'служител', 'брокер', 'агент', 'консултант'],
    client: ['client', 'клиент', 'customer', 'name', 'име', 'клиент име'],
    property_address: ['property_address', 'address', 'адрес', 'property', 'имот', 'обект'],
    property_ref: ['property_ref', 'crm', 'ref', 'reference', 'номер', 'крм', 'crm number'],
    commission: ['commission', 'комисион', 'комисиона', 'amount', 'сума', 'fee', 'приход'],
    broker_pct: ['broker_pct', 'broker %', 'broker pct', 'процент', 'дял', 'процент брокер'],
    cash: ['cash', 'кеш', 'в брой', 'брой'],
    bank: ['bank', 'банка', 'по банка'],
    status: ['status', 'статус', 'платено'],
    notes: ['notes', 'note', 'бележки', 'забележка', 'коментар'],
    policy_number: ['policy_number', 'policy number', 'policy no', 'полица', 'номер полица', '№ полица'],
    policy_type: ['policy_type', 'policy type', 'вид полица', 'тип полица', 'застраховка'],
    egn_eik: ['egn_eik', 'egn', 'eik', 'егн', 'еик', 'egn/eik', 'егн/еик'],
    valid_from: ['valid_from', 'valid from', 'от', 'валидна от', 'начало'],
    valid_to: ['valid_to', 'valid to', 'till', 'до', 'валидна до', 'край'],
    policy_cost_gross: ['policy_cost_gross', 'bruto', 'бруто', 'gross', 'премия бруто'],
    policy_cost_net: ['policy_cost_net', 'neto', 'нето', 'net', 'премия нето'],
};

const CATEGORY_SYNONYMS: Record<string, IncomeCategory> = {
    sale: 'sale', sales: 'sale', 'property sale': 'sale', продажба: 'sale', продажби: 'sale',
    rent: 'rent', rental: 'rent', наем: 'rent', отдаване: 'rent',
    insurance: 'insurance', застраховка: 'insurance', застраховки: 'insurance', полица: 'insurance',
    credit: 'credit_referral', 'credit referral': 'credit_referral', кредит: 'credit_referral',
    construction: 'construction_referral', 'construction referral': 'construction_referral', строителство: 'construction_referral',
    interior: 'interior_design_referral', design: 'interior_design_referral',
    'interior design': 'interior_design_referral', интериор: 'interior_design_referral', дизайн: 'interior_design_referral',
};

const STATUS_SYNONYMS: Record<string, IncomeStatus> = {
    paid: 'paid', платено: 'paid', платена: 'paid', yes: 'paid', да: 'paid',
    won: 'won', pending: 'won', awaiting: 'won', очаква: 'won', неплатено: 'won', no: 'won', не: 'won',
    partially_paid: 'partially_paid', partial: 'partially_paid', частично: 'partially_paid',
    lost: 'lost', загубена: 'lost', cancelled: 'cancelled', canceled: 'cancelled', отказана: 'cancelled',
};

export const TEMPLATE_HEADERS = [
    'date', 'category', 'employee', 'client', 'property_address', 'property_ref',
    'commission', 'broker_pct', 'cash', 'bank', 'status', 'notes',
    'policy_number', 'policy_type', 'egn_eik', 'valid_from', 'valid_to',
    'policy_cost_gross', 'policy_cost_net',
];

// Two worked example rows so the columns are self-explanatory when opened in Excel.
export function templateCsv(): string {
    const rows = [
        TEMPLATE_HEADERS,
        ['2026-03-14', 'sale', 'Ivan Petrov', 'Maria Ivanova', 'ул. Шипка 12, София', 'AGZ-2026-014',
            '4000', '40', '0', '4000', 'paid', 'both sides', '', '', '', '', '', '', ''],
        ['2026-05-02', 'insurance', 'Ivan Petrov', 'Georgi Dimitrov', '', '',
            '120', '30', '120', '0', 'paid', '', 'BG/12345', 'Motor — Casco (Каско)', '8001010101',
            '2026-05-02', '2027-05-02', '600', '500'],
    ];
    return rows.map((r) => r.map(csvCell).join(',')).join('\r\n') + '\r\n';
}

function csvCell(v: string): string {
    return /[",\r\n;]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
}

// Pick the delimiter from the header line: comma, semicolon (BG Excel), or tab.
function detectDelimiter(firstLine: string): string {
    const counts: Record<string, number> = {
        ',': (firstLine.match(/,/g) || []).length,
        ';': (firstLine.match(/;/g) || []).length,
        '\t': (firstLine.match(/\t/g) || []).length,
    };
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0] || ',';
}

// Minimal RFC-4180-ish CSV parser: honours quotes, escaped quotes, embedded newlines.
export function parseDelimited(text: string, delimiter: string): string[][] {
    const rows: string[][] = [];
    let field = '';
    let row: string[] = [];
    let inQuotes = false;
    const s = text.replace(/^﻿/, ''); // strip BOM
    for (let i = 0; i < s.length; i++) {
        const c = s[i];
        if (inQuotes) {
            if (c === '"') {
                if (s[i + 1] === '"') { field += '"'; i++; } else { inQuotes = false; }
            } else { field += c; }
        } else if (c === '"') {
            inQuotes = true;
        } else if (c === delimiter) {
            row.push(field); field = '';
        } else if (c === '\n') {
            row.push(field); rows.push(row); row = []; field = '';
        } else if (c === '\r') {
            // ignore; \n handles the row break
        } else {
            field += c;
        }
    }
    if (field.length > 0 || row.length > 0) { row.push(field); rows.push(row); }
    return rows;
}

function normNum(s: string): number | null {
    if (!s) return null;
    let t = s.trim().replace(/\s/g, '').replace(/€|лв\.?|bgn|eur/gi, '');
    if (!t) return null;
    const hasComma = t.includes(','), hasDot = t.includes('.');
    if (hasComma && hasDot) {
        // Whichever separator comes last is the decimal point.
        if (t.lastIndexOf(',') > t.lastIndexOf('.')) t = t.replace(/\./g, '').replace(',', '.');
        else t = t.replace(/,/g, '');
    } else if (hasComma) {
        t = t.replace(',', '.'); // lone comma = decimal (BG)
    }
    const n = Number(t);
    return Number.isFinite(n) ? n : null;
}

function normDate(s: string): string | null | undefined {
    // undefined ⇒ blank (allowed); null ⇒ present but unparseable (error)
    if (!s || !s.trim()) return undefined;
    const t = s.trim();
    let m = t.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (m) return `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`;
    m = t.match(/^(\d{1,2})[.\/-](\d{1,2})[.\/-](\d{2,4})$/);
    if (m) {
        let y = m[3];
        if (y.length === 2) y = '20' + y;
        return `${y}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
    }
    return null;
}

function normalizeHeader(h: string): string {
    return h.trim().toLowerCase().replace(/\s+/g, ' ');
}

// Map each known field to a column index in the sheet, by alias.
function buildFieldIndex(headers: string[]): Record<string, number> {
    const norm = headers.map(normalizeHeader);
    const idx: Record<string, number> = {};
    for (const [field, aliases] of Object.entries(FIELD_ALIASES)) {
        const found = norm.findIndex((h) => aliases.includes(h));
        if (found >= 0) idx[field] = found;
    }
    return idx;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

export interface ParseResult {
    rows: ParsedRow[];
    unmatchedHeaders: string[];  // headers we couldn't map (info only)
    missingCritical: string[];   // required fields with no column at all
}

// Parse + validate a whole CSV against the current employee roster.
export function parseImportCsv(text: string, owners: OwnerRef[]): ParseResult {
    const firstLine = text.replace(/^﻿/, '').split(/\r?\n/, 1)[0] ?? '';
    const grid = parseDelimited(text, detectDelimiter(firstLine));
    if (grid.length === 0) return { rows: [], unmatchedHeaders: [], missingCritical: ['(empty file)'] };

    const headers = grid[0];
    const fieldIdx = buildFieldIndex(headers);
    const matchedCols = new Set(Object.values(fieldIdx));
    const unmatchedHeaders = headers.filter((h, i) => h.trim() !== '' && !matchedCols.has(i));

    const missingCritical: string[] = [];
    (['category', 'employee', 'client'] as const).forEach((f) => {
        if (!(f in fieldIdx)) missingCritical.push(f);
    });

    // Owner lookup by normalized name.
    const ownerByName = new Map<string, string>();
    owners.forEach((o) => ownerByName.set(o.name.trim().toLowerCase().replace(/\s+/g, ' '), o.id));

    const get = (cells: string[], field: string): string => {
        const i = fieldIdx[field];
        return i == null ? '' : (cells[i] ?? '').trim();
    };

    const rows: ParsedRow[] = [];
    for (let r = 1; r < grid.length; r++) {
        const cells = grid[r];
        if (cells.every((c) => (c ?? '').trim() === '')) continue; // skip blank lines

        const errors: string[] = [];

        const categoryRaw = get(cells, 'category');
        const category = CATEGORY_SYNONYMS[categoryRaw.toLowerCase().replace(/\s+/g, ' ')] ?? null;
        if (!categoryRaw) errors.push('missing category');
        else if (!category) errors.push(`unknown category "${categoryRaw}"`);

        const employeeRaw = get(cells, 'employee');
        const ownerId = ownerByName.get(employeeRaw.toLowerCase().replace(/\s+/g, ' ')) ?? null;
        if (!employeeRaw) errors.push('missing employee');
        else if (!ownerId) errors.push(`unknown employee "${employeeRaw}"`);

        const clientName = get(cells, 'client');
        if (!clientName) errors.push('missing client');

        const parsedDate = normDate(get(cells, 'date'));
        if (parsedDate === null) errors.push(`unrecognised date "${get(cells, 'date')}"`);
        const dealDate = parsedDate ?? null;

        const commission = normNum(get(cells, 'commission'));
        const brokerPct = normNum(get(cells, 'broker_pct'));
        let cash = normNum(get(cells, 'cash'));
        let bank = normNum(get(cells, 'bank'));

        const statusRaw = get(cells, 'status');
        const status: IncomeStatus =
            STATUS_SYNONYMS[statusRaw.toLowerCase().replace(/\s+/g, ' ')]
            ?? (commission != null ? 'paid' : 'won');
        if (statusRaw && !STATUS_SYNONYMS[statusRaw.toLowerCase().replace(/\s+/g, ' ')]) {
            errors.push(`unknown status "${statusRaw}"`);
        }

        const moneyStatus = status === 'paid' || status === 'partially_paid';
        if (moneyStatus && commission == null) {
            errors.push('paid row needs a commission amount');
        }
        // If money is known but the cash/bank split isn't, assume it came by bank.
        if (moneyStatus && commission != null && cash == null && bank == null) {
            bank = commission; cash = 0;
        }

        const validFrom = normDate(get(cells, 'valid_from'));
        const validTo = normDate(get(cells, 'valid_to'));
        if (validFrom === null) errors.push('unrecognised valid-from date');
        if (validTo === null) errors.push('unrecognised valid-to date');

        rows.push({
            rowNum: r,
            employeeRaw,
            categoryRaw,
            errors,
            ownerId: ownerId ?? '',
            category: category ?? 'sale',
            status,
            clientName,
            dealDate,
            propertyAddress: get(cells, 'property_address') || null,
            propertyRef: get(cells, 'property_ref') || null,
            notes: get(cells, 'notes') || null,
            commission,
            brokerPct,
            cash,
            bank,
            policyNumber: get(cells, 'policy_number') || null,
            policyType: get(cells, 'policy_type') || null,
            insuredIdent: get(cells, 'egn_eik') || null,
            validFrom: validFrom ?? null,
            validTo: validTo ?? null,
            policyGross: normNum(get(cells, 'policy_cost_gross')),
            policyNet: normNum(get(cells, 'policy_cost_net')),
        });
    }

    return { rows, unmatchedHeaders, missingCritical };
}

// The broker/agency split for a valid row (net of nothing — imported figures are
// treated as final). Returns nulls when there's no percentage to split by.
export function computeCuts(commission: number | null, brokerPct: number | null): { brokerCut: number | null; agencyCut: number | null } {
    if (commission == null) return { brokerCut: null, agencyCut: null };
    if (brokerPct == null) return { brokerCut: null, agencyCut: null };
    const brokerCut = round2(commission * (brokerPct / 100));
    return { brokerCut, agencyCut: round2(commission - brokerCut) };
}
