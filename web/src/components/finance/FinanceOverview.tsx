'use client';

import { useMemo, useState } from 'react';
import { IncomeEntry, IncomeCategory, CATEGORY_LABELS } from '@/lib/financeTypes';
import { OwnerInfo, PartnerInfo } from '@/lib/useFinance';

interface FinanceOverviewProps {
    entries: IncomeEntry[];
    owners: Record<string, OwnerInfo>;
    partners: Record<string, PartnerInfo>;
}

const eur = (n: number) => new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);

// Commission actually received on an entry (cash + bank across its lines).
const receivedOf = (e: IncomeEntry) =>
    (e.status === 'paid' || e.status === 'partially_paid')
        ? e.lines.reduce((s, l) => s + (l.amountCash ?? 0) + (l.amountBank ?? 0), 0)
        : 0;

const yearOf = (e: IncomeEntry) => (e.dealDate ? e.dealDate.slice(0, 4) : null);
const monthOf = (e: IncomeEntry) => (e.dealDate ? Number(e.dealDate.slice(5, 7)) : null);

export default function FinanceOverview({ entries, owners, partners }: FinanceOverviewProps) {
    const years = useMemo(() => {
        const s = new Set<string>();
        entries.forEach((e) => { const y = yearOf(e); if (y) s.add(y); });
        return Array.from(s).sort().reverse();
    }, [entries]);

    const [year, setYear] = useState<string>('all');
    const effectiveYear = year !== 'all' ? year : (years[0] ?? String(new Date().getFullYear()));

    const scoped = useMemo(
        () => (year === 'all' ? entries : entries.filter((e) => yearOf(e) === year)),
        [entries, year]
    );

    // Revenue by pillar
    const pillars = useMemo(() => {
        const m = new Map<IncomeCategory, number>();
        scoped.forEach((e) => m.set(e.category, (m.get(e.category) ?? 0) + receivedOf(e)));
        const arr = Array.from(m.entries()).map(([cat, val]) => ({ cat, val }));
        arr.sort((a, b) => b.val - a.val);
        return arr;
    }, [scoped]);
    const pillarMax = Math.max(1, ...pillars.map((p) => p.val));
    const totalReceived = pillars.reduce((s, p) => s + p.val, 0);
    const totalPipeline = scoped.reduce((s, e) => s + (e.status === 'won' ? (e.expectedAmount ?? 0) : 0), 0);

    // Monthly revenue for the effective year
    const monthly = useMemo(() => {
        const arr = Array(12).fill(0) as number[];
        entries.filter((e) => yearOf(e) === effectiveYear).forEach((e) => {
            const mo = monthOf(e);
            if (mo) arr[mo - 1] += receivedOf(e);
        });
        return arr;
    }, [entries, effectiveYear]);
    const monthlyMax = Math.max(1, ...monthly);

    // Where sales come from (sale + rent)
    const sourceSplit = useMemo(() => {
        const buckets = { portfolio: 0, internal: 0, external: 0 };
        scoped.filter((e) => e.category === 'sale' || e.category === 'rent').forEach((e) => {
            const v = receivedOf(e);
            if (e.cobroke === 'external') buckets.external += v;
            else if (e.cobroke === 'internal') buckets.internal += v;
            else buckets.portfolio += v;
        });
        return buckets;
    }, [scoped]);
    const sourceTotal = sourceSplit.portfolio + sourceSplit.internal + sourceSplit.external;

    // Cross-sell: property clients who also generated a referral/insurance
    const crossSell = useMemo(() => {
        const norm = (s: string | null) => (s ?? '').trim().toLowerCase();
        const propClients = new Set<string>();
        const otherClients = new Set<string>();
        scoped.forEach((e) => {
            const name = norm(e.clientName);
            if (!name) return;
            if (e.category === 'sale' || e.category === 'rent') propClients.add(name);
            else otherClients.add(name);
        });
        let both = 0;
        propClients.forEach((n) => { if (otherClients.has(n)) both++; });
        const rate = propClients.size ? Math.round((both / propClients.size) * 100) : 0;
        return { propClients: propClients.size, both, rate };
    }, [scoped]);

    // Partner league
    const partnerRows = useMemo(() => {
        const m = new Map<string, { paidUs: number; total: number; won: number }>();
        scoped.forEach((e) => {
            if (!e.partnerId) return;
            const row = m.get(e.partnerId) ?? { paidUs: 0, total: 0, won: 0 };
            row.paidUs += receivedOf(e);
            row.total += 1;
            if (e.status === 'won' || e.status === 'paid' || e.status === 'partially_paid') row.won += 1;
            m.set(e.partnerId, row);
        });
        return Array.from(m.entries())
            .map(([id, r]) => ({ id, name: partners[id]?.name ?? '—', ...r }))
            .sort((a, b) => b.paidUs - a.paidUs);
    }, [scoped, partners]);

    // Team: received + deal count per employee
    const teamRows = useMemo(() => {
        const m = new Map<string, { received: number; count: number }>();
        scoped.forEach((e) => {
            const row = m.get(e.ownerId) ?? { received: 0, count: 0 };
            row.received += receivedOf(e);
            row.count += 1;
            m.set(e.ownerId, row);
        });
        return Array.from(m.entries())
            .map(([id, r]) => ({ id, name: owners[id]?.name ?? '—', ...r }))
            .sort((a, b) => b.received - a.received);
    }, [scoped, owners]);

    const hasData = entries.length > 0;

    const card = 'bg-white border border-gray-100 rounded-xl p-5';

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2">
                <select value={year} onChange={(e) => setYear(e.target.value)} title="Year"
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal">
                    <option value="all">All years</option>
                    {years.map((y) => <option key={y} value={y}>{y}</option>)}
                </select>
                <span className="text-xs text-text-muted ml-auto">Amounts are commission received (paid).</span>
            </div>

            {!hasData ? (
                <div className={`${card} text-center py-12`}>
                    <p className="text-navy-primary font-semibold mb-1">No data yet</p>
                    <p className="text-text-muted text-sm">Charts appear once deals are registered and confirmed.</p>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Revenue by pillar */}
                        <div className={card}>
                            <p className="text-sm font-medium text-navy-primary mb-3">Revenue by pillar</p>
                            <div className="space-y-2.5">
                                {pillars.map((p) => (
                                    <div key={p.cat}>
                                        <div className="flex justify-between text-xs mb-1">
                                            <span>{CATEGORY_LABELS[p.cat]}</span>
                                            <span className="text-text-muted">{eur(p.val)}</span>
                                        </div>
                                        <div className="h-2 bg-gray-100 rounded">
                                            <div className="h-2 rounded" style={{ width: `${(p.val / pillarMax) * 100}%`, background: '#1D9E75' }} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="flex justify-between mt-4 pt-3 border-t border-gray-100 text-sm">
                                <span className="text-text-muted">Received <strong className="text-navy-primary">{eur(totalReceived)}</strong></span>
                                <span className="text-text-muted">Pipeline <strong className="text-navy-primary">{eur(totalPipeline)}</strong></span>
                            </div>
                        </div>

                        {/* Monthly revenue */}
                        <div className={card}>
                            <p className="text-sm font-medium text-navy-primary mb-3">Monthly revenue · {effectiveYear}</p>
                            <div className="flex items-end gap-1.5 h-28">
                                {monthly.map((v, i) => (
                                    <div key={i} className="flex-1 flex flex-col justify-end" title={eur(v)}>
                                        <div className="rounded-t" style={{ height: `${Math.max((v / monthlyMax) * 100, v > 0 ? 4 : 0)}%`, background: '#5DCAA5' }} />
                                    </div>
                                ))}
                            </div>
                            <div className="flex gap-1.5 mt-1 text-[10px] text-text-muted">
                                {['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'].map((m, i) => (
                                    <span key={i} className="flex-1 text-center">{m}</span>
                                ))}
                            </div>
                        </div>

                        {/* Where sales come from */}
                        <div className={card}>
                            <p className="text-sm font-medium text-navy-primary mb-3">Where sales come from</p>
                            {sourceTotal === 0 ? (
                                <p className="text-text-muted text-sm">No confirmed sales or rentals yet.</p>
                            ) : (
                                <>
                                    <div className="flex h-3.5 rounded-full overflow-hidden mb-3">
                                        <div style={{ width: `${(sourceSplit.portfolio / sourceTotal) * 100}%`, background: '#1D9E75' }} />
                                        <div style={{ width: `${(sourceSplit.internal / sourceTotal) * 100}%`, background: '#5DCAA5' }} />
                                        <div style={{ width: `${(sourceSplit.external / sourceTotal) * 100}%`, background: '#9FE1CB' }} />
                                    </div>
                                    <div className="space-y-1 text-sm">
                                        <Legend color="#1D9E75" label="Our portfolio / solo" value={sourceSplit.portfolio} total={sourceTotal} />
                                        <Legend color="#5DCAA5" label="Co-broke internal" value={sourceSplit.internal} total={sourceTotal} />
                                        <Legend color="#9FE1CB" label="Co-broke external" value={sourceSplit.external} total={sourceTotal} />
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Cross-sell + partners */}
                        <div className={card}>
                            <p className="text-sm font-medium text-navy-primary mb-3">Cross-sell</p>
                            <div className="flex items-baseline gap-2 mb-4">
                                <span className="text-3xl font-bold text-navy-primary">{crossSell.rate}%</span>
                                <span className="text-sm text-text-muted">of property clients also generated a referral or policy ({crossSell.both} of {crossSell.propClients})</span>
                            </div>
                            <p className="text-sm font-medium text-navy-primary mb-2">Partners by revenue</p>
                            {partnerRows.length === 0 ? (
                                <p className="text-text-muted text-sm">No partner referrals yet.</p>
                            ) : (
                                <table className="w-full text-sm">
                                    <thead><tr className="text-text-muted text-left"><th className="font-medium py-1">Partner</th><th className="font-medium text-right">Paid us</th><th className="font-medium text-right">Won / sent</th></tr></thead>
                                    <tbody>
                                        {partnerRows.map((p) => (
                                            <tr key={p.id} className="border-t border-gray-50">
                                                <td className="py-1.5">{p.name}</td>
                                                <td className="py-1.5 text-right">{eur(p.paidUs)}</td>
                                                <td className="py-1.5 text-right text-text-muted">{p.won} / {p.total}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>

                    {/* Team */}
                    <div className={card}>
                        <p className="text-sm font-medium text-navy-primary mb-3">Team</p>
                        {teamRows.length === 0 ? (
                            <p className="text-text-muted text-sm">No deals registered yet.</p>
                        ) : (
                            <table className="w-full text-sm">
                                <thead><tr className="text-text-muted text-left"><th className="font-medium py-1">Employee</th><th className="font-medium text-right">Deals</th><th className="font-medium text-right">Received</th></tr></thead>
                                <tbody>
                                    {teamRows.map((t) => (
                                        <tr key={t.id} className="border-t border-gray-50">
                                            <td className="py-1.5">{t.name}</td>
                                            <td className="py-1.5 text-right text-text-muted">{t.count}</td>
                                            <td className="py-1.5 text-right font-medium text-navy-primary">{eur(t.received)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}

function Legend({ color, label, value, total }: { color: string; label: string; value: number; total: number }) {
    const pct = total ? Math.round((value / total) * 100) : 0;
    return (
        <div className="flex justify-between">
            <span className="flex items-center gap-2">
                <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ background: color }} />
                {label}
            </span>
            <span className="text-text-muted">{pct}%</span>
        </div>
    );
}
