'use client';

import { useState } from 'react';
import { Shield } from 'lucide-react';

export default function Footer() {
    const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);

    return (
        <footer className="w-full py-6 mt-8 border-t border-gray-100 flex flex-col md:flex-row items-center justify-between text-xs text-gray-400 bg-transparent px-8">
            <div className="flex items-center gap-2 mb-4 md:mb-0">
                <Shield className="w-4 h-4 text-teal" />
                <span>Private Vault | Powered by Agenzia</span>
            </div>

            <button
                onClick={() => setIsPrivacyModalOpen(true)}
                className="hover:text-teal font-medium transition-colors cursor-pointer outline-none"
            >
                Privacy & Cookies
            </button>

            {/* Privacy Modal */}
            {isPrivacyModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-navy-primary/40 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white max-w-lg w-full rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        {/* Header */}
                        <div className="bg-slate-50 border-b border-gray-100 p-6 flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-teal/10 rounded-lg">
                                    <Shield className="w-5 h-5 text-teal" />
                                </div>
                                <h3 className="font-bold text-slate-800 text-lg">Transparency & Security</h3>
                            </div>
                            <button
                                onClick={() => setIsPrivacyModalOpen(false)}
                                className="text-gray-400 hover:text-gray-600 transition-colors bg-transparent border-none text-2xl leading-none cursor-pointer"
                            >
                                &times;
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-6 space-y-8">
                            {/* English */}
                            <div className="space-y-2">
                                <h4 className="text-xs font-bold text-teal uppercase tracking-wider">English</h4>
                                <p className="text-sm text-slate-600 leading-relaxed">
                                    We use strictly necessary cookies to manage your secure session. We do not use tracking, advertising, or third-party analytics cookies. Your privacy is managed under the highest EEA standards.
                                </p>
                            </div>

                            <div className="h-px w-full bg-gray-100" />

                            {/* Bulgarian */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <h4 className="font-bold text-slate-800 text-lg">Прозрачност и сигурност</h4>
                                    <h4 className="text-xs font-bold text-teal uppercase tracking-wider">Български</h4>
                                </div>
                                <p className="text-sm text-slate-600 leading-relaxed">
                                    Използваме само строго необходими бисквитки за управление на Вашата сигурна сесия. Не използваме бисквитки за проследяване, реклама или анализи от трети страни. Вашата поверителност се управлява съгласно най-високите стандарти на ЕИЗ.
                                </p>
                            </div>
                        </div>

                        {/* Footer Action */}
                        <div className="bg-slate-50 border-t border-gray-100 p-4 flex justify-end">
                            <button
                                onClick={() => setIsPrivacyModalOpen(false)}
                                className="bg-navy-primary hover:bg-navy-secondary text-white px-6 py-2.5 rounded-lg text-sm font-bold transition-all shadow-md active:scale-95"
                            >
                                Acknowledge | Разбрах
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </footer>
    );
}
