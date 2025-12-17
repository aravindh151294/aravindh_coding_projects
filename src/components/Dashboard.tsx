
import { Calculator, PiggyBank, DollarSign, Info, Sparkles } from 'lucide-react';

interface DashboardProps {
    eurToInr: number;
    setEurToInr: (rate: number) => void;
    loanAmount: number;
    loanRate: number;
    currentEMI: number;
    scenarioA: any;
    scenarioC: any;
    fdPrincipal: number;
    fdRate: number;
    fdTerm: number;
    fdPayoutFrequency: string;
    fdResult: any;
    netBenefit: number;
    loanSavings: number;
    fdReturns: number;
    setShowAIInsights: (show: boolean) => void;
    setCurrentPage: (page: string) => void;
}

const Dashboard = ({
    eurToInr, setEurToInr, loanAmount, loanRate, currentEMI, scenarioA, scenarioC,
    fdPrincipal, fdRate, fdTerm, fdPayoutFrequency, fdResult,
    netBenefit, loanSavings, fdReturns, setShowAIInsights, setCurrentPage
}: DashboardProps) => {
    return (
        <div className="space-y-6">
            <div className="text-center mb-8">
                <h1 className="text-4xl font-bold text-blue-600 mb-2">FinDash</h1>
                <p className="text-gray-600">Your Complete Financial Planning Dashboard</p>
            </div>

            {/* Currency Converter */}
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4 border border-purple-200">
                <div className="flex items-center gap-3 mb-2">
                    <DollarSign className="text-purple-600" size={20} />
                    <h3 className="font-semibold">Currency Converter</h3>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-sm">1 EUR =</span>
                    <input
                        type="number"
                        value={eurToInr}
                        onChange={(e) => setEurToInr(Number(e.target.value))}
                        className="w-24 px-3 py-1 border rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        step="0.01"
                    />
                    <span className="text-sm">INR</span>
                </div>
            </div>

            {/* Overview Cards */}
            <div className="grid md:grid-cols-2 gap-6">
                {/* Loan Overview */}
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold">Loan Overview</h2>
                        <Calculator size={32} />
                    </div>
                    <div className="space-y-3">
                        <div>
                            <p className="text-blue-100 text-sm">Loan Amount</p>
                            <p className="text-2xl font-bold">€{loanAmount.toLocaleString()}</p>
                            <p className="text-sm text-blue-100">₹{(loanAmount * eurToInr).toLocaleString('en-IN')}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-blue-100 text-sm">Monthly EMI</p>
                                <p className="text-lg font-semibold">€{currentEMI.toFixed(2)}</p>
                            </div>
                            <div>
                                <p className="text-blue-100 text-sm">Interest Rate</p>
                                <p className="text-lg font-semibold">{loanRate}%</p>
                            </div>
                        </div>
                        <div>
                            <p className="text-blue-100 text-sm">Total Interest (Scenario A)</p>
                            <p className="text-xl font-bold">€{scenarioA.totalInterest.toFixed(2)}</p>
                            <p className="text-sm text-blue-100">₹{(scenarioA.totalInterest * eurToInr).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
                        </div>
                        <div className="pt-2 border-t border-blue-400">
                            <p className="text-blue-100 text-sm">Savings with Prepayment (Scenario C)</p>
                            <p className="text-2xl font-bold text-green-300">
                                €{(scenarioA.totalInterest - scenarioC.totalInterest).toFixed(2)}
                            </p>
                            <p className="text-sm text-blue-100">
                                ₹{((scenarioA.totalInterest - scenarioC.totalInterest) * eurToInr).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                            </p>
                        </div>
                    </div>
                </div>

                {/* FD Overview */}
                <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold">Fixed Deposit Overview</h2>
                        <PiggyBank size={32} />
                    </div>
                    <div className="space-y-3">
                        <div>
                            <p className="text-green-100 text-sm">Principal Amount</p>
                            <p className="text-2xl font-bold">€{fdPrincipal.toLocaleString()}</p>
                            <p className="text-sm text-green-100">₹{(fdPrincipal * eurToInr).toLocaleString('en-IN')}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-green-100 text-sm">Interest Rate</p>
                                <p className="text-lg font-semibold">{fdRate}%</p>
                            </div>
                            <div>
                                <p className="text-green-100 text-sm">Term</p>
                                <p className="text-lg font-semibold">{fdTerm} months</p>
                                <p className="text-xs text-green-100">({(fdTerm / 12).toFixed(1)} years)</p>
                            </div>
                        </div>
                        <div>
                            <p className="text-green-100 text-sm">Payout Mode</p>
                            <p className="text-md font-semibold">
                                {fdPayoutFrequency === 'maturity' ? 'At Maturity' :
                                    fdPayoutFrequency.charAt(0).toUpperCase() + fdPayoutFrequency.slice(1)}
                            </p>
                        </div>
                        <div>
                            <p className="text-green-100 text-sm">Maturity Amount (Pre-Tax)</p>
                            <p className="text-xl font-bold">€{fdResult.maturityAmount.toFixed(2)}</p>
                            <p className="text-sm text-green-100">₹{(fdResult.maturityAmount * eurToInr).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
                        </div>
                        <div className="pt-2 border-t border-green-400">
                            <p className="text-green-100 text-sm">Post-Tax Maturity</p>
                            <p className="text-2xl font-bold text-yellow-300">
                                €{fdResult.postTaxMaturity.toFixed(2)}
                            </p>
                            <p className="text-sm text-green-100">
                                ₹{(fdResult.postTaxMaturity * eurToInr).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Comparison Insight */}
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg p-6 border border-yellow-200">
                <div className="flex items-center gap-3 mb-4">
                    <Info className="text-orange-600" size={24} />
                    <h3 className="text-xl font-bold text-gray-800">Smart Money Decision</h3>
                </div>
                <div className="space-y-2">
                    <div className="grid md:grid-cols-3 gap-4 mt-4">
                        <div className="bg-white rounded-lg p-4 border-2 border-blue-200">
                            <p className="text-sm text-gray-600 mb-1">Loan Interest Saved</p>
                            <p className="text-xl font-bold text-blue-600">€{loanSavings.toFixed(2)}</p>
                            <p className="text-xs text-gray-500">₹{(loanSavings * eurToInr).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
                        </div>
                        <div className="bg-white rounded-lg p-4 border-2 border-green-200">
                            <p className="text-sm text-gray-600 mb-1">FD Returns (Post-Tax)</p>
                            <p className="text-xl font-bold text-green-600">€{fdReturns.toFixed(2)}</p>
                            <p className="text-xs text-gray-500">₹{(fdReturns * eurToInr).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
                        </div>
                        <div className={`bg-white rounded-lg p-4 border-2 ${netBenefit > 0 ? 'border-green-400' : 'border-red-400'}`}>
                            <p className="text-sm text-gray-600 mb-1">Net Benefit</p>
                            <p className={`text-xl font-bold ${netBenefit > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                €{netBenefit.toFixed(2)}
                            </p>
                            <p className="text-xs text-gray-500">₹{(netBenefit * eurToInr).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
                        </div>
                    </div>
                    <p className="text-sm text-gray-600 mt-4 italic">
                        💡 {netBenefit > 0
                            ? "Prepaying your loan saves you more money than investing in FD!"
                            : "Investing in FD gives you better returns than loan prepayment."}
                    </p>
                </div>
            </div>

            {/* AI Feature Highlight */}
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl p-6 text-white shadow-lg">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="bg-white bg-opacity-20 rounded-full p-3">
                            <Sparkles size={32} />
                        </div>
                        <div>
                            <h3 className="text-2xl font-bold mb-1">Need Financial Advice?</h3>
                            <p className="text-purple-100">Get AI-powered insights about your loan and investment decisions</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowAIInsights(true)}
                        className="bg-white text-purple-600 px-6 py-3 rounded-lg font-semibold hover:bg-purple-50 transition-colors"
                    >
                        Ask AI
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
