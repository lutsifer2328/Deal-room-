'use client';

import { useState } from 'react';
import { X, Pencil, Home, Users, Wallet, Calendar, Building2, ShieldCheck, CheckCircle2 } from 'lucide-react';
import {
    IncomeEntry,
    IncomeStatus,
    isProperty,
} from '@/lib/financeTypes';
import { OwnerInfo } from '@/lib/useFinance';
import { useTranslation } from '@/lib/useTranslation';
import { catKey, statusKey, sideKey, ptypeKey } from '@/lib/financeLabels';

interface ManagerEntryDetailProps {
    entry: IncomeEntry;
    owners: Record<string, OwnerInfo>;
    onClose: () => void;
    onEdit: (entry: IncomeEntry) => void;
    onQuickStatus: (entryId: string, status: IncomeStatus) => Promise<{ error: string | null }>;
    onConfirmRequest: (entry: IncomeEntry) => void;
}

// Statuses a manager can set directly from the drawer. 'paid'/'partially_paid'
// are reached via Confirm payment (money is entered there), not this dropdown.
const QUICK_STATUSES: IncomeStatus[] = ['referred', 'in_progress', 'won', 'lost', 'cancelled'];

const eur = (n: number) => new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR' }).format(n);
const dt = (s: string | null) => (s ? new Date(s).toLocaleDateString() : '—');

const statusChip = (s: IncomeEntry['status']) => {
    switch (s) {
        case 'paid': return 'bg-green-100 text-green-700';
        case 'partially_paid': return 'bg-green-50 text-green-600';
        case 'won': return 'bg-amber-100 text-amber-700';
        case 'lost':
        case 'cancelled': return 'bg-gray-100 text-gray-500';
        default: return 'bg-blue-50 text-blue-600';
    }
};

function Row({ label, value }: { label: string; value: React.ReactNode }) {
    if (value == null || value === '' || value === '—') return null;
    return (
        <div className="flex justify-between gap-4 py-1.5 text-sm">
            <span className="text-text-muted">{label}</span>
            <span className="text-navy-primary text-right font-medium">{value}</span>
        </div>
    );
}

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
    return (
        <div className="border border-gray-100 rounded-xl p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-text-muted mb-2 flex items-center gap-2">{icon}{title}</p>
            {children}
        </div>
    );
}

export default function ManagerEntryDetail({ entry, owners, onClose, onEdit, onQuickStatus, onConfirmRequest }: ManagerEntryDetailProps) {
    const { t } = useTranslation();
    const property = isProperty(entry.category);
    const isRent = entry.category === 'rent';
    const paid = entry.status === 'paid' || entry.status === 'partially_paid';
    const [savingStatus, setSavingStatus] = useState(false);
    const [statusError, setStatusError] = useState<string | null>(null);

    const changeStatus = async (next: IncomeStatus) => {
        if (next === entry.status) return;
        setStatusError(null);
        setSavingStatus(true);
        const { error } = await onQuickStatus(entry.id, next);
        setSavingStatus(false);
        if (error) setStatusError(error);
    };

    const totalGross = entry.lines.reduce((s, l) => s + (l.grossAmount ?? 0), 0);
    const totalBroker = entry.lines.reduce((s, l) => s + (l.brokerCut ?? 0), 0);
    const totalAgency = entry.lines.reduce((s, l) => s + (l.agencyCut ?? 0), 0);
    const totalCash = entry.lines.reduce((s, l) => s + (l.amountCash ?? 0), 0);
    const totalBank = entry.lines.reduce((s, l) => s + (l.amountBank ?? 0), 0);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full flex flex-col max-h-[90vh]">
                <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <div>
                            <p className="text-xs text-gray-400">{entry.propertyRef || t('fin.detail.noCrm')}</p>
                            <h3 className="text-lg font-semibold text-gray-900">
                                {entry.propertyAddress || entry.clientName || t(catKey(entry.category))}
                            </h3>
                        </div>
                        {paid ? (
                            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusChip(entry.status)}`}>{t(statusKey(entry.status))}</span>
                        ) : (
                            <select
                                value={entry.status}
                                disabled={savingStatus}
                                onChange={(e) => changeStatus(e.target.value as IncomeStatus)}
                                title="Change status"
                                className={`text-xs font-medium px-2 py-1 rounded-full border-0 focus:outline-none focus:ring-2 focus:ring-teal cursor-pointer ${statusChip(entry.status)}`}
                            >
                                {QUICK_STATUSES.map((s) => <option key={s} value={s}>{t(statusKey(s))}</option>)}
                            </select>
                        )}
                        {entry.houseDeal && <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-teal/10 text-teal">{t('fin.detail.agencyDeal')}</span>}
                    </div>
                    <div className="flex items-center gap-2">
                        {!paid && entry.status !== 'lost' && entry.status !== 'cancelled' && (
                            <button onClick={() => onConfirmRequest(entry)} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-teal rounded-lg hover:opacity-90"><CheckCircle2 className="w-3.5 h-3.5" /> <span className="hidden sm:inline">{t('fin.detail.confirmPayment')}</span></button>
                        )}
                        <button onClick={() => onEdit(entry)} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-navy-primary border border-gray-200 rounded-lg hover:bg-gray-50"><Pencil className="w-3.5 h-3.5" /> <span className="hidden sm:inline">{t('fin.detail.edit')}</span></button>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-700" aria-label="Close"><X className="w-5 h-5" /></button>
                    </div>
                </div>

                {statusError && (
                    <p className="mx-6 mt-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-2">{statusError}</p>
                )}

                <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                    <Section icon={<Home className="w-3.5 h-3.5" />} title={property ? t('fin.detail.property') : t('fin.detail.deal')}>
                        <Row label={t('fin.detail.type')} value={t(catKey(entry.category))} />
                        {property && <Row label={t('fin.reg.propertyType')} value={entry.propertyType ? t(ptypeKey(entry.propertyType)) : '—'} />}
                        <Row label={t('fin.detail.address')} value={entry.propertyAddress} />
                        <Row label={t('fin.edit.crmNumber')} value={entry.propertyRef} />
                        {property && <Row label={t('fin.detail.source')} value={entry.listingSource === 'external' ? t('fin.edit.externalListing') : entry.listingSource === 'portfolio' ? t('fin.edit.ourPortfolio') : '—'} />}
                        {property && <Row label={isRent ? t('fin.detail.monthlyRent') : t('fin.detail.salePrice')} value={entry.dealValue != null ? eur(entry.dealValue) : '—'} />}
                    </Section>

                    <Section icon={<Users className="w-3.5 h-3.5" />} title={t('fin.detail.parties')}>
                        {entry.lines.map((l) => (
                            <div key={l.id} className="flex justify-between gap-4 py-1.5 text-sm">
                                <span className="text-text-muted">{t(sideKey(l.side))}</span>
                                <span className="text-right">
                                    <span className="text-navy-primary font-medium">{l.clientName ?? '—'}</span>
                                    <span className="block text-xs text-text-muted">{t('fin.detail.brokerLabel')}: {owners[l.ownerId]?.name ?? '—'}</span>
                                </span>
                            </div>
                        ))}
                        {entry.cobroke === 'internal' && <Row label={t('fin.detail.cobrokeWith')} value={t('fin.detail.cobrokeInternalVal')} />}
                        {entry.cobroke === 'external' && <Row label={t('fin.detail.cobrokeWith')} value={entry.externalAgency || t('fin.detail.externalAgencyFallback')} />}
                        {entry.cobroke === 'external' && entry.externalShare != null && <Row label={t('fin.detail.paidToAgency')} value={eur(entry.externalShare)} />}
                    </Section>

                    <Section icon={<Wallet className="w-3.5 h-3.5" />} title={t('fin.commission')}>
                        {entry.lines.map((l) => (
                            <div key={l.id} className="py-1.5 border-b border-gray-50 last:border-0">
                                <div className="flex justify-between text-sm">
                                    <span className="text-text-muted">{t(sideKey(l.side))}
                                        {l.agencyPct != null ? ` · ${l.agencyPct}%` : ''}
                                        {l.rentMonths != null ? ` · ${l.rentMonths} ${t('fin.months').toLowerCase()}` : ''}
                                    </span>
                                    <span className="text-navy-primary font-medium">{l.grossAmount != null ? eur(l.grossAmount) : t('fin.pending')}</span>
                                </div>
                                {l.grossAmount != null && (
                                    <div className="flex justify-between text-xs text-text-muted mt-0.5">
                                        <span>{t('fin.broker')} {l.brokerPct ?? 0}%: {eur(l.brokerCut ?? 0)} · {t('fin.agency')}: {eur(l.agencyCut ?? 0)}</span>
                                        <span>{l.amountCash ? `${t('fin.cash')} ${eur(l.amountCash)}` : ''}{l.amountCash && l.amountBank ? ' · ' : ''}{l.amountBank ? `${t('fin.bank')} ${eur(l.amountBank)}` : ''}</span>
                                    </div>
                                )}
                            </div>
                        ))}
                        {paid && (
                            <div className="flex justify-between pt-2 mt-1 border-t border-gray-200 text-sm font-semibold text-navy-primary">
                                <span>{t('fin.detail.total')} {eur(totalGross)}</span>
                                <span>{t('fin.broker')} {eur(totalBroker)} · {t('fin.agency')} {eur(totalAgency)}</span>
                            </div>
                        )}
                        {paid && (totalCash > 0 || totalBank > 0) && (
                            <div className="flex justify-end text-xs text-text-muted mt-1">{t('fin.cash')} {eur(totalCash)} · {t('fin.bank')} {eur(totalBank)}</div>
                        )}
                        {!paid && entry.expectedAmount != null && <Row label={t('fin.detail.expected')} value={eur(entry.expectedAmount)} />}
                    </Section>

                    {entry.category === 'insurance' && (
                        <Section icon={<ShieldCheck className="w-3.5 h-3.5" />} title={t('fin.detail.policy')}>
                            <Row label={t('fin.reg.policyNumber')} value={entry.policyNumber} />
                            <Row label={t('fin.detail.type')} value={entry.policyType} />
                            <Row label="ЕГН / ЕИК" value={entry.insuredIdent} />
                            <Row label={t('fin.detail.valid')} value={entry.policyValidFrom || entry.policyValidTo ? `${dt(entry.policyValidFrom)} — ${dt(entry.policyValidTo)}` : '—'} />
                            <Row label={t('fin.costBruto')} value={entry.policyCostGross != null ? eur(entry.policyCostGross) : '—'} />
                            <Row label={t('fin.costNeto')} value={entry.policyCostNet != null ? eur(entry.policyCostNet) : '—'} />
                        </Section>
                    )}

                    <Section icon={<Calendar className="w-3.5 h-3.5" />} title={t('fin.detail.dates')}>
                        <Row label={property ? t('fin.reg.dateSigned') : t('fin.reg.date')} value={dt(entry.dealDate)} />
                        {entry.category === 'insurance' && <Row label={t('fin.detail.renewalDue')} value={dt(entry.renewalDate)} />}
                        <Row label={t('fin.detail.registeredRow')} value={dt(entry.createdAt)} />
                    </Section>

                    {entry.notes && entry.notes !== 'MOCK' && (
                        <Section icon={<Building2 className="w-3.5 h-3.5" />} title={t('fin.notes')}>
                            <p className="text-sm text-navy-primary whitespace-pre-wrap">{entry.notes}</p>
                        </Section>
                    )}
                </div>
            </div>
        </div>
    );
}
