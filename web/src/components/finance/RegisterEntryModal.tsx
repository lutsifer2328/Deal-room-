'use client';

import { useState } from 'react';
import { Home, Key, Users, ShieldCheck, ArrowLeft, Lock, CreditCard, Hammer, Sofa, X } from 'lucide-react';
import { useAuth } from '@/lib/authContext';
import {
    IncomeCategory,
    CommissionFrom,
    PropertyType,
    RegisterEntryInput,
    CATEGORY_LABELS,
    PROPERTY_TYPE_LABELS,
    POLICY_TYPE_SUGGESTIONS,
    isProperty,
    isReferral,
} from '@/lib/financeTypes';

interface RegisterEntryModalProps {
    onClose: () => void;
    onRegister: (input: RegisterEntryInput) => Promise<{ error: string | null }>;
}

const todayISO = () => new Date().toISOString().slice(0, 10);

type Tile = { category?: IncomeCategory; group?: 'referral'; label: string; sub?: string; icon: typeof Home };

const PRIMARY_TILES: Tile[] = [
    { category: 'sale', label: 'Property sale', icon: Home },
    { category: 'rent', label: 'Rental', icon: Key },
    { group: 'referral', label: 'Referral', sub: 'credit, construction, design', icon: Users },
    { category: 'insurance', label: 'Insurance', icon: ShieldCheck },
];

const REFERRAL_TILES: Tile[] = [
    { category: 'credit_referral', label: 'Credit', icon: CreditCard },
    { category: 'construction_referral', label: 'Construction', icon: Hammer },
    { category: 'interior_design_referral', label: 'Interior design', icon: Sofa },
];

export default function RegisterEntryModal({ onClose, onRegister }: RegisterEntryModalProps) {
    const { user } = useAuth();
    const insuranceFirst = (user?.department ?? null) === 'insurance';
    const isManager = (user?.financeAccess ?? 'none') === 'all';

    const [step, setStep] = useState<1 | 2>(1);
    const [showReferralTiles, setShowReferralTiles] = useState(false);
    const [category, setCategory] = useState<IncomeCategory | null>(null);

    const [clientName, setClientName] = useState('');
    const [secondClientName, setSecondClientName] = useState('');
    const [commissionFrom, setCommissionFrom] = useState<CommissionFrom>('both');
    const [dealDate, setDealDate] = useState(todayISO());
    const [propertyAddress, setPropertyAddress] = useState('');
    const [propertyRef, setPropertyRef] = useState('');
    const [propertyType, setPropertyType] = useState<PropertyType | ''>('');
    const [dealValue, setDealValue] = useState('');
    const [agencyPct, setAgencyPct] = useState('');
    const [secondAgencyPct, setSecondAgencyPct] = useState('');
    const [rentMonths, setRentMonths] = useState('');
    const [secondRentMonths, setSecondRentMonths] = useState('');
    const [policyNumber, setPolicyNumber] = useState('');
    const [policyType, setPolicyType] = useState('');
    const [validFrom, setValidFrom] = useState('');
    const [validTo, setValidTo] = useState('');
    const [policyGross, setPolicyGross] = useState('');
    const [policyNet, setPolicyNet] = useState('');
    const [insuredIdent, setInsuredIdent] = useState('');
    const [houseDeal, setHouseDeal] = useState(false);
    const [expected, setExpected] = useState('');
    const [notes, setNotes] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Insurance agents see their tile first; property people see the standard order.
    const primaryTiles = insuranceFirst
        ? [...PRIMARY_TILES].sort((a, b) => (a.category === 'insurance' ? -1 : b.category === 'insurance' ? 1 : 0))
        : PRIMARY_TILES;

    const pickCategory = (c: IncomeCategory) => {
        setCategory(c);
        setStep(2);
    };

    const handleTile = (tile: Tile) => {
        if (tile.group === 'referral') {
            setShowReferralTiles(true);
            return;
        }
        if (tile.category) pickCategory(tile.category);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!category || !clientName.trim()) return;
        setSubmitting(true);
        setError(null);
        const input: RegisterEntryInput = {
            category,
            clientName,
            secondClientName: secondClientName || undefined,
            commissionFrom,
            houseDeal: houseDeal || undefined,
            dealDate,
            propertyAddress: propertyAddress || undefined,
            propertyRef: propertyRef || undefined,
            propertyType: propertyType === '' ? null : propertyType,
            dealValue: dealValue.trim() === '' ? null : Number(dealValue),
            agencyPct: agencyPct.trim() === '' ? null : Number(agencyPct),
            secondAgencyPct: secondAgencyPct.trim() === '' ? null : Number(secondAgencyPct),
            rentMonths: rentMonths.trim() === '' ? null : Number(rentMonths),
            secondRentMonths: secondRentMonths.trim() === '' ? null : Number(secondRentMonths),
            policyNumber: policyNumber.trim() || undefined,
            policyType: policyType.trim() || undefined,
            policyValidFrom: validFrom || undefined,
            policyValidTo: validTo || undefined,
            policyCostGross: policyGross.trim() === '' ? null : Number(policyGross),
            policyCostNet: policyNet.trim() === '' ? null : Number(policyNet),
            insuredIdent: insuredIdent.trim() || undefined,
            expectedAmount: expected.trim() === '' ? null : Number(expected),
            notes: notes || undefined,
        };
        const { error } = await onRegister(input);
        setSubmitting(false);
        if (error) {
            setError(error);
            return;
        }
        onClose();
    };

    const property = category ? isProperty(category) : false;
    const bothSides = property && commissionFrom === 'both';
    const isRent = category === 'rent';

    // Live estimate: sales use agency % of the price; rentals use a multiple of
    // the monthly rent. Then the agent's own estimated cut via their default %.
    const price = Number(dealValue) || 0;
    let agencyCommission = 0;
    if (category === 'sale') {
        const rate1 = Number(agencyPct) || 0;
        const rate2 = bothSides ? (Number(secondAgencyPct) || rate1) : 0;
        agencyCommission = price > 0 ? price * (rate1 / 100) + (bothSides ? price * (rate2 / 100) : 0) : 0;
    } else if (isRent) {
        const m1 = Number(rentMonths) || 0;
        const m2 = bothSides ? (Number(secondRentMonths) || m1) : 0;
        agencyCommission = price > 0 ? price * m1 + (bothSides ? price * m2 : 0) : 0;
    }
    agencyCommission = Math.round(agencyCommission * 100) / 100;
    const myPct = user?.defaultCommissionPct ?? null;
    const estCut = myPct != null ? Math.round(agencyCommission * (myPct / 100) * 100) / 100 : null;
    const eur = (n: number) => new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR' }).format(n);

    return (
        <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-start sm:items-center justify-center z-50 p-4 overflow-y-auto"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-2xl shadow-xl max-w-lg w-full my-auto max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-200 flex items-center gap-3 sticky top-0 bg-white z-10">
                    {step === 2 && (
                        <button
                            type="button"
                            onClick={() => { setStep(1); setShowReferralTiles(false); }}
                            className="text-gray-400 hover:text-gray-700"
                            aria-label="Back"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                    )}
                    <div>
                        <p className="text-xs text-gray-400">Step {step} of 2</p>
                        <h3 className="text-lg font-semibold text-gray-900">
                            {step === 1 ? 'What did you close?' : CATEGORY_LABELS[category!]}
                        </h3>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="ml-auto text-gray-400 hover:text-gray-700"
                        aria-label="Close"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {step === 1 && (
                    <div className="p-6">
                        {!showReferralTiles ? (
                            <div className="grid grid-cols-2 gap-3">
                                {primaryTiles.map((tile) => {
                                    const Icon = tile.icon;
                                    return (
                                        <button
                                            key={tile.label}
                                            type="button"
                                            onClick={() => handleTile(tile)}
                                            className="flex flex-col items-center text-center gap-2 p-5 rounded-xl border border-gray-200 hover:border-teal hover:bg-teal/5 transition-colors"
                                        >
                                            <Icon className="w-7 h-7 text-teal" />
                                            <span className="text-sm font-semibold text-gray-800">{tile.label}</span>
                                            {tile.sub && <span className="text-xs text-gray-400">{tile.sub}</span>}
                                        </button>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="grid grid-cols-3 gap-3">
                                {REFERRAL_TILES.map((tile) => {
                                    const Icon = tile.icon;
                                    return (
                                        <button
                                            key={tile.label}
                                            type="button"
                                            onClick={() => tile.category && pickCategory(tile.category)}
                                            className="flex flex-col items-center text-center gap-2 p-5 rounded-xl border border-gray-200 hover:border-teal hover:bg-teal/5 transition-colors"
                                        >
                                            <Icon className="w-6 h-6 text-teal" />
                                            <span className="text-sm font-semibold text-gray-800">{tile.label}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {step === 2 && category && (
                    <form onSubmit={handleSubmit} className="px-6 py-4">
                        <div className="space-y-4">
                            {isManager && (
                                <label className="flex items-start gap-2.5 p-3 rounded-lg border border-gray-200 bg-gray-50 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={houseDeal}
                                        onChange={(e) => setHouseDeal(e.target.checked)}
                                        className="mt-0.5"
                                    />
                                    <span className="text-sm">
                                        <span className="font-medium text-navy-primary">Agency deal — no broker</span>
                                        <span className="block text-xs text-gray-500">The agency closed this directly; 100% of the commission is agency income.</span>
                                    </span>
                                </label>
                            )}

                            {property && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Property address</label>
                                    <input
                                        type="text"
                                        value={propertyAddress}
                                        onChange={(e) => setPropertyAddress(e.target.value)}
                                        placeholder="ул. Шипка 12, София"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal"
                                    />
                                </div>
                            )}

                            {property && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">CRM number (optional)</label>
                                    <input
                                        type="text"
                                        value={propertyRef}
                                        onChange={(e) => setPropertyRef(e.target.value)}
                                        placeholder="AGZ-2026-001"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal"
                                    />
                                </div>
                            )}

                            {property && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Property type</label>
                                    <select
                                        value={propertyType}
                                        onChange={(e) => setPropertyType(e.target.value as PropertyType | '')}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal"
                                        title="Property type"
                                    >
                                        <option value="">—</option>
                                        {(Object.keys(PROPERTY_TYPE_LABELS) as PropertyType[]).map((tp) => (
                                            <option key={tp} value={tp}>{PROPERTY_TYPE_LABELS[tp]}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div className="flex gap-3">
                                <div className="flex-1">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        {isProperty(category) ? 'Date signed' : isReferral(category) ? 'Date referred' : 'Date'}
                                    </label>
                                    <input
                                        type="date"
                                        value={dealDate}
                                        onChange={(e) => setDealDate(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal"
                                    />
                                </div>
                                {property && (
                                    <div className="flex-1">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Commission from</label>
                                        <select
                                            value={commissionFrom}
                                            onChange={(e) => setCommissionFrom(e.target.value as CommissionFrom)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal"
                                            title="Commission from"
                                        >
                                            <option value="both">Both sides</option>
                                            <option value="buyer">{isRent ? 'Tenant only' : 'Buyer only'}</option>
                                            <option value="seller">{isRent ? 'Landlord only' : 'Seller only'}</option>
                                        </select>
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    {property ? (isRent ? 'Tenant name' : 'Buyer name') : 'Client name'}
                                </label>
                                <input
                                    type="text"
                                    value={clientName}
                                    onChange={(e) => setClientName(e.target.value)}
                                    placeholder="Иван Петров"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal"
                                    required
                                />
                            </div>

                            {bothSides && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        {isRent ? 'Landlord name' : 'Seller name'}
                                    </label>
                                    <input
                                        type="text"
                                        value={secondClientName}
                                        onChange={(e) => setSecondClientName(e.target.value)}
                                        placeholder="Мария Димитрова"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal"
                                    />
                                </div>
                            )}

                            {category === 'insurance' && (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">ЕГН / ЕИК (optional)</label>
                                        <input
                                            type="text"
                                            value={insuredIdent}
                                            onChange={(e) => setInsuredIdent(e.target.value)}
                                            placeholder="Personal (ЕГН) or company (ЕИК) number"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal"
                                        />
                                        <p className="text-xs text-gray-500 mt-1">Makes the policy easy to find later.</p>
                                    </div>

                                    <div className="flex gap-3">
                                        <div className="flex-1">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Policy number</label>
                                            <input
                                                type="text"
                                                value={policyNumber}
                                                onChange={(e) => setPolicyNumber(e.target.value)}
                                                placeholder="BG/..."
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal"
                                            />
                                        </div>
                                        <div className="flex-1">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Policy type</label>
                                            <input
                                                type="text"
                                                list="policy-types"
                                                value={policyType}
                                                onChange={(e) => setPolicyType(e.target.value)}
                                                placeholder="e.g. Casco"
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal"
                                            />
                                            <datalist id="policy-types">
                                                {POLICY_TYPE_SUGGESTIONS.map((t) => <option key={t} value={t} />)}
                                            </datalist>
                                        </div>
                                    </div>

                                    <div className="flex gap-3">
                                        <div className="flex-1">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Valid from</label>
                                            <input
                                                type="date"
                                                value={validFrom}
                                                onChange={(e) => setValidFrom(e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal"
                                                title="Valid from"
                                            />
                                        </div>
                                        <div className="flex-1">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Valid till</label>
                                            <input
                                                type="date"
                                                value={validTo}
                                                onChange={(e) => setValidTo(e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal"
                                                title="Valid till"
                                            />
                                        </div>
                                    </div>
                                    {validTo && <p className="text-xs text-gray-500 -mt-2">You&apos;ll get a renewal reminder before it&apos;s due.</p>}

                                    <div className="flex gap-3">
                                        <div className="flex-1">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Policy cost — bruto (EUR)</label>
                                            <input
                                                type="number" min={0} step={0.01} value={policyGross}
                                                onChange={(e) => setPolicyGross(e.target.value)}
                                                placeholder="with tax"
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal"
                                            />
                                        </div>
                                        <div className="flex-1">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Policy cost — neto (EUR)</label>
                                            <input
                                                type="number" min={0} step={0.01} value={policyNet}
                                                onChange={(e) => setPolicyNet(e.target.value)}
                                                placeholder="without tax"
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal"
                                            />
                                        </div>
                                    </div>
                                </>
                            )}

                            {property ? (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            {isRent ? 'Monthly rent (EUR)' : 'Sale price (EUR)'}
                                        </label>
                                        <input
                                            type="number" min={0} step={0.01} value={dealValue}
                                            onChange={(e) => setDealValue(e.target.value)}
                                            placeholder={isRent ? 'e.g. 1200' : 'e.g. 200000'}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal"
                                        />
                                    </div>

                                    {isRent ? (
                                        <div className="flex gap-3">
                                            <div className="flex-1">
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    {bothSides ? 'Tenant — months of rent' : 'Commission (months of rent)'}
                                                </label>
                                                <input
                                                    type="number" min={0} step={0.25} value={rentMonths}
                                                    onChange={(e) => setRentMonths(e.target.value)}
                                                    placeholder="1"
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal"
                                                />
                                                <div className="flex gap-1 mt-1">
                                                    {['0.5', '1', '2'].map((q) => (
                                                        <button key={q} type="button" onClick={() => setRentMonths(q)}
                                                            className="px-2 py-0.5 text-xs rounded border border-gray-200 text-gray-600 hover:border-teal">
                                                            {q === '0.5' ? '½' : q} mo
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                            {bothSides && (
                                                <div className="flex-1">
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Landlord — months of rent</label>
                                                    <input
                                                        type="number" min={0} step={0.25} value={secondRentMonths}
                                                        onChange={(e) => setSecondRentMonths(e.target.value)}
                                                        placeholder={rentMonths || '1'}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal"
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="flex gap-3">
                                            <div className="w-40">
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    {bothSides ? 'Buyer %' : 'Agency %'}
                                                </label>
                                                <input
                                                    type="number" min={0} max={100} step={0.1} value={agencyPct}
                                                    onChange={(e) => setAgencyPct(e.target.value)}
                                                    placeholder="3"
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal"
                                                />
                                            </div>
                                            {bothSides && (
                                                <div className="w-40">
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Seller %</label>
                                                    <input
                                                        type="number" min={0} max={100} step={0.1} value={secondAgencyPct}
                                                        onChange={(e) => setSecondAgencyPct(e.target.value)}
                                                        placeholder={String(Number(agencyPct) || 3)}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal"
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    )}
                                    {agencyCommission > 0 && (
                                        <div className="bg-teal/5 border border-teal/20 rounded-lg px-3 py-2 text-sm">
                                            <div className="flex justify-between text-gray-700">
                                                <span>Agency commission (est.)</span>
                                                <strong className="text-navy-primary">{eur(agencyCommission)}</strong>
                                            </div>
                                            {houseDeal ? (
                                                <div className="flex justify-between text-gray-500 mt-0.5">
                                                    <span>Broker cut</span>
                                                    <strong className="text-teal">100% to agency</strong>
                                                </div>
                                            ) : estCut != null && (
                                                <div className="flex justify-between text-gray-500 mt-0.5">
                                                    <span>Your cut (est. at {myPct}%)</span>
                                                    <strong className="text-teal">{eur(estCut)}</strong>
                                                </div>
                                            )}
                                            <p className="text-[11px] text-gray-400 mt-1">Estimate — the office confirms the final figures.</p>
                                        </div>
                                    )}
                                </>
                            ) : isReferral(category) ? (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Commission agreed (EUR, optional)
                                    </label>
                                    <input
                                        type="number"
                                        min={0}
                                        step={0.01}
                                        value={expected}
                                        onChange={(e) => setExpected(e.target.value)}
                                        placeholder="Leave blank if not final yet"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal"
                                    />
                                </div>
                            ) : null}

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
                                <textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    rows={2}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal"
                                />
                            </div>

                            {error && (
                                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-2">{error}</p>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={submitting || !clientName.trim()}
                            className="mt-5 w-full py-2.5 bg-navy-primary text-white font-semibold rounded-lg hover:bg-navy-secondary transition-colors disabled:opacity-50"
                        >
                            {submitting ? 'Registering…' : 'Register deal'}
                        </button>
                        <p className="text-xs text-gray-400 mt-3 text-center flex items-center justify-center gap-1">
                            <Lock className="w-3.5 h-3.5" />
                            The office confirms the money — you&apos;ll see your cut once it&apos;s paid.
                        </p>
                    </form>
                )}
            </div>
        </div>
    );
}
