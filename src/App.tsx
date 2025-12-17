import { useState } from 'react';
import LoanCalculator from './components/LoanCalculator';
import FDCalculator from './components/FDCalculator';
import { Card, Button, Input } from './components/ui-base';
import { LayoutDashboard, PiggyBank, Scale, Bot } from 'lucide-react';
import { formatCurrency, calculateFD } from './utils/finance';

function App() {
    const [view, setView] = useState<'loan' | 'fd' | 'compare' | 'ai'>('loan');
    const [currency, setCurrency] = useState<'INR' | 'EUR'>('INR');
    const [conversionRate, setConversionRate] = useState(1); // 1 EUR = ? INR

    // Comparison State
    const [compareAmount, setCompareAmount] = useState(100000);
    const [compareLoanRate, setCompareLoanRate] = useState(8.5);
    const [compareFDRate, setCompareFDRate] = useState(7.0);
    const [compareTerm, setCompareTerm] = useState(60);

    const renderComparison = () => {
        // Logic: If I prepay 'compareAmount' in loan vs put in FD
        // Loan Savings = Interest prevented.
        // FD Gains = Interest earned (post tax usually, but ignoring tax for simplicity unless requested)

        // Simplification: Calculate Interest on Loan for this principal for this term
        // vs Interest on FD for this principal for this term

        // Interest Saved on Loan (approx simple interest logic for lump sum reduction over term)
        // Actually, accurate way: Run loan schedule with and without prepayment. But here we compare purely capital efficiency.
        // Cost of Debt = Amount * Rate * Time ? No, compounding.
        // Effective Savings = Present Value difference? 
        // Let's stick to "Absolute Interest Dollars over Term" comparison

        // Option A: Pay off Loan
        // We treat 'compareAmount' as principal reduction.
        // Interest saved = Total Interest on a loan of 'compareAmount' for 'compareTerm' (Approx)
        // OR better: Prepayment saves Loan Rate compounded? 
        // Actually, prepaying 10k at 8% saves more than earning 7% on 10k. 

        // We'll calculate the Future Value of the money in both cases.
        // 1. Keep Debt: You pay Interest I_loan. You keep cash in FD, earn I_fd. Net = I_fd - I_loan.
        // 2. Pay Debt: You pay 0 Interest. You have 0 FD. Net = 0.

        // So if (I_fd - I_loan) > 0, Invest. Else Pay Debt.

        // Simple calc
        const fdRes = calculateFD(compareAmount, compareFDRate, compareTerm);
        const fdInterest = fdRes.totalInterest;

        // Loan "Interest Cost" of holding that debt
        // Approx by using FD calc with Loan rate (since loan interest reduces similarly to reverse compounding if paid off? No, standard amortization)
        // Actually, saving money on loan is exactly equal to "Investing at Loan Rate" risk free.
        const loanResLikeFD = calculateFD(compareAmount, compareLoanRate, compareTerm);
        const loanInterestSaved = loanResLikeFD.totalInterest;
        // Wait, amortized loan interest is different.
        // If you prepay X, you save interest on X. 
        // The interest saved is roughly X * R * T (simple) if flat, or complex.
        // Prepaying X reduces principal. The "Balance" curve shifts down.
        // The most accurate comparison is: Return on Investment. RR of Loan Prepayment = Loan Rate. RR of FD = FD Rate.
        // Detailed math: 8.5% > 7.0%. Always prepay.

        const diff = loanInterestSaved - fdInterest;

        return (
            <div className="space-y-6 animate-in fade-in">
                <Card className="border-l-4 border-l-blue-500">
                    <h2 className="text-xl font-bold mb-4">Capital Allocation Check</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <Input label="Capital Amount" value={compareAmount} onChange={(v: any) => setCompareAmount(Number(v))} suffix={currency} />
                            <Input label="Loan Rate" value={compareLoanRate} onChange={(v: any) => setCompareLoanRate(Number(v))} suffix="%" />
                            <Input label="FD Rate" value={compareFDRate} onChange={(v: any) => setCompareFDRate(Number(v))} suffix="%" />
                            <Input label="Term (Months)" value={compareTerm} onChange={(v: any) => setCompareTerm(Number(v))} suffix="mo" />
                        </div>
                        <div className="bg-muted/30 p-6 rounded-xl flex flex-col justify-center items-center text-center">
                            <h3 className="text-lg font-medium text-muted-foreground mb-2">Recommendation</h3>
                            {compareLoanRate > compareFDRate ? (
                                <div className="text-3xl font-bold text-blue-600">PREPAY LOAN</div>
                            ) : (
                                <div className="text-3xl font-bold text-emerald-600">INVEST IN FD</div>
                            )}
                            <p className="mt-4 text-sm max-w-xs">
                                Since the Loan Rate ({compareLoanRate}%) is {compareLoanRate > compareFDRate ? 'higher' : 'lower'} than the FD Rate ({compareFDRate}%),
                                you save more by {compareLoanRate > compareFDRate ? 'eliminating debt' : 'investing'}.
                            </p>

                            <div className="mt-6 pt-6 border-t w-full">
                                <div className="flex justify-between text-sm mb-2">
                                    <span>Gain/Savings Diff:</span>
                                    <span className={diff > 0 ? "text-green-600 font-bold" : "text-amber-600 font-bold"}>
                                        {formatCurrency(Math.abs(diff), currency, conversionRate)}
                                    </span>
                                </div>
                                <div className="flex justify-between text-xs text-muted-foreground">
                                    <span>{formatCurrency(Math.abs(diff), 'INR', 1)} INR</span>
                                    <span>{formatCurrency(Math.abs(diff / (conversionRate || 1)), 'EUR', 1)} EUR</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </Card>
            </div>
        )
    };

    const [aiQuery, setAiQuery] = useState('');
    const [aiResponse, setAiResponse] = useState('');

    return (
        <div className={`min-h-screen bg-background text-foreground ${currency === 'EUR' ? 'theme-eur' : ''}`}>
            {/* Header */}
            <nav className="glass sticky top-0 z-50 border-b border-border/40">
                <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2 font-bold text-xl bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                        <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center">
                            <span className="text-lg">F</span>
                        </div>
                        FinDash
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            onClick={() => setCurrency(c => c === 'INR' ? 'EUR' : 'INR')}
                            className="font-mono text-xs"
                        >
                            {currency}
                        </Button>
                        {currency === 'EUR' && (
                            <div className="flex items-center gap-1">
                                <span className="text-xs text-muted-foreground">Rate:</span>
                                <input
                                    className="w-16 h-8 text-xs border rounded px-1 bg-transparent"
                                    value={conversionRate}
                                    onChange={(e) => setConversionRate(Number(e.target.value))}
                                />
                            </div>
                        )}
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 py-8 pb-24">
                {view === 'loan' && <LoanCalculator currency={currency} rate={conversionRate} />}
                {view === 'fd' && <FDCalculator currency={currency} rate={conversionRate} />}
                {view === 'compare' && renderComparison()}
                {view === 'ai' && (
                    <Card className="max-w-2xl mx-auto">
                        <div className="flex items-center gap-2 mb-4">
                            <Bot className="w-6 h-6 text-purple-600" />
                            <h2 className="text-xl font-bold">DeepSeek Financial AI</h2>
                        </div>
                        <div className="bg-muted/50 rounded-lg p-4 min-h-[200px] mb-4 text-sm whitespace-pre-wrap">
                            {aiResponse || "Ask me anything about your loans or investments..."}
                        </div>
                        <div className="flex gap-2">
                            <input
                                className="flex-1 border rounded-md px-3 py-2 bg-background"
                                placeholder="e.g., How can I save more interest?"
                                value={aiQuery}
                                onChange={(e) => setAiQuery(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        setAiResponse("DeepSeek AI Analysis Simulated: Based on your current 8.5% loan rate, prepaying is highly recommended before starting new FDs at 7%.");
                                        setAiQuery('');
                                    }
                                }}
                            />
                            <Button onClick={() => setAiResponse("DeepSeek AI Analysis Simulated: Based on your current 8.5% loan rate, prepaying is highly recommended before starting new FDs at 7%.")}>Ask</Button>
                        </div>
                    </Card>
                )}
            </main>

            {/* Bottom Nav Mobile / Sidebar Desktop */}
            <div className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-lg border-t border-border p-2 z-50">
                <div className="max-w-md mx-auto flex justify-around">
                    <NavBtn icon={LayoutDashboard} label="Loan" active={view === 'loan'} onClick={() => setView('loan')} />
                    <NavBtn icon={PiggyBank} label="FD" active={view === 'fd'} onClick={() => setView('fd')} />
                    <NavBtn icon={Scale} label="Compare" active={view === 'compare'} onClick={() => setView('compare')} />
                    <NavBtn icon={Bot} label="AI" active={view === 'ai'} onClick={() => setView('ai')} />
                </div>
            </div>
        </div>
    )
}

const NavBtn = ({ icon: Icon, label, active, onClick }: any) => (
    <button
        onClick={onClick}
        className={`flex flex-col items-center p-2 rounded-lg transition-all w-16 ${active ? 'text-blue-600 bg-blue-50 dark:bg-blue-900/20' : 'text-muted-foreground hover:bg-muted'}`}
    >
        <Icon className="w-5 h-5 mb-1" />
        <span className="text-[10px] font-medium">{label}</span>
    </button>
);

export default App;
