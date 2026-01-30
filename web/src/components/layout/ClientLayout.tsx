'use client';

import { usePathname } from 'next/navigation';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isLoginPage = pathname === '/login';

    if (isLoginPage) {
        return <>{children}</>;
    }

    return (
        <div className="flex h-screen overflow-hidden">
            <Sidebar />

            <div className="flex-1 flex flex-col ml-[280px] h-full relative z-0 bg-transparent">
                <Navbar />
                <main className="flex-1 overflow-y-auto p-12">
                    {children}
                </main>
            </div>
        </div>
    );
}
