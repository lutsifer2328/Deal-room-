'use client';

import { usePathname } from 'next/navigation';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import { useState } from 'react';

import { Toaster } from 'react-hot-toast';

import BottomNav from './BottomNav';
import Footer from '../common/Footer';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isLoginPage = pathname === '/login';
    const isAuthPage = pathname.startsWith('/auth/');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    if (isLoginPage || isAuthPage) {
        return <>{children}</>;
    }

    return (
        <div className="flex min-h-screen bg-background relative">
            <Toaster position="bottom-center" toastOptions={{
                success: {
                    style: {
                        background: '#333',
                        color: '#fff',
                    },
                },
                error: {
                    style: {
                        background: '#ef4444',
                        color: '#fff',
                    },
                }
            }} />
            <Sidebar
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
            />

            <div className="flex-1 flex flex-col md:ml-[280px] ml-0 min-h-screen relative z-0 bg-transparent transition-all duration-300">
                <Navbar onMenuClick={() => setIsSidebarOpen(true)} />
                <main className="flex-1 flex flex-col px-4 md:px-12 pb-24 md:pb-12 w-full max-w-[100vw] overflow-x-clip min-h-[calc(100vh-80px)]">
                    <div className="flex-1">
                        {children}
                    </div>
                    <Footer />
                </main>
            </div>

            <BottomNav />
        </div>
    );
}
