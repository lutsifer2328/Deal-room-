'use client';

import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function TermsPage() {
    const router = useRouter();

    return (
        <div className="min-h-screen bg-slate-50 text-slate-800 p-8 pt-12 max-w-4xl mx-auto">
            <button
                onClick={() => router.back()}
                className="flex items-center text-teal-600 hover:text-teal-700 transition-colors mb-8 font-medium"
            >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Назад
            </button>
            <h1 className="text-4xl font-serif font-bold text-slate-900 mb-8 border-b border-slate-200 pb-4">Общи условия</h1>
            <div className="prose prose-slate prose-teal max-w-none">
                <p className="text-lg text-slate-600 mb-6 border-l-4 border-teal-500 pl-4 italic">
                    Забележка: Това е примерен документ за демонстрационни цели.
                </p>

                <h2 className="text-2xl font-bold mt-8 mb-4">1. Предмет</h2>
                <p className="mb-4">Настоящите общи условия уреждат отношенията между Deal Room ("Платформата") и Потребителите на Платформата във връзка с предоставяните услуги.</p>

                <h2 className="text-2xl font-bold mt-8 mb-4">2. Дефиниции</h2>
                <ul className="list-disc pl-6 mb-4 space-y-2">
                    <li><strong>Платформа</strong> - уеб базирано приложение за управление на сделки и документи.</li>
                    <li><strong>Потребител</strong> - всяко лице, което достъпва и използва Платформата.</li>
                    <li><strong>Офис/Администратор</strong> - юридическо лице, което е клиент на Платформата и администрира съдържанието.</li>
                </ul>

                <h2 className="text-2xl font-bold mt-8 mb-4">3. Права и задължения на потребителя</h2>
                <p className="mb-4">Потребителят се задължава да използва Платформата съгласно нейното предназначение, спазвайки приложимото законодателство и без да нарушава правата на трети лица. Потребителят отговаря за сигурността на своята парола за достъп.</p>

                <h2 className="text-2xl font-bold mt-8 mb-4">4. Отговорност</h2>
                <p className="mb-4">Платформата предоставя технологична среда и не носи отговорност за съдържанието на качваните документи и информация, които се администрират и преглеждат от съответния Офис/Брокер.</p>

                <h2 className="text-2xl font-bold mt-8 mb-4">5. Изменения</h2>
                <p className="mb-4">Платформата си запазва правото едностранно да променя настоящите Общи условия, като се задължава да уведоми Потребителите за това.</p>

                <div className="mt-12 pt-8 border-t border-slate-200 text-slate-500 text-sm">
                    Последна актуализация: {new Date().toLocaleDateString('bg-BG')}
                </div>
            </div>
        </div>
    );
}
