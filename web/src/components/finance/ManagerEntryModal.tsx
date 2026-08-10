'use client';

import { useState } from 'react';
import { X, Trash2, Plus, Lock } from 'lucide-react';
import {
    IncomeEntry,
    IncomeSide,
    IncomeStatus,
    PropertyType,
    CATEGORY_LABELS,
    STATUS_LABELS,
    PROPERTY_TYPE_LABELS,
    POLICY_TYPE_SUGGESTIONS,
    isProperty,
} from '@/lib/financeTypes';
import { OwnerInfo, EditEntryInput, EditLineInput } from '@/lib/useFinance';

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
    const property = isProperty(entry.category);
    const isRent = entry.category === 'rent';

    const [clientName, setClientName] = useState(entry.clientName ?? '');
    const [address, setAddress] = useState(entry.propertyAddress ?? '');
    const [propertyRef, setPropertyRef] = useState(entry.propertyRef ?? '');
    const [propertyType, setPropertyType] = useState<PropertyType | ''>(entry.propertyType ?? '');
    const [dealValue, setDealValue] = useState(entry.dealValue != null ? String(entry.dealValue) : '');
    const [dealDate, setDealDate] = useState(entry.dealDate ?? '');
    const [listingSource, setListingSource] = useState<'portfolio' | 'external' | ''>(entry.listingSource ?? '');
    const [cobroke, setCobroke] = useState<'none' | 'internal' | 'external'>(entry.cobroke);
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

    const [lines, setLines] = useState<LineRow[]>(() => entry.lines.map((l) => ({
        id: l.id,
        side: l.side,
        clientName: l.clientName ?? '',
        rate: isRent ? (l.rentMonths != null ? String(l.rentMonths) : '') : (l.agencyPct != null ? String(l.agencyPct) : ''),
        gross: l.grossAmount != null ? String(l.grossAmount) : '',
        vatIncluded: false,
        cash: l.amountCash != null ? String(l.amountCash) : '',
        bank: l.amountBank != null ? String(l.amountBank) : '',
        brokerPct: l.brokerPct != null ? String(l.brokerPct) : (owners[l.ownerId]?.defaultPct != null ? String(owners[l.ownerId].defaultPct) : ''),
    })));
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

    // Recompute a line's gross from the deal value + its rate.
    const rateChange = (i: number, r: string) => {
        const v = Number(dealValue), rr = Number(r);
        const g = v && rr ? String(round2(isRent ? v * rr : v * (rr / 100))) : lines[i].gross;
        setLine(i, { rate: r, gross: g });
    };

    const cutsOf = (l: LineRow) => {
        const gross = Number(l.gross) || 0;
        const base = l.vatIncluded ? gross / 1.2 : gross;
        const broker = round2(base * ((Number(l.brokerPct) || 0) / 100));
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
                            {CATEGORY_LABELS[entry.category]} · {owners[entry.ownerId]?.name ?? ''}
                            {entry.status === 'paid' ? <Lock className="w-3 h-3" /> : null}
                        </p>
                        <h3 className="text-lg font-semibold text-gray-900">Edit transaction</h3>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-700" aria-label="Close"><X className="w-5 h-5" /></button>
                </div>

                <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                    {/* Core fields */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">{property ? (isRent ? 'Primary tenant' : 'Primary client') : 'Client'}</label>
                            <input value={clientName} onChange={(e) => setClientName(e.target.value)} className={inp} />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
                            <select value={status} onChange={(e) => setStatus(e.target.value as IncomeStatus)} className={inp} title="Status">
                                {(Object.keys(STATUS_LABELS) as IncomeStatus[]).map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                            </select>
                        </div>
                        {property && (
                            <>
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Property address</label>
                                    <input value={address} onChange={(e) => setAddress(e.target.value)} className={inp} />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">CRM number</label>
                                    <input value={propertyRef} onChange={(e) => setPropertyRef(e.target.value)} placeholder="AGZ-2026-001" className={inp} />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Property type</label>
                                    <select value={propertyType} onChange={(e) => setPropertyType(e.target.value as PropertyType | '')} className={inp} title="Property type">
                                        <option value="">—</option>
                                        {(Object.keys(PROPERTY_TYPE_LABELS) as PropertyType[]).map((t) => <option key={t} value={t}>{PROPERTY_TYPE_LABELS[t]}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">{isRent ? 'Monthly rent (EUR)' : 'Sale price (EUR)'}</label>
                                    <input type="number" min={0} value={dealValue} onChange={(e) => setDealValue(e.target.value)} className={inp} />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Listing source</label>
                                    <select value={listingSource} onChange={(e) => setListingSource(e.target.value as 'portfolio' | 'external' | '')} className={inp} title="Listing source">
                                        <option value="">—</option>
                                        <option value="portfolio">Our portfolio</option>
                                        <option value="external">External listing</option>
                                    </select>
                                </div>
                            </>
                        )}
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Deal date</label>
                            <input type="date" value={dealDate} onChange={(e) => setDealDate(e.target.value)} className={inp} />
                        </div>
                        {entry.category === 'insurance' && (
                            <>
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Valid from</label>
                                    <input type="date" value={validFrom} onChange={(e) => setValidFrom(e.target.value)} className={inp} title="Valid from" />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Valid till (renewal)</label>
                                    <input type="date" value={validTo} onChange={(e) => setValidTo(e.target.value)} className={inp} title="Valid till" />
                                </div>
                            </>
                        )}
                    </div>

                    {/* Insurance policy details */}
                    {entry.category === 'insurance' && (
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Policy number</label>
                                <input value={policyNumber} onChange={(e) => setPolicyNumber(e.target.value)} className={inp} />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Policy type</label>
                                <input value={policyType} onChange={(e) => setPolicyType(e.target.value)} list="policy-types-edit" className={inp} />
                                <datalist id="policy-types-edit">
                                    {POLICY_TYPE_SUGGESTIONS.map((t) => <option key={t} value={t} />)}
                                </datalist>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">ЕГН / ЕИК</label>
                                <input value={insuredIdent} onChange={(e) => setInsuredIdent(e.target.value)} className={inp} />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Cost bruto</label>
                                    <input type="number" min={0} step={0.01} value={policyGross} onChange={(e) => setPolicyGross(e.target.value)} className={inp} placeholder="with tax" />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Cost neto</label>
                                    <input type="number" min={0} step={0.01} value={policyNet} onChange={(e) => setPolicyNet(e.target.value)} className={inp} placeholder="without tax" />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Co-broke */}
                    {property && (
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Co-broke</label>
                                <select value={cobroke} onChange={(e) => setCobroke(e.target.value as 'none' | 'internal' | 'external')} className={inp} title="Co-broke">
                                    <option value="none">Solo (no co-broke)</option>
                                    <option value="internal">Internal (with a colleague)</option>
                                    <option value="external">External (another agency)</option>
                                </select>
                            </div>
                            {cobroke === 'external' && (
                                <>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">Which agency</label>
                                        <input value={externalAgency} onChange={(e) => setExternalAgency(e.target.value)} placeholder="Agency name" className={inp} />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">Paid to their agency (EUR)</label>
                                        <input type="number" min={0} value={externalShare} onChange={(e) => setExternalShare(e.target.value)} className={inp} />
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    {/* Lines */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-navy-primary">Commission lines</p>
                            <button type="button" onClick={addLine} className="inline-flex items-center gap-1 text-sm text-teal hover:underline"><Plus className="w-3.5 h-3.5" /> Add line</button>
                        </div>
                        {lines.map((l, i) => {
                            const c = cutsOf(l);
                            return (
                                <div key={l.id ?? `new-${i}`} className="border border-gray-200 rounded-xl p-3">
                                    <div className="flex items-center gap-2 mb-2">
                                        <select value={l.side} onChange={(e) => setLine(i, { side: e.target.value as IncomeSide })} className="px-2 py-1.5 border border-gray-300 rounded-lg text-sm" title="Side">
                                            {SIDES.map((s) => <option key={s} value={s}>{s}</option>)}
                                        </select>
                                        <input value={l.clientName} onChange={(e) => setLine(i, { clientName: e.target.value })} placeholder="client name" className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm" />
                                        <button type="button" onClick={() => removeLine(i)} className="text-gray-400 hover:text-red-600" aria-label="Remove line"><Trash2 className="w-4 h-4" /></button>
                                    </div>
                                    <div className="grid grid-cols-4 gap-2">
                                        <div>
                                            <label className="block text-[11px] text-gray-500 mb-0.5">{isRent ? 'Months' : 'Agency %'}</label>
                                            <input type="number" step={isRent ? 0.25 : 0.1} value={l.rate} onChange={(e) => rateChange(i, e.target.value)} className={inp} />
                                        </div>
                                        <div>
                                            <label className="block text-[11px] text-gray-500 mb-0.5">Commission</label>
                                            <input type="number" value={l.gross} onChange={(e) => setLine(i, { gross: e.target.value })} className={inp} />
                                        </div>
                                        <div>
                                            <label className="block text-[11px] text-gray-500 mb-0.5">Cash</label>
                                            <input type="number" value={l.cash} onChange={(e) => setLine(i, { cash: e.target.value })} className={inp} />
                                        </div>
                                        <div>
                                            <label className="block text-[11px] text-gray-500 mb-0.5">Bank</label>
                                            <input type="number" value={l.bank} onChange={(e) => setLine(i, { bank: e.target.value })} className={inp} />
                                        </div>
                                        <div>
                                            <label className="block text-[11px] text-gray-500 mb-0.5">Broker %</label>
                                            <input type="number" value={l.brokerPct} onChange={(e) => setLine(i, { brokerPct: e.target.value })} className={inp} />
                                        </div>
                                        <label className="col-span-3 flex items-end gap-2 text-xs text-gray-500 pb-2">
                                            <input type="checkbox" checked={l.vatIncluded} onChange={(e) => setLine(i, { vatIncluded: e.target.checked })} /> incl. VAT
                                        </label>
                                    </div>
                                    {Number(l.gross) > 0 && (
                                        <div className="mt-2 flex justify-between text-xs bg-gray-50 rounded px-2 py-1">
                                            <span className="text-gray-500">Broker <strong className="text-navy-primary">{eur(c.broker)}</strong></span>
                                            <span className="text-gray-500">Agency <strong className="text-navy-primary">{eur(c.agency)}</strong></span>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
                        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className={inp} />
                    </div>

                    {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-2">{error}</p>}
                </div>

                <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between flex-shrink-0">
                    {confirmDelete ? (
                        <button type="button" onClick={del} disabled={submitting} className="text-sm text-white bg-red-600 px-3 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50">Click again to delete</button>
                    ) : (
                        <button type="button" onClick={() => setConfirmDelete(true)} className="inline-flex items-center gap-1.5 text-sm text-red-600 hover:underline"><Trash2 className="w-4 h-4" /> Delete</button>
                    )}
                    <div className="flex gap-3">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">Cancel</button>
                        <button type="button" onClick={save} disabled={submitting} className="px-5 py-2 bg-navy-primary text-white font-semibold rounded-lg hover:bg-navy-secondary disabled:opacity-50">{submitting ? 'Saving…' : 'Save changes'}</button>
                    </div>
                </div>
            </div>
        </div>
    );
}
