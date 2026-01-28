'use client';

import { use, useState, useEffect } from 'react';
import { useData } from '@/lib/store';
import { useAuth } from '@/lib/authContext';
import { useRouter } from 'next/navigation';
import { ArrowLeft, User, Mail, Phone, Send, Edit2, Check, Clock, XCircle, ExternalLink } from 'lucide-react';

export default function ParticipantDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = use(params);
    const { globalParticipants, getParticipantDeals, updateGlobalParticipant } = useData();
    const { user } = useAuth();
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
                    <h1 className="text-2xl font-bold text-gray-800 mb-2">Access Denied</h1>
                    <p className="text-gray-600">You don't have permission to view this page.</p>
                </div>
            </div>
        );
    }

    if (!participant) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-800 mb-2">Participant Not Found</h1>
                    <p className="text-gray-600">The participant you're looking for doesn't exist.</p>
                    <button
                        onClick={() => router.push('/participants')}
                        className="mt-4 px-4 py-2 bg-teal text-white rounded-lg font-bold hover:bg-teal/90"
                    >
                        Back to Participants
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

    const getInvitationStatusDisplay = () => {
        switch (participant.invitationStatus) {
            case 'accepted':
                return (
                    <div className="flex items-center gap-2 text-green-600">
                        <Check className="w-5 h-5" />
                        <span className="font-medium">
                            Accepted {participant.invitationAcceptedAt && `(${new Date(participant.invitationAcceptedAt).toLocaleDateString()})`}
                        </span>
                    </div>
                );
            case 'pending':
                return (
                    <div className="flex items-center gap-2 text-orange-600">
                        <Clock className="w-5 h-5" />
                        <span className="font-medium">
                            Pending {participant.invitationSentAt && `(${new Date(participant.invitationSentAt).toLocaleDateString()})`}
                        </span>
                    </div>
                );
            case 'declined':
                return (
                    <div className="flex items-center gap-2 text-red-600">
                        <XCircle className="w-5 h-5" />
                        <span className="font-medium">
                            Declined {participant.invitationSentAt && `(${new Date(participant.invitationSentAt).toLocaleDateString()})`}
                        </span>
                    </div>
                );
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-4xl mx-auto">
                {/* Back Button */}
                <button
                    onClick={() => router.push('/participants')}
                    className="mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-800 font-medium"
                >
                    <ArrowLeft className="w-5 h-5" />
                    Back to Participants
                </button>

                {/* Header Card */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                    <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-full bg-teal flex items-center justify-center text-white text-2xl font-bold">
                                {participant.name.charAt(0)}
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-midnight flex items-center gap-2">
                                    <User className="w-6 h-6 text-teal" />
                                    {participant.name}
                                </h1>
                                <div className="mt-2 space-y-1">
                                    <div className="flex items-center gap-2 text-gray-600">
                                        <Mail className="w-4 h-4" />
                                        {participant.email}
                                    </div>
                                    {participant.phone && (
                                        <div className="flex items-center gap-2 text-gray-600">
                                            <Phone className="w-4 h-4" />
                                            {participant.phone}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={() => window.location.href = `mailto:${participant.email}`}
                            className="px-4 py-2 bg-teal text-white rounded-lg font-bold hover:bg-teal/90 flex items-center gap-2"
                        >
                            <Send className="w-4 h-4" />
                            Send Email
                        </button>
                    </div>

                    <div className="pt-4 border-t border-gray-200">
                        <div className="text-sm text-gray-600 mb-1">Invitation Status:</div>
                        {getInvitationStatusDisplay()}
                    </div>
                </div>

                {/* Deals Section */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                    <h2 className="text-lg font-bold text-midnight mb-4">
                        Deals ({activeDeals.length} active, {closedDeals.length} closed)
                    </h2>

                    {participantDeals.length === 0 ? (
                        <p className="text-gray-500 text-center py-8">Not currently involved in any deals</p>
                    ) : (
                        <div className="space-y-6">
                            {/* Active Deals */}
                            {activeDeals.length > 0 && (
                                <div>
                                    <h3 className="text-sm font-bold text-gray-700 uppercase mb-3 flex items-center gap-2">
                                        <span className="w-3 h-3 rounded-full bg-green-500"></span>
                                        Active Deals
                                    </h3>
                                    <div className="space-y-2">
                                        {activeDeals.map(({ deal, dealParticipant }) => (
                                            <div
                                                key={dealParticipant.id}
                                                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                                            >
                                                <div className="flex-1">
                                                    <div className="font-medium text-midnight">
                                                        {deal.title || deal.propertyAddress}
                                                        <span className="ml-2 text-xs font-bold px-2 py-1 rounded uppercase bg-teal/10 text-teal">
                                                            {dealParticipant.role}
                                                        </span>
                                                    </div>
                                                    {deal.propertyAddress && (
                                                        <div className="text-sm text-gray-600 mt-1">{deal.propertyAddress}</div>
                                                    )}
                                                </div>
                                                <button
                                                    onClick={() => router.push(`/deal/${deal.id}`)}
                                                    className="px-3 py-1.5 text-teal hover:bg-teal/10 rounded font-medium flex items-center gap-1"
                                                >
                                                    View Deal
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
                                    <h3 className="text-sm font-bold text-gray-700 uppercase mb-3 flex items-center gap-2">
                                        <span className="w-3 h-3 rounded-full bg-gray-400"></span>
                                        Closed Deals
                                    </h3>
                                    <div className="space-y-2">
                                        {closedDeals.map(({ deal, dealParticipant }) => (
                                            <div
                                                key={dealParticipant.id}
                                                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                                            >
                                                <div className="flex-1">
                                                    <div className="font-medium text-gray-700">
                                                        {deal.title || deal.propertyAddress}
                                                        <span className="ml-2 text-xs font-bold px-2 py-1 rounded uppercase bg-gray-100 text-gray-600">
                                                            {dealParticipant.role}
                                                        </span>
                                                    </div>
                                                    {deal.propertyAddress && (
                                                        <div className="text-sm text-gray-500 mt-1">{deal.propertyAddress}</div>
                                                    )}
                                                    <div className="text-xs text-gray-500 mt-1">
                                                        Closed {deal.closedAt ? new Date(deal.closedAt).toLocaleDateString() : ''}
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => router.push(`/deal/${deal.id}`)}
                                                    className="px-3 py-1.5 text-gray-600 hover:bg-gray-200 rounded font-medium flex items-center gap-1"
                                                >
                                                    View Deal
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
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-bold text-midnight">Internal Notes</h2>
                        {!isEditingNotes && (
                            <button
                                onClick={() => setIsEditingNotes(true)}
                                className="px-3 py-1.5 text-teal hover:bg-teal/10 rounded font-medium flex items-center gap-1"
                            >
                                <Edit2 className="w-4 h-4" />
                                Edit
                            </button>
                        )}
                    </div>
                    <p className="text-xs text-gray-500 mb-3">Only visible to your team</p>

                    {isEditingNotes ? (
                        <div>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                maxLength={1000}
                                rows={5}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal outline-none"
                                placeholder="Add internal notes about this participant..."
                            />
                            <div className="flex items-center justify-between mt-2">
                                <span className="text-xs text-gray-500">{notes.length}/1000 characters</span>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => {
                                            setNotes(participant.internalNotes || '');
                                            setIsEditingNotes(false);
                                        }}
                                        className="px-3 py-1.5 text-gray-600 hover:bg-gray-100 rounded font-medium"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleSaveNotes}
                                        disabled={saveStatus === 'saving'}
                                        className="px-3 py-1.5 bg-teal text-white rounded font-bold hover:bg-teal/90 disabled:opacity-50"
                                    >
                                        {saveStatus === 'saving' ? 'Saving...' : 'Save'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-gray-700 whitespace-pre-wrap">
                            {participant.internalNotes || <span className="text-gray-400 italic">No notes yet</span>}
                        </div>
                    )}

                    {saveStatus === 'saved' && (
                        <div className="mt-2 text-sm text-green-600 flex items-center gap-1">
                            <Check className="w-4 h-4" />
                            Saved successfully
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
