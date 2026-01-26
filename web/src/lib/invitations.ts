// Invitation Token Management
// TODO: Move to database when deploying

export interface InvitationData {
    email: string;
    dealId: string;
    participantId: string;
    name: string;
    role: string;
    createdAt: string;
    expiresAt: string;
}

const INVITATION_EXPIRY_DAYS = 7;

export function generateInviteToken(
    email: string,
    dealId: string,
    participantId: string,
    name: string,
    role: string
): string {
    const token = `inv_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    const invitationData: InvitationData = {
        email,
        dealId,
        participantId,
        name,
        role,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + INVITATION_EXPIRY_DAYS * 24 * 60 * 60 * 1000).toISOString()
    };

    // Store in localStorage (TODO: Move to database)
    if (typeof window !== 'undefined') {
        localStorage.setItem(`invitation_${token}`, JSON.stringify(invitationData));
    }

    return token;
}

export function getInvitationData(token: string): InvitationData | null {
    if (typeof window === 'undefined') return null;

    const data = localStorage.getItem(`invitation_${token}`);
    if (!data) return null;

    try {
        const invitation: InvitationData = JSON.parse(data);

        // Check if expired
        if (new Date(invitation.expiresAt) < new Date()) {
            localStorage.removeItem(`invitation_${token}`);
            return null;
        }

        return invitation;
    } catch {
        return null;
    }
}

export function invalidateInvitation(token: string): void {
    if (typeof window !== 'undefined') {
        localStorage.removeItem(`invitation_${token}`);
    }
}

export function isInvitationValid(token: string): boolean {
    return getInvitationData(token) !== null;
}
