'use client';

import { Deal, Participant, Role, GlobalParticipant } from '@/lib/types';
import { X, UserPlus, Trash2, Mail, Phone, User, Edit2, Check, XCircle, Eye, Download, Send } from 'lucide-react';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Modal, ModalHeader, ModalContent, ModalFooter } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useData } from '@/lib/store';
import { generateInviteToken } from '@/lib/invitations';
import { sendInvitationEmail } from '@/lib/emailService';
import DuplicateDetectionModal from '@/components/participants/DuplicateDetectionModal';

export default function ParticipantsModal({ deal, onClose, isOpen = true }: { deal: Deal, onClose: () => void, isOpen?: boolean }) {
    const { addParticipant, removeParticipant, updateParticipant, deals, checkDuplicateEmail, getParticipantDeals, users, inviteParticipant } = useData();

    // Get fresh deal data from store to see newly added participants
    const freshDeal = (deal && deals) ? (deals.find(d => d && d.id === deal.id) || deal) : deal;

    const [isAddingNew, setIsAddingNew] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<Partial<Participant>>({});
    const [isInternalUser, setIsInternalUser] = useState(false);
    const defaultParticipantState = {
        fullName: '',
        email: '',
        phone: '',
        agency: '',
        role: 'buyer' as Role,
        userId: undefined as string | undefined,
        canViewDocuments: true,
        canDownload: true,
        documentPermissions: { canViewRoles: [] as Role[] }
    };
    const [newParticipant, setNewParticipant] = useState(defaultParticipantState);

    useEffect(() => {
        if (!isOpen) {
            setIsAddingNew(false);
            setEditingId(null);
            setEditForm({});
            setIsInternalUser(false);
            setNewParticipant(defaultParticipantState);
            setShowDuplicateModal(false);
            setDuplicateParticipant(null);
            setPendingParticipantData(null);
        }
    }, [isOpen]);


    // Get list of internal staff/agents for dropdown
    const internalStaff = Object.values(users).filter(u =>
        (u.role === 'staff' || u.role === 'agent' || u.role === 'admin' || u.role === 'lawyer') && u.isActive
    );

    // Get all unique roles in the deal (excluding lawyer)
    const availableRoles = Array.from(new Set(
        (freshDeal?.participants || [])
            .filter(p => p && p.isActive && p.role && p.role !== 'lawyer')
            .map(p => p.role)
    ));

    const [sendingInvite, setSendingInvite] = useState(false);
    const [inviteSuccess, setInviteSuccess] = useState('');

    // Duplicate detection state
    const [duplicateParticipant, setDuplicateParticipant] = useState<GlobalParticipant | null>(null);
    const [showDuplicateModal, setShowDuplicateModal] = useState(false);
    const [pendingParticipantData, setPendingParticipantData] = useState<any>(null);

    const [confirmedDuplicateEmail, setConfirmedDuplicateEmail] = useState<string | null>(null);

    const handleEmailBlur = () => {
        if (newParticipant.email.trim() && newParticipant.email !== confirmedDuplicateEmail) {
            const duplicate = checkDuplicateEmail(newParticipant.email);
            if (duplicate) {
                // Show modal immediately when duplicate is detected
                setPendingParticipantData(newParticipant);
                setDuplicateParticipant(duplicate);
                setShowDuplicateModal(true);
            } else {
                setDuplicateParticipant(null);
            }
        }
    };

    const handleAddParticipant = async () => {
        if (!newParticipant.fullName || !newParticipant.email) {
            alert('Name and email are required');
            return;
        }

        if (!deal?.id) {
            alert('Invalid deal');
            return;
        }

        // Check for duplicate email (skip if already confirmed)
        if (newParticipant.email !== confirmedDuplicateEmail) {
            const duplicate = checkDuplicateEmail(newParticipant.email);
            if (duplicate) {
                // Store pending data and show duplicate modal
                setPendingParticipantData(newParticipant);
                setDuplicateParticipant(duplicate);
                setShowDuplicateModal(true);
                return;
            }
        }

        // No duplicate or confirmed, proceed with adding
        await proceedWithAddingParticipant(newParticipant);
        setConfirmedDuplicateEmail(null); // Reset after add
    };

    const proceedWithAddingParticipant = async (participantData: any) => {
        if (!deal?.id) return;

        // Generate participant ID
        const participantId = `p_${Date.now()}_${Math.random()}`;

        // Add participant to deal WITHOUT sending invite
        addParticipant(deal.id, {
            ...participantData,
            isActive: true,
            hasAcceptedInvite: false,
            invitationToken: undefined, // Will be generated when inviting
            invitedAt: undefined,
            // Ensure permissions are correctly mapped
            documentPermissions: participantData.documentPermissions || { canViewRoles: [] }
        });

        setIsAddingNew(false);
        setNewParticipant({
            fullName: '',
            email: '',
            phone: '',
            agency: '',
            role: 'buyer',
            userId: undefined,
            canViewDocuments: true,
            canDownload: true,
            documentPermissions: { canViewRoles: [] }
        });
        setConfirmedDuplicateEmail(null);
    };

    const handleUseExisting = async () => {
        if (!duplicateParticipant || !pendingParticipantData) return;

        // JUST UPDATE FORM, DO NOT ADD YET
        setNewParticipant({
            ...pendingParticipantData,
            fullName: duplicateParticipant.name,
            email: duplicateParticipant.email,
            phone: duplicateParticipant.phone || pendingParticipantData.phone,
            // Keep the role currently selected (likely from pendingData)
        });

        setConfirmedDuplicateEmail(duplicateParticipant.email);
        setShowDuplicateModal(false);
        setDuplicateParticipant(null);
        setPendingParticipantData(null);
    };

    const handleCreateNew = async () => {
        if (!pendingParticipantData) return;

        setShowDuplicateModal(false);
        await proceedWithAddingParticipant(pendingParticipantData);
        setDuplicateParticipant(null);
        setPendingParticipantData(null);
    };

    const handleCancelDuplicate = () => {
        setShowDuplicateModal(false);
        setDuplicateParticipant(null);
        setPendingParticipantData(null);
    };

    const handleRemoveParticipant = (participantId: string) => {
        console.log('DEBUG: handleRemoveParticipant clicked', participantId);
        if (!deal?.id) {
            console.error('DEBUG: No deal ID found');
            return;
        }
        if (confirm('Are you sure you want to remove this participant?')) {
            console.log('DEBUG: Confirmed. Calling removeParticipant...', deal.id, participantId);
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

    const handleSendInvite = async (participant: Participant) => {
        if (!deal?.id) return;

        setSendingInvite(true);

        const success = await inviteParticipant(participant.email, participant.fullName, participant.role);

        if (success) {
            // Update participant state to show they are invited
            updateParticipant(deal.id, participant.id, {
                invitationToken: 'sent_via_supa', // Placeholder to indicate invited
                invitedAt: new Date().toISOString()
            });

            setInviteSuccess(`✅ Invitation sent to ${participant.email}`);
            setTimeout(() => setInviteSuccess(''), 5000);
        }
        setSendingInvite(false);
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



    // Portal to body
    return (
        <Modal isOpen={isOpen} onClose={onClose} size="3xl">
            {/* Header */}
            <ModalHeader onClose={onClose} className="bg-midnight text-white">
                <div className="flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Manage Participants & Permissions
                </div>
            </ModalHeader>

            {/* Success Message */}
            <AnimatePresence>
                {inviteSuccess && (
                    <motion.div
                        initial={{ opacity: 0, height: 0, marginTop: 0 }}
                        animate={{ opacity: 1, height: 'auto', marginTop: 16 }}
                        exit={{ opacity: 0, height: 0, marginTop: 0 }}
                        className="mx-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2 flex-shrink-0 overflow-hidden"
                    >
                        <Send className="w-4 h-4" />
                        {inviteSuccess}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Content */}
            <ModalContent>
                <div className="space-y-4">
                    {/* Add New Section */}
                    {isAddingNew ? (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="p-4 bg-teal/5 rounded-lg border-2 border-teal/20"
                        >
                            <h3 className="text-sm font-bold text-teal uppercase mb-3 flex items-center gap-2">
                                <UserPlus className="w-4 h-4" /> Add New Participant
                            </h3>

                            {/* Toggle: Internal vs External */}
                            <div className="flex gap-4 mb-4 border-b border-gray-200 pb-4">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="userType"
                                        checked={!isInternalUser}
                                        onChange={() => {
                                            setIsInternalUser(false);
                                            setNewParticipant({ ...newParticipant, userId: undefined, fullName: '', email: '', role: 'buyer' });
                                        }}
                                        className="w-4 h-4 text-teal focus:ring-teal"
                                    />
                                    <span className="text-sm font-bold text-navy-primary">External Client/Agent</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="userType"
                                        checked={isInternalUser}
                                        onChange={() => setIsInternalUser(true)}
                                        className="w-4 h-4 text-teal focus:ring-teal"
                                    />
                                    <span className="text-sm font-bold text-navy-primary">Internal Team Member</span>
                                </label>
                            </div>

                            <div className="grid grid-cols-2 gap-3 mb-3">
                                {isInternalUser ? (
                                    // INTERNAL USER SELECTION
                                    <div className="col-span-2 space-y-3">
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1">Select Team Member</label>
                                            <select
                                                onChange={(e) => {
                                                    const selectedUser = users[e.target.value];
                                                    if (selectedUser) {
                                                        setNewParticipant({
                                                            ...newParticipant,
                                                            userId: selectedUser.id,
                                                            fullName: selectedUser.name,
                                                            email: selectedUser.email,
                                                            // Default to 'agent' if they are staff/agent, otherwise keep their role or default logic
                                                            role: (selectedUser.role === 'staff' || selectedUser.role === 'agent') ? 'agent' : (selectedUser.role as Role),
                                                            agency: 'Agenzia'
                                                        });
                                                    }
                                                }}
                                                className="w-full px-3 py-2 rounded border border-gray-300 text-sm bg-white outline-none focus:ring-2 focus:ring-teal"
                                            >
                                                <option value="">Select a user...</option>
                                                {internalStaff.map(u => (
                                                    <option key={u.id} value={u.id}>
                                                        {u.name} ({u.role.toUpperCase()}) - {u.email}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Role Selector for Internal User */}
                                        {newParticipant.userId && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                            >
                                                <label className="block text-xs font-medium text-gray-700 mb-1">Role in this Deal</label>
                                                <div className="flex gap-2 p-2 bg-gray-50 rounded border border-gray-200">
                                                    <select
                                                        value={newParticipant.role}
                                                        onChange={(e) => setNewParticipant({ ...newParticipant, role: e.target.value as Role })}
                                                        className="flex-1 bg-transparent text-sm font-bold text-navy-primary outline-none"
                                                    >
                                                        <option value="agent">Broker (Agent)</option>
                                                        <option value="staff">Staff Support</option>
                                                        <option value="lawyer">Lawyer</option>
                                                        <option value="admin">Admin</option>
                                                        <option value="viewer">Viewer</option>
                                                    </select>
                                                </div>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    Internal members usually act as <b>Brokers</b> or <b>Staff Support</b>.
                                                </p>
                                            </motion.div>
                                        )}
                                    </div>
                                ) : (
                                    // EXTERNAL USER FORM
                                    <>
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
                                                onBlur={handleEmailBlur}
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
                                                <option value="agent">Broker (Agent)</option>
                                                <option value="attorney">Attorney</option>
                                                <option value="notary">Notary</option>
                                                <option value="bank_representative">Bank Representative</option>
                                            </select>
                                        </div>
                                        {/* Agency Field for Brokers */}
                                        {newParticipant.role === 'agent' && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                className="col-span-2"
                                            >
                                                <label className="block text-xs font-bold text-navy-primary mb-1">Agency Name</label>
                                                <input
                                                    type="text"
                                                    value={newParticipant.agency}
                                                    onChange={(e) => setNewParticipant({ ...newParticipant, agency: e.target.value })}
                                                    placeholder="e.g. Century 21, Remax, etc."
                                                    className="w-full px-3 py-2 rounded border border-gray-300 text-sm focus:ring-2 focus:ring-teal outline-none shadow-sm"
                                                />
                                            </motion.div>
                                        )}
                                    </>
                                )}
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
                                <Button
                                    onClick={() => {
                                        setIsAddingNew(false);
                                        setIsInternalUser(false);
                                    }}
                                    variant="ghost"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleAddParticipant}
                                    variant="primary"
                                >
                                    Add Participant
                                </Button>
                            </div>
                        </motion.div>
                    ) : (
                        <Button
                            onClick={() => setIsAddingNew(true)}
                            variant="outline"
                            className="w-full py-3 border-dashed border-2 hover:bg-teal/5 flex gap-2"
                        >
                            <UserPlus className="w-5 h-5" /> Add New Participant
                        </Button>
                    )}

                    {/* Existing Participants List */}
                    {(freshDeal?.participants || []).filter(p => p && p.isActive).map((participant) => (
                        <div key={participant.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                            {editingId === participant.id ? (
                                // EDIT MODE
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="space-y-4"
                                >
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
                                                <p className="text-xs font-medium text-blue-800 mb-2">Select which roles&apos; documents this person CAN view:</p>
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
                                        <Button
                                            onClick={cancelEdit}
                                            variant="ghost"
                                            size="sm"
                                            className="flex gap-1"
                                        >
                                            <XCircle className="w-4 h-4" /> Cancel
                                        </Button>
                                        <Button
                                            onClick={saveEdit}
                                            variant="primary"
                                            size="sm"
                                            className="flex gap-1"
                                        >
                                            <Check className="w-4 h-4" /> Save Changes
                                        </Button>
                                    </div>
                                </motion.div>
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
                                                <Badge className={getRoleColor(participant.role)}>
                                                    {participant.role.replace('_', ' ')}
                                                </Badge>
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
                                        {!participant.invitedAt ? (
                                            <Button
                                                onClick={() => handleSendInvite(participant)}
                                                variant="outline"
                                                size="sm"
                                                className="text-teal border-teal/20 hover:bg-teal/5 h-8 px-2 text-xs flex items-center gap-1"
                                                title="Send Invitation Email"
                                            >
                                                <Send className="w-3 h-3" /> Invite
                                            </Button>
                                        ) : (
                                            <div className="px-2 py-1 bg-green-50 text-green-700 text-xs rounded border border-green-200 flex items-center h-8">
                                                Invited
                                            </div>
                                        )}
                                        <Button
                                            onClick={() => startEdit(participant)}
                                            variant="ghost"
                                            size="icon"
                                            className="text-teal hover:bg-teal/10"
                                            title="Edit participant"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </Button>
                                        <Button
                                            onClick={() => handleRemoveParticipant(participant.id)}
                                            variant="ghost"
                                            size="icon"
                                            className="text-red-500 hover:bg-red-50"
                                            title="Remove participant"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </ModalContent>

            <ModalFooter>
                <Button
                    onClick={() => {
                        if (editingId) {
                            saveEdit();
                        }
                        onClose();
                    }}
                    variant="secondary"
                >
                    {editingId ? 'Save & Close' : 'Done'}
                </Button>
            </ModalFooter>

            {/* Duplicate Detection Modal */}
            {
                showDuplicateModal && duplicateParticipant && (
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
                )
            }
        </Modal>
    );
}
