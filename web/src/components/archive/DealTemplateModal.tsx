'use client';

import { useState } from 'react';
import { DealTemplate, DealTemplateItem, Role } from '@/lib/types';
import { useData } from '@/lib/store';
import { useAuth } from '@/lib/authContext';
import { Plus, Trash2, ArrowUp, ArrowDown } from 'lucide-react';
import { Modal, ModalHeader, ModalContent, ModalFooter } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';

const ITEM_ROLES: Role[] = ['buyer', 'seller', 'agent', 'attorney', 'notary', 'bank_representative'];

/**
 * Editor for a lawyer-managed checklist. Items point at Standard Documents by
 * id, so the titles shown here (and on seeded tasks) always follow the current
 * standard document names.
 */
export default function DealTemplateModal({ template, onClose }: {
    template: DealTemplate | null;
    onClose: () => void;
}) {
    const { standardDocuments, createDealTemplate, updateDealTemplate } = useData();
    const { user } = useAuth();

    const [nameEn, setNameEn] = useState(template?.nameEn ?? '');
    const [nameBg, setNameBg] = useState(template?.nameBg ?? '');
    const [description, setDescription] = useState(template?.description ?? '');
    const [items, setItems] = useState<DealTemplateItem[]>(template?.items ?? []);
    const [isSaving, setIsSaving] = useState(false);

    const activeDocs = standardDocuments.filter(d => d.isActive);

    const addItem = () => {
        const firstUnused = activeDocs.find(d => !items.some(i => i.standardDocumentId === d.id)) || activeDocs[0];
        if (!firstUnused) return;
        setItems([...items, { standardDocumentId: firstUnused.id, role: 'buyer', required: true }]);
    };

    const updateItem = (index: number, patch: Partial<DealTemplateItem>) => {
        setItems(items.map((it, i) => i === index ? { ...it, ...patch } : it));
    };

    const removeItem = (index: number) => setItems(items.filter((_, i) => i !== index));

    const moveItem = (index: number, direction: -1 | 1) => {
        const target = index + direction;
        if (target < 0 || target >= items.length) return;
        const next = [...items];
        [next[index], next[target]] = [next[target], next[index]];
        setItems(next);
    };

    const handleSave = async () => {
        if (!nameEn.trim()) {
            alert('A checklist name is required');
            return;
        }
        setIsSaving(true);
        try {
            if (template) {
                await updateDealTemplate(template.id, {
                    nameEn: nameEn.trim(),
                    nameBg: nameBg.trim() || undefined,
                    description: description.trim() || undefined,
                    items
                });
            } else {
                await createDealTemplate({
                    nameEn: nameEn.trim(),
                    nameBg: nameBg.trim() || undefined,
                    description: description.trim() || undefined,
                    items
                }, user?.id || '');
            }
            onClose();
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Modal isOpen onClose={onClose} size="3xl">
            <ModalHeader onClose={onClose} className="bg-midnight text-white">
                {template ? 'Edit checklist' : 'New checklist'}
            </ModalHeader>

            <ModalContent>
                <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Name (English) *</label>
                            <input
                                type="text"
                                value={nameEn}
                                onChange={(e) => setNameEn(e.target.value)}
                                placeholder="e.g. Purchase"
                                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-teal outline-none text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Name (Bulgarian)</label>
                            <input
                                type="text"
                                value={nameBg}
                                onChange={(e) => setNameBg(e.target.value)}
                                placeholder="напр. Покупка"
                                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-teal outline-none text-sm"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Description</label>
                        <input
                            type="text"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="When should staff use this checklist?"
                            className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-teal outline-none text-sm"
                        />
                    </div>

                    {/* Items */}
                    <div className="border-t border-gray-100 pt-4">
                        <div className="flex items-center justify-between mb-3">
                            <h4 className="text-sm font-bold text-gray-700">
                                Documents in this checklist ({items.length})
                            </h4>
                            <button
                                onClick={addItem}
                                disabled={activeDocs.length === 0}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-teal/10 text-teal font-bold rounded-lg text-sm hover:bg-teal/20 transition-colors disabled:opacity-40"
                            >
                                <Plus className="w-4 h-4" /> Add document
                            </button>
                        </div>

                        {activeDocs.length === 0 ? (
                            <p className="text-sm text-gray-500 bg-amber-50 border border-amber-200 rounded-lg p-3">
                                No standard documents exist yet. Add them in the Standard Documents tab first —
                                checklists are built from them.
                            </p>
                        ) : items.length === 0 ? (
                            <p className="text-sm text-gray-500 bg-gray-50 border border-dashed border-gray-300 rounded-lg p-4 text-center">
                                No documents yet. Use &ldquo;Add document&rdquo; to build the checklist.
                            </p>
                        ) : (
                            <div className="space-y-2">
                                {items.map((item, index) => (
                                    <div key={index} className="flex flex-col sm:flex-row sm:items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg p-2">
                                        <div className="flex flex-col gap-0.5">
                                            <button
                                                onClick={() => moveItem(index, -1)}
                                                disabled={index === 0}
                                                className="p-1 text-gray-400 hover:text-teal disabled:opacity-30"
                                                title="Move up"
                                            >
                                                <ArrowUp className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                                onClick={() => moveItem(index, 1)}
                                                disabled={index === items.length - 1}
                                                className="p-1 text-gray-400 hover:text-teal disabled:opacity-30"
                                                title="Move down"
                                            >
                                                <ArrowDown className="w-3.5 h-3.5" />
                                            </button>
                                        </div>

                                        <select
                                            value={item.standardDocumentId}
                                            onChange={(e) => updateItem(index, { standardDocumentId: e.target.value })}
                                            className="flex-1 min-w-0 px-2 py-2 rounded border border-gray-300 bg-white text-sm outline-none"
                                            title="Standard document"
                                        >
                                            {activeDocs.map(d => (
                                                <option key={d.id} value={d.id}>{d.name}</option>
                                            ))}
                                        </select>

                                        <select
                                            value={item.role}
                                            onChange={(e) => updateItem(index, { role: e.target.value as Role })}
                                            className="px-2 py-2 rounded border border-gray-300 bg-white text-sm outline-none"
                                            title="Assigned to role"
                                        >
                                            {ITEM_ROLES.map(r => (
                                                <option key={r} value={r}>{r.replace('_', ' ')}</option>
                                            ))}
                                        </select>

                                        <label className="flex items-center gap-1.5 text-xs font-medium text-gray-600 whitespace-nowrap px-1">
                                            <input
                                                type="checkbox"
                                                checked={item.required !== false}
                                                onChange={(e) => updateItem(index, { required: e.target.checked })}
                                                className="w-4 h-4"
                                            />
                                            Required
                                        </label>

                                        <button
                                            onClick={() => removeItem(index)}
                                            className="p-2 text-red-500 hover:bg-red-50 rounded"
                                            title="Remove"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </ModalContent>

            <ModalFooter>
                <Button variant="ghost" onClick={onClose} disabled={isSaving}>Cancel</Button>
                <Button variant="primary" onClick={handleSave} isLoading={isSaving} disabled={isSaving || !nameEn.trim()}>
                    {template ? 'Save changes' : 'Create checklist'}
                </Button>
            </ModalFooter>
        </Modal>
    );
}
