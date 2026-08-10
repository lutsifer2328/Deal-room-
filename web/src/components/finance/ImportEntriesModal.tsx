'use client';

import { useMemo, useRef, useState } from 'react';
import { X, Download, UploadCloud, CheckCircle2, AlertTriangle } from 'lucide-react';
import { CATEGORY_LABELS, STATUS_LABELS } from '@/lib/financeTypes';
import { OwnerInfo } from '@/lib/useFinance';
import {
    ParsedRow,
    OwnerRef,
    parseImportCsv,
    templateCsv,
    PreparedImportRow,
} from '@/lib/financeImport';

interface ImportEntriesModalProps {
    owners: Record<string, OwnerInfo>;
    onClose: () => void;
    onImport: (rows: PreparedImportRow[]) => Promise<{ imported: number; error: string | null }>;
}

const eur = (n: number) => new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR' }).format(n);

export default function ImportEntriesModal({ owners, onClose, onImport }: ImportEntriesModalProps) {
    const fileRef = useRef<HTMLInputElement>(null);
    const [fileName, setFileName] = useState<string | null>(null);
    const [parsed, setParsed] = useState<ParsedRow[] | null>(null);
    const [unmatched, setUnmatched] = useState<string[]>([]);
    const [missing, setMissing] = useState<string[]>([]);
    const [parseError, setParseError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [result, setResult] = useState<string | null>(null);

    const ownerRefs: OwnerRef[] = useMemo(
        () => Object.entries(owners).map(([id, o]) => ({ id, name: o.name })),
        [owners]
    );

    const valid = useMemo(() => (parsed ?? []).filter((r) => r.errors.length === 0), [parsed]);
    const invalid = useMemo(() => (parsed ?? []).filter((r) => r.errors.length > 0), [parsed]);

    const onFile = async (file: File) => {
        setParseError(null);
        setResult(null);
        setFileName(file.name);
        try {
            const text = await file.text();
            const res = parseImportCsv(text, ownerRefs);
            setParsed(res.rows);
            setUnmatched(res.unmatchedHeaders);
            setMissing(res.missingCritical);
            if (res.rows.length === 0) {
                setParseError('No data rows found. Check the file has a header row and at least one entry.');
            }
        } catch {
            setParsed(null);
            setParseError('Could not read the file. Make sure it is a .csv exported from your spreadsheet.');
        }
    };

    const downloadTemplate = () => {
        const blob = new Blob([templateCsv()], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'agenzia-finance-import-template.csv';
        a.click();
        URL.revokeObjectURL(url);
    };

    const runImport = async () => {
        if (valid.length === 0) return;
        setSubmitting(true);
        setParseError(null);
        const payload: PreparedImportRow[] = valid.map((r) => ({
            ownerId: r.ownerId,
            category: r.category,
            status: r.status,
            clientName: r.clientName,
            dealDate: r.dealDate,
            propertyAddress: r.propertyAddress,
            propertyRef: r.propertyRef,
            notes: r.notes,
            commission: r.commission,
            brokerPct: r.brokerPct,
            cash: r.cash,
            bank: r.bank,
            policyNumber: r.policyNumber,
            policyType: r.policyType,
            insuredIdent: r.insuredIdent,
            validFrom: r.validFrom,
            validTo: r.validTo,
            policyGross: r.policyGross,
            policyNet: r.policyNet,
        }));
        const { imported, error } = await onImport(payload);
        setSubmitting(false);
        if (error) { setParseError(error); return; }
        setResult(`Imported ${imported} ${imported === 1 ? 'deal' : 'deals'} into the ledger.`);
        setParsed(null);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-xl max-w-3xl w-full flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
                <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
                    <div>
                        <p className="text-xs text-gray-400">Finance</p>
                        <h3 className="text-lg font-semibold text-gray-900">Import from spreadsheet</h3>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-700" aria-label="Close"><X className="w-5 h-5" /></button>
                </div>

                <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                    {/* Instructions */}
                    <div className="text-sm text-text-muted bg-gray-50 border border-gray-100 rounded-xl p-4 space-y-2">
                        <p>
                            In Excel, save your sheet as <strong>CSV</strong> (File → Save As → CSV), then upload it here.
                            We match common column names automatically, in English or Bulgarian
                            (<em>date/дата, client/клиент, employee/брокер, commission/комисиона…</em>).
                        </p>
                        <p>
                            Each row becomes one ledger entry. <strong>Employee names must match a Deal Room user.</strong>
                            Rows marked <em>paid</em> land confirmed &amp; locked with the commission split; blank amounts come in as pending.
                            Nothing is saved until you press Import.
                        </p>
                        <button onClick={downloadTemplate} className="inline-flex items-center gap-2 text-teal font-medium hover:underline">
                            <Download className="w-4 h-4" /> Download template (.csv)
                        </button>
                    </div>

                    {/* File picker */}
                    <div>
                        <input
                            ref={fileRef}
                            type="file"
                            accept=".csv,text/csv"
                            className="hidden"
                            onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); }}
                        />
                        <button
                            onClick={() => fileRef.current?.click()}
                            className="w-full border-2 border-dashed border-gray-300 rounded-xl py-6 flex flex-col items-center gap-2 text-text-muted hover:border-teal hover:text-navy-primary transition-colors"
                        >
                            <UploadCloud className="w-7 h-7" />
                            <span className="text-sm font-medium">{fileName ? `Change file — ${fileName}` : 'Choose a CSV file'}</span>
                        </button>
                    </div>

                    {parseError && (
                        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-2">{parseError}</p>
                    )}

                    {result && (
                        <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4" /> {result}
                        </p>
                    )}

                    {missing.length > 0 && (
                        <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2">
                            Missing required column(s): <strong>{missing.join(', ')}</strong>. Add them (or rename yours to match) and re-upload.
                        </p>
                    )}
                    {unmatched.length > 0 && (
                        <p className="text-xs text-text-muted">
                            Ignored unrecognised columns: {unmatched.join(', ')}.
                        </p>
                    )}

                    {/* Preview */}
                    {parsed && parsed.length > 0 && (
                        <>
                            <div className="flex items-center gap-4 text-sm">
                                <span className="inline-flex items-center gap-1.5 text-green-700"><CheckCircle2 className="w-4 h-4" /> {valid.length} ready</span>
                                {invalid.length > 0 && (
                                    <span className="inline-flex items-center gap-1.5 text-amber-700"><AlertTriangle className="w-4 h-4" /> {invalid.length} with problems (skipped)</span>
                                )}
                            </div>

                            <div className="border border-gray-100 rounded-xl overflow-x-auto max-h-72 overflow-y-auto">
                                <table className="w-full text-sm min-w-[640px]">
                                    <thead className="sticky top-0 bg-white">
                                        <tr className="text-left text-text-muted border-b border-gray-100">
                                            <th className="px-3 py-2 font-medium">#</th>
                                            <th className="px-3 py-2 font-medium">Date</th>
                                            <th className="px-3 py-2 font-medium">Segment</th>
                                            <th className="px-3 py-2 font-medium">Employee</th>
                                            <th className="px-3 py-2 font-medium">Client</th>
                                            <th className="px-3 py-2 font-medium text-right">Commission</th>
                                            <th className="px-3 py-2 font-medium">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {parsed.map((r) => {
                                            const ok = r.errors.length === 0;
                                            return (
                                                <tr key={r.rowNum} className={`border-b border-gray-50 ${ok ? '' : 'bg-amber-50/50'}`}>
                                                    <td className="px-3 py-2 text-text-muted">{r.rowNum}</td>
                                                    <td className="px-3 py-2 whitespace-nowrap">{r.dealDate ?? '—'}</td>
                                                    <td className="px-3 py-2">{r.categoryRaw ? (CATEGORY_LABELS[r.category] ?? r.categoryRaw) : '—'}</td>
                                                    <td className="px-3 py-2">{r.ownerId ? owners[r.ownerId]?.name : <span className="text-amber-700">{r.employeeRaw || '—'}</span>}</td>
                                                    <td className="px-3 py-2">{r.clientName || '—'}</td>
                                                    <td className="px-3 py-2 text-right">{r.commission != null ? eur(r.commission) : '—'}</td>
                                                    <td className="px-3 py-2">
                                                        {ok ? (
                                                            <span className="text-xs text-text-muted">{STATUS_LABELS[r.status]}</span>
                                                        ) : (
                                                            <span className="text-xs text-amber-700" title={r.errors.join('; ')}>{r.errors[0]}</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}
                </div>

                <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end gap-3 flex-shrink-0">
                    <button onClick={onClose} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">Close</button>
                    <button
                        onClick={runImport}
                        disabled={submitting || valid.length === 0}
                        className="px-5 py-2 bg-navy-primary text-white font-semibold rounded-lg hover:bg-navy-secondary disabled:opacity-50"
                    >
                        {submitting ? 'Importing…' : `Import ${valid.length || ''} ${valid.length === 1 ? 'deal' : 'deals'}`.trim()}
                    </button>
                </div>
            </div>
        </div>
    );
}
