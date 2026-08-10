'use client';

import { X, Pencil, Home, Users, Wallet, Calendar, Building2, ShieldCheck } from 'lucide-react';
import {
    IncomeEntry,
    CATEGORY_LABELS,
    STATUS_LABELS,
    PROPERTY_TYPE_LABELS,
    isProperty,
} from '@/lib/financeTypes';
import { OwnerInfo } from '@/lib/useFinance';

interface ManagerEntryDetailProps {
    entry: IncomeEntry;
    owners: Record<string, OwnerInfo>;
    onClose: () => void;
    onEdit: (entry: IncomeEntry) => void;
}

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

const sideLabel: Record<string, string> = { buyer: 'Buyer', seller: 'Seller', tenant: 'Tenant', landlord: 'Landlord', 'n/a': 'Client' };

export default function ManagerEntryDetail({ entry, owners, onClose, onEdit }: ManagerEntryDetailProps) {
    const property = isProperty(entry.category);
    const isRent = entry.category === 'rent';
    const paid = entry.status === 'paid' || entry.status === 'partially_paid';

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
                            <p className="text-xs text-gray-400">{entry.propertyRef || 'No CRM number'}</p>
                            <h3 className="text-lg font-semibold text-gray-900">
                                {entry.propertyAddress || entry.clientName || CATEGORY_LABELS[entry.category]}
                            </h3>
                        </div>
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusChip(entry.status)}`}>{STATUS_LABELS[entry.status]}</span>
                        {entry.houseDeal && <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-teal/10 text-teal">Agency deal</span>}
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={() => onEdit(entry)} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-navy-primary border border-gray-200 rounded-lg hover:bg-gray-50"><Pencil className="w-3.5 h-3.5" /> Edit</button>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-700" aria-label="Close"><X className="w-5 h-5" /></button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                    <Section icon={<Home className="w-3.5 h-3.5" />} title={property ? 'Property' : 'Deal'}>
                        <Row label="Type" value={CATEGORY_LABELS[entry.category]} />
                        {property && <Row label="Property type" value={entry.propertyType ? PROPERTY_TYPE_LABELS[entry.propertyType] : '—'} />}
                        <Row label="Address" value={entry.propertyAddress} />
                        <Row label="CRM number" value={entry.propertyRef} />
                        {property && <Row label="Source" value={entry.listingSource === 'external' ? 'External listing' : entry.listingSource === 'portfolio' ? 'Our portfolio' : '—'} />}
                        {property && <Row label={isRent ? 'Monthly rent' : 'Sale price'} value={entry.dealValue != null ? eur(entry.dealValue) : '—'} />}
                    </Section>

                    <Section icon={<Users className="w-3.5 h-3.5" />} title="Parties &amp; brokers">
                        {entry.lines.map((l) => (
                            <div key={l.id} className="flex justify-between gap-4 py-1.5 text-sm">
                                <span className="text-text-muted">{sideLabel[l.side] ?? l.side}</span>
                                <span className="text-right">
                                    <span className="text-navy-primary font-medium">{l.clientName ?? '—'}</span>
                                    <span className="block text-xs text-text-muted">broker: {owners[l.ownerId]?.name ?? '—'}</span>
                                </span>
                            </div>
                        ))}
                        {entry.cobroke === 'internal' && <Row label="Co-broke" value="Split with a colleague (internal)" />}
                        {entry.cobroke === 'external' && <Row label="Co-broke with" value={entry.externalAgency || 'External agency'} />}
                        {entry.cobroke === 'external' && entry.externalShare != null && <Row label="Paid to their agency" value={eur(entry.externalShare)} />}
                    </Section>

                    <Section icon={<Wallet className="w-3.5 h-3.5" />} title="Commission">
                        {entry.lines.map((l) => (
                            <div key={l.id} className="py-1.5 border-b border-gray-50 last:border-0">
                                <div className="flex justify-between text-sm">
                                    <span className="text-text-muted">{sideLabel[l.side] ?? l.side}
                                        {l.agencyPct != null ? ` · ${l.agencyPct}%` : ''}
                                        {l.rentMonths != null ? ` · ${l.rentMonths} mo` : ''}
                                    </span>
                                    <span className="text-navy-primary font-medium">{l.grossAmount != null ? eur(l.grossAmount) : 'pending'}</span>
                                </div>
                                {l.grossAmount != null && (
                                    <div className="flex justify-between text-xs text-text-muted mt-0.5">
                                        <span>broker {l.brokerPct ?? 0}%: {eur(l.brokerCut ?? 0)} · agency: {eur(l.agencyCut ?? 0)}</span>
                                        <span>{l.amountCash ? `cash ${eur(l.amountCash)}` : ''}{l.amountCash && l.amountBank ? ' · ' : ''}{l.amountBank ? `bank ${eur(l.amountBank)}` : ''}</span>
                                    </div>
                                )}
                            </div>
                        ))}
                        {paid && (
                            <div className="flex justify-between pt-2 mt-1 border-t border-gray-200 text-sm font-semibold text-navy-primary">
                                <span>Total {eur(totalGross)}</span>
                                <span>broker {eur(totalBroker)} · agency {eur(totalAgency)}</span>
                            </div>
                        )}
                        {paid && (totalCash > 0 || totalBank > 0) && (
                            <div className="flex justify-end text-xs text-text-muted mt-1">cash {eur(totalCash)} · bank {eur(totalBank)}</div>
                        )}
                        {!paid && entry.expectedAmount != null && <Row label="Expected" value={eur(entry.expectedAmount)} />}
                    </Section>

                    {entry.category === 'insurance' && (
                        <Section icon={<ShieldCheck className="w-3.5 h-3.5" />} title="Policy">
                            <Row label="Policy number" value={entry.policyNumber} />
                            <Row label="Type" value={entry.policyType} />
                            <Row label="ЕГН / ЕИК" value={entry.insuredIdent} />
                            <Row label="Valid" value={entry.policyValidFrom || entry.policyValidTo ? `${dt(entry.policyValidFrom)} — ${dt(entry.policyValidTo)}` : '—'} />
                            <Row label="Cost bruto" value={entry.policyCostGross != null ? eur(entry.policyCostGross) : '—'} />
                            <Row label="Cost neto" value={entry.policyCostNet != null ? eur(entry.policyCostNet) : '—'} />
                        </Section>
                    )}

                    <Section icon={<Calendar className="w-3.5 h-3.5" />} title="Dates">
                        <Row label={property ? 'Date signed' : 'Date'} value={dt(entry.dealDate)} />
                        {entry.category === 'insurance' && <Row label="Renewal due" value={dt(entry.renewalDate)} />}
                        <Row label="Registered" value={dt(entry.createdAt)} />
                    </Section>

                    {entry.notes && entry.notes !== 'MOCK' && (
                        <Section icon={<Building2 className="w-3.5 h-3.5" />} title="Notes">
                            <p className="text-sm text-navy-primary whitespace-pre-wrap">{entry.notes}</p>
                        </Section>
                    )}
                </div>
            </div>
        </div>
    );
}
