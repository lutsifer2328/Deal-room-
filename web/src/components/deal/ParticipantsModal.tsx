'use client';

import { Deal, Participant, Role } from '@/lib/types';
import { X, UserPlus, Trash2, Mail, Phone, User, Edit2, Check, XCircle, Eye, Download, Send } from 'lucide-react';
import { useState } from 'react';
import { useData } from '@/lib/store';
import { generateInviteToken } from '@/lib/invitations';
import { sendInvitationEmail } from '@/lib/emailService';

export default function ParticipantsModal({ deal, onClose }: { deal: Deal, onClose: () => void }) {
    const { addParticipant, removeParticipant, updateParticipant, deals } = useData();

    // Get fresh deal data from store to see newly added participants
    const freshDeal = (deal && deals) ? (deals.find(d => d && d.id === deal.id) || deal) : deal;

    const [isAddingNew, setIsAddingNew] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<Partial<Participant>>({});
    const [newParticipant, setNewParticipant] = useState({
        fullName: '',
        email: '',
        phone: '',
        role: 'buyer' as Role,
        canViewDocuments: true,
        canDownload: true,
        documentPermissions: { canViewRoles: [] as Role[] }
    });

    // Get all unique roles in the deal (excluding lawyer)
    const availableRoles = Array.from(new Set(
        (freshDeal?.participants || [])
            .filter(p => p && p.isActive && p.role && p.role !== 'lawyer')
            .map(p => p.role)
    ));

    const [sendingInvite, setSendingInvite] = useState(false);
    const [inviteSuccess, setInviteSuccess] = useState('');

    const handleAddParticipant = async () => {
        if (!newParticipant.fullName || !newParticipant.email) {
            alert('Name and email are required');
            return;
        }

        if (!deal?.id) {
            alert('Invalid deal');
            return;
        }

        // Generate participant ID
        const participantId = `p_${Date.now()}_${Math.random()}`;

        // Generate invitation token
        const token = generateInviteToken(
            newParticipant.email,
            deal.id,
            participantId,
            newParticipant.fullName,
            newParticipant.role
        );

        // Add participant to deal
        addParticipant(deal.id, {
            ...newParticipant,
            isActive: true,
            hasAcceptedInvite: false,
            invitationToken: token,
            invitedAt: new Date().toISOString()
        });

        // Send invitation email
        setSendingInvite(true);
        const emailSent = await sendInvitationEmail(
            newParticipant.email,
            newParticipant.fullName,
            deal.title || 'Deal',
            deal.propertyAddress || '',
            newParticipant.role,
            'Elena Petrova', // TODO: Get from current user
            token
        );

        if (emailSent) {
            setInviteSuccess(`✅ Invitation sent to ${newParticipant.email}`);
            setTimeout(() => setInviteSuccess(''), 5000);
        }
        setSendingInvite(false);

        setIsAddingNew(false);
        setNewParticipant({
            fullName: '',
            email: '',
            phone: '',
            role: 'buyer',
            canViewDocuments: true,
            canDownload: true,
            documentPermissions: { canViewRoles: [] }
        });
    };

    const handleRemoveParticipant = (participantId: string) => {
        if (!deal?.id) return;
        if (confirm('Are you sure you want to remove this participant?')) {
            removeParticipant(deal.id, participantId);
        }
    };

    const startEdit = (participant: Participant) => {
        setEditingId(participant.id);
        setEditForm({
            ...participant,
            documentPermissions: participant.documentPermissions || { canViewRoles: [] }
        });
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditForm({});
    };

    const saveEdit = () => {
        if (!deal?.id) return;
        if (editingId && editForm.fullName && editForm.email) {
            updateParticipant(deal.id, editingId, editForm);
            setEditingId(null);
            setEditForm({});
        } else {
            alert('Name and email are required');
        }
    };

    const toggleRolePermission = (role: Role) => {
        const currentRoles = editForm.documentPermissions?.canViewRoles || [];
        const newRoles = currentRoles.includes(role)
            ? currentRoles.filter(r => r !== role)
            : [...currentRoles, role];

        setEditForm({
            ...editForm,
            documentPermissions: { canViewRoles: newRoles }
        });
    };

    const toggleNewParticipantRole = (role: Role) => {
        const currentRoles = newParticipant.documentPermissions.canViewRoles;
        const newRoles = currentRoles.includes(role)
            ? currentRoles.filter(r => r !== role)
            : [...currentRoles, role];

        setNewParticipant({
            ...newParticipant,
            documentPermissions: { canViewRoles: newRoles }
        });
    };

    const getRoleColor = (role: Role | string) => {
        const colors: Partial<Record<Role | string, string>> = {
            'buyer': 'bg-teal/10 text-teal',
            'seller': 'bg-blue-100 text-blue-700',
            'lawyer': 'bg-gold/10 text-gold',
            'agent': 'bg-purple-100 text-purple-700',
            'broker': 'bg-purple-100 text-purple-700',
            'attorney': 'bg-orange-100 text-orange-700',
            'notary': 'bg-green-100 text-green-700',
            'bank_representative': 'bg-gray-100 text-gray-700',
            'admin': 'bg-red-100 text-red-700',
            'staff': 'bg-green-100 text-green-700',
            'viewer': 'bg-gray-100 text-gray-700'
        };
        return colors[role] || 'bg-gray-100 text-gray-700';
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[85vh] overflow-hidden animate-in fade-in zoom-in duration-200">

                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-midnight text-white">
                    <h2 className="text-lg font-bold flex items-center gap-2">
                        <User className="w-5 h-5" />
                        Manage Participants & Permissions
                    </h2>
                    <button onClick={onClose} className="text-white/80 hover:text-white">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Success Message */}
                {inviteSuccess && (
                    <div className="mx-6 mt-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
                        <Send className="w-4 h-4" />
                        {inviteSuccess}
                    </div>
                )}

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-[calc(85vh-140px)]">
                    <div className="space-y-4">
                        {(freshDeal?.participants || []).filter(p => p && p.isActive).map((participant) => (
                            <div key={participant.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                                {editingId === participant.id ? (
                                    // EDIT MODE
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="block text-xs font-medium text-gray-700 mb-1">Full Name *</label>
                                                <input
                                                    type="text"
                                                    value={editForm.fullName || ''}
                                                    onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                                                    className="w-full px-3 py-2 rounded border border-gray-300 text-sm focus:ring-2 focus:ring-teal outline-none"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-gray-700 mb-1">Email *</label>
                                                <input
                                                    type="email"
                                                    value={editForm.email || ''}
                                                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                                                    className="w-full px-3 py-2 rounded border border-gray-300 text-sm focus:ring-2 focus:ring-teal outline-none"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-gray-700 mb-1">Phone</label>
                                                <input
                                                    type="tel"
                                                    value={editForm.phone || ''}
                                                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                                                    className="w-full px-3 py-2 rounded border border-gray-300 text-sm focus:ring-2 focus:ring-teal outline-none"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-gray-700 mb-1">Role *</label>
                                                <select
                                                    value={editForm.role || 'buyer'}
                                                    onChange={(e) => setEditForm({ ...editForm, role: e.target.value as Role })}
                                                    className="w-full px-3 py-2 rounded border border-gray-300 text-sm bg-white outline-none"
                                                >
                                                    <option value="buyer">Buyer</option>
                                                    <option value="seller">Seller</option>
                                                    <option value="broker">Broker (Agent)</option>
                                                    <option value="attorney">Attorney</option>
                                                    <option value="notary">Notary</option>
                                                    <option value="bank_representative">Bank Representative</option>
                                                </select>
                                            </div>
                                        </div>

                                        {/* Permissions Section */}
                                        <div className="border-t pt-3">
                                            <h4 className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                                                <Eye className="w-4 h-4" /> Document Access Permissions
                                            </h4>

                                            <div className="space-y-2 mb-3">
                                                <label className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-100 p-2 rounded">
                                                    <input
                                                        type="checkbox"
                                                        checked={editForm.canViewDocuments || false}
                                                        onChange={(e) => setEditForm({ ...editForm, canViewDocuments: e.target.checked })}
                                                        className="w-4 h-4"
                                                    />
                                                    <span className="font-medium">Can view ALL documents</span>
                                                </label>

                                                <label className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-100 p-2 rounded">
                                                    <input
                                                        type="checkbox"
                                                        checked={editForm.canDownload !== false}
                                                        onChange={(e) => setEditForm({ ...editForm, canDownload: e.target.checked })}
                                                        className="w-4 h-4"
                                                    />
                                                    <Download className="w-4 h-4" />
                                                    <span className="font-medium">Can download documents</span>
                                                </label>
                                            </div>

                                            {!editForm.canViewDocuments && availableRoles.length > 0 && (
                                                <div className="bg-blue-50 border border-blue-200 rounded p-3">
                                                    <p className="text-xs font-medium text-blue-800 mb-2">Select which roles' documents this person CAN view:</p>
                                                    <div className="space-y-1">
                                                        {availableRoles.map(role => (
                                                            <label key={role} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-blue-100 p-2 rounded">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={editForm.documentPermissions?.canViewRoles?.includes(role) || false}
                                                                    onChange={() => toggleRolePermission(role)}
                                                                    className="w-4 h-4"
                                                                />
                                                                <span className={`text-xs font-bold px-2 py-0.5 rounded uppercase ${getRoleColor(role)}`}>
                                                                    {role.replace('_', ' ')}
                                                                </span>
                                                                documents
                                                            </label>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex justify-end gap-2 pt-2">
                                            <button
                                                onClick={cancelEdit}
                                                className="px-3 py-1.5 text-gray-600 hover:bg-gray-200 rounded font-medium text-sm flex items-center gap-1"
                                            >
                                                <XCircle className="w-4 h-4" /> Cancel
                                            </button>
                                            <button
                                                onClick={saveEdit}
                                                className="px-3 py-1.5 bg-teal text-white rounded font-bold text-sm hover:bg-teal/90 flex items-center gap-1"
                                            >
                                                <Check className="w-4 h-4" /> Save Changes
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    // VIEW MODE
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <div className="w-10 h-10 rounded-full bg-teal flex items-center justify-center text-white font-bold">
                                                    {participant.fullName.charAt(0)}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-midnight">{participant.fullName}</div>
                                                    <span className={`text-xs font-bold px-2 py-0.5 rounded uppercase ${getRoleColor(participant.role)}`}>
                                                        {participant.role.replace('_', ' ')}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="ml-13 space-y-1 text-sm">
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
                                                <div className="text-xs space-y-0.5 mt-2">
                                                    <div className={participant.canViewDocuments ? 'text-green-600 font-medium' : 'text-gray-500'}>
                                                        {participant.canViewDocuments ? '✓ Can view all documents' : '○ Limited document access'}
                                                    </div>
                                                    {!participant.canViewDocuments && participant.documentPermissions?.canViewRoles && participant.documentPermissions.canViewRoles.length > 0 && (
                                                        <div className="text-gray-600 ml-3">
                                                            → Can view: {participant.documentPermissions.canViewRoles.map(r => r.toUpperCase()).join(', ')} docs
                                                        </div>
                                                    )}
                                                    <div className={participant.canDownload !== false ? 'text-green-600 font-medium' : 'text-red-600'}>
                                                        {participant.canDownload !== false ? '✓ Can download' : '✗ Cannot download'}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => startEdit(participant)}
                                                className="p-2 text-teal hover:bg-teal/10 rounded transition-colors"
                                                title="Edit participant"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleRemoveParticipant(participant.id)}
                                                className="p-2 text-red-500 hover:bg-red-50 rounded transition-colors"
                                                title="Remove participant"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}

                        {/* Add New Section (Similar permissions UI) */}
                        {isAddingNew ? (
                            <div className="p-4 bg-teal/5 rounded-lg border-2 border-teal/20">
                                <h3 className="text-sm font-bold text-teal uppercase mb-3 flex items-center gap-2">
                                    <UserPlus className="w-4 h-4" /> Add New Participant
                                </h3>
                                <div className="grid grid-cols-2 gap-3 mb-3">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">Full Name *</label>
                                        <input
                                            type="text"
                                            value={newParticipant.fullName}
                                            onChange={(e) => setNewParticipant({ ...newParticipant, fullName: e.target.value })}
                                            className="w-full px-3 py-2 rounded border border-gray-300 text-sm focus:ring-2 focus:ring-teal outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">Email *</label>
                                        <input
                                            type="email"
                                            value={newParticipant.email}
                                            onChange={(e) => setNewParticipant({ ...newParticipant, email: e.target.value })}
                                            className="w-full px-3 py-2 rounded border border-gray-300 text-sm focus:ring-2 focus:ring-teal outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">Phone</label>
                                        <input
                                            type="tel"
                                            value={newParticipant.phone}
                                            onChange={(e) => setNewParticipant({ ...newParticipant, phone: e.target.value })}
                                            className="w-full px-3 py-2 rounded border border-gray-300 text-sm focus:ring-2 focus:ring-teal outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">Role *</label>
                                        <select
                                            value={newParticipant.role}
                                            onChange={(e) => setNewParticipant({ ...newParticipant, role: e.target.value as Role })}
                                            className="w-full px-3 py-2 rounded border border-gray-300 text-sm bg-white outline-none"
                                        >
                                            <option value="buyer">Buyer</option>
                                            <option value="seller">Seller</option>
                                            <option value="broker">Broker (Agent)</option>
                                            <option value="attorney">Attorney</option>
                                            <option value="notary">Notary</option>
                                            <option value="bank_representative">Bank Representative</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Permissions for new participant */}
                                <div className="space-y-2 mb-3">
                                    <label className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-100 p-2 rounded">
                                        <input
                                            type="checkbox"
                                            checked={newParticipant.canViewDocuments}
                                            onChange={(e) => setNewParticipant({ ...newParticipant, canViewDocuments: e.target.checked })}
                                            className="w-4 h-4"
                                        />
                                        <span className="font-medium">Can view ALL documents</span>
                                    </label>

                                    <label className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-100 p-2 rounded">
                                        <input
                                            type="checkbox"
                                            checked={newParticipant.canDownload}
                                            onChange={(e) => setNewParticipant({ ...newParticipant, canDownload: e.target.checked })}
                                            className="w-4 h-4"
                                        />
                                        <Download className="w-4 h-4" />
                                        <span className="font-medium">Can download documents</span>
                                    </label>
                                </div>

                                {!newParticipant.canViewDocuments && availableRoles.length > 0 && (
                                    <div className="bg-blue-50 border border-blue-200 rounded p-3 mb-3">
                                        <p className="text-xs font-medium text-blue-800 mb-2">Select which roles' documents this person CAN view:</p>
                                        <div className="space-y-1">
                                            {availableRoles.map(role => (
                                                <label key={role} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-blue-100 p-2 rounded">
                                                    <input
                                                        type="checkbox"
                                                        checked={newParticipant.documentPermissions.canViewRoles.includes(role)}
                                                        onChange={() => toggleNewParticipantRole(role)}
                                                        className="w-4 h-4"
                                                    />
                                                    <span className={`text-xs font-bold px-2 py-0.5 rounded uppercase ${getRoleColor(role)}`}>
                                                        {role.replace('_', ' ')}
                                                    </span>
                                                    documents
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="flex justify-end gap-2">
                                    <button
                                        onClick={() => setIsAddingNew(false)}
                                        className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded font-medium"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleAddParticipant}
                                        className="px-4 py-2 bg-teal text-white rounded font-bold hover:bg-teal/90"
                                    >
                                        Add Participant
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <button
                                onClick={() => setIsAddingNew(true)}
                                className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-teal hover:text-teal hover:bg-teal/5 transition-all font-medium flex items-center justify-center gap-2"
                            >
                                <UserPlus className="w-5 h-5" /> Add New Participant
                            </button>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-midnight text-white font-bold rounded-lg hover:bg-midnight/90"
                    >
                        Done
                    </button>
                </div>
            </div>
        </div>
    );
}
