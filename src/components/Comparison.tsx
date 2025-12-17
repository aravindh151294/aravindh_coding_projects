
import { Calculator, TrendingUp, ArrowRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { calculateFD } from '@/utils/finance';

interface ComparisonProps {
    bulkPrepayment: number;
    eurToInr: number;
    loanSavings: number;
    scenarioA: any;
    scenarioB: any;
    comparisonAmount: number;
    fdRate: number;
    fdTerm: number;
    fdCompounding: string;
    fdPayoutFrequency: string;
    fdTaxRate: number;
    fdReturns: number;
    netBenefit: number;
}

const Comparison = ({
    bulkPrepayment, eurToInr, loanSavings, scenarioA, scenarioB,
    comparisonAmount, fdRate, fdTerm, fdCompounding, fdPayoutFrequency, fdTaxRate,
    fdReturns, netBenefit
}: ComparisonProps) => {
    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold text-gray-800 mb-6">Prepay Loan vs Invest in FD</h2>

            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 border-2 border-purple-200">
                <h3 className="text-2xl font-bold text-gray-800 mb-4">Financial Decision Analysis</h3>
                <p className="text-gray-700 mb-4">
                    Comparing the benefit of prepaying €{bulkPrepayment.toLocaleString()} on your loan versus investing the same amount in a Fixed Deposit.
                </p>

                <div className="grid md:grid-cols-2 gap-6 mb-6">
                    {/* Loan Prepayment Option */}
                    <div className="bg-white rounded-lg p-6 border-2 border-blue-300">
                        <div className="flex items-center gap-3 mb-4">
                            <Calculator className="text-blue-600" size={32} />
                            <h4 className="text-xl font-bold text-gray-800">Loan Prepayment</h4>
                        </div>
                        <div className="space-y-3">
                            <div>
                                <p className="text-sm text-gray-600">Prepayment Amount</p>
                                <p className="text-2xl font-bold text-blue-600">€{bulkPrepayment.toLocaleString()}</p>
                                <p className="text-sm text-gray-500">₹{(bulkPrepayment * eurToInr).toLocaleString('en-IN')}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Interest Saved</p>
                                <p className="text-xl font-bold text-green-600">€{loanSavings.toFixed(2)}</p>
                                <p className="text-sm text-gray-500">₹{(loanSavings * eurToInr).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Prepayment Penalty</p>
                                <p className="text-lg font-semibold text-red-600">-€{scenarioB.totalPenalty.toFixed(2)}</p>
                            </div>
                            <div className="pt-3 border-t border-blue-200">
                                <p className="text-sm text-gray-600 font-semibold">Net Benefit</p>
                                <p className="text-2xl font-bold text-blue-600">€{loanSavings.toFixed(2)}</p>
                            </div>
                        </div>
                    </div>

                    {/* FD Investment Option */}
                    <div className="bg-white rounded-lg p-6 border-2 border-green-300">
                        <div className="flex items-center gap-3 mb-4">
                            <TrendingUp className="text-green-600" size={32} />
                            <h4 className="text-xl font-bold text-gray-800">FD Investment</h4>
                        </div>
                        <div className="space-y-3">
                            <div>
                                <p className="text-sm text-gray-600">Investment Amount</p>
                                <p className="text-2xl font-bold text-green-600">€{comparisonAmount.toLocaleString()}</p>
                                <p className="text-sm text-gray-500">₹{(comparisonAmount * eurToInr).toLocaleString('en-IN')}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Interest Earned (Pre-Tax)</p>
                                <p className="text-xl font-bold text-green-600">
                                    €{calculateFD(comparisonAmount, fdRate, Math.min(scenarioA.actualTerm, fdTerm), fdCompounding, fdPayoutFrequency, fdTaxRate).interest.toFixed(2)}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Tax Liability</p>
                                <p className="text-lg font-semibold text-red-600">
                                    -€{calculateFD(comparisonAmount, fdRate, Math.min(scenarioA.actualTerm, fdTerm), fdCompounding, fdPayoutFrequency, fdTaxRate).taxOnInterest.toFixed(2)}
                                </p>
                            </div>
                            <div className="pt-3 border-t border-green-200">
                                <p className="text-sm text-gray-600 font-semibold">Net Returns (Post-Tax)</p>
                                <p className="text-2xl font-bold text-green-600">€{fdReturns.toFixed(2)}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Final Verdict */}
                <div className={`bg-gradient-to-r ${netBenefit > 0 ? 'from-blue-100 to-blue-200 border-blue-400' : 'from-green-100 to-green-200 border-green-400'} rounded-lg p-6 border-2`}>
                    <div className="flex items-center justify-between mb-4">
                        <h4 className="text-2xl font-bold text-gray-800">Recommendation</h4>
                        <ArrowRight className={netBenefit > 0 ? 'text-blue-600' : 'text-green-600'} size={32} />
                    </div>
                    <div className="space-y-3">
                        <div className="bg-white rounded-lg p-4 mt-4">
                            <p className="text-lg font-bold text-gray-800 mb-2">
                                {netBenefit > 0
                                    ? '✅ Prepaying your loan is the better choice!'
                                    : '✅ Investing in FD is the better choice!'}
                            </p>
                            <p className="text-gray-700">
                                {netBenefit > 0
                                    ? `By prepaying €${bulkPrepayment.toLocaleString()} on your loan, you'll save €${Math.abs(netBenefit).toFixed(2)} more than investing the same amount in an FD.`
                                    : `By investing €${comparisonAmount.toLocaleString()} in an FD, you'll earn €${Math.abs(netBenefit).toFixed(2)} more than the interest you'd save by prepaying your loan.`}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Visual Comparison Chart */}
                <div className="bg-white rounded-lg p-6 shadow-md border mt-6">
                    <h4 className="text-xl font-bold text-gray-800 mb-4">Visual Comparison</h4>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart
                            data={[
                                {
                                    option: 'Loan Prepayment',
                                    benefit: loanSavings,
                                    cost: scenarioB.totalPenalty,
                                    net: loanSavings
                                },
                                {
                                    option: 'FD Investment',
                                    benefit: calculateFD(comparisonAmount, fdRate, Math.min(scenarioA.actualTerm, fdTerm), fdCompounding, fdPayoutFrequency, fdTaxRate).interest,
                                    cost: calculateFD(comparisonAmount, fdRate, Math.min(scenarioA.actualTerm, fdTerm), fdCompounding, fdPayoutFrequency, fdTaxRate).taxOnInterest,
                                    net: fdReturns
                                }
                            ]}
                        >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="option" />
                            <YAxis label={{ value: 'Amount (€)', angle: -90, position: 'insideLeft' }} />
                            <Tooltip formatter={(value: number) => `€${value.toFixed(2)}`} />
                            <Legend />
                            <Bar dataKey="benefit" fill="#10b981" name="Gross Benefit" />
                            <Bar dataKey="cost" fill="#ef4444" name="Cost/Tax" />
                            <Bar dataKey="net" fill="#3b82f6" name="Net Benefit" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

export default Comparison;
