import { NextResponse } from 'next/server';
import { sendInviteEmail } from '@/lib/emailService';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { email, templateType } = body;

        if (!email) {
            return NextResponse.json({ error: 'Email is required' }, { status: 400 });
        }

        // Set mock data based on template requested
        const isBg = templateType === 'bg';

        const mockName = isBg ? 'Иван Петров' : 'Sarah Jenkins';
        const mockRole = 'investor';
        const mockLink = 'https://dealroom.online/auth/preview-only';

        const result = await sendInviteEmail(
            email,
            mockName,
            mockLink,
            mockRole,
            undefined, // isExistingUser (renders the Deal context)
        );

        if (!result.success) {
            throw new Error(result.error || 'Failed to send preview email');
        }

        return NextResponse.json({ success: true, message: 'Preview sent successfully' });
    } catch (error: any) {
        console.error('Preview email error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to send preview' },
            { status: 500 }
        );
    }
}
