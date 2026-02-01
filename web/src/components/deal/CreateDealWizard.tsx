'use client';

import { useData } from '@/lib/store';
import { useAuth } from '@/lib/authContext';
import { X, ChevronRight, ChevronLeft, UserPlus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Participant, Role, GlobalParticipant } from '@/lib/types';
import DuplicateDetectionModal from '@/components/participants/DuplicateDetectionModal';
import { useTranslation, TranslationKey } from '@/lib/useTranslation';

export default function CreateDealWizard({ onClose, onSuccess }: { onClose: () => void, onSuccess?: (dealId: string) => void }) {
    const { createDeal, checkDuplicateEmail, getParticipantDeals } = useData();
    const { user } = useAuth();
    const { t } = useTranslation();
    const [step, setStep] = useState(1);

    // Step 1: Deal Info
    const [dealNumber, setDealNumber] = useState('');
    const [title, setTitle] = useState('');
    const [propertyAddress, setPropertyAddress] = useState('');

    // Step 2: Participants
    const [participants, setParticipants] = useState<Omit<Participant, 'id' | 'addedAt'>[]>([]);
    const [currentParticipant, setCurrentParticipant] = useState({
        fullName: '',
        email: '',
        phone: '',
        role: 'buyer' as Role,
        canViewDocuments: true,
        canDownload: true,
        hasAcceptedInvite: false,
        isActive: true
    });

    // Duplicate detection state
    const [duplicateParticipant, setDuplicateParticipant] = useState<GlobalParticipant | null>(null);
    const [showDuplicateModal, setShowDuplicateModal] = useState(false);
    const [pendingParticipantData, setPendingParticipantData] = useState<any>(null);

    const handleEmailBlur = () => {
        if (currentParticipant.email.trim()) {
            const duplicate = checkDuplicateEmail(currentParticipant.email);
            if (duplicate) {
                // Show modal immediately when duplicate is detected
                setPendingParticipantData(currentParticipant);
                setDuplicateParticipant(duplicate);
                setShowDuplicateModal(true);
            } else {
                setDuplicateParticipant(null);
            }
        }
    };

    const handleAddParticipant = () => {
        if (!currentParticipant.fullName || !currentParticipant.email) {
            alert(t('modal.addParticipant.errorRequired'));
            return;
        }

        // Check for duplicate email
        const duplicate = checkDuplicateEmail(currentParticipant.email);
        if (duplicate) {
            // Store pending data and show duplicate modal
            setPendingParticipantData(currentParticipant);
            setDuplicateParticipant(duplicate);
            setShowDuplicateModal(true);
            return;
        }

        // No duplicate, proceed with adding
        proceedWithAddingParticipant(currentParticipant);
    };

    const proceedWithAddingParticipant = (participantData: any) => {
        setParticipants([...participants, { ...participantData }]);
        setCurrentParticipant({
            fullName: '',
            email: '',
            phone: '',
            role: 'buyer',
            canViewDocuments: true,
            canDownload: true,
            hasAcceptedInvite: false,
            isActive: true
        });
        setDuplicateParticipant(null);
    };

    const handleUseExisting = () => {
        if (!duplicateParticipant || !pendingParticipantData) return;

        // Use the existing participant but with the new role from the form
        const participantData = {
            ...pendingParticipantData,
            fullName: duplicateParticipant.name,
            email: duplicateParticipant.email,
            phone: duplicateParticipant.phone || pendingParticipantData.phone
        };

        setShowDuplicateModal(false);
        proceedWithAddingParticipant(participantData);
        setPendingParticipantData(null);
    };

    const handleCreateNew = () => {
        if (!pendingParticipantData) return;

        setShowDuplicateModal(false);
        proceedWithAddingParticipant(pendingParticipantData);
        setPendingParticipantData(null);
    };

    const handleCancelDuplicate = () => {
        setShowDuplicateModal(false);
        setDuplicateParticipant(null);
        setPendingParticipantData(null);
    };

    const handleRemoveParticipant = (index: number) => {
        setParticipants(participants.filter((_, i) => i !== index));
    };

    const handleSubmit = async () => {
        if (!title) {
            alert(t('wizard.error.title'));
            return;
        }

        // Auto-add the current participant if form is filled but not yet added
        let finalParticipants = [...participants];
        if (currentParticipant.fullName && currentParticipant.email) {
            finalParticipants.push({
                ...currentParticipant,
                isActive: true
            });
        }

        if (finalParticipants.length === 0) {
            alert(t('wizard.error.participants'));
            return;
        }

        const dealId = await createDeal(title, propertyAddress, finalParticipants, dealNumber || undefined);
        if (onSuccess) {
            onSuccess(dealId);
        } else {
            onClose();
        }
    };

    const getTranslatedRole = (role: string) => {
        const key = `role.${role}` as TranslationKey;
        return t(key).startsWith('role.') ? role : t(key);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl overflow-hidden animate-in fade-in zoom-in duration-200">

                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-midnight text-white">
                    <h2 className="text-lg font-bold">{t('wizard.title')}</h2>
                    <button onClick={onClose} className="text-white/80 hover:text-white">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Progress Indicator */}
                <div className="px-6 py-4 bg-gray-50 flex items-center gap-4">
                    <div className={`flex items-center gap-2 ${step === 1 ? 'text-teal font-bold' : 'text-gray-400'}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 1 ? 'bg-teal text-white' : 'bg-gray-200'}`}>
                            1
                        </div>
                        <span className="text-sm">{t('wizard.step.info')}</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                    <div className={`flex items-center gap-2 ${step === 2 ? 'text-teal font-bold' : 'text-gray-400'}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 2 ? 'bg-teal text-white' : 'bg-gray-200'}`}>
                            2
                        </div>
                        <span className="text-sm">{t('wizard.step.participants')}</span>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 max-h-[60vh] overflow-y-auto">
                    {step === 1 && (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    {t('wizard.label.dealId')}
                                    <span className="text-gray-400 font-normal ml-2">{t('wizard.label.optionalCrm')}</span>
                                </label>
                                <input
                                    type="text"
                                    value={dealNumber}
                                    onChange={(e) => setDealNumber(e.target.value)}
                                    placeholder={t('wizard.placeholder.dealId')}
                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-teal focus:border-teal outline-none"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    {t('wizard.hint.crm')}
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">{t('wizard.label.title')}</label>
                                <input
                                    type="text"
                                    required
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder={t('wizard.placeholder.title')}
                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-teal focus:border-teal outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">{t('wizard.label.address')}</label>
                                <input
                                    type="text"
                                    value={propertyAddress}
                                    onChange={(e) => setPropertyAddress(e.target.value)}
                                    placeholder={t('wizard.placeholder.address')}
                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-teal focus:border-teal outline-none"
                                />
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-6">
                            {/* Participants List */}
                            {participants.length > 0 && (
                                <div className="mb-6">
                                    <h3 className="text-sm font-bold text-gray-700 uppercase mb-3">{t('wizard.section.added')}</h3>
                                    <div className="space-y-2">
                                        {participants.map((p, idx) => (
                                            <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                                                <div className="flex-1">
                                                    <div className="font-bold text-midnight">{p.fullName}</div>
                                                    <div className="text-xs text-gray-500">{p.email} • {getTranslatedRole(p.role)}</div>
                                                </div>
                                                <button
                                                    onClick={() => handleRemoveParticipant(idx)}
                                                    className="p-2 text-red-500 hover:bg-red-50 rounded"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Add Participant Form */}
                            <div className="border-t pt-6">
                                <h3 className="text-sm font-bold text-teal uppercase mb-3 flex items-center gap-2">
                                    <UserPlus className="w-4 h-4" /> {t('wizard.section.add')}
                                </h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">{t('wizard.label.name')}</label>
                                        <input
                                            type="text"
                                            value={currentParticipant.fullName}
                                            onChange={(e) => setCurrentParticipant({ ...currentParticipant, fullName: e.target.value })}
                                            className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-teal outline-none text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">{t('wizard.label.email')}</label>
                                        <input
                                            type="email"
                                            value={currentParticipant.email}
                                            onChange={(e) => setCurrentParticipant({ ...currentParticipant, email: e.target.value })}
                                            onBlur={handleEmailBlur}
                                            className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-teal outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">{t('wizard.label.phone')}</label>
                                        <input
                                            type="tel"
                                            value={currentParticipant.phone}
                                            onChange={(e) => setCurrentParticipant({ ...currentParticipant, phone: e.target.value })}
                                            className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-teal outline-none text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">{t('wizard.label.role')}</label>
                                        <select
                                            value={currentParticipant.role}
                                            onChange={(e) => setCurrentParticipant({ ...currentParticipant, role: e.target.value as Role })}
                                            className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-white outline-none text-sm"
                                        >
                                            <option value="buyer">{t('role.buyer')}</option>
                                            <option value="seller">{t('role.seller')}</option>
                                            <option value="agent">{t('role.agent')}</option>
                                            <option value="lawyer">{t('role.lawyer')}</option>
                                            <option value="notary">{t('role.notary')}</option>
                                            <option value="bank_representative">{t('role.bank_representative')}</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="mt-3 flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={currentParticipant.canViewDocuments}
                                        onChange={(e) => setCurrentParticipant({ ...currentParticipant, canViewDocuments: e.target.checked })}
                                        className="w-4 h-4"
                                    />
                                    <label className="text-sm text-gray-700">{t('wizard.label.canView')}</label>
                                </div>
                                <button
                                    onClick={handleAddParticipant}
                                    className="mt-4 w-full py-2 bg-teal/10 text-teal font-bold rounded-lg hover:bg-teal/20 transition-all"
                                >
                                    {t('wizard.btn.add')}
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-between">
                    {step === 1 ? (
                        <>
                            <button onClick={onClose} className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg">
                                {t('common.cancel')}
                            </button>
                            <button
                                onClick={() => setStep(2)}
                                disabled={!title}
                                className="px-6 py-2 bg-midnight text-white font-bold rounded-lg hover:bg-midnight/90 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {t('wizard.btn.next')}
                            </button>
                        </>
                    ) : (
                        <>
                            <button onClick={() => setStep(1)} className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg flex items-center gap-2">
                                <ChevronLeft className="w-4 h-4" />
                                {t('wizard.btn.back')}
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={participants.length === 0}
                                className="px-6 py-2 bg-teal text-white font-bold rounded-lg hover:bg-teal/90 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {t('wizard.btn.create')}
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Duplicate Detection Modal */}
            {showDuplicateModal && duplicateParticipant && (
                <DuplicateDetectionModal
                    existingParticipant={duplicateParticipant}
                    email={pendingParticipantData?.email || ''}
                    deals={getParticipantDeals(duplicateParticipant.id).map(({ deal, dealParticipant }) => ({
                        dealName: deal.title || deal.propertyAddress,
                        role: dealParticipant.role
                    }))}
                    onCancel={handleCancelDuplicate}
                    onUseExisting={handleUseExisting}
                    onCreateNew={handleCreateNew}
                />
            )}
        </div>
    );
}
