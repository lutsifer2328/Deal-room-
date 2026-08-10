'use client';

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/authContext';
import {
    IncomeEntry,
    IncomeLine,
    IncomeSide,
    IncomeStatus,
    PropertyType,
    RegisterEntryInput,
    isProperty,
} from '@/lib/financeTypes';
import { PreparedImportRow, computeCuts } from '@/lib/financeImport';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapLine = (l: any): IncomeLine => ({
    id: l.id,
    entryId: l.entry_id,
    ownerId: l.owner_id,
    side: l.side,
    clientName: l.client_name ?? null,
    agencyPct: l.agency_pct ?? null,
    rentMonths: l.rent_months ?? null,
    grossAmount: l.gross_amount ?? null,
    amountCash: l.amount_cash ?? null,
    amountBank: l.amount_bank ?? null,
    brokerPct: l.broker_pct ?? null,
    brokerCut: l.broker_cut ?? null,
    agencyCut: l.agency_cut ?? null,
    receivedDate: l.received_date ?? null,
    invoiceNo: l.invoice_no ?? null,
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapEntry = (e: any): IncomeEntry => ({
    id: e.id,
    ownerId: e.owner_id,
    category: e.category,
    status: e.status,
    clientName: e.client_name ?? null,
    propertyType: e.property_type ?? null,
    dealValue: e.deal_value ?? null,
    dealDate: e.deal_date ?? null,
    partnerId: e.partner_id ?? null,
    dealId: e.deal_id ?? null,
    propertyRef: e.property_ref ?? null,
    propertyAddress: e.property_address ?? null,
    listingSource: e.listing_source ?? null,
    cobroke: e.cobroke ?? 'none',
    houseDeal: e.house_deal ?? false,
    externalShare: e.external_share ?? null,
    externalAgency: e.external_agency ?? null,
    renewalDate: e.renewal_date ?? null,
    renewedFrom: e.renewed_from ?? null,
    expectedAmount: e.expected_amount ?? null,
    policyNumber: e.policy_number ?? null,
    policyType: e.policy_type ?? null,
    policyValidFrom: e.policy_valid_from ?? null,
    policyValidTo: e.policy_valid_to ?? null,
    policyCostGross: e.policy_cost_gross ?? null,
    policyCostNet: e.policy_cost_net ?? null,
    insuredIdent: e.insured_ident ?? null,
    currency: e.currency ?? 'EUR',
    notes: e.notes ?? null,
    createdAt: e.created_at,
    lines: Array.isArray(e.income_lines) ? e.income_lines.map(mapLine) : [],
});

// Which sides to create for a property deal, given who pays commission.
function propertySides(category: 'sale' | 'rent', commissionFrom: RegisterEntryInput['commissionFrom']): IncomeSide[] {
    const first: IncomeSide = category === 'rent' ? 'tenant' : 'buyer';
    const second: IncomeSide = category === 'rent' ? 'landlord' : 'seller';
    if (commissionFrom === 'buyer') return [first];
    if (commissionFrom === 'seller') return [second];
    return [first, second];
}

export interface OwnerInfo {
    name: string;
    defaultPct: number | null;
    department: string | null;
}

export interface PartnerInfo {
    name: string;
    type: string;
}

// Full manager edit of a single line. id absent = a newly added line.
export interface EditLineInput {
    id?: string;
    side: IncomeSide;
    clientName: string | null;
    agencyPct: number | null;
    rentMonths: number | null;
    gross: number | null;
    vatIncluded: boolean;
    cash: number | null;
    bank: number | null;
    brokerPct: number | null;
}

export interface EditEntryInput {
    clientName: string | null;
    propertyAddress: string | null;
    propertyRef: string | null;
    propertyType: PropertyType | null;
    dealValue: number | null;
    dealDate: string | null;
    listingSource: 'portfolio' | 'external' | null;
    cobroke: 'none' | 'internal' | 'external';
    houseDeal: boolean;
    externalAgency: string | null;
    externalShare: number | null;
    renewalDate: string | null;
    policyNumber: string | null;
    policyType: string | null;
    policyValidFrom: string | null;
    policyValidTo: string | null;
    policyCostGross: number | null;
    policyCostNet: number | null;
    insuredIdent: string | null;
    notes: string | null;
    status: IncomeStatus;
}

// One line's confirmed figures, entered by a manager at confirmation.
export interface ConfirmLineInput {
    id: string;
    gross: number;
    vatIncluded: boolean;
    cash: number;
    bank: number;
    brokerPct: number;
    agencyPct?: number | null;  // sales: persist the (possibly corrected) rate
    rentMonths?: number | null; // rentals: persist the months basis
}

export function useFinance() {
    const { user } = useAuth();
    const [entries, setEntries] = useState<IncomeEntry[]>([]);
    const [owners, setOwners] = useState<Record<string, OwnerInfo>>({});
    const [partners, setPartners] = useState<Record<string, PartnerInfo>>({});
    const [isLoading, setIsLoading] = useState(true);

    const financeAccess = user?.financeAccess ?? 'none';
    const canUseFinance = financeAccess !== 'none';
    const isManager = financeAccess === 'all';

    const refresh = useCallback(async () => {
        if (!canUseFinance) {
            setEntries([]);
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        try {
            // RLS returns only the caller's own entries (and, for managers, all).
            const { data, error } = await supabase
                .from('income_entries')
                .select('*, income_lines(*)')
                .order('deal_date', { ascending: false, nullsFirst: false })
                .order('created_at', { ascending: false });
            if (error) throw error;
            setEntries((data ?? []).map(mapEntry));

            // Managers need employee names + default rates for the ledger/confirmation.
            if (isManager) {
                const { data: us } = await supabase
                    .from('users')
                    .select('id, name, default_commission_pct, department');
                const map: Record<string, OwnerInfo> = {};
                (us ?? []).forEach((u) => {
                    map[u.id] = {
                        name: u.name ?? 'Unknown',
                        defaultPct: u.default_commission_pct ?? null,
                        department: u.department ?? null,
                    };
                });
                setOwners(map);

                const { data: ps } = await supabase
                    .from('finance_partners')
                    .select('id, name, type');
                const pmap: Record<string, PartnerInfo> = {};
                (ps ?? []).forEach((p) => { pmap[p.id] = { name: p.name ?? '—', type: p.type ?? 'other' }; });
                setPartners(pmap);
            }
        } catch (err) {
            console.error('Finance fetch failed:', err);
            setEntries([]);
        } finally {
            setIsLoading(false);
        }
    }, [canUseFinance, isManager]);

    useEffect(() => {
        refresh();
    }, [refresh]);

    // Agents register the event; they never enter money. A manager confirms later.
    const registerEntry = useCallback(
        async (input: RegisterEntryInput): Promise<{ error: string | null }> => {
            if (!user) return { error: 'Not signed in' };

            const property = isProperty(input.category);
            // Referrals begin their pipeline as "referred"; a closed sale/rent or a
            // logged insurance policy is already "won" (awaiting the money).
            const status = input.category === 'credit_referral'
                || input.category === 'construction_referral'
                || input.category === 'interior_design_referral'
                ? 'referred'
                : 'won';

            // Co-broke (internal/external) is a manager decision at confirmation,
            // not something the agent sets when registering.

            // Per-side commission basis. Sales use an agency % of the price;
            // rentals use a multiple of the monthly rent (e.g. 1 = one month).
            const isSale = input.category === 'sale';
            const isRentCat = input.category === 'rent';
            const dealValue = input.dealValue ?? null;
            const sides = property ? propertySides(input.category as 'sale' | 'rent', input.commissionFrom) : [];
            const sideAgency = sides.map((_, i) =>
                i === 0 ? (input.agencyPct ?? null) : (input.secondAgencyPct ?? input.agencyPct ?? null));
            const sideMonths = sides.map((_, i) =>
                i === 0 ? (input.rentMonths ?? null) : (input.secondRentMonths ?? input.rentMonths ?? null));
            let expected = input.expectedAmount ?? null;
            if (property && dealValue != null) {
                let sum = 0;
                sides.forEach((_, i) => {
                    if (isSale && sideAgency[i] != null) sum += dealValue * (sideAgency[i]! / 100);
                    if (isRentCat && sideMonths[i] != null) sum += dealValue * sideMonths[i]!;
                });
                if (sum > 0) expected = Math.round(sum * 100) / 100;
            }

            try {
                const { data: entry, error: entryErr } = await supabase
                    .from('income_entries')
                    .insert({
                        owner_id: user.id,
                        created_by: user.id,
                        category: input.category,
                        status,
                        client_name: input.clientName.trim() || null,
                        property_type: property ? (input.propertyType ?? null) : null,
                        deal_value: dealValue,
                        deal_date: input.dealDate || null,
                        partner_id: input.partnerId ?? null,
                        property_address: input.propertyAddress?.trim() || null,
                        property_ref: input.propertyRef?.trim() || null,
                        listing_source: property ? 'portfolio' : null,
                        cobroke: 'none',
                        house_deal: input.houseDeal ?? false,
                        // The policy expiry is the renewal trigger; fall back to an
                        // explicit renewal date if one was given without a valid-to.
                        renewal_date: input.policyValidTo || input.renewalDate || null,
                        expected_amount: expected,
                        policy_number: input.policyNumber?.trim() || null,
                        policy_type: input.policyType?.trim() || null,
                        policy_valid_from: input.policyValidFrom || null,
                        policy_valid_to: input.policyValidTo || null,
                        policy_cost_gross: input.policyCostGross ?? null,
                        policy_cost_net: input.policyCostNet ?? null,
                        insured_ident: input.insuredIdent?.trim() || null,
                        notes: input.notes?.trim() || null,
                    })
                    .select('id')
                    .single();
                if (entryErr) throw entryErr;

                // Build the money-free lines (RLS forbids agents writing amounts).
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const lines: any[] = [];
                if (property && (input.category === 'sale' || input.category === 'rent')) {
                    const sides = propertySides(input.category, input.commissionFrom);
                    sides.forEach((side, i) => {
                        const isFirst = i === 0;
                        lines.push({
                            entry_id: entry.id,
                            owner_id: user.id,
                            side,
                            client_name: isFirst
                                ? input.clientName.trim() || null
                                : (input.secondClientName?.trim() || null),
                            agency_pct: isSale ? (sideAgency[i] ?? null) : null,
                            rent_months: isRentCat ? (sideMonths[i] ?? null) : null,
                        });
                    });
                } else {
                    lines.push({
                        entry_id: entry.id,
                        owner_id: user.id,
                        side: 'n/a',
                        client_name: input.clientName.trim() || null,
                    });
                }

                const { error: linesErr } = await supabase.from('income_lines').insert(lines);
                if (linesErr) throw linesErr;

                await refresh();
                return { error: null };
            } catch (err) {
                const message = err instanceof Error ? err.message : 'Could not register';
                console.error('registerEntry failed:', err);
                return { error: message };
            }
        },
        [user, refresh]
    );

    // Managers confirm the money: write per-line amounts + the snapshotted split,
    // then set the entry paid/partially_paid. 'paid' locks the entry.
    const confirmEntry = useCallback(
        async (
            entryId: string,
            status: 'paid' | 'partially_paid',
            lineInputs: ConfirmLineInput[],
            dealValue?: number | null
        ): Promise<{ error: string | null }> => {
            if (!user) return { error: 'Not signed in' };
            try {
                const nowISO = new Date().toISOString();
                const today = nowISO.slice(0, 10);

                for (const li of lineInputs) {
                    // Splits compute on the net (ex-VAT) amount. Bulgarian VAT is 20%.
                    const base = li.vatIncluded ? li.gross / 1.2 : li.gross;
                    const brokerCut = Math.round(base * (li.brokerPct / 100) * 100) / 100;
                    const agencyCut = Math.round((base - brokerCut) * 100) / 100;
                    const { error } = await supabase
                        .from('income_lines')
                        .update({
                            gross_amount: li.gross,
                            vat_included: li.vatIncluded,
                            amount_cash: li.cash,
                            amount_bank: li.bank,
                            agency_pct: li.agencyPct ?? null,
                            rent_months: li.rentMonths ?? null,
                            broker_pct: li.brokerPct,
                            broker_cut: brokerCut,
                            agency_cut: agencyCut,
                            received_date: today,
                        })
                        .eq('id', li.id);
                    if (error) throw error;
                }

                const entryPatch: Record<string, unknown> = {
                    status,
                    confirmed_by: user.id,
                    confirmed_at: nowISO,
                    locked_at: status === 'paid' ? nowISO : null,
                };
                if (dealValue !== undefined) entryPatch.deal_value = dealValue;
                const { error: eErr } = await supabase
                    .from('income_entries')
                    .update(entryPatch)
                    .eq('id', entryId);
                if (eErr) throw eErr;

                await refresh();
                return { error: null };
            } catch (err) {
                const message = err instanceof Error ? err.message : 'Could not confirm';
                console.error('confirmEntry failed:', err);
                return { error: message };
            }
        },
        [user, refresh]
    );

    // Full manager edit: update entry core fields + upsert/remove lines, recompute
    // splits, and set lock/confirm state from the chosen status. Manager-only (RLS).
    const saveEntry = useCallback(
        async (
            entryId: string,
            entryOwnerId: string,
            entry: EditEntryInput,
            lines: EditLineInput[],
            removedLineIds: string[]
        ): Promise<{ error: string | null }> => {
            if (!user) return { error: 'Not signed in' };
            const round2 = (n: number) => Math.round(n * 100) / 100;
            try {
                const nowISO = new Date().toISOString();
                const today = nowISO.slice(0, 10);

                for (const id of removedLineIds) {
                    const { error } = await supabase.from('income_lines').delete().eq('id', id);
                    if (error) throw error;
                }

                for (const l of lines) {
                    // A house deal has no broker: force the broker share to 0 so the
                    // agency keeps the whole line, whatever pct was typed.
                    const brokerPct = entry.houseDeal ? 0 : l.brokerPct;
                    const base = l.gross != null ? (l.vatIncluded ? l.gross / 1.2 : l.gross) : null;
                    const brokerCut = base != null && brokerPct != null ? round2(base * (brokerPct / 100)) : null;
                    const agencyCut = base != null ? round2(base - (brokerCut ?? 0)) : null;
                    const payload = {
                        side: l.side,
                        client_name: l.clientName,
                        agency_pct: l.agencyPct,
                        rent_months: l.rentMonths,
                        gross_amount: l.gross,
                        vat_included: l.vatIncluded,
                        amount_cash: l.gross != null ? l.cash : null,
                        amount_bank: l.gross != null ? l.bank : null,
                        broker_pct: brokerPct,
                        broker_cut: brokerCut,
                        agency_cut: agencyCut,
                        received_date: l.gross != null ? today : null,
                    };
                    if (l.id) {
                        const { error } = await supabase.from('income_lines').update(payload).eq('id', l.id);
                        if (error) throw error;
                    } else {
                        const { error } = await supabase.from('income_lines')
                            .insert({ entry_id: entryId, owner_id: entryOwnerId, ...payload });
                        if (error) throw error;
                    }
                }

                const paidLike = entry.status === 'paid' || entry.status === 'partially_paid';
                const entryPatch: Record<string, unknown> = {
                    client_name: entry.clientName,
                    property_address: entry.propertyAddress,
                    property_ref: entry.propertyRef,
                    property_type: entry.propertyType,
                    deal_value: entry.dealValue,
                    deal_date: entry.dealDate,
                    listing_source: entry.listingSource,
                    cobroke: entry.cobroke,
                    house_deal: entry.houseDeal,
                    external_agency: entry.externalAgency,
                    external_share: entry.externalShare,
                    // Keep the renewal reminder pinned to the policy's expiry.
                    renewal_date: entry.policyValidTo ?? entry.renewalDate,
                    policy_number: entry.policyNumber,
                    policy_type: entry.policyType,
                    policy_valid_from: entry.policyValidFrom,
                    policy_valid_to: entry.policyValidTo,
                    policy_cost_gross: entry.policyCostGross,
                    policy_cost_net: entry.policyCostNet,
                    insured_ident: entry.insuredIdent,
                    notes: entry.notes,
                    status: entry.status,
                    locked_at: entry.status === 'paid' ? nowISO : null,
                };
                if (paidLike) { entryPatch.confirmed_by = user.id; entryPatch.confirmed_at = nowISO; }
                const { error: eErr } = await supabase.from('income_entries').update(entryPatch).eq('id', entryId);
                if (eErr) throw eErr;

                await refresh();
                return { error: null };
            } catch (err) {
                const message = err instanceof Error ? err.message : 'Could not save';
                console.error('saveEntry failed:', err);
                return { error: message };
            }
        },
        [user, refresh]
    );

    // Bulk import from a spreadsheet (manager-only; RLS lets finance 'all' write
    // entries + money on anyone's behalf). Inserts every entry, then every line
    // aligned to the returned ids. Paid rows are confirmed + locked, like a
    // manual confirmation; 'won' rows keep the commission as the expected figure.
    const importEntries = useCallback(
        async (rows: PreparedImportRow[]): Promise<{ imported: number; error: string | null }> => {
            if (!user) return { imported: 0, error: 'Not signed in' };
            if (rows.length === 0) return { imported: 0, error: 'Nothing to import' };
            const nowISO = new Date().toISOString();
            const today = nowISO.slice(0, 10);
            try {
                const entryPayloads = rows.map((r) => {
                    const paidLike = r.status === 'paid' || r.status === 'partially_paid';
                    return {
                        owner_id: r.ownerId,
                        created_by: user.id,
                        category: r.category,
                        status: r.status,
                        client_name: r.clientName || null,
                        deal_date: r.dealDate,
                        property_address: isProperty(r.category) ? r.propertyAddress : null,
                        property_ref: isProperty(r.category) ? r.propertyRef : null,
                        listing_source: isProperty(r.category) ? 'portfolio' : null,
                        cobroke: 'none',
                        renewal_date: r.category === 'insurance' ? r.validTo : null,
                        expected_amount: !paidLike ? r.commission : null,
                        policy_number: r.policyNumber,
                        policy_type: r.policyType,
                        policy_valid_from: r.validFrom,
                        policy_valid_to: r.validTo,
                        policy_cost_gross: r.policyGross,
                        policy_cost_net: r.policyNet,
                        insured_ident: r.insuredIdent,
                        notes: r.notes,
                        confirmed_by: paidLike ? user.id : null,
                        confirmed_at: paidLike ? nowISO : null,
                        locked_at: r.status === 'paid' ? nowISO : null,
                    };
                });

                const { data: inserted, error } = await supabase
                    .from('income_entries')
                    .insert(entryPayloads)
                    .select('id');
                if (error) throw error;
                if (!inserted || inserted.length !== rows.length) {
                    throw new Error('Import mismatch — no rows were saved.');
                }

                const linePayloads = rows.map((r, i) => {
                    const paidLike = r.status === 'paid' || r.status === 'partially_paid';
                    const { brokerCut, agencyCut } = computeCuts(r.commission, r.brokerPct);
                    return {
                        entry_id: inserted[i].id,
                        owner_id: r.ownerId,
                        side: 'n/a',
                        client_name: r.clientName || null,
                        gross_amount: paidLike ? r.commission : null,
                        vat_included: false,
                        amount_cash: paidLike ? r.cash : null,
                        amount_bank: paidLike ? r.bank : null,
                        broker_pct: r.brokerPct,
                        broker_cut: paidLike ? brokerCut : null,
                        agency_cut: paidLike ? agencyCut : null,
                        received_date: paidLike ? (r.dealDate ?? today) : null,
                    };
                });

                const { error: linesErr } = await supabase.from('income_lines').insert(linePayloads);
                if (linesErr) throw linesErr;

                await refresh();
                return { imported: rows.length, error: null };
            } catch (err) {
                const message = err instanceof Error ? err.message : 'Could not import';
                console.error('importEntries failed:', err);
                return { imported: 0, error: message };
            }
        },
        [user, refresh]
    );

    // Lightweight status change (manager-only) for the non-money transitions —
    // referred / in_progress / won / lost / cancelled. Reaching 'paid' still goes
    // through confirmation (money is entered there), so it's not accepted here.
    const updateStatus = useCallback(
        async (entryId: string, status: IncomeStatus): Promise<{ error: string | null }> => {
            if (!user) return { error: 'Not signed in' };
            if (status === 'paid' || status === 'partially_paid') {
                return { error: 'Use Confirm payment to mark money received.' };
            }
            try {
                const { error } = await supabase
                    .from('income_entries')
                    .update({ status, locked_at: null })
                    .eq('id', entryId);
                if (error) throw error;
                await refresh();
                return { error: null };
            } catch (err) {
                const message = err instanceof Error ? err.message : 'Could not update status';
                console.error('updateStatus failed:', err);
                return { error: message };
            }
        },
        [user, refresh]
    );

    const deleteEntry = useCallback(
        async (entryId: string): Promise<{ error: string | null }> => {
            try {
                const { error } = await supabase.from('income_entries').delete().eq('id', entryId);
                if (error) throw error;
                await refresh();
                return { error: null };
            } catch (err) {
                const message = err instanceof Error ? err.message : 'Could not delete';
                console.error('deleteEntry failed:', err);
                return { error: message };
            }
        },
        [refresh]
    );

    // Clone an entry as next period's renewal: money-free, linked via renewed_from,
    // dates advanced a year. Ownership stays with the original owner.
    const renewEntry = useCallback(
        async (src: IncomeEntry): Promise<{ error: string | null }> => {
            if (!user) return { error: 'Not signed in' };
            const addYear = (d: string | null): string | null => {
                if (!d) return null;
                const dt = new Date(d);
                dt.setFullYear(dt.getFullYear() + 1);
                return dt.toISOString().slice(0, 10);
            };
            try {
                const { data: entry, error } = await supabase
                    .from('income_entries')
                    .insert({
                        owner_id: src.ownerId,
                        created_by: user.id,
                        category: src.category,
                        status: 'won',
                        client_name: src.clientName,
                        property_type: src.propertyType,
                        deal_value: src.dealValue,
                        deal_date: src.renewalDate ?? new Date().toISOString().slice(0, 10),
                        partner_id: src.partnerId,
                        property_address: src.propertyAddress,
                        property_ref: src.propertyRef,
                        cobroke: src.cobroke,
                        house_deal: src.houseDeal,
                        renewal_date: addYear(src.policyValidTo ?? src.renewalDate),
                        renewed_from: src.id,
                        // Carry the policy over; advance the cover period a year.
                        policy_number: src.policyNumber,
                        policy_type: src.policyType,
                        policy_valid_from: addYear(src.policyValidFrom),
                        policy_valid_to: addYear(src.policyValidTo),
                        policy_cost_gross: src.policyCostGross,
                        policy_cost_net: src.policyCostNet,
                        insured_ident: src.insuredIdent,
                        currency: src.currency,
                    })
                    .select('id')
                    .single();
                if (error) throw error;

                const lines = src.lines.map((l) => ({
                    entry_id: entry.id,
                    owner_id: l.ownerId,
                    side: l.side,
                    client_name: l.clientName,
                    agency_pct: l.agencyPct,
                    rent_months: l.rentMonths,
                }));
                if (lines.length) {
                    const { error: le } = await supabase.from('income_lines').insert(lines);
                    if (le) throw le;
                }
                await refresh();
                return { error: null };
            } catch (err) {
                const message = err instanceof Error ? err.message : 'Could not register renewal';
                console.error('renewEntry failed:', err);
                return { error: message };
            }
        },
        [user, refresh]
    );

    return { entries, owners, partners, isLoading, canUseFinance, financeAccess, isManager, refresh, registerEntry, confirmEntry, renewEntry, saveEntry, deleteEntry, importEntries, updateStatus };
}
