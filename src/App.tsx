
import React, { useState, useEffect, useMemo } from 'react';
import { Calculator, TrendingUp, BarChart3, Home, RefreshCw, Sparkles, X, Send } from 'lucide-react';
import Dashboard from './components/Dashboard';
import LoanCalculator from './components/LoanCalculator';
import FDCalculator from './components/FDCalculator';
import Comparison from './components/Comparison';
import { generateLoanSchedule, calculateFD, calculateEMI } from './utils/finance';
import { getDeepSeekInsights } from './lib/deepseek';

function App() {
    const [currentPage, setCurrentPage] = useState('dashboard');

    // Persistence Helper
    const usePersistedState = (key: string, defaultValue: any) => {
        const [state, setState] = useState(() => {
            try {
                const storedValue = localStorage.getItem(key);
                return storedValue ? JSON.parse(storedValue) : defaultValue;
            } catch (error) {
                return defaultValue;
            }
        });

        useEffect(() => {
            localStorage.setItem(key, JSON.stringify(state));
        }, [key, state]);

        return [state, setState];
    };

    // State
    const [eurToInr, setEurToInr] = usePersistedState('eurToInr', 90);

    // Loan State
    const [loanAmount, setLoanAmount] = usePersistedState('loanAmount', 200000);
    const [loanRate, setLoanRate] = usePersistedState('loanRate', 4.5);
    const [loanTerm, setLoanTerm] = usePersistedState('loanTerm', 240);
    const [bulkPrepayment, setBulkPrepayment] = usePersistedState('bulkPrepayment', 20000);
    const [prepaymentMonth, setPrepaymentMonth] = usePersistedState('prepaymentMonth', 24);
    const [prepaymentPenalty, setPrepaymentPenalty] = usePersistedState('prepaymentPenalty', 2);
    const [extraMonthly, setExtraMonthly] = usePersistedState('extraMonthly', 500);
    const [extraMonthlyTiming, setExtraMonthlyTiming] = usePersistedState('extraMonthlyTiming', 'both');

    // FD State
    const [fdPrincipal, setFdPrincipal] = usePersistedState('fdPrincipal', 50000);
    const [fdRate, setFdRate] = usePersistedState('fdRate', 7);
    const [fdTerm, setFdTerm] = usePersistedState('fdTerm', 60);
    const [fdCompounding, setFdCompounding] = usePersistedState('fdCompounding', 'quarterly');
    const [fdPayoutFrequency, setFdPayoutFrequency] = usePersistedState('fdPayoutFrequency', 'maturity');
    const [fdTaxRate, setFdTaxRate] = usePersistedState('fdTaxRate', 30);

    // AI State
    const [showAIInsights, setShowAIInsights] = useState(false);
    const [aiQuestion, setAiQuestion] = useState('');
    const [aiResponse, setAiResponse] = useState('');
    const [aiLoading, setAiLoading] = useState(false);
    const [aiKey, setAiKey] = usePersistedState('deepseekKey', '');
    const [showKeyInput, setShowKeyInput] = useState(false);

    // Derived State (Calculations)
    const currentEMI = useMemo(() => calculateEMI(loanAmount, loanRate, loanTerm), [loanAmount, loanRate, loanTerm]);

    const scenarioA = useMemo(() =>
        generateLoanSchedule(loanAmount, loanRate, loanTerm),
        [loanAmount, loanRate, loanTerm]
    );

    const scenarioB = useMemo(() =>
        generateLoanSchedule(loanAmount, loanRate, loanTerm, 0, bulkPrepayment, prepaymentMonth, prepaymentPenalty),
        [loanAmount, loanRate, loanTerm, bulkPrepayment, prepaymentMonth, prepaymentPenalty]
    );

    const scenarioC = useMemo(() =>
        generateLoanSchedule(loanAmount, loanRate, loanTerm, extraMonthly, bulkPrepayment, prepaymentMonth, prepaymentPenalty, extraMonthlyTiming),
        [loanAmount, loanRate, loanTerm, extraMonthly, bulkPrepayment, prepaymentMonth, prepaymentPenalty, extraMonthlyTiming]
    );

    const fdResult = useMemo(() =>
        calculateFD(fdPrincipal, fdRate, fdTerm, fdCompounding, fdPayoutFrequency, fdTaxRate),
        [fdPrincipal, fdRate, fdTerm, fdCompounding, fdPayoutFrequency, fdTaxRate]
    );

    const { loanSavings, fdReturns, netBenefit, comparisonAmount } = useMemo(() => {
        const comparisonAmt = bulkPrepayment;
        const loanSave = scenarioA.totalInterest - scenarioB.totalInterest - scenarioB.totalPenalty;
        const fdRet = calculateFD(comparisonAmt, fdRate, Math.min(scenarioA.actualTerm, fdTerm), fdCompounding, fdPayoutFrequency, fdTaxRate).interest * (1 - fdTaxRate / 100);
        const netBen = loanSave - fdRet;

        return {
            loanSavings: loanSave,
            fdReturns: fdRet,
            netBenefit: netBen,
            comparisonAmount: comparisonAmt
        };
    }, [bulkPrepayment, scenarioA, scenarioB, fdRate, fdTerm, fdCompounding, fdPayoutFrequency, fdTaxRate]);

    // AI Handler
    const handleAskAI = async () => {
        if (!aiQuestion.trim()) return;
        if (!aiKey) {
            setShowKeyInput(true);
            return;
        }

        setAiLoading(true);
        setAiResponse('');

        const context = `
Current Financial Situation:
- Loan Amount: €${loanAmount}
- Interest Rate: ${loanRate}%
- Loan Term: ${loanTerm} months
- Bulk Prepayment: €${bulkPrepayment} at month ${prepaymentMonth}
- Extra Monthly: €${extraMonthly} (${extraMonthlyTiming})

FD Details:
- Principal: €${fdPrincipal}
- Rate: ${fdRate}%
- Term: ${fdTerm} months

Analysis:
- Net Benefit of Prepayment vs FD: €${netBenefit.toFixed(2)}
- Loan Interest Saved: €${loanSavings.toFixed(2)}
- FD Returns (Post-Tax): €${fdReturns.toFixed(2)}
    `;

        try {
            const response = await getDeepSeekInsights(context, aiQuestion, aiKey);
            setAiResponse(response || "No response received.");
        } catch (error) {
            setAiResponse("Error: Could not fetch insights. Please check your API Key.");
        } finally {
            setAiLoading(false);
        }
    };

    const navItems = [
        { id: 'dashboard', label: 'Dashboard', icon: Home },
        { id: 'loan', label: 'Loan Calculator', icon: Calculator },
        { id: 'fd', label: 'FD Calculator', icon: TrendingUp },
        { id: 'comparison', label: 'Comparison', icon: BarChart3 }
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 font-sans text-gray-900">
            {/* Header */}
            <header className="bg-white shadow-md sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-4 py-4">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg p-2">
                                <Calculator className="text-white" size={28} />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-800">FinDash</h1>
                                <p className="text-xs text-gray-500">Financial Planning Made Easy</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => {
                                    if (confirm("Reset all data to defaults?")) {
                                        localStorage.clear();
                                        window.location.reload();
                                    }
                                }}
                                className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                            >
                                <RefreshCw size={16} />
                                <span className="hidden sm:inline">Reset All</span>
                            </button>
                            <button
                                onClick={() => setShowAIInsights(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 rounded-lg transition-all"
                            >
                                <Sparkles size={16} />
                                <span className="hidden sm:inline">AI Insights</span>
                            </button>
                        </div>
                    </div>

                    {/* Navigation */}
                    <nav className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                        {navItems.map(item => (
                            <button
                                key={item.id}
                                onClick={() => setCurrentPage(item.id)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${currentPage === item.id
                                        ? 'bg-blue-600 text-white shadow-md'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                            >
                                <item.icon size={18} />
                                {item.label}
                            </button>
                        ))}
                    </nav>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 py-8 pb-24">
                {currentPage === 'dashboard' && <Dashboard
                    eurToInr={eurToInr} setEurToInr={setEurToInr}
                    loanAmount={loanAmount} loanRate={loanRate} currentEMI={currentEMI}
                    scenarioA={scenarioA} scenarioC={scenarioC}
                    fdPrincipal={fdPrincipal} fdRate={fdRate} fdTerm={fdTerm} fdPayoutFrequency={fdPayoutFrequency} fdResult={fdResult}
                    netBenefit={netBenefit} loanSavings={loanSavings} fdReturns={fdReturns}
                    setShowAIInsights={setShowAIInsights} setCurrentPage={setCurrentPage}
                />}
                {currentPage === 'loan' && <LoanCalculator
                    loanAmount={loanAmount} setLoanAmount={setLoanAmount}
                    loanRate={loanRate} setLoanRate={setLoanRate}
                    loanTerm={loanTerm} setLoanTerm={setLoanTerm}
                    bulkPrepayment={bulkPrepayment} setBulkPrepayment={setBulkPrepayment}
                    prepaymentMonth={prepaymentMonth} setPrepaymentMonth={setPrepaymentMonth}
                    prepaymentPenalty={prepaymentPenalty} setPrepaymentPenalty={setPrepaymentPenalty}
                    extraMonthly={extraMonthly} setExtraMonthly={setExtraMonthly}
                    extraMonthlyTiming={extraMonthlyTiming} setExtraMonthlyTiming={setExtraMonthlyTiming}
                    currentEMI={currentEMI} scenarioA={scenarioA} scenarioB={scenarioB} scenarioC={scenarioC}
                    eurToInr={eurToInr}
                />}
                {currentPage === 'fd' && <FDCalculator
                    fdPrincipal={fdPrincipal} setFdPrincipal={setFdPrincipal}
                    fdRate={fdRate} setFdRate={setFdRate}
                    fdTerm={fdTerm} setFdTerm={setFdTerm}
                    fdCompounding={fdCompounding} setFdCompounding={setFdCompounding}
                    fdPayoutFrequency={fdPayoutFrequency} setFdPayoutFrequency={setFdPayoutFrequency}
                    fdTaxRate={fdTaxRate} setFdTaxRate={setFdTaxRate}
                    fdResult={fdResult} eurToInr={eurToInr}
                />}
                {currentPage === 'comparison' && <Comparison
                    bulkPrepayment={bulkPrepayment} eurToInr={eurToInr}
                    loanSavings={loanSavings} scenarioA={scenarioA} scenarioB={scenarioB}
                    comparisonAmount={comparisonAmount} fdRate={fdRate} fdTerm={fdTerm}
                    fdCompounding={fdCompounding} fdPayoutFrequency={fdPayoutFrequency} fdTaxRate={fdTaxRate}
                    fdReturns={fdReturns} netBenefit={netBenefit}
                />}
            </main>

            {/* AI Floating Button */}
            <button
                onClick={() => setShowAIInsights(!showAIInsights)}
                className="fixed bottom-6 right-6 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full p-4 shadow-lg hover:shadow-xl transition-all hover:scale-110 z-50"
            >
                <Sparkles size={24} />
            </button>

            {/* AI Insights Modal */}
            {showAIInsights && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                        <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white p-6 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Sparkles size={28} />
                                <div>
                                    <h2 className="text-2xl font-bold">AI Financial Insights</h2>
                                    <p className="text-sm text-purple-100">Powered by DeepSeek AI</p>
                                </div>
                            </div>
                            <button onClick={() => setShowAIInsights(false)} className="hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition-colors">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6">
                            {!aiKey || showKeyInput ? (
                                <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                                    <label className="block text-sm font-medium text-yellow-800 mb-2">DeepSeek API Key Required</label>
                                    <input
                                        type="password"
                                        className="w-full px-3 py-2 border rounded mb-2"
                                        placeholder="sk-..."
                                        value={aiKey}
                                        onChange={(e) => setAiKey(e.target.value)}
                                    />
                                    <button
                                        onClick={() => setShowKeyInput(false)}
                                        className="w-full bg-yellow-600 text-white py-2 rounded font-medium hover:bg-yellow-700"
                                    >
                                        Save Key
                                    </button>
                                </div>
                            ) : null}

                            <div className="mb-4">
                                <p className="text-sm font-semibold text-gray-700 mb-2">Quick Questions:</p>
                                <div className="flex flex-wrap gap-2">
                                    {["Should I prepay my loan?", "How much tax will I pay on FD?", "Analyze my repayment strategy"].map((q, idx) => (
                                        <button key={idx} onClick={() => setAiQuestion(q)} className="text-xs bg-purple-50 text-purple-700 px-3 py-2 rounded-lg hover:bg-purple-100 border border-purple-200">
                                            {q}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="mb-4">
                                <textarea
                                    value={aiQuestion}
                                    onChange={(e) => setAiQuestion(e.target.value)}
                                    placeholder="Ask any financial question..."
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 resize-none"
                                    rows={3}
                                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAskAI(); } }}
                                />
                            </div>

                            {aiResponse && (
                                <div className="bg-gray-50 rounded-lg p-4 border border-purple-100">
                                    <p className="whitespace-pre-wrap text-sm text-gray-800 leading-relaxed">{aiResponse}</p>
                                </div>
                            )}

                            {aiLoading && <div className="text-center py-4 text-purple-600 animate-pulse">Analyzing...</div>}
                        </div>

                        <div className="border-t bg-gray-50 p-4 flex gap-3">
                            <button
                                onClick={handleAskAI}
                                disabled={aiLoading}
                                className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-lg font-medium hover:from-purple-600 transition-all disabled:opacity-50"
                            >
                                <Send size={18} />
                                Get Insights
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default App;
