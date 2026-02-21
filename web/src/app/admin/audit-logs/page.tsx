'use client';

import { useState, useEffect } from 'react';
import { getAuditLogs, AuditLogEntry } from '@/app/actions/getAuditLogs';
import { ShieldAlert, ChevronLeft, ChevronRight, Loader2, Search } from 'lucide-react';
import Link from 'next/link';

export default function AuditLogsPage() {
    const [logs, setLogs] = useState<AuditLogEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const limit = 20;

    const fetchLogs = async (pageNum: number) => {
        setLoading(true);
        setError(null);
        try {
            const { logs, total, error } = await getAuditLogs(pageNum, limit);
            if (error) {
                setError(error);
                setLogs([]);
            } else {
                setLogs(logs);
                setTotal(total);
            }
        } catch (err) {
            console.error(err);
            setError('Failed to load audit logs.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs(page);
    }, [page]);

    const handleNext = () => {
        if (page * limit < total) setPage(p => p + 1);
    };

    const handlePrev = () => {
        if (page > 1) setPage(p => p - 1);
    };

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-navy-primary font-serif flex items-center gap-2">
                        <ShieldAlert className="w-6 h-6 text-teal" />
                        Audit Logs
                    </h1>
                    <p className="text-text-secondary mt-1">
                        System-wide activity log for security and compliance
                    </p>
                </div>
                <div className="text-sm text-text-light">
                    Total Events: <span className="font-bold text-navy-primary">{total}</span>
                </div>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                {/* Filters / Search could go here */}

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-100 text-xs uppercase tracking-wider text-text-light font-bold">
                                <th className="px-6 py-4">Timestamp</th>
                                <th className="px-6 py-4">Actor</th>
                                <th className="px-6 py-4">Action</th>
                                <th className="px-6 py-4">Details</th>
                                <th className="px-6 py-4">Deal ID</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm text-navy-primary divide-y divide-gray-50">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center">
                                        <div className="flex flex-col items-center justify-center text-teal">
                                            <Loader2 className="w-8 h-8 animate-spin mb-2" />
                                            <span className="font-bold">Loading logs...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : error ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-red-500">
                                        <div className="font-bold mb-1">Error Loading Logs</div>
                                        <div className="text-xs bg-red-50 p-2 rounded inline-block border border-red-100">{error}</div>
                                    </td>
                                </tr>
                            ) : logs.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-text-light">
                                        No audit logs found.
                                    </td>
                                </tr>
                            ) : (
                                logs.map((log) => (
                                    <tr key={log.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-text-secondary">
                                            {new Date(log.created_at).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-bold">{log.actor_name}</div>
                                            <div className="text-xs text-text-light font-mono truncate max-w-[100px]" title={log.actor_id}>
                                                {log.actor_id}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="px-2 py-1 rounded bg-teal/10 text-teal text-xs font-bold border border-teal/20">
                                                {log.action}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-xs font-mono text-text-secondary max-w-xs">
                                            <div className="truncate" title={JSON.stringify(log.details, null, 2)}>
                                                {JSON.stringify(log.details)}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-xs text-text-light font-mono">
                                            {log.deal_id ? (
                                                <Link href={`/app/deals/${log.deal_id}`} className="hover:text-teal hover:underline">
                                                    {log.deal_id.slice(0, 8)}...
                                                </Link>
                                            ) : '-'}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-gray-50/30">
                    <button
                        onClick={handlePrev}
                        disabled={page === 1 || loading}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-bold text-navy-primary disabled:opacity-30 hover:bg-white hover:shadow-sm transition-all"
                    >
                        <ChevronLeft className="w-4 h-4" />
                        Previous
                    </button>
                    <span className="text-xs font-bold text-text-light">
                        Page {page} of {Math.ceil(total / limit) || 1}
                    </span>
                    <button
                        onClick={handleNext}
                        disabled={page * limit >= total || loading}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-bold text-navy-primary disabled:opacity-30 hover:bg-white hover:shadow-sm transition-all"
                    >
                        Next
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}
