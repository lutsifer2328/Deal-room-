'use client';

import { useState, useEffect } from 'react';
import { Deal } from '@/lib/types';
import { useData } from '@/lib/store';
import { useTranslation, TranslationKey } from '@/lib/useTranslation';
import { supabase } from '@/lib/supabase';
import { ShieldCheck, Phone, Mail } from 'lucide-react';
import Avatar from '@/components/ui/Avatar';

interface LeadContact {
    name: string;
    title?: string | null;
    phone?: string | null;
    email?: string | null;
    avatarUrl?: string | null;
}

/**
 * "Managing this deal" — the Agenzia operator (deal lead) shown to every viewer
 * as the point of contact for questions or upload trouble, regardless of side.
 * This is an operator/contact role, not a claim of legal representation.
 *
 * Staff hold the lead in their in-memory users map. Participants cannot read the
 * internal users table, so they resolve the lead's public contact fields through
 * the `get_deal_lead_contact` RPC (SECURITY DEFINER, gated to deal members).
 */
export default function DealLeadCard({ deal }: { deal: Deal }) {
    const { users } = useData();
    const { t } = useTranslation();
    const [fetched, setFetched] = useState<LeadContact | null>(null);

    // Staff hold the lead in their users map — resolve synchronously, no fetch.
    const leadFromMap = deal.leadUserId ? users[deal.leadUserId] : undefined;

    useEffect(() => {
        // Only participants (who can't read the users table) need the RPC.
        if (leadFromMap || !deal.leadUserId) return;
        let cancelled = false;
        (async () => {
            const { data, error } = await supabase.rpc('get_deal_lead_contact', { p_deal_id: deal.id });
            if (cancelled) return;
            const row = Array.isArray(data) ? data[0] : data;
            // The RPC intentionally omits the lead's email; contact is by phone or
            // by replying to the deal's automated mail.
            setFetched(error || !row ? null : { name: row.name, title: row.title, phone: row.phone, avatarUrl: row.avatar_url });
        })();
        return () => { cancelled = true; };
    }, [deal.id, deal.leadUserId, leadFromMap]);

    const contact: LeadContact | null = leadFromMap
        ? { name: leadFromMap.name, title: leadFromMap.title, phone: leadFromMap.phone, email: leadFromMap.email, avatarUrl: leadFromMap.avatarUrl }
        : fetched;

    // No lead resolved (legacy deal, or RPC denied) — fall back to a neutral card.
    if (!contact) {
        return (
            <div className="bg-midnight/5 rounded-xl p-6 border border-midnight/10 sticky top-24">
                <h3 className="font-bold text-midnight mb-2">{t('deal.infoTitle')}</h3>
                <p className="text-sm text-gray-600 mb-4">
                    {t('deal.infoPrefix')} <strong>Agenzia</strong>{t('deal.infoSuffix')}
                </p>
                <div className="flex items-center gap-2 text-xs font-medium text-teal">
                    <ShieldCheck className="w-4 h-4" />
                    <span>{t('deal.encryption')}</span>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl p-6 border border-midnight/10 shadow-sm sticky top-24">
            <p className="text-xs font-bold text-teal uppercase tracking-wider mb-4">
                {t('deal.lead.managing' as TranslationKey)}
            </p>
            <div className="flex items-center gap-3 mb-4">
                <Avatar name={contact.name} avatarUrl={contact.avatarUrl} size={48} />
                <div className="min-w-0">
                    <div className="font-bold text-navy-primary truncate">{contact.name}</div>
                    <div className="text-xs text-text-light truncate">
                        {contact.title || t('role.lawyer')} · Agenzia
                    </div>
                </div>
            </div>

            <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                {t('deal.lead.help' as TranslationKey)}
            </p>

            <div className="space-y-2">
                {contact.phone && (
                    <a
                        href={`tel:${contact.phone.replace(/\s+/g, '')}`}
                        className="flex items-center gap-2 text-sm font-medium text-navy-primary hover:text-teal transition-colors"
                    >
                        <Phone className="w-4 h-4 text-teal flex-shrink-0" />
                        <span className="truncate">{contact.phone}</span>
                    </a>
                )}
                {contact.email && (
                    <a
                        href={`mailto:${contact.email}`}
                        className="flex items-center gap-2 text-sm font-medium text-navy-primary hover:text-teal transition-colors"
                    >
                        <Mail className="w-4 h-4 text-teal flex-shrink-0" />
                        <span className="truncate">{contact.email}</span>
                    </a>
                )}
            </div>

            <div className="flex items-center gap-2 text-xs font-medium text-teal mt-5 pt-4 border-t border-gray-100">
                <ShieldCheck className="w-4 h-4" />
                <span>{t('deal.encryption')}</span>
            </div>
        </div>
    );
}
