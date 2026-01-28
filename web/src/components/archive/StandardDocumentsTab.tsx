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
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h2 className="text-xl font-bold text-midnight mb-2">📋 Standard Documents</h2>
                    <p className="text-sm text-gray-600 mb-2">Manage your firm's common document names</p>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
                        💡 <strong>Tip:</strong> These names appear as suggestions when adding document requirements to deals.
                    </div>
                </div>
                <button
                    onClick={handleAddNew}
                    className="flex items-center gap-2 px-4 py-2 bg-teal text-white font-bold rounded-lg hover:bg-teal/90 shadow-md transition-all"
                >
                    <Plus className="w-4 h-4" />
                    Add Name
                </button>
            </div>

            {/* Table */}
            {sortedDocuments.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                    <p className="mb-4">No standard documents yet</p>
                    <button
                        onClick={handleAddNew}
                        className="text-teal font-medium hover:underline"
                    >
                        Add your first standard document
                    </button>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-gray-200">
                                <th
                                    className="text-left py-3 px-4 font-bold text-midnight cursor-pointer hover:bg-gray-50"
                                    onClick={() => toggleSort('name')}
                                >
                                    Document Name {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
                                </th>
                                <th className="text-left py-3 px-4 font-bold text-midnight">
                                    Description
                                </th>
                                <th
                                    className="text-left py-3 px-4 font-bold text-midnight cursor-pointer hover:bg-gray-50"
                                    onClick={() => toggleSort('usageCount')}
                                >
                                    Usage {sortBy === 'usageCount' && (sortOrder === 'asc' ? '↑' : '↓')}
                                </th>
                                <th className="text-right py-3 px-4 font-bold text-midnight">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedDocuments.map((doc) => (
                                <tr key={doc.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                                    <td className="py-3 px-4 font-medium text-midnight">
                                        {doc.name}
                                    </td>
                                    <td className="py-3 px-4 text-gray-600 text-sm">
                                        {doc.description || <span className="italic text-gray-400">No description</span>}
                                    </td>
                                    <td className="py-3 px-4 text-gray-600 text-sm">
                                        <span className="bg-gray-100 px-2 py-1 rounded text-xs font-medium">
                                            Used {doc.usageCount}x
                                        </span>
                                    </td>
                                    <td className="py-3 px-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={() => handleEdit(doc)}
                                                className="p-2 text-gray-600 hover:text-teal hover:bg-teal/10 rounded transition-colors"
                                                title="Edit"
                                            >
                                                <Pencil className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(doc)}
                                                className="p-2 text-gray-600 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
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
