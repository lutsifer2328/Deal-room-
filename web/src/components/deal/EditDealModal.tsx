'use client';

import { Deal } from '@/lib/types';
import { useData } from '@/lib/store';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface EditDealModalProps {
    deal: Deal;
    isOpen: boolean;
    onClose: () => void;
}

export default function EditDealModal({ deal, isOpen, onClose }: EditDealModalProps) {
    const { updateDeal } = useData();
    const [editForm, setEditForm] = useState({
        title: deal.title,
        address: deal.propertyAddress || '',
        price: deal.price ? String(deal.price) : ''
    });
    const [isSaving, setIsSaving] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        setEditForm({
            title: deal.title,
            address: deal.propertyAddress || '',
            price: deal.price ? String(deal.price) : ''
        });
    }, [deal]);

    if (!isOpen || !mounted) return null;

    const handleSaveDeal = async () => {
        if (!editForm.title.trim()) return;
        setIsSaving(true);
        try {
            await updateDeal(deal.id, {
                title: editForm.title.trim(),
                propertyAddress: editForm.address.trim(),
                price: editForm.price ? Number(editForm.price) : undefined
            });
            onClose();
        } catch (error) {
            console.error('Failed to update deal:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const modalContent = (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center px-4 sm:px-0">
            {/* 1. The Backdrop (Dark & Blurry) */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            ></div>

            {/* 2. The White Box */}
            <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden">

                {/* Header - Sticky Top */}
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-white shrink-0">
                    <h2 className="text-xl font-bold text-gray-800">Edit Deal Details</h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        ✕
                    </button>
                </div>

                {/* Body - Scrollable Area */}
                <div className="p-6 overflow-y-auto flex-1 space-y-5">

                    {/* Title Field */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Deal Title</label>
                        <input
                            type="text"
                            value={editForm.title}
                            onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                        />
                    </div>

                    {/* Address Field */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Property Address</label>
                        <input
                            type="text"
                            value={editForm.address}
                            onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                        />
                    </div>

                    {/* Price Field */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Deal Value (€)</label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">€</span>
                            <input
                                type="number"
                                value={editForm.price}
                                onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
                                className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                                placeholder="0.00"
                            />
                        </div>
                    </div>
                </div>

                {/* Footer - Sticky Bottom */}
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3 shrink-0">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-gray-600 font-medium hover:text-gray-800 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSaveDeal}
                        disabled={isSaving}
                        className="px-6 py-2 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 shadow-md hover:shadow-lg transition-all transform active:scale-95 disabled:opacity-50"
                    >
                        {isSaving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>

            </div>
        </div>
    );

    // Portal: render the modal on document.body to escape the
    // DealHeader's overflow-hidden + backdrop-blur container
    return createPortal(modalContent, document.body);
}
