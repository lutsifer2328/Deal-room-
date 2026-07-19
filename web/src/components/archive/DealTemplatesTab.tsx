'use client';

import { useState } from 'react';
import { useData } from '@/lib/store';
import { useAuth } from '@/lib/authContext';
import { DealTemplate } from '@/lib/types';
import { Pencil, Trash2, Plus, Copy, EyeOff, Eye } from 'lucide-react';
import DealTemplateModal from './DealTemplateModal';

/**
 * Lawyer-managed deal checklists. Admin + lawyer can create/edit/remove
 * (mirrors is_template_manager() in the DB); other staff can view them.
 */
export default function DealTemplatesTab() {
    const { dealTemplates, standardDocuments, createDealTemplate, updateDealTemplate, deleteDealTemplate } = useData();
    const { user } = useAuth();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editing, setEditing] = useState<DealTemplate | null>(null);
    const [busyId, setBusyId] = useState<string | null>(null);

    if (!user) return null;

    const canManage = user.role === 'admin' || user.role === 'lawyer';
    const sorted = [...dealTemplates].sort((a, b) => a.nameEn.localeCompare(b.nameEn));

    const docName = (id: string) => standardDocuments.find(d => d.id === id)?.name || 'Unknown document';

    const handleAddNew = () => { setEditing(null); setIsModalOpen(true); };
    const handleEdit = (tpl: DealTemplate) => { setEditing(tpl); setIsModalOpen(true); };

    const handleDuplicate = async (tpl: DealTemplate) => {
        setBusyId(tpl.id);
        await createDealTemplate({
            nameEn: `${tpl.nameEn} (copy)`,
            nameBg: tpl.nameBg ? `${tpl.nameBg} (копие)` : undefined,
            description: tpl.description,
            items: tpl.items
        }, user.id);
        setBusyId(null);
    };

    const handleToggleActive = async (tpl: DealTemplate) => {
        setBusyId(tpl.id);
        await updateDealTemplate(tpl.id, { isActive: !tpl.isActive });
        setBusyId(null);
    };

    const handleDelete = async (tpl: DealTemplate) => {
        if (!confirm(`Delete the checklist "${tpl.nameEn}"?\n\nDeals already created from it are not affected.`)) return;
        setBusyId(tpl.id);
        await deleteDealTemplate(tpl.id);
        setBusyId(null);
    };

    return (
        <div>
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-8">
                <div>
                    <h2 className="text-2xl font-bold text-navy-primary font-serif mb-2 flex items-center gap-2">
                        🗂️ Checklists
                    </h2>
                    <p className="text-text-secondary mb-4">Reusable document checklists for new deals</p>
                    <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 text-sm text-blue-800 flex items-start gap-3">
                        <div className="text-lg mt-0.5">💡</div>
                        <div>
                            <strong>Tip:</strong> Pick a checklist when creating a deal and its document tasks are
                            created automatically. Items follow your Standard Documents, so renaming a document
                            updates every checklist that uses it.
                        </div>
                    </div>
                </div>
                {canManage && (
                    <button
                        onClick={handleAddNew}
                        className="flex items-center gap-2 px-5 py-2.5 bg-teal text-white font-bold rounded-xl hover:bg-teal/90 shadow-lg shadow-teal/20 transition-all hover:scale-105 whitespace-nowrap"
                        title="New checklist"
                    >
                        <Plus className="w-5 h-5" />
                        New checklist
                    </button>
                )}
            </div>

            {sorted.length === 0 ? (
                <div className="text-center py-16 bg-gray-50/50 rounded-2xl border-2 border-dashed border-gray-200">
                    <p className="text-text-light font-medium mb-2">No checklists yet</p>
                    <p className="text-sm text-gray-400 mb-4">
                        {canManage
                            ? 'Create one to stop adding the same documents to every deal by hand.'
                            : 'An admin or lawyer can create checklists here.'}
                    </p>
                    {canManage && (
                        <button
                            onClick={handleAddNew}
                            className="text-teal font-bold hover:underline hover:text-teal/80 transition-colors"
                        >
                            Create your first checklist
                        </button>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {sorted.map(tpl => (
                        <div
                            key={tpl.id}
                            className={`bg-white rounded-2xl border shadow-sm p-5 transition-opacity ${tpl.isActive ? 'border-gray-100' : 'border-gray-200 opacity-60'
                                } ${busyId === tpl.id ? 'opacity-50 pointer-events-none' : ''}`}
                        >
                            <div className="flex items-start justify-between gap-3 mb-2">
                                <div className="min-w-0">
                                    <h3 className="font-bold text-navy-primary truncate">
                                        {tpl.nameEn}
                                        {tpl.nameBg && <span className="text-text-light font-normal"> · {tpl.nameBg}</span>}
                                    </h3>
                                    {tpl.description && (
                                        <p className="text-xs text-text-light mt-0.5">{tpl.description}</p>
                                    )}
                                </div>
                                <div className="flex items-center gap-1 flex-shrink-0">
                                    {!tpl.isActive && (
                                        <span className="text-[10px] font-bold uppercase bg-gray-100 text-gray-500 px-2 py-1 rounded">
                                            Hidden
                                        </span>
                                    )}
                                    {canManage && (
                                        <>
                                            <button onClick={() => handleEdit(tpl)} className="p-1.5 text-teal hover:bg-teal/10 rounded" title="Edit">
                                                <Pencil className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => handleDuplicate(tpl)} className="p-1.5 text-gray-500 hover:bg-gray-100 rounded" title="Duplicate">
                                                <Copy className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleToggleActive(tpl)}
                                                className="p-1.5 text-gray-500 hover:bg-gray-100 rounded"
                                                title={tpl.isActive ? 'Hide from the deal wizard' : 'Show in the deal wizard'}
                                            >
                                                {tpl.isActive ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                            <button onClick={() => handleDelete(tpl)} className="p-1.5 text-red-500 hover:bg-red-50 rounded" title="Delete">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>

                            <div className="text-xs font-bold text-text-light uppercase tracking-wider mt-3 mb-1">
                                {tpl.items.length} document{tpl.items.length === 1 ? '' : 's'}
                            </div>
                            {tpl.items.length > 0 && (
                                <ul className="text-sm text-gray-600 space-y-1">
                                    {tpl.items.slice(0, 5).map((item, i) => (
                                        <li key={i} className="flex items-center gap-2 min-w-0">
                                            <span className="text-[10px] font-bold uppercase bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded flex-shrink-0">
                                                {item.role.replace('_', ' ')}
                                            </span>
                                            <span className="truncate">{docName(item.standardDocumentId)}</span>
                                        </li>
                                    ))}
                                    {tpl.items.length > 5 && (
                                        <li className="text-xs text-text-light italic">
                                            +{tpl.items.length - 5} more
                                        </li>
                                    )}
                                </ul>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {isModalOpen && (
                <DealTemplateModal template={editing} onClose={() => { setIsModalOpen(false); setEditing(null); }} />
            )}
        </div>
    );
}
