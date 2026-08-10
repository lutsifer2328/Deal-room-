'use client';

import { useMemo, useState } from 'react';
import { Download, Search, Upload } from 'lucide-react';
import {
    IncomeEntry,
    IncomeLine,
    IncomeCategory,
    IncomeStatus,
    CATEGORY_LABELS,
    STATUS_LABELS,
    PROPERTY_TYPE_LABELS,
} from '@/lib/financeTypes';
import { OwnerInfo, ConfirmLineInput, EditEntryInput, EditLineInput } from '@/lib/useFinance';
import { PreparedImportRow } from '@/lib/financeImport';
import ConfirmEntryModal from './ConfirmEntryModal';
import ManagerEntryModal from './ManagerEntryModal';
import ManagerEntryDetail from './ManagerEntryDetail';
import ImportEntriesModal from './ImportEntriesModal';

interface ManagerLedgerProps {
    entries: IncomeEntry[];
    owners: Record<string, OwnerInfo>;
    onConfirm: (
        entryId: string,
        status: 'paid' | 'partially_paid',
        lines: ConfirmLineInput[],
        dealValue?: number | null
    ) => Promise<{ error: string | null }>;
    onSave: (entryId: string, entryOwnerId: string, entry: EditEntryInput, lines: EditLineInput[], removedLineIds: string[]) => Promise<{ error: string | null }>;
    onDelete: (entryId: string) => Promise<{ error: string | null }>;
    onImport: (rows: PreparedImportRow[]) => Promise<{ imported: number; error: string | null }>;
}

interface Row {
    entry: IncomeEntry;
    line: IncomeLine;
    firstOfEntry: boolean;
}

const eur = (n: number) => new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);
const eur2 = (n: number) => new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR' }).format(n);

const statusChip = (s: IncomeStatus) => {
    switch (s) {
        case 'paid': return 'bg-green-100 text-green-700';
        case 'partially_paid': return 'bg-green-50 text-green-600';
        case 'won': return 'bg-amber-100 text-amber-700';
        case 'lost':
        case 'cancelled': return 'bg-gray-100 text-gray-500';
        default: return 'bg-blue-50 text-blue-600';
    }
};

export default function ManagerLedger({ entries, owners, onConfirm, onSave, onDelete, onImport }: ManagerLedgerProps) {
    const [category, setCategory] = useState<'all' | IncomeCategory>('all');
    const [employee, setEmployee] = useState<'all' | string>('all');
    const [status, setStatus] = useState<'all' | IncomeStatus>('all');
    const [year, setYear] = useState<'all' | string>('all');
    const [month, setMonth] = useState<'all' | string>('all');
    const [search, setSearch] = useState('');
    const [confirming, setConfirming] = useState<IncomeEntry | null>(null);
    const [editing, setEditing] = useState<IncomeEntry | null>(null);
    const [viewing, setViewing] = useState<IncomeEntry | null>(null);
    const [importing, setImporting] = useState(false);

    // Flatten to one row per line, tagging the first line of each entry (for the action button).
    const allRows: Row[] = useMemo(() => {
        const out: Row[] = [];
        for (const e of entries) {
            const lines = e.lines.length ? e.lines : [];
            lines.forEach((line, i) => out.push({ entry: e, line, firstOfEntry: i === 0 }));
        }
        return out;
    }, [entries]);

    const years = useMemo(() => {
        const set = new Set<string>();
        entries.forEach((e) => { if (e.dealDate) set.add(e.dealDate.slice(0, 4)); });
        return Array.from(set).sort().reverse();
    }, [entries]);

    const employeeIds = useMemo(() => {
        const set = new Set<string>();
        allRows.forEach((r) => set.add(r.line.ownerId));
        return Array.from(set);
    }, [allRows]);

    const q = search.trim().toLowerCase();
    const rows = useMemo(() => allRows.filter((r) => {
        if (category !== 'all' && r.entry.category !== category) return false;
        if (employee !== 'all' && r.line.ownerId !== employee) return false;
        if (status !== 'all' && r.entry.status !== status) return false;
        if (r.entry.dealDate) {
            if (year !== 'all' && r.entry.dealDate.slice(0, 4) !== year) return false;
            if (month !== 'all' && r.entry.dealDate.slice(5, 7) !== month) return false;
        } else if (year !== 'all' || month !== 'all') {
            return false;
        }
        if (q) {
            const hay = [
                r.entry.clientName, r.line.clientName, r.entry.policyNumber,
                r.entry.insuredIdent, r.entry.propertyRef, r.entry.propertyAddress,
            ].filter(Boolean).join(' ').toLowerCase();
            if (!hay.includes(q)) return false;
        }
        return true;
    }), [allRows, category, employee, status, year, month, q]);

    const totals = useMemo(() => {
        let cash = 0, bank = 0, received = 0, pipeline = 0;
        const seenEntries = new Set<string>();
        for (const r of rows) {
            cash += r.line.amountCash ?? 0;
            bank += r.line.amountBank ?? 0;
            if (r.entry.status === 'paid' || r.entry.status === 'partially_paid') {
                received += (r.line.amountCash ?? 0) + (r.line.amountBank ?? 0);
            }
            if (r.firstOfEntry && (r.entry.status === 'won') && !seenEntries.has(r.entry.id)) {
                pipeline += r.entry.expectedAmount ?? 0;
                seenEntries.add(r.entry.id);
            }
        }
        return { cash, bank, received, pipeline };
    }, [rows]);

    const exportCsv = () => {
        const header = ['Date', 'Segment', 'Type', 'Employee', 'Client', 'Side', 'Policy no', 'ЕГН/ЕИК', 'Deal value', 'Cash', 'Bank', 'Broker cut', 'Agency cut', 'Status'];
        const lines = rows.map((r) => [
            r.entry.dealDate ?? '',
            CATEGORY_LABELS[r.entry.category],
            r.entry.category === 'insurance' ? (r.entry.policyType ?? '') : (r.entry.propertyType ? PROPERTY_TYPE_LABELS[r.entry.propertyType] : ''),
            owners[r.line.ownerId]?.name ?? '',
            r.line.clientName ?? r.entry.clientName ?? '',
            r.line.side === 'n/a' ? '' : r.line.side,
            r.entry.policyNumber ?? '',
            r.entry.insuredIdent ?? '',
            r.entry.dealValue ?? '',
            r.line.amountCash ?? '',
            r.line.amountBank ?? '',
            r.line.brokerCut ?? '',
            r.line.agencyCut ?? '',
            STATUS_LABELS[r.entry.status],
        ]);
        const csv = [header, ...lines]
            .map((row) => row.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))
            .join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `agenzia-finance-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const selectCls = 'px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal';

    return (
        <div>
            {/* Stat cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
                <div className="bg-white border border-gray-100 rounded-xl p-4">
                    <div className="text-xs text-text-muted mb-1">Received (paid)</div>
                    <div className="text-2xl font-bold text-navy-primary">{eur(totals.received)}</div>
                </div>
                <div className="bg-white border border-gray-100 rounded-xl p-4">
                    <div className="text-xs text-text-muted mb-1">Pipeline (expected)</div>
                    <div className="text-2xl font-bold text-navy-primary">{eur(totals.pipeline)}</div>
                </div>
                <div className="bg-white border border-gray-100 rounded-xl p-4">
                    <div className="text-xs text-text-muted mb-1">Cash</div>
                    <div className="text-2xl font-bold text-navy-primary">{eur(totals.cash)}</div>
                </div>
                <div className="bg-white border border-gray-100 rounded-xl p-4">
                    <div className="text-xs text-text-muted mb-1">Bank</div>
                    <div className="text-2xl font-bold text-navy-primary">{eur(totals.bank)}</div>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-2 mb-4 items-center">
                <div className="relative">
                    <Search className="w-4 h-4 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                        type="search"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Client, policy no, ЕГН/ЕИК…"
                        className="pl-8 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal w-56"
                    />
                </div>
                <select className={selectCls} value={category} onChange={(e) => setCategory(e.target.value as typeof category)} title="Segment">
                    <option value="all">All segments</option>
                    {(Object.keys(CATEGORY_LABELS) as IncomeCategory[]).map((c) => (
                        <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
                    ))}
                </select>
                <select className={selectCls} value={employee} onChange={(e) => setEmployee(e.target.value)} title="Employee">
                    <option value="all">All employees</option>
                    {employeeIds.map((id) => (
                        <option key={id} value={id}>{owners[id]?.name ?? id.slice(0, 8)}</option>
                    ))}
                </select>
                <select className={selectCls} value={status} onChange={(e) => setStatus(e.target.value as typeof status)} title="Status">
                    <option value="all">All statuses</option>
                    {(Object.keys(STATUS_LABELS) as IncomeStatus[]).map((s) => (
                        <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                    ))}
                </select>
                <select className={selectCls} value={year} onChange={(e) => setYear(e.target.value)} title="Year">
                    <option value="all">All years</option>
                    {years.map((y) => <option key={y} value={y}>{y}</option>)}
                </select>
                <select className={selectCls} value={month} onChange={(e) => setMonth(e.target.value)} title="Month">
                    <option value="all">All months</option>
                    {['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'].map((m) => (
                        <option key={m} value={m}>{new Date(2000, Number(m) - 1, 1).toLocaleString('en', { month: 'short' })}</option>
                    ))}
                </select>
                <div className="ml-auto flex items-center gap-2">
                    <button onClick={() => setImporting(true)} className="inline-flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
                        <Upload className="w-4 h-4" /> Import
                    </button>
                    <button onClick={exportCsv} className="inline-flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
                        <Download className="w-4 h-4" /> Export
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white border border-gray-100 rounded-xl overflow-x-auto">
                <table className="w-full text-sm min-w-[720px]">
                    <thead>
                        <tr className="text-left text-text-muted border-b border-gray-100">
                            <th className="px-4 py-3 font-medium">Date</th>
                            <th className="px-4 py-3 font-medium">Segment</th>
                            <th className="px-4 py-3 font-medium">Employee</th>
                            <th className="px-4 py-3 font-medium">Client / side</th>
                            <th className="px-4 py-3 font-medium text-right">Cash</th>
                            <th className="px-4 py-3 font-medium text-right">Bank</th>
                            <th className="px-4 py-3 font-medium">Status</th>
                            <th className="px-4 py-3"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.length === 0 ? (
                            <tr><td colSpan={8} className="px-4 py-10 text-center text-text-muted">No matching rows.</td></tr>
                        ) : rows.map((r) => {
                            const canConfirm = r.firstOfEntry && (r.entry.status === 'won' || r.entry.status === 'partially_paid');
                            return (
                                <tr key={r.line.id} className="border-b border-gray-50">
                                    <td className="px-4 py-3 text-text-muted whitespace-nowrap">{r.entry.dealDate ? new Date(r.entry.dealDate).toLocaleDateString() : '—'}</td>
                                    <td className="px-4 py-3">
                                        {CATEGORY_LABELS[r.entry.category]}
                                        {r.entry.propertyType && <span className="block text-xs text-text-muted">{PROPERTY_TYPE_LABELS[r.entry.propertyType]}</span>}
                                    </td>
                                    <td className="px-4 py-3">{owners[r.line.ownerId]?.name ?? '—'}</td>
                                    <td className="px-4 py-3">
                                        {(r.line.clientName ?? r.entry.clientName ?? '—')}
                                        {r.line.side !== 'n/a' && <span className="text-text-muted"> · {r.line.side}</span>}
                                    </td>
                                    <td className="px-4 py-3 text-right">{r.line.amountCash != null ? eur2(r.line.amountCash) : <span className="text-gray-300">—</span>}</td>
                                    <td className="px-4 py-3 text-right">{r.line.amountBank != null ? eur2(r.line.amountBank) : <span className="text-gray-300">—</span>}</td>
                                    <td className="px-4 py-3"><span className={`text-xs font-medium px-2.5 py-1 rounded-full whitespace-nowrap ${statusChip(r.entry.status)}`}>{STATUS_LABELS[r.entry.status]}</span></td>
                                    <td className="px-4 py-3 text-right whitespace-nowrap">
                                        {r.firstOfEntry && (
                                            <span className="inline-flex items-center gap-3">
                                                {canConfirm && (
                                                    <button onClick={() => setConfirming(r.entry)} className="text-teal font-medium hover:underline">
                                                        {r.entry.status === 'partially_paid' ? 'Update' : 'Confirm'}
                                                    </button>
                                                )}
                                                <button onClick={() => setViewing(r.entry)} className="text-text-muted hover:text-navy-primary hover:underline">Open</button>
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                    <tfoot>
                        <tr className="border-t border-gray-200 font-semibold text-navy-primary">
                            <td className="px-4 py-3" colSpan={4}>Totals (filtered)</td>
                            <td className="px-4 py-3 text-right">{eur2(totals.cash)}</td>
                            <td className="px-4 py-3 text-right">{eur2(totals.bank)}</td>
                            <td className="px-4 py-3" colSpan={2}></td>
                        </tr>
                    </tfoot>
                </table>
            </div>

            {confirming && (
                <ConfirmEntryModal
                    entry={confirming}
                    owners={owners}
                    onClose={() => setConfirming(null)}
                    onConfirm={onConfirm}
                />
            )}

            {viewing && (
                <ManagerEntryDetail
                    entry={viewing}
                    owners={owners}
                    onClose={() => setViewing(null)}
                    onEdit={(e) => { setViewing(null); setEditing(e); }}
                />
            )}

            {editing && (
                <ManagerEntryModal
                    entry={editing}
                    owners={owners}
                    onClose={() => setEditing(null)}
                    onSave={onSave}
                    onDelete={onDelete}
                />
            )}

            {importing && (
                <ImportEntriesModal
                    owners={owners}
                    onClose={() => setImporting(false)}
                    onImport={onImport}
                />
            )}
        </div>
    );
}
