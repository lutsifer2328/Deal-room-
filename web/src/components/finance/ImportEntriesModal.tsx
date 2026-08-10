'use client';

import { useMemo, useRef, useState } from 'react';
import { X, Download, UploadCloud, CheckCircle2, AlertTriangle } from 'lucide-react';
import { OwnerInfo } from '@/lib/useFinance';
import { useTranslation } from '@/lib/useTranslation';
import { catKey, statusKey } from '@/lib/financeLabels';
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
    const { t } = useTranslation();
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
                setParseError(t('fin.import.noData'));
            }
        } catch {
            setParsed(null);
            setParseError(t('fin.import.readError'));
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
            agencyPct: r.agencyPct,
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
        setResult(t('fin.import.importedResult', { n: imported, noun: imported === 1 ? t('fin.deal') : t('fin.deals') }));
        setParsed(null);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-xl max-w-3xl w-full flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
                <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
                    <div>
                        <p className="text-xs text-gray-400">{t('fin.page.title')}</p>
                        <h3 className="text-lg font-semibold text-gray-900">{t('fin.import.title')}</h3>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-700" aria-label="Close"><X className="w-5 h-5" /></button>
                </div>

                <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                    {/* Instructions */}
                    <div className="text-sm text-text-muted bg-gray-50 border border-gray-100 rounded-xl p-4 space-y-2">
                        <p>{t('fin.import.instr1')}</p>
                        <p>{t('fin.import.instr2')}</p>
                        <button onClick={downloadTemplate} className="inline-flex items-center gap-2 text-teal font-medium hover:underline">
                            <Download className="w-4 h-4" /> {t('fin.import.downloadTemplate')}
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
                            <span className="text-sm font-medium">{fileName ? t('fin.import.changeFile', { name: fileName }) : t('fin.import.chooseFile')}</span>
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
                            {t('fin.import.missingCols', { cols: missing.join(', ') })}
                        </p>
                    )}
                    {unmatched.length > 0 && (
                        <p className="text-xs text-text-muted">
                            {t('fin.import.ignoredCols', { cols: unmatched.join(', ') })}
                        </p>
                    )}

                    {/* Preview */}
                    {parsed && parsed.length > 0 && (
                        <>
                            <div className="flex items-center gap-4 text-sm">
                                <span className="inline-flex items-center gap-1.5 text-green-700"><CheckCircle2 className="w-4 h-4" /> {t('fin.import.ready', { n: valid.length })}</span>
                                {invalid.length > 0 && (
                                    <span className="inline-flex items-center gap-1.5 text-amber-700"><AlertTriangle className="w-4 h-4" /> {t('fin.import.problems', { n: invalid.length })}</span>
                                )}
                            </div>

                            <div className="border border-gray-100 rounded-xl overflow-x-auto max-h-72 overflow-y-auto">
                                <table className="w-full text-sm min-w-[640px]">
                                    <thead className="sticky top-0 bg-white">
                                        <tr className="text-left text-text-muted border-b border-gray-100">
                                            <th className="px-3 py-2 font-medium">#</th>
                                            <th className="px-3 py-2 font-medium">{t('fin.ledger.thDate')}</th>
                                            <th className="px-3 py-2 font-medium">{t('fin.ledger.thSegment')}</th>
                                            <th className="px-3 py-2 font-medium">{t('fin.ov.thEmployee')}</th>
                                            <th className="px-3 py-2 font-medium">{t('fin.import.thClient')}</th>
                                            <th className="px-3 py-2 font-medium text-right">{t('fin.commission')}</th>
                                            <th className="px-3 py-2 font-medium">{t('fin.edit.status')}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {parsed.map((r) => {
                                            const ok = r.errors.length === 0;
                                            return (
                                                <tr key={r.rowNum} className={`border-b border-gray-50 ${ok ? '' : 'bg-amber-50/50'}`}>
                                                    <td className="px-3 py-2 text-text-muted">{r.rowNum}</td>
                                                    <td className="px-3 py-2 whitespace-nowrap">{r.dealDate ?? '—'}</td>
                                                    <td className="px-3 py-2">{r.categoryRaw ? t(catKey(r.category)) : '—'}</td>
                                                    <td className="px-3 py-2">{r.ownerId ? owners[r.ownerId]?.name : <span className="text-amber-700">{r.employeeRaw || '—'}</span>}</td>
                                                    <td className="px-3 py-2">{r.clientName || '—'}</td>
                                                    <td className="px-3 py-2 text-right">{r.commission != null ? eur(r.commission) : '—'}</td>
                                                    <td className="px-3 py-2">
                                                        {ok ? (
                                                            <span className="text-xs text-text-muted">{t(statusKey(r.status))}</span>
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
                    <button onClick={onClose} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">{t('fin.import.close')}</button>
                    <button
                        onClick={runImport}
                        disabled={submitting || valid.length === 0}
                        className="px-5 py-2 bg-navy-primary text-white font-semibold rounded-lg hover:bg-navy-secondary disabled:opacity-50"
                    >
                        {submitting ? t('fin.import.importing') : t('fin.import.importBtn', { n: valid.length, noun: valid.length === 1 ? t('fin.deal') : t('fin.deals') })}
                    </button>
                </div>
            </div>
        </div>
    );
}
