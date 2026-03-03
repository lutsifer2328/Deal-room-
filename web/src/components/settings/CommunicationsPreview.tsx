'use client';

import { useState } from 'react';
import { Mail, Smartphone, Monitor, RefreshCw, Send } from 'lucide-react';
import { useData } from '@/lib/store';

export default function CommunicationsPreview() {
    const { addNotification } = useData();
    const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop');
    const [mockType, setMockType] = useState<'bg' | 'en'>('bg');
    const [testEmail, setTestEmail] = useState('');
    const [isSending, setIsSending] = useState(false);

    // Mock data based on type
    const isBg = mockType === 'bg';
    const mockName = isBg ? 'Иван Петров' : 'Sarah Jenkins';
    const greeting = isBg ? `Здравейте <strong>${mockName}</strong>,` : `Hello <strong>${mockName}</strong>,`;
    const introText = isBg
        ? `Каним Ви в <strong>Agenzia Deal Room</strong> — защитен портал за Вашите имотни трансакции.`
        : `You are invited to the <strong>Agenzia Deal Room</strong> — a high-security portal for your property portfolio.`;

    const handleSendTest = async () => {
        if (!testEmail || !testEmail.includes('@')) {
            addNotification('warning', 'Invalid Email', 'Please enter a valid email address.');
            return;
        }

        setIsSending(true);
        try {
            const res = await fetch('/api/preview-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: testEmail, templateType: mockType })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to send preview');

            addNotification('success', 'Preview Sent', `Test email successfully dispatched to ${testEmail}`);
        } catch (error: any) {
            console.error(error);
            addNotification('error', 'Send Failed', error.message);
        } finally {
            setIsSending(false);
        }
    };

    // We build the visual HTML using classes directly matching the actual email where possible for a 1:1 look 
    // Since we are in an iframe or standard div, tailwind is easiest to visualize it here, 
    // but we'll try to match the exact aesthetic from the emailService.
    return (
        <div className="bg-white rounded-2xl shadow-sm border border-navy-primary/10 overflow-hidden flex flex-col h-full min-h-[600px]">
            {/* Header Controls */}
            <div className="px-6 py-4 border-b border-gray-100 flex flex-wrap items-center justify-between gap-4 bg-gray-50/50">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-teal/10 rounded-lg text-teal">
                        <Mail className="w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-navy-primary">Communications Preview</h2>
                        <p className="text-sm text-text-light">Live view of automated system emails</p>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    {/* Device Toggle */}
                    <div className="flex bg-white rounded-lg border border-gray-200 p-0.5">
                        <button
                            onClick={() => setViewMode('desktop')}
                            className={`p-1.5 rounded-md transition-all ${viewMode === 'desktop' ? 'bg-navy-primary text-white shadow' : 'text-gray-400 hover:text-navy-primary'}`}
                            title="Desktop View"
                        >
                            <Monitor className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setViewMode('mobile')}
                            className={`p-1.5 rounded-md transition-all ${viewMode === 'mobile' ? 'bg-navy-primary text-white shadow' : 'text-gray-400 hover:text-navy-primary'}`}
                            title="Mobile View"
                        >
                            <Smartphone className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Content Toggle */}
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Mock Data</span>
                        <select
                            value={mockType}
                            onChange={(e) => setMockType(e.target.value as 'bg' | 'en')}
                            className="bg-white border border-gray-200 rounded-lg text-sm font-medium py-1.5 pl-3 pr-8 focus:ring-2 focus:ring-teal/20 focus:border-teal outline-none"
                        >
                            <option value="bg">Bulgarian Investor</option>
                            <option value="en">Global Partner (EN)</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Main Preview Area */}
            <div className="flex-1 bg-gray-100 p-8 flex justify-center overflow-y-auto">
                <div className={`transition-all duration-300 ${viewMode === 'desktop' ? 'w-full max-w-[600px]' : 'w-[375px]'} flex flex-col`}>

                    {/* The Rendered Email Container */}
                    <div className="bg-white border border-gray-200 rounded text-left overflow-hidden" style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", color: "#1a1a1a", backgroundColor: "#ffffff" }}>

                        {/* Header */}
                        <div style={{ backgroundColor: "#11141b", padding: "40px 20px", textAlign: "center" }}>
                            <img src="/email-badge.png" alt="DEAL ROOM - POWERED BY AGENZIA" style={{ height: "180px", width: "auto", display: "inline-block" }} />
                        </div>

                        {/* Email Content */}
                        <div style={{ padding: "50px 60px" }}>
                            <h1 style={{ fontSize: "22px", fontWeight: 600, color: "#0f172a", marginBottom: "30px", letterSpacing: "-0.02em" }}>
                                Private Deal Room Invitation
                            </h1>

                            <p style={{ marginBottom: "20px", fontSize: "15px", color: "#475569" }} dangerouslySetInnerHTML={{ __html: greeting }} />

                            <p style={{ marginBottom: "20px", fontSize: "15px", color: "#475569" }} dangerouslySetInnerHTML={{ __html: introText }} />

                            <h3 style={{ fontSize: "14px", textTransform: "uppercase", letterSpacing: "0.1em", color: "#14b8a6", marginTop: "40px", marginBottom: "10px" }}>
                                The Experience
                            </h3>
                            <p style={{ marginBottom: "20px", fontSize: "15px", color: "#475569" }}>
                                This is your digital concierge. Access verified documents, track deal milestones, and manage sensitive communications in one centralized, encrypted hub.
                            </p>

                            <h3 style={{ fontSize: "14px", textTransform: "uppercase", letterSpacing: "0.1em", color: "#14b8a6", marginTop: "40px", marginBottom: "10px" }}>
                                Security First
                            </h3>
                            <p style={{ marginBottom: "20px", fontSize: "15px", color: "#475569" }}>
                                Your privacy is our priority. This sovereign environment ensures that all data remains confidential and protected by industry-leading security protocols.
                            </p>

                            <div style={{ margin: "50px 0" }}>
                                <a href="https://dealroom.online/auth/callback" target="_blank" rel="noopener noreferrer" style={{ display: "inline-block", background: "#0f172a", color: "#ffffff", padding: "16px 40px", textDecoration: "none", borderRadius: "2px", fontWeight: 600, fontSize: "14px", textTransform: "uppercase", letterSpacing: "0.05em", border: "none" }}>
                                    Access Deal Room
                                </a>
                            </div>

                            <div style={{ borderTop: "1px solid #f1f5f9", marginTop: "40px", paddingTop: "40px" }}>
                                <h1 style={{ fontSize: "22px", fontWeight: 600, color: "#0f172a", marginBottom: "30px", letterSpacing: "-0.02em" }}>Покана за достъп</h1>
                                <p style={{ marginBottom: "20px", fontSize: "15px", color: "#475569" }} dangerouslySetInnerHTML={{ __html: isBg ? `Здравейте, <strong>${mockName}</strong>,` : `Здравейте, <strong>Sarah Jenkins</strong>,` }} />
                                <p style={{ marginBottom: "20px", fontSize: "15px", color: "#475569" }}>Каним Ви в <strong>Agenzia Deal Room</strong> — Вашата частна и сигурна среда за професионално управление на имотни трансакции.</p>

                                <h3 style={{ fontSize: "14px", textTransform: "uppercase", letterSpacing: "0.1em", color: "#14b8a6", marginTop: "40px", marginBottom: "10px" }}>Какво е Deal Room?</h3>
                                <p style={{ marginBottom: "20px", fontSize: "15px", color: "#475569" }}>Вашият дигитален център за документация и проследяване на сделки в реално време, далеч от несигурността на стандартната кореспонденция.</p>

                                <h3 style={{ fontSize: "14px", textTransform: "uppercase", letterSpacing: "0.1em", color: "#14b8a6", marginTop: "40px", marginBottom: "10px" }}>Сигурност</h3>
                                <p style={{ marginBottom: "20px", fontSize: "15px", color: "#475569" }}>Сигурността на Вашите данни е наш приоритет. Платформата използва криптирана архитектура, гарантираща пълна конфиденциалност.</p>

                                <div style={{ margin: "50px 0" }}>
                                    <a href="https://dealroom.online/auth/callback" target="_blank" rel="noopener noreferrer" style={{ display: "inline-block", background: "#0f172a", color: "#ffffff", padding: "16px 40px", textDecoration: "none", borderRadius: "2px", fontWeight: 600, fontSize: "14px", textTransform: "uppercase", letterSpacing: "0.05em", border: "none" }}>
                                        Активирай достъп
                                    </a>
                                </div>
                            </div>
                        </div>

                        {/* Email Footer */}
                        <div style={{ padding: "40px", background: "#f8fafc", fontSize: "11px", color: "#94a3b8", borderTop: "1px solid #e2e8f0" }}>
                            <div style={{ lineHeight: "1.4" }}>
                                © 2026 AGENZIA. All rights reserved.<br />
                                This communication is confidential. Sent via our secure infrastructure at dealroom.online.
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Test Send Footer Tool */}
            <div className="p-4 border-t border-gray-100 bg-white flex items-center justify-between gap-4">
                <div className="flex-1 max-w-md flex items-center relative">
                    <input
                        type="email"
                        placeholder="Enter email to send live preview..."
                        value={testEmail}
                        onChange={(e) => setTestEmail(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2.5 pl-4 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal transition-all"
                    />
                </div>
                <button
                    onClick={handleSendTest}
                    disabled={isSending || !testEmail}
                    className="flex items-center gap-2 bg-navy-primary text-white px-5 py-2.5 rounded-lg font-bold text-sm hover:bg-navy-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isSending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    Send Live Preview to Me
                </button>
            </div>
        </div>
    );
}
