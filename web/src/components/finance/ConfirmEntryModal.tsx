'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { IncomeEntry, CATEGORY_LABELS } from '@/lib/financeTypes';
import { OwnerInfo, ConfirmLineInput } from '@/lib/useFinance';

interface ConfirmEntryModalProps {
    entry: IncomeEntry;
    owners: Record<string, OwnerInfo>;
    onClose: () => void;
    onConfirm: (
        entryId: string,
        status: 'paid' | 'partially_paid',
        lines: ConfirmLineInput[],
        dealValue?: number | null
    ) => Promise<{ error: string | null }>;
}

interface LineState {
    id: string;
    ownerId: string;
    label: string;
    rate: string; // agency % (sale) or months of rent (rent)
    gross: string;
    vatIncluded: boolean;
    cash: string;
    bank: string;
    brokerPct: string;
}

const round2 = (n: number) => Math.round(n * 100) / 100;
const eur = (n: number) => new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR' }).format(n);

export default function ConfirmEntryModal({ entry, owners, onClose, onConfirm }: ConfirmEntryModalProps) {
    const isRent = entry.category === 'rent';
    // Property deals derive the commission from price/rent × a rate; insurance and
    // referrals have no such basis — the manager just types the commission in.
    const property = entry.category === 'sale' || entry.category === 'rent';

    // Gross commission: sale = price x agency%; rent = monthly rent x months.
    const grossFrom = (dealValue: string, rate: string): string => {
        const v = Number(dealValue), r = Number(rate);
        if (!v || !r) return '';
        return String(round2(isRent ? v * r : v * (r / 100)));
    };

    const [dealValue, setDealValue] = useState<string>(entry.dealValue != null ? String(entry.dealValue) : '');
    const [lines, setLines] = useState<LineState[]>(() =>
        entry.lines.map((l) => {
            const rate = isRent
                ? (l.rentMonths != null ? String(l.rentMonths) : '')
                : (l.agencyPct != null ? String(l.agencyPct) : '');
            const derived = grossFrom(entry.dealValue != null ? String(entry.dealValue) : '', rate);
            return {
                id: l.id,
                ownerId: l.ownerId,
                label: `${l.side !== 'n/a' ? l.side + ' · ' : ''}${l.clientName ?? owners[l.ownerId]?.name ?? '—'}`,
                rate,
                gross: l.grossAmount != null ? String(l.grossAmount) : derived,
                vatIncluded: false,
                cash: l.amountCash != null ? String(l.amountCash) : '',
                bank: l.amountBank != null ? String(l.amountBank) : '',
                brokerPct: l.brokerPct != null ? String(l.brokerPct) : (owners[l.ownerId]?.defaultPct != null ? String(owners[l.ownerId].defaultPct) : ''),
            };
        })
    );
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const setLine = (id: string, patch: Partial<LineState>) =>
        setLines((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)));

    // Editing the price/rent recomputes each line's gross from its rate.
    const onDealValueChange = (v: string) => {
        setDealValue(v);
        setLines((prev) => prev.map((l) => {
            const g = grossFrom(v, l.rate);
            return g ? { ...l, gross: g } : l;
        }));
    };

    // Editing a line's rate recomputes that line's gross from the price/rent.
    const onRateChange = (id: string, r: string) => {
        const g = grossFrom(dealValue, r);
        setLine(id, g ? { rate: r, gross: g } : { rate: r });
    };

    const computed = lines.map((l) => {
        const gross = Number(l.gross) || 0;
        const pct = Number(l.brokerPct) || 0;
        const base = l.vatIncluded ? gross / 1.2 : gross;
        const brokerCut = round2(base * (pct / 100));
        const agencyCut = round2(base - brokerCut);
        const cashBank = round2((Number(l.cash) || 0) + (Number(l.bank) || 0));
        const cashBankMismatch = gross > 0 && Math.abs(cashBank - gross) > 0.01;
        return { brokerCut, agencyCut, cashBankMismatch };
    });

    const anyMismatch = computed.some((c) => c.cashBankMismatch);
    const allHaveGross = lines.every((l) => Number(l.gross) > 0);

    const submit = async (status: 'paid' | 'partially_paid') => {
        setError(null);
        if (!allHaveGross) {
            setError('Enter the commission amount for each line.');
            return;
        }
        setSubmitting(true);
        const payload: ConfirmLineInput[] = lines.map((l) => ({
            id: l.id,
            gross: Number(l.gross) || 0,
            vatIncluded: l.vatIncluded,
            cash: Number(l.cash) || 0,
            bank: Number(l.bank) || 0,
            brokerPct: Number(l.brokerPct) || 0,
            agencyPct: isRent ? null : (l.rate.trim() === '' ? null : Number(l.rate)),
            rentMonths: isRent ? (l.rate.trim() === '' ? null : Number(l.rate)) : null,
        }));
        const { error } = await onConfirm(entry.id, status, payload, dealValue.trim() === '' ? null : Number(dealValue));
        setSubmitting(false);
        if (error) { setError(error); return; }
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
                    <div>
                        <p className="text-xs text-gray-400">Confirm payment</p>
                        <h3 className="text-lg font-semibold text-gray-900">
                            {CATEGORY_LABELS[entry.category]}
                            {entry.propertyAddress ? ` · ${entry.propertyAddress}` : ''}
                        </h3>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-700" aria-label="Close">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 space-y-5">
                    {entry.category === 'sale' || entry.category === 'rent' ? (
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                                {isRent ? 'Monthly rent (EUR)' : 'Sale price (EUR)'}
                            </label>
                            <input type="number" min={0} step={0.01} value={dealValue}
                                onChange={(e) => onDealValueChange(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal" />
                            <p className="text-[11px] text-gray-400 mt-1">
                                {isRent ? 'Commission below fills in from rent × months.' : 'Commission below fills in from price × agency %.'}
                            </p>
                        </div>
                    ) : null}

                    {lines.map((l, i) => (
                        <div key={l.id} className="border border-gray-200 rounded-xl p-4">
                            <div className="flex items-center justify-between mb-3">
                                <p className="font-semibold text-navy-primary capitalize">{l.label}</p>
                                <span className="text-xs text-gray-400">{owners[l.ownerId]?.name ?? ''}</span>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                {property && (
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">{isRent ? 'Months of rent' : 'Agency %'}</label>
                                        <input type="number" min={0} max={isRent ? undefined : 100} step={isRent ? 0.25 : 0.1} value={l.rate}
                                            onChange={(e) => onRateChange(l.id, e.target.value)}
                                            placeholder={isRent ? 'e.g. 1' : 'e.g. 3'}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal" />
                                    </div>
                                )}
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Commission received (EUR)</label>
                                    <input type="number" min={0} step={0.01} value={l.gross}
                                        onChange={(e) => setLine(l.id, { gross: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal" />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Broker %</label>
                                    <input type="number" min={0} max={100} step={0.5} value={l.brokerPct}
                                        onChange={(e) => setLine(l.id, { brokerPct: e.target.value })}
                                        placeholder="default"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal" />
                                    <p className="text-[11px] text-gray-400 mt-1">
                                        {owners[l.ownerId]?.defaultPct != null ? `default ${owners[l.ownerId].defaultPct}% — override for this deal` : 'no default set'}
                                    </p>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Cash (EUR)</label>
                                    <input type="number" min={0} step={0.01} value={l.cash}
                                        onChange={(e) => setLine(l.id, { cash: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal" />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Bank (EUR)</label>
                                    <input type="number" min={0} step={0.01} value={l.bank}
                                        onChange={(e) => setLine(l.id, { bank: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal" />
                                </div>
                            </div>

                            <label className="flex items-center gap-2 mt-3 text-sm text-gray-600">
                                <input type="checkbox" checked={l.vatIncluded}
                                    onChange={(e) => setLine(l.id, { vatIncluded: e.target.checked })} />
                                Amount includes VAT (ДДС) — split computed on net
                            </label>

                            <div className="mt-3 flex items-center justify-between text-sm bg-gray-50 rounded-lg px-3 py-2">
                                <span className="text-gray-500">Broker gets <strong className="text-navy-primary">{eur(computed[i].brokerCut)}</strong></span>
                                <span className="text-gray-500">Agency keeps <strong className="text-navy-primary">{eur(computed[i].agencyCut)}</strong></span>
                            </div>
                            {computed[i].cashBankMismatch && (
                                <p className="text-[11px] text-amber-600 mt-1">Cash + bank doesn&apos;t match the commission amount.</p>
                            )}
                        </div>
                    ))}

                    {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-2">{error}</p>}

                    <div className="flex items-center justify-end gap-3 pt-2">
                        <button type="button" onClick={() => submit('partially_paid')} disabled={submitting}
                            className="px-4 py-2 text-navy-primary bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50">
                            Partially paid
                        </button>
                        <button type="button" onClick={() => submit('paid')} disabled={submitting}
                            className="px-5 py-2 bg-navy-primary text-white font-semibold rounded-lg hover:bg-navy-secondary transition-colors disabled:opacity-50">
                            {submitting ? 'Saving…' : anyMismatch ? 'Mark paid anyway' : 'Mark paid & lock'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
