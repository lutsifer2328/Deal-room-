import { Wallet, Construction } from 'lucide-react';

export default function FinancesPage() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
            <div className="bg-navy-secondary/10 p-6 rounded-full mb-6 animate-pulse">
                <Wallet className="w-16 h-16 text-teal" />
            </div>

            <h1 className="text-4xl font-playfair font-bold text-navy-primary mb-4">
                Finances
            </h1>

            <p className="text-lg text-text-muted max-w-md mb-8">
                We are building a comprehensive financial dashboard to help you track payments,
                fees, and transaction history.
            </p>

            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gold/10 text-gold font-bold rounded-lg border border-gold/20">
                <Construction className="w-4 h-4" />
                Coming Soon
            </div>
        </div>
    );
}
