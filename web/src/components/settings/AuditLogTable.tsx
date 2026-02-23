'use client';

import { useState, useEffect, useCallback } from 'react';
import { getAuditLogs, AuditLogEntry } from '@/app/actions/getAuditLogs';
import { History, Search, Filter, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import { useTranslation } from '@/lib/useTranslation';
import { TranslationKey } from '@/lib/translations';

const ACTION_LABELS: Record<string, { label: string; color: string }> = {
    'CREATED_DEAL': { label: 'Created Deal', color: 'bg-emerald-100 text-emerald-800' },
    'ADDED_TASK': { label: 'Added Task', color: 'bg-blue-100 text-blue-800' },
    'VERIFIED_DOC': { label: 'Verified Document', color: 'bg-emerald-100 text-emerald-800' },
    'RELEASED_DOC': { label: 'Released Document', color: 'bg-teal-100 text-teal-800' },
    'REJECTED_DOC': { label: 'Rejected Document', color: 'bg-red-100 text-red-800' },
    'UPLOADED_DOC': { label: 'Uploaded Document', color: 'bg-indigo-100 text-indigo-800' },
    'DELETED_DOC': { label: 'Deleted Document', color: 'bg-red-100 text-red-800' },
    'INVITED_USER': { label: 'Invited User', color: 'bg-purple-100 text-purple-800' },
    'ROLE_CHANGE': { label: 'Role Changed', color: 'bg-amber-100 text-amber-800' },
};

const FILTER_OPTIONS = [
    { value: '', labelKey: 'audit.filter.all' },
    { value: 'CREATED_DEAL', labelKey: 'audit.filter.deals' },
    { value: 'ADDED_TASK', labelKey: 'audit.filter.documents' },
    { value: 'VERIFIED_DOC', labelKey: 'audit.filter.documents' },
    { value: 'RELEASED_DOC', labelKey: 'audit.filter.documents' },
    { value: 'REJECTED_DOC', labelKey: 'audit.filter.documents' },
    { value: 'UPLOADED_DOC', labelKey: 'audit.filter.documents' },
    { value: 'DELETED_DOC', labelKey: 'audit.filter.documents' },
    { value: 'INVITED_USER', labelKey: 'audit.filter.users' },
    { value: 'ROLE_CHANGE', labelKey: 'audit.filter.users' },
];


const PAGE_SIZE = 20;

export default function AuditLogTable() {
    const { t } = useTranslation();
    const [logs, setLogs] = useState<AuditLogEntry[]>([]);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [actionFilter, setActionFilter] = useState('');

    const fetchLogs = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            // Fetch a larger batch for client-side filtering
            const result = await getAuditLogs(1, 500);
            if (result.error) {
                setError(result.error);
                return;
            }
            setLogs(result.logs);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Failed to load audit logs');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchLogs();
    }, [fetchLogs]);

    // Client-side filtering
    const filteredLogs = logs.filter(log => {
        const matchesAction = !actionFilter || log.action === actionFilter;
        const query = searchQuery.toLowerCase();
        const matchesSearch = !query ||
            log.actor_name?.toLowerCase().includes(query) ||
            JSON.stringify(log.details).toLowerCase().includes(query) ||
            log.action?.toLowerCase().includes(query);
        return matchesAction && matchesSearch;
    });

    // Pagination
    const totalPages = Math.max(1, Math.ceil(filteredLogs.length / PAGE_SIZE));
    const paginatedLogs = filteredLogs.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    // Reset to page 1 when filters change
    useEffect(() => {
        setPage(1);
    }, [searchQuery, actionFilter]);

    const getActionBadge = (action: string) => {
        const info = ACTION_LABELS[action] || { label: action, color: 'bg-gray-100 text-gray-700' };
        const labelKey = `audit.action.${action}` as TranslationKey;
        const translated = t(labelKey);

        return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${info.color}`}>
                {translated !== labelKey ? translated : info.label}
            </span>
        );
    };

    const formatTimestamp = (ts: string) => {
        try {
            const date = new Date(ts);
            return date.toLocaleString('en-GB', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            });
        } catch {
            return ts;
        }
    };

    return (
        <div className="space-y-4">
            {/* Header + Controls */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <h2 className="text-lg font-bold text-navy-primary flex items-center gap-2">
                    <History className="w-5 h-5 text-teal" />
                    {t('nav.auditLog')}
                    <span className="text-sm font-normal text-text-light ml-2">
                        ({filteredLogs.length} {filteredLogs.length === 1 ? 'entry' : 'entries'})
                    </span>
                </h2>
                <button
                    onClick={fetchLogs}
                    disabled={loading}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-bold text-navy-primary bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                </button>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder={t('participants.searchPlaceholder')}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal"
                    />
                </div>
                <div className="relative">
                    <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <select
                        title="Filter Actions"
                        value={actionFilter}
                        onChange={(e) => setActionFilter(e.target.value)}
                        className="pl-9 pr-8 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal appearance-none bg-white cursor-pointer"
                    >
                        {FILTER_OPTIONS.map(opt => (
                            <option key={opt.value} value={opt.value}>{t(opt.labelKey as TranslationKey)}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Error State */}
            {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                    {error}
                </div>
            )}

            {/* Table */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-200">
                                <th className="text-left px-4 py-3 font-bold text-navy-primary">{t('audit.header.timestamp' as TranslationKey)}</th>
                                <th className="text-left px-4 py-3 font-bold text-navy-primary">{t('audit.header.actor' as TranslationKey)}</th>
                                <th className="text-left px-4 py-3 font-bold text-navy-primary">{t('audit.header.action' as TranslationKey)}</th>
                                <th className="text-left px-4 py-3 font-bold text-navy-primary">{t('audit.header.details' as TranslationKey)}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={4} className="px-4 py-12 text-center text-gray-400">
                                        <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2" />
                                        Loading audit logs...
                                    </td>
                                </tr>
                            ) : paginatedLogs.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-4 py-12 text-center text-gray-400 italic">
                                        {searchQuery || actionFilter
                                            ? 'No logs match your filters.'
                                            : 'No audit log entries found.'}
                                    </td>
                                </tr>
                            ) : (
                                paginatedLogs.map((log) => (
                                    <tr key={log.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-4 py-3 text-gray-500 whitespace-nowrap text-xs">
                                            {formatTimestamp(log.timestamp)}
                                        </td>
                                        <td className="px-4 py-3 font-bold text-navy-primary whitespace-nowrap">
                                            {log.actor_name || 'System'}
                                        </td>
                                        <td className="px-4 py-3">
                                            {getActionBadge(log.action)}
                                        </td>
                                        <td className="px-4 py-3 text-gray-600 max-w-xs truncate" title={typeof log.details === 'string' ? log.details : JSON.stringify(log.details)}>
                                            {typeof log.details === 'string'
                                                ? log.details
                                                : JSON.stringify(log.details)}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50">
                        <span className="text-xs text-gray-500">
                            Showing {((page - 1) * PAGE_SIZE) + 1}–{Math.min(page * PAGE_SIZE, filteredLogs.length)} of {filteredLogs.length}
                        </span>
                        <div className="flex items-center gap-2">
                            <button
                                title="Previous Page"
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page <= 1}
                                className="p-1.5 rounded-lg border border-gray-200 hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <span className="text-xs font-bold text-navy-primary px-2">
                                Page {page} of {totalPages}
                            </span>
                            <button
                                title="Next Page"
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page >= totalPages}
                                className="p-1.5 rounded-lg border border-gray-200 hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
