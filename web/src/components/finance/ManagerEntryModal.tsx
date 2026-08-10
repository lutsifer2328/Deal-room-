'use client';

import { useState } from 'react';
import { X, Trash2, Plus, Lock } from 'lucide-react';
import {
    IncomeEntry,
    IncomeSide,
    IncomeStatus,
    PropertyType,
    STATUS_LABELS,
    PROPERTY_TYPE_LABELS,
    POLICY_TYPE_SUGGESTIONS,
    isProperty,
} from '@/lib/financeTypes';
import { OwnerInfo, EditEntryInput, EditLineInput } from '@/lib/useFinance';
import { useTranslation } from '@/lib/useTranslation';
import { catKey, statusKey, ptypeKey, sideKey } from '@/lib/financeLabels';

interface ManagerEntryModalProps {
    entry: IncomeEntry;
    owners: Record<string, OwnerInfo>;
    onClose: () => void;
    onSave: (entryId: string, entryOwnerId: string, entry: EditEntryInput, lines: EditLineInput[], removedLineIds: string[]) => Promise<{ error: string | null }>;
    onDelete: (entryId: string) => Promise<{ error: string | null }>;
}

interface LineRow {
    id?: string;
    side: IncomeSide;
    clientName: string;
    rate: string;   // agency % (sale) or months (rent)
    gross: string;
    vatIncluded: boolean;
    cash: string;
    bank: string;
    brokerPct: string;
}

const round2 = (n: number) => Math.round(n * 100) / 100;
const eur = (n: number) => new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR' }).format(n);
const num = (s: string) => (s.trim() === '' ? null : Number(s));
const inp = 'w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal';

const SIDES: IncomeSide[] = ['buyer', 'seller', 'tenant', 'landlord', 'n/a'];

export default function ManagerEntryModal({ entry, owners, onClose, onSave, onDelete }: ManagerEntryModalProps) {
    const { t } = useTranslation();
    const property = isProperty(entry.category);
    const isRent = entry.category === 'rent';
    const insurance = entry.category === 'insurance';

    const [clientName, setClientName] = useState(entry.clientName ?? '');
    const [address, setAddress] = useState(entry.propertyAddress ?? '');
    const [propertyRef, setPropertyRef] = useState(entry.propertyRef ?? '');
    const [propertyType, setPropertyType] = useState<PropertyType | ''>(entry.propertyType ?? '');
    const [dealValue, setDealValue] = useState(entry.dealValue != null ? String(entry.dealValue) : '');
    const [dealDate, setDealDate] = useState(entry.dealDate ?? '');
    const [listingSource, setListingSource] = useState<'portfolio' | 'external' | ''>(entry.listingSource ?? '');
    const [cobroke, setCobroke] = useState<'none' | 'internal' | 'external'>(entry.cobroke);
    const [houseDeal, setHouseDeal] = useState(entry.houseDeal);
    const [externalAgency, setExternalAgency] = useState(entry.externalAgency ?? '');
    const [externalShare, setExternalShare] = useState(entry.externalShare != null ? String(entry.externalShare) : '');
    const [renewalDate] = useState(entry.renewalDate ?? '');
    const [policyNumber, setPolicyNumber] = useState(entry.policyNumber ?? '');
    const [policyType, setPolicyType] = useState(entry.policyType ?? '');
    const [validFrom, setValidFrom] = useState(entry.policyValidFrom ?? '');
    const [validTo, setValidTo] = useState(entry.policyValidTo ?? '');
    const [policyGross, setPolicyGross] = useState(entry.policyCostGross != null ? String(entry.policyCostGross) : '');
    const [policyNet, setPolicyNet] = useState(entry.policyCostNet != null ? String(entry.policyCostNet) : '');
    const [insuredIdent, setInsuredIdent] = useState(entry.insuredIdent ?? '');
    const [notes, setNotes] = useState(entry.notes ?? '');
    const [status, setStatus] = useState<IncomeStatus>(entry.status);

    const [lines, setLines] = useState<LineRow[]>(() => entry.lines.map((l) => {
        const rate = isRent ? (l.rentMonths != null ? String(l.rentMonths) : '') : (l.agencyPct != null ? String(l.agencyPct) : '');
        // If the commission wasn't stored yet, derive it from the basis × rate so the
        // field is never blank when the price/neto and rate are both known.
        const basis = insurance ? entry.policyCostNet : entry.dealValue;
        const rr = Number(rate);
        const derived = basis != null && rr ? String(round2(isRent ? basis * rr : basis * (rr / 100))) : '';
        return {
            id: l.id,
            side: l.side,
            clientName: l.clientName ?? '',
            rate,
            gross: l.grossAmount != null ? String(l.grossAmount) : derived,
            vatIncluded: false,
            cash: l.amountCash != null ? String(l.amountCash) : '',
            bank: l.amountBank != null ? String(l.amountBank) : '',
            brokerPct: l.brokerPct != null ? String(l.brokerPct) : (owners[l.ownerId]?.defaultPct != null ? String(owners[l.ownerId].defaultPct) : ''),
        };
    }));
    const [removed, setRemoved] = useState<string[]>([]);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [confirmDelete, setConfirmDelete] = useState(false);

    const setLine = (i: number, patch: Partial<LineRow>) =>
        setLines((prev) => prev.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));

    const removeLine = (i: number) => {
        const l = lines[i];
        if (l.id) setRemoved((r) => [...r, l.id!]);
        setLines((prev) => prev.filter((_, idx) => idx !== i));
    };

    const addLine = () => setLines((prev) => [...prev, {
        side: property ? (isRent ? 'landlord' : 'seller') : 'n/a',
        clientName: '', rate: '', gross: '', vatIncluded: false, cash: '', bank: '', brokerPct: '',
    }]);

    // Recompute a line's commission from its basis × rate. Property deals use the
    // sale price / monthly rent; insurance uses the policy neto (commission = neto × agency %).
    const rateChange = (i: number, r: string) => {
        const basis = insurance ? Number(policyNet) : Number(dealValue);
        const rr = Number(r);
        const g = basis && rr ? String(round2(isRent ? basis * rr : basis * (rr / 100))) : lines[i].gross;
        setLine(i, { rate: r, gross: g });
    };

    // Property: editing the sale price / monthly rent re-derives every line's
    // commission (price × agency %, or rent × months).
    const dealValueChange = (v: string) => {
        setDealValue(v);
        if (!property) return;
        const basis = Number(v);
        setLines((prev) => prev.map((l) => {
            const rr = Number(l.rate);
            return basis && rr ? { ...l, gross: String(round2(isRent ? basis * rr : basis * (rr / 100))) } : l;
        }));
    };

    // Insurance: editing the neto re-derives every line's commission (neto × agency %).
    const netChange = (v: string) => {
        setPolicyNet(v);
        if (!insurance) return;
        const basis = Number(v);
        setLines((prev) => prev.map((l) => {
            const rr = Number(l.rate);
            return basis && rr ? { ...l, gross: String(round2(basis * (rr / 100))) } : l;
        }));
    };

    const cutsOf = (l: LineRow) => {
        const gross = Number(l.gross) || 0;
        const base = l.vatIncluded ? gross / 1.2 : gross;
        const pct = houseDeal ? 0 : (Number(l.brokerPct) || 0);
        const broker = round2(base * (pct / 100));
        return { broker, agency: round2(base - broker) };
    };

    const save = async () => {
        setError(null);
        setSubmitting(true);
        const entryInput: EditEntryInput = {
            clientName: clientName.trim() || null,
            propertyAddress: address.trim() || null,
            propertyRef: propertyRef.trim() || null,
            propertyType: propertyType === '' ? null : propertyType,
            dealValue: num(dealValue),
            dealDate: dealDate || null,
            listingSource: listingSource === '' ? null : listingSource,
            cobroke,
            houseDeal,
            externalAgency: externalAgency.trim() || null,
            externalShare: num(externalShare),
            renewalDate: renewalDate || null,
            policyNumber: policyNumber.trim() || null,
            policyType: policyType.trim() || null,
            policyValidFrom: validFrom || null,
            policyValidTo: validTo || null,
            policyCostGross: num(policyGross),
            policyCostNet: num(policyNet),
            insuredIdent: insuredIdent.trim() || null,
            notes: notes.trim() || null,
            status,
        };
        const lineInputs: EditLineInput[] = lines.map((l) => ({
            id: l.id,
            side: l.side,
            clientName: l.clientName.trim() || null,
            agencyPct: isRent ? null : num(l.rate),
            rentMonths: isRent ? num(l.rate) : null,
            gross: num(l.gross),
            vatIncluded: l.vatIncluded,
            cash: num(l.cash),
            bank: num(l.bank),
            brokerPct: num(l.brokerPct),
        }));
        const { error } = await onSave(entry.id, entry.ownerId, entryInput, lineInputs, removed);
        setSubmitting(false);
        if (error) { setError(error); return; }
        onClose();
    };

    const del = async () => {
        setSubmitting(true);
        const { error } = await onDelete(entry.id);
        setSubmitting(false);
        if (error) { setError(error); return; }
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full flex flex-col max-h-[90vh]">
                <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
                    <div>
                        <p className="text-xs text-gray-400 flex items-center gap-1">
                            {t(catKey(entry.category))} · {owners[entry.ownerId]?.name ?? ''}
                            {entry.status === 'paid' ? <Lock className="w-3 h-3" /> : null}
                        </p>
                        <h3 className="text-lg font-semibold text-gray-900">{t('fin.edit.title')}</h3>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-700" aria-label="Close"><X className="w-5 h-5" /></button>
                </div>

                <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                    {/* Core fields */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">{property ? (isRent ? t('fin.edit.primaryTenant') : t('fin.edit.primaryClient')) : t('fin.side.na')}</label>
                            <input value={clientName} onChange={(e) => setClientName(e.target.value)} className={inp} />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">{t('fin.edit.status')}</label>
                            <select value={status} onChange={(e) => setStatus(e.target.value as IncomeStatus)} className={inp} title={t('fin.edit.status')}>
                                {(Object.keys(STATUS_LABELS) as IncomeStatus[]).map((s) => <option key={s} value={s}>{t(statusKey(s))}</option>)}
                            </select>
                        </div>
                        {property && (
                            <>
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">{t('fin.reg.propertyAddress')}</label>
                                    <input value={address} onChange={(e) => setAddress(e.target.value)} className={inp} />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">{t('fin.edit.crmNumber')}</label>
                                    <input value={propertyRef} onChange={(e) => setPropertyRef(e.target.value)} placeholder="AGZ-2026-001" className={inp} />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">{t('fin.reg.propertyType')}</label>
                                    <select value={propertyType} onChange={(e) => setPropertyType(e.target.value as PropertyType | '')} className={inp} title={t('fin.reg.propertyType')}>
                                        <option value="">—</option>
                                        {(Object.keys(PROPERTY_TYPE_LABELS) as PropertyType[]).map((pt) => <option key={pt} value={pt}>{t(ptypeKey(pt))}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">{isRent ? t('fin.monthlyRentEur') : t('fin.salePriceEur')}</label>
                                    <input type="number" min={0} value={dealValue} onChange={(e) => dealValueChange(e.target.value)} className={inp} />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">{t('fin.edit.listingSource')}</label>
                                    <select value={listingSource} onChange={(e) => setListingSource(e.target.value as 'portfolio' | 'external' | '')} className={inp} title={t('fin.edit.listingSource')}>
                                        <option value="">—</option>
                                        <option value="portfolio">{t('fin.edit.ourPortfolio')}</option>
                                        <option value="external">{t('fin.edit.externalListing')}</option>
                                    </select>
                                </div>
                            </>
                        )}
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">{t('fin.edit.dealDate')}</label>
                            <input type="date" value={dealDate} onChange={(e) => setDealDate(e.target.value)} className={inp} />
                        </div>
                        {entry.category === 'insurance' && (
                            <>
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">{t('fin.reg.validFrom')}</label>
                                    <input type="date" value={validFrom} onChange={(e) => setValidFrom(e.target.value)} className={inp} title={t('fin.reg.validFrom')} />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">{t('fin.edit.validTillRenewal')}</label>
                                    <input type="date" value={validTo} onChange={(e) => setValidTo(e.target.value)} className={inp} title={t('fin.reg.validTill')} />
                                </div>
                            </>
                        )}
                    </div>

                    {/* Insurance policy details */}
                    {entry.category === 'insurance' && (
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">{t('fin.reg.policyNumber')}</label>
                                <input value={policyNumber} onChange={(e) => setPolicyNumber(e.target.value)} className={inp} />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">{t('fin.reg.policyTypeLabel')}</label>
                                <input value={policyType} onChange={(e) => setPolicyType(e.target.value)} list="policy-types-edit" className={inp} />
                                <datalist id="policy-types-edit">
                                    {POLICY_TYPE_SUGGESTIONS.map((s) => <option key={s} value={s} />)}
                                </datalist>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">ЕГН / ЕИК</label>
                                <input value={insuredIdent} onChange={(e) => setInsuredIdent(e.target.value)} className={inp} />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">{t('fin.costBruto')}</label>
                                    <input type="number" min={0} step={0.01} value={policyGross} onChange={(e) => setPolicyGross(e.target.value)} className={inp} placeholder={t('fin.withTax')} />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">{t('fin.costNeto')}</label>
                                    <input type="number" min={0} step={0.01} value={policyNet} onChange={(e) => netChange(e.target.value)} className={inp} placeholder={t('fin.withoutTax')} />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Co-broke */}
                    {property && (
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">{t('fin.edit.cobroke')}</label>
                                <select value={cobroke} onChange={(e) => setCobroke(e.target.value as 'none' | 'internal' | 'external')} className={inp} title={t('fin.edit.cobroke')}>
                                    <option value="none">{t('fin.edit.cobrokeSolo')}</option>
                                    <option value="internal">{t('fin.edit.cobrokeInternal')}</option>
                                    <option value="external">{t('fin.edit.cobrokeExternal')}</option>
                                </select>
                            </div>
                            {cobroke === 'external' && (
                                <>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">{t('fin.edit.whichAgency')}</label>
                                        <input value={externalAgency} onChange={(e) => setExternalAgency(e.target.value)} placeholder={t('fin.edit.agencyNamePh')} className={inp} />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">{t('fin.edit.paidToAgency')}</label>
                                        <input type="number" min={0} value={externalShare} onChange={(e) => setExternalShare(e.target.value)} className={inp} />
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    {/* House deal */}
                    <label className="flex items-start gap-2.5 p-3 rounded-lg border border-gray-200 bg-gray-50 cursor-pointer">
                        <input type="checkbox" checked={houseDeal} onChange={(e) => setHouseDeal(e.target.checked)} className="mt-0.5" />
                        <span className="text-sm">
                            <span className="font-medium text-navy-primary">{t('fin.reg.houseDeal')}</span>
                            <span className="block text-xs text-gray-500">{t('fin.edit.houseDealSub')}</span>
                        </span>
                    </label>

                    {/* Lines */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-navy-primary">{t('fin.edit.commissionLines')}</p>
                            <button type="button" onClick={addLine} className="inline-flex items-center gap-1 text-sm text-teal hover:underline"><Plus className="w-3.5 h-3.5" /> {t('fin.edit.addLine')}</button>
                        </div>
                        {lines.map((l, i) => {
                            const c = cutsOf(l);
                            return (
                                <div key={l.id ?? `new-${i}`} className="border border-gray-200 rounded-xl p-3">
                                    <div className="flex items-center gap-2 mb-2">
                                        <select value={l.side} onChange={(e) => setLine(i, { side: e.target.value as IncomeSide })} className="px-2 py-1.5 border border-gray-300 rounded-lg text-sm" title={t('fin.ledger.thClientSide')}>
                                            {SIDES.map((s) => <option key={s} value={s}>{t(sideKey(s))}</option>)}
                                        </select>
                                        <input value={l.clientName} onChange={(e) => setLine(i, { clientName: e.target.value })} placeholder={t('fin.edit.clientNamePh')} className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm" />
                                        <button type="button" onClick={() => removeLine(i)} className="text-gray-400 hover:text-red-600" aria-label={t('fin.edit.delete')}><Trash2 className="w-4 h-4" /></button>
                                    </div>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                        <div>
                                            <label className="block text-[11px] text-gray-500 mb-0.5">{isRent ? t('fin.months') : t('fin.agencyPct')}</label>
                                            <input type="number" step={isRent ? 0.25 : 0.1} value={l.rate} onChange={(e) => rateChange(i, e.target.value)} className={inp} />
                                        </div>
                                        <div>
                                            <label className="block text-[11px] text-gray-500 mb-0.5">{t('fin.commission')}</label>
                                            <input type="number" value={l.gross} onChange={(e) => setLine(i, { gross: e.target.value })} className={inp} />
                                        </div>
                                        <div>
                                            <label className="block text-[11px] text-gray-500 mb-0.5">{t('fin.cash')}</label>
                                            <input type="number" value={l.cash} onChange={(e) => setLine(i, { cash: e.target.value })} className={inp} />
                                        </div>
                                        <div>
                                            <label className="block text-[11px] text-gray-500 mb-0.5">{t('fin.bank')}</label>
                                            <input type="number" value={l.bank} onChange={(e) => setLine(i, { bank: e.target.value })} className={inp} />
                                        </div>
                                        <div>
                                            <label className="block text-[11px] text-gray-500 mb-0.5">{t('fin.brokerPct')}</label>
                                            <input type="number" value={houseDeal ? '0' : l.brokerPct} disabled={houseDeal}
                                                onChange={(e) => setLine(i, { brokerPct: e.target.value })}
                                                className={`${inp} ${houseDeal ? 'bg-gray-50 text-gray-400' : ''}`} />
                                        </div>
                                        {!insurance && (
                                            <label className="col-span-2 sm:col-span-3 flex items-end gap-2 text-xs text-gray-500 pb-2">
                                                <input type="checkbox" checked={l.vatIncluded} onChange={(e) => setLine(i, { vatIncluded: e.target.checked })} /> {t('fin.inclVat')}
                                            </label>
                                        )}
                                    </div>
                                    {insurance && (
                                        <p className="text-[11px] text-gray-400 mt-1">{t('fin.edit.insuranceHint')}</p>
                                    )}
                                    {Number(l.gross) > 0 && (
                                        <div className="mt-2 flex justify-between text-xs bg-gray-50 rounded px-2 py-1">
                                            <span className="text-gray-500">{t('fin.broker')} <strong className="text-navy-primary">{eur(c.broker)}</strong></span>
                                            <span className="text-gray-500">{t('fin.agency')} <strong className="text-navy-primary">{eur(c.agency)}</strong></span>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">{t('fin.notes')}</label>
                        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className={inp} />
                    </div>

                    {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-2">{error}</p>}
                </div>

                <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between flex-shrink-0">
                    {confirmDelete ? (
                        <button type="button" onClick={del} disabled={submitting} className="text-sm text-white bg-red-600 px-3 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50">{t('fin.edit.deleteConfirm')}</button>
                    ) : (
                        <button type="button" onClick={() => setConfirmDelete(true)} className="inline-flex items-center gap-1.5 text-sm text-red-600 hover:underline"><Trash2 className="w-4 h-4" /> {t('fin.edit.delete')}</button>
                    )}
                    <div className="flex gap-3">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">{t('common.cancel')}</button>
                        <button type="button" onClick={save} disabled={submitting} className="px-5 py-2 bg-navy-primary text-white font-semibold rounded-lg hover:bg-navy-secondary disabled:opacity-50">{submitting ? t('common.saving') : t('fin.edit.saveChanges')}</button>
                    </div>
                </div>
            </div>
        </div>
    );
}
