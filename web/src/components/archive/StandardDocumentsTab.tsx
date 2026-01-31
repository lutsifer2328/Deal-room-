'use client';

import { useState } from 'react';
import { useData } from '@/lib/store';
import { useAuth } from '@/lib/authContext';
import { StandardDocument } from '@/lib/types';
import { Pencil, Trash2, Plus } from 'lucide-react';
import StandardDocumentModal from './StandardDocumentModal';

export default function StandardDocumentsTab() {
    const { standardDocuments, deleteStandardDocument } = useData();
    const { user } = useAuth();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingDocument, setEditingDocument] = useState<StandardDocument | null>(null);
    const [sortBy, setSortBy] = useState<'name' | 'usageCount'>('name');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

    if (!user) return null;

    // Filter active documents only
    const activeDocuments = standardDocuments.filter(doc => doc.isActive);

    // Sort documents
    const sortedDocuments = [...activeDocuments].sort((a, b) => {
        let comparison = 0;
        if (sortBy === 'name') {
            comparison = a.name.localeCompare(b.name);
        } else if (sortBy === 'usageCount') {
            comparison = a.usageCount - b.usageCount;
        }
        return sortOrder === 'asc' ? comparison : -comparison;
    });

    const handleEdit = (doc: StandardDocument) => {
        setEditingDocument(doc);
        setIsModalOpen(true);
    };

    const handleDelete = (doc: StandardDocument) => {
        if (confirm(`Are you sure you want to delete "${doc.name}"?\n\nThis will not affect existing documents, but will remove it from suggestions.`)) {
            deleteStandardDocument(doc.id);
        }
    };

    const handleAddNew = () => {
        setEditingDocument(null);
        setIsModalOpen(true);
    };

    const toggleSort = (column: 'name' | 'usageCount') => {
        if (sortBy === column) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(column);
            setSortOrder('asc');
        }
    };

    return (
        <div>
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-8">
                <div>
                    <h2 className="text-2xl font-bold text-navy-primary font-serif mb-2 flex items-center gap-2">
                        📋 Standard Documents
                    </h2>
                    <p className="text-text-secondary mb-4">Manage your firm's common document names</p>
                    <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 text-sm text-blue-800 flex items-start gap-3">
                        <div className="text-lg mt-0.5">💡</div>
                        <div><strong>Tip:</strong> These names appear as suggestions when adding document requirements to deals.</div>
                    </div>
                </div>
                <button
                    onClick={handleAddNew}
                    className="flex items-center gap-2 px-5 py-2.5 bg-teal text-white font-bold rounded-xl hover:bg-teal/90 shadow-lg shadow-teal/20 transition-all hover:scale-105"
                >
                    <Plus className="w-5 h-5" />
                    Add Name
                </button>
            </div>

            {/* Table */}
            {sortedDocuments.length === 0 ? (
                <div className="text-center py-16 bg-gray-50/50 rounded-2xl border-2 border-dashed border-gray-200">
                    <p className="text-text-light font-medium mb-4">No standard documents yet</p>
                    <button
                        onClick={handleAddNew}
                        className="text-teal font-bold hover:underline hover:text-teal/80 transition-colors"
                    >
                        Add your first standard document
                    </button>
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-gray-50/50 border-b border-gray-100">
                                    <th
                                        className="text-left py-4 px-6 text-xs font-bold text-text-light uppercase tracking-wider cursor-pointer hover:text-teal transition-colors"
                                        onClick={() => toggleSort('name')}
                                    >
                                        Document Name {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
                                    </th>
                                    <th className="text-left py-4 px-6 text-xs font-bold text-text-light uppercase tracking-wider">
                                        Description
                                    </th>
                                    <th
                                        className="text-left py-4 px-6 text-xs font-bold text-text-light uppercase tracking-wider cursor-pointer hover:text-teal transition-colors"
                                        onClick={() => toggleSort('usageCount')}
                                    >
                                        Usage {sortBy === 'usageCount' && (sortOrder === 'asc' ? '↑' : '↓')}
                                    </th>
                                    <th className="text-right py-4 px-6 text-xs font-bold text-text-light uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {sortedDocuments.map((doc) => (
                                    <tr key={doc.id} className="hover:bg-teal/[0.02] transition-colors group">
                                        <td className="py-4 px-6 font-bold text-navy-primary group-hover:text-teal transition-colors">
                                            {doc.name}
                                        </td>
                                        <td className="py-4 px-6 text-text-secondary text-sm">
                                            {doc.description || <span className="italic text-text-light opacity-60">No description</span>}
                                        </td>
                                        <td className="py-4 px-6 text-text-secondary text-sm whitespace-nowrap">
                                            <span className="bg-gray-100 text-text-light px-2.5 py-1 rounded-md text-xs font-bold border border-gray-200 inline-flex items-center gap-1">
                                                Used {doc.usageCount}x
                                            </span>
                                        </td>
                                        <td className="py-4 px-6 text-right whitespace-nowrap">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => handleEdit(doc)}
                                                    className="p-2 text-text-light hover:text-teal hover:bg-teal/10 rounded-lg transition-colors"
                                                    title="Edit"
                                                >
                                                    <Pencil className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(doc)}
                                                    className="p-2 text-text-light hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Modal */}
            {isModalOpen && (
                <StandardDocumentModal
                    document={editingDocument}
                    onClose={() => {
                        setIsModalOpen(false);
                        setEditingDocument(null);
                    }}
                />
            )}
        </div>
    );
}
