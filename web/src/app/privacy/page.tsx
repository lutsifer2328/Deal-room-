'use client';

import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function PrivacyPage() {
    return (
        <div className="min-h-screen bg-slate-50 text-slate-800 p-8 pt-12 max-w-4xl mx-auto">
            <Link
                href="/login"
                className="flex items-center text-teal-600 hover:text-teal-700 transition-colors mb-8 font-medium"
            >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Назад към Вход
            </Link>
            <h1 className="text-4xl font-serif font-bold text-slate-900 mb-8 border-b border-slate-200 pb-4">Политика за поверителност</h1>
            <div className="prose prose-slate prose-teal max-w-none">
                <p className="text-lg text-slate-600 mb-6 border-l-4 border-teal-500 pl-4 italic">
                    Забележка: Това е примерен документ за демонстрационни цели.
                </p>

                <h2 className="text-2xl font-bold mt-8 mb-4">1. Въведение</h2>
                <p className="mb-4">В Deal Room уважаваме вашата поверителност и се ангажираме да защитаваме вашите лични данни. Настоящата политика обяснява как събираме, използваме и защитаваме вашата информация.</p>

                <h2 className="text-2xl font-bold mt-8 mb-4">2. Събиране на данни</h2>
                <p className="mb-4">Събираме само информацията, която е необходима за предоставяне на нашите услуги, включително, но не само:</p>
                <ul className="list-disc pl-6 mb-4 space-y-2">
                    <li>Имена и контактна информация (имейл, телефон)</li>
                    <li>Данни, свързани със сделки, в които участвате</li>
                    <li>Документи, качени в Платформата от вас или от съответния Брокер/Администратор</li>
                </ul>

                <h2 className="text-2xl font-bold mt-8 mb-4">3. Използване на данните</h2>
                <p className="mb-4">Вашите данни се използват изключително за целите на:</p>
                <ul className="list-disc pl-6 mb-4 space-y-2">
                    <li>Администриране на вашия профил и достъп до Платформата</li>
                    <li>Осигуряване на комуникацията между страните по дадена сделка</li>
                    <li>Спазване на законови изисквания</li>
                </ul>

                <h2 className="text-2xl font-bold mt-8 mb-4">4. Защита на данните</h2>
                <p className="mb-4">Ние прилагаме строги технически и организационни мерки за сигурност, за да предотвратим неоторизиран достъп, загуба или злоупотреба с вашите лични данни. Всички данни се съхраняват в защитени сървъри чрез индустриални стандарти за криптиране.</p>

                <h2 className="text-2xl font-bold mt-8 mb-4">5. Споделяне на данни</h2>
                <p className="mb-4">Вашите лични данни не се споделят с трети страни за маркетингови цели. Те се споделят единствено с другите участници в съответните сделки, доколкото това е необходимо за изпълнението им, и когато сме задължени по закон.</p>

                <h2 className="text-2xl font-bold mt-8 mb-4">6. Вашите права</h2>
                <p className="mb-4">Имате право на достъп, корекция и изтриване (право "да бъдеш забравен") на вашите лични данни, освен когато закон ни задължава да ги съхраняваме.</p>

                <div className="mt-12 pt-8 border-t border-slate-200 text-slate-500 text-sm">
                    Последна актуализация: {new Date().toLocaleDateString('bg-BG')}
                </div>
            </div>
        </div>
    );
}
