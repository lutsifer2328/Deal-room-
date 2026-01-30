'use client';

import { use, useState, useEffect } from 'react';
import { useData } from '@/lib/store';
import { useAuth } from '@/lib/authContext';
import { useRouter } from 'next/navigation';
import { ArrowLeft, User, Mail, Phone, Send, Edit2, Check, Clock, XCircle, ExternalLink, Trash2 } from 'lucide-react';
import { useTranslation } from '@/lib/useTranslation';

export default function ParticipantDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = use(params);
    const { globalParticipants, getParticipantDeals, updateGlobalParticipant, deleteGlobalParticipant } = useData();
    const { user } = useAuth();
    const { t } = useTranslation();
    const router = useRouter();

    // All hooks MUST be called unconditionally
    const [isEditingNotes, setIsEditingNotes] = useState(false);
    const [notes, setNotes] = useState('');
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

    const participant = globalParticipants.find(p => p.id === resolvedParams.id);
    const participantDeals = participant ? getParticipantDeals(participant.id) : [];

    // Initialize notes
    useEffect(() => {
        if (participant) {
            setNotes(participant.internalNotes || '');
        }
    }, [participant]);

    // NOW we can do conditional rendering AFTER all hooks
    // Access control
    if (!user || !['lawyer', 'admin', 'staff'].includes(user.role)) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-800 mb-2">{t('participant.accessDenied')}</h1>
                    <p className="text-gray-600">{t('participant.noPermission')}</p>
                </div>
            </div>
        );
    }

    if (!participant) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-800 mb-2">{t('participant.notFound')}</h1>
                    <p className="text-gray-600">{t('participant.notFoundDesc')}</p>
                    <button
                        onClick={() => router.push('/participants')}
                        className="mt-4 px-4 py-2 bg-teal text-white rounded-lg font-bold hover:bg-teal/90"
                    >
                        {t('participant.back')}
                    </button>
                </div>
            </div>
        );
    }

    const activeDeals = participantDeals.filter(pd => pd.deal.status !== 'closed');
    const closedDeals = participantDeals.filter(pd => pd.deal.status === 'closed');

    const handleSaveNotes = () => {
        setSaveStatus('saving');
        updateGlobalParticipant(participant.id, { internalNotes: notes });
        setTimeout(() => {
            setSaveStatus('saved');
            setIsEditingNotes(false);
            setTimeout(() => setSaveStatus('idle'), 2000);
        }, 500);
    };

    const handleDeleteParticipant = () => {
        if (confirm(t('participant.deleteConfirm'))) {
            deleteGlobalParticipant(participant.id);
            router.push('/participants');
        }
    };

    const getInvitationStatusDisplay = () => {
        switch (participant.invitationStatus) {
            case 'accepted':
                return (
                    <div className="flex items-center gap-2 text-green-600">
                        <Check className="w-5 h-5" />
                        <span className="font-medium">
                            {t('participant.accepted')} {participant.invitationAcceptedAt && `(${new Date(participant.invitationAcceptedAt).toLocaleDateString()})`}
                        </span>
                    </div>
                );
            case 'pending':
                return (
                    <div className="flex items-center gap-2 text-orange-600">
                        <Clock className="w-5 h-5" />
                        <span className="font-medium">
                            {t('participant.pending')} {participant.invitationSentAt && `(${new Date(participant.invitationSentAt).toLocaleDateString()})`}
                        </span>
                    </div>
                );
            case 'declined':
                return (
                    <div className="flex items-center gap-2 text-red-600">
                        <XCircle className="w-5 h-5" />
                        <span className="font-medium">
                            {t('participant.declined')} {participant.invitationSentAt && `(${new Date(participant.invitationSentAt).toLocaleDateString()})`}
                        </span>
                    </div>
                );
        }
    };

    return (
        <div className="flex-1 overflow-y-auto bg-gray-50/50 p-12">
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Back Button */}
                <button
                    onClick={() => router.push('/participants')}
                    className="flex items-center gap-2 text-text-light hover:text-navy-primary font-bold transition-colors group"
                >
                    <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                    {t('participant.back')}
                </button>

                {/* Header Card */}
                <div className="bg-white rounded-3xl shadow-xl shadow-navy-primary/5 border border-white/20 p-8 backdrop-blur-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-teal/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 relative z-10">
                        <div className="flex items-center gap-6">
                            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-navy-primary to-navy-secondary text-white flex items-center justify-center text-3xl font-serif font-bold shadow-lg shadow-navy-primary/20">
                                {participant.name.charAt(0)}
                            </div>
                            <div>
                                <h1 className="text-3xl font-serif font-bold text-navy-primary flex items-center gap-3 mb-2">
                                    {participant.name}
                                    <span className="text-base font-sans font-normal bg-gray-100 text-text-light px-3 py-1 rounded-full border border-gray-200">
                                        Participant
                                    </span>
                                </h1>
                                <div className="space-y-1.5">
                                    <div className="flex items-center gap-2 text-text-secondary font-medium">
                                        <Mail className="w-4 h-4 text-teal" />
                                        {participant.email}
                                    </div>
                                    {participant.phone && (
                                        <div className="flex items-center gap-2 text-text-secondary font-medium">
                                            <Phone className="w-4 h-4 text-teal" />
                                            {participant.phone}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                            <button
                                onClick={() => window.location.href = `mailto:${participant.email}`}
                                className="px-5 py-2.5 bg-teal text-white rounded-xl font-bold hover:bg-teal/90 flex items-center gap-2 shadow-lg shadow-teal/20 transition-all hover:scale-105"
                            >
                                <Send className="w-4 h-4" />
                                {t('participant.sendEmail')}
                            </button>
                            {['admin', 'lawyer'].includes(user?.role || '') && (
                                <button
                                    onClick={handleDeleteParticipant}
                                    className="px-5 py-2.5 bg-red-50 text-red-600 border border-red-100 rounded-xl font-bold hover:bg-red-100 flex items-center gap-2 transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    {t('common.delete')}
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="mt-8 pt-6 border-t border-gray-100 flex items-center gap-4">
                        <span className="text-sm font-bold text-text-light uppercase tracking-wider">{t('participant.invitationStatus')}:</span>
                        <div className="font-medium">
                            {getInvitationStatusDisplay()}
                        </div>
                    </div>
                </div>

                {/* Deals Section */}
                <div className="bg-white rounded-3xl shadow-lg shadow-navy-primary/5 border border-white/20 p-8">
                    <h2 className="text-xl font-bold text-navy-primary mb-6 font-serif flex items-center gap-3">
                        <User className="w-6 h-6 text-teal" />
                        {t('dashboard.title')}
                        <span className="text-sm font-sans font-normal text-text-light bg-gray-50 px-3 py-1 rounded-full border border-gray-100">
                            {activeDeals.length} {t('participants.dealCount.active')}, {closedDeals.length} {t('participants.dealCount.closed')}
                        </span>
                    </h2>

                    {participantDeals.length === 0 ? (
                        <div className="text-center py-12 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
                            <p className="text-text-light font-medium">{t('participants.notFound')}</p>
                        </div>
                    ) : (
                        <div className="space-y-8">
                            {/* Active Deals */}
                            {activeDeals.length > 0 && (
                                <div>
                                    <h3 className="text-xs font-bold text-text-light uppercase tracking-wider mb-4 flex items-center gap-2 pl-1">
                                        <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]"></span>
                                        {t('dashboard.activeDeals')}
                                    </h3>
                                    <div className="grid gap-3">
                                        {activeDeals.map(({ deal, dealParticipant }) => (
                                            <div
                                                key={dealParticipant.id}
                                                className="flex items-center justify-between p-5 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md hover:border-teal/30 hover:bg-teal/[0.02] transition-all group"
                                            >
                                                <div className="flex-1">
                                                    <div className="font-bold text-navy-primary text-lg group-hover:text-teal transition-colors">
                                                        {deal.title || deal.propertyAddress}
                                                        <span className="ml-3 text-xs font-bold px-2 py-1 rounded-md uppercase bg-teal/10 text-teal border border-teal/20 align-middle">
                                                            {t(`role.${dealParticipant.role}` as any)}
                                                        </span>
                                                    </div>
                                                    {deal.propertyAddress && (
                                                        <div className="text-sm text-text-light mt-1 font-medium">{deal.propertyAddress}</div>
                                                    )}
                                                </div>
                                                <button
                                                    onClick={() => router.push(`/deal/${deal.id}`)}
                                                    className="px-4 py-2 text-teal bg-teal/5 hover:bg-teal/10 rounded-xl font-bold flex items-center gap-2 transition-colors"
                                                >
                                                    {t('common.view')}
                                                    <ExternalLink className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Closed Deals */}
                            {closedDeals.length > 0 && (
                                <div>
                                    <h3 className="text-xs font-bold text-text-light uppercase tracking-wider mb-4 flex items-center gap-2 pl-1">
                                        <span className="w-2 h-2 rounded-full bg-gray-400"></span>
                                        {t('archive.tab.closed')}
                                    </h3>
                                    <div className="grid gap-3">
                                        {closedDeals.map(({ deal, dealParticipant }) => (
                                            <div
                                                key={dealParticipant.id}
                                                className="flex items-center justify-between p-5 bg-gray-50/50 border border-gray-100 rounded-2xl hover:bg-white hover:shadow-sm transition-all"
                                            >
                                                <div className="flex-1 opacity-70 hover:opacity-100 transition-opacity">
                                                    <div className="font-bold text-text-secondary">
                                                        {deal.title || deal.propertyAddress}
                                                        <span className="ml-3 text-xs font-bold px-2 py-1 rounded-md uppercase bg-gray-200 text-gray-600 border border-gray-300 align-middle">
                                                            {t(`role.${dealParticipant.role}` as any)}
                                                        </span>
                                                    </div>
                                                    {deal.propertyAddress && (
                                                        <div className="text-sm text-text-light mt-1">{deal.propertyAddress}</div>
                                                    )}
                                                    <div className="text-xs text-text-light mt-1 font-medium flex items-center gap-1">
                                                        <Clock className="w-3 h-3" />
                                                        {t('deal.header.closed')} {deal.closedAt ? new Date(deal.closedAt).toLocaleDateString() : ''}
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => router.push(`/deal/${deal.id}`)}
                                                    className="px-4 py-2 text-text-light hover:bg-gray-100 rounded-xl font-bold flex items-center gap-2 transition-colors"
                                                >
                                                    {t('common.view')}
                                                    <ExternalLink className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Internal Notes Section */}
                <div className="bg-white rounded-3xl shadow-lg shadow-navy-primary/5 border border-white/20 p-8">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-navy-primary font-serif">{t('participant.internalNotes')}</h2>
                        {!isEditingNotes && (
                            <button
                                onClick={() => setIsEditingNotes(true)}
                                className="px-4 py-2 text-teal hover:bg-teal/5 rounded-xl font-bold flex items-center gap-2 transition-colors border border-transparent hover:border-teal/10"
                            >
                                <Edit2 className="w-4 h-4" />
                                {t('common.edit')}
                            </button>
                        )}
                    </div>

                    {!isEditingNotes && (
                        <div className="bg-yellow-50/50 border border-yellow-100 rounded-xl p-4 mb-4 flex gap-3 text-sm text-yellow-800">
                            <div className="mt-0.5">💡</div>
                            <p>{t('participant.notesVisible')}</p>
                        </div>
                    )}

                    {isEditingNotes ? (
                        <div className="animate-in fade-in zoom-in-95 duration-200">
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                maxLength={1000}
                                rows={6}
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal/20 focus:border-teal outline-none bg-gray-50 focus:bg-white transition-all resize-none shadow-inner"
                                placeholder={t('participant.addNotes')}
                            />
                            <div className="flex items-center justify-between mt-4">
                                <span className="text-xs text-text-light font-medium">{notes.length}/1000 characters</span>
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => {
                                            setNotes(participant.internalNotes || '');
                                            setIsEditingNotes(false);
                                        }}
                                        className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-xl font-bold transition-colors"
                                    >
                                        {t('common.cancel')}
                                    </button>
                                    <button
                                        onClick={handleSaveNotes}
                                        disabled={saveStatus === 'saving'}
                                        className="px-6 py-2 bg-teal text-white rounded-xl font-bold hover:bg-teal/90 disabled:opacity-50 shadow-md shadow-teal/20 transition-all"
                                    >
                                        {saveStatus === 'saving' ? t('common.saving') : t('common.save')}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-text-secondary whitespace-pre-wrap leading-relaxed bg-gray-50/50 p-6 rounded-2xl border border-gray-100">
                            {participant.internalNotes || <span className="text-text-light italic opacity-70">No notes yet</span>}
                        </div>
                    )}

                    {saveStatus === 'saved' && (
                        <div className="mt-4 text-sm text-green-600 font-bold flex items-center gap-2 bg-green-50 px-4 py-2 rounded-lg border border-green-100 inline-flex animate-in fade-in slide-in-from-bottom-2">
                            <Check className="w-4 h-4" />
                            {t('participant.saved')}
                        </div>
                    )}
                </div>
            </div>
        </div >
    );
}
