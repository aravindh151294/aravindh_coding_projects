
import { Download } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface LoanCalculatorProps {
    loanAmount: number;
    setLoanAmount: (val: number) => void;
    loanRate: number;
    setLoanRate: (val: number) => void;
    loanTerm: number;
    setLoanTerm: (val: number) => void;
    bulkPrepayment: number;
    setBulkPrepayment: (val: number) => void;
    prepaymentMonth: number;
    setPrepaymentMonth: (val: number) => void;
    prepaymentPenalty: number;
    setPrepaymentPenalty: (val: number) => void;
    extraMonthly: number;
    setExtraMonthly: (val: number) => void;
    extraMonthlyTiming: string;
    setExtraMonthlyTiming: (val: string) => void;
    currentEMI: number;
    scenarioA: any;
    scenarioB: any;
    scenarioC: any;
    eurToInr: number;
}

const LoanCalculator = ({
    loanAmount, setLoanAmount, loanRate, setLoanRate, loanTerm, setLoanTerm,
    bulkPrepayment, setBulkPrepayment, prepaymentMonth, setPrepaymentMonth,
    prepaymentPenalty, setPrepaymentPenalty, extraMonthly, setExtraMonthly,
    extraMonthlyTiming, setExtraMonthlyTiming,
    currentEMI, scenarioA, scenarioB, scenarioC, eurToInr
}: LoanCalculatorProps) => {

    const exportToCSV = (scenario: any, name: string) => {
        const headers = ['Month', 'EMI', 'Extra Monthly', 'Bulk Payment', 'Penalty', 'Total Payment', 'Principal', 'Interest', 'Balance EUR', 'Balance INR'];
        const rows = scenario.schedule.map((row: any) => [
            row.month,
            row.emi.toFixed(2),
            row.extraMonthly.toFixed(2),
            row.bulkPayment.toFixed(2),
            row.penalty.toFixed(2),
            row.payment.toFixed(2),
            row.principal.toFixed(2),
            row.interest.toFixed(2),
            row.balance.toFixed(2),
            (row.balance * eurToInr).toFixed(2)
        ]);

        const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${name}-schedule.csv`;
        a.click();
    };

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold text-gray-800 mb-6">Loan Calculator</h2>

            {/* Input Form */}
            <div className="bg-white rounded-lg p-6 shadow-md border">
                <h3 className="text-xl font-semibold mb-4 text-gray-800">Loan Details</h3>
                <div className="grid md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Loan Amount (€)
                        </label>
                        <input
                            type="number"
                            value={loanAmount}
                            onChange={(e) => setLoanAmount(Number(e.target.value))}
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Interest Rate (% p.a.)
                        </label>
                        <input
                            type="number"
                            value={loanRate}
                            onChange={(e) => setLoanRate(Number(e.target.value))}
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            step="0.1"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Loan Term (Months)
                        </label>
                        <input
                            type="number"
                            value={loanTerm}
                            onChange={(e) => setLoanTerm(Number(e.target.value))}
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <p className="text-xs text-gray-500 mt-1">{(loanTerm / 12).toFixed(1)} years</p>
                    </div>
                </div>

                <h3 className="text-xl font-semibold mt-6 mb-4 text-gray-800">Prepayment Options</h3>
                <div className="grid md:grid-cols-4 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Bulk Prepayment (€)
                        </label>
                        <input
                            type="number"
                            value={bulkPrepayment}
                            onChange={(e) => setBulkPrepayment(Number(e.target.value))}
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Prepayment Month
                        </label>
                        <input
                            type="number"
                            value={prepaymentMonth}
                            onChange={(e) => setPrepaymentMonth(Number(e.target.value))}
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Penalty (%)
                        </label>
                        <input
                            type="number"
                            value={prepaymentPenalty}
                            onChange={(e) => setPrepaymentPenalty(Number(e.target.value))}
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            step="0.1"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Extra Monthly (€)
                        </label>
                        <input
                            type="number"
                            value={extraMonthly}
                            onChange={(e) => setExtraMonthly(Number(e.target.value))}
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                </div>

                <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Extra Monthly Payment Timing
                    </label>
                    <div className="flex flex-wrap gap-3">
                        {[
                            { value: 'none', label: 'None', color: 'gray' },
                            { value: 'before', label: 'Before Bulk Prepayment', color: 'blue' },
                            { value: 'after', label: 'After Bulk Prepayment', color: 'green' },
                            { value: 'both', label: 'Throughout Loan', color: 'purple' }
                        ].map(option => (
                            <button
                                key={option.value}
                                onClick={() => setExtraMonthlyTiming(option.value)}
                                className={`px-4 py-2 rounded-lg font-medium transition-colors ${extraMonthlyTiming === option.value
                                    ? `bg-${option.color}-500 text-white`
                                    : `bg-${option.color}-100 text-${option.color}-700 hover:bg-${option.color}-200`
                                    }`}
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Scenario Comparison */}
            <div className="grid md:grid-cols-3 gap-6">
                {[
                    { name: 'Scenario A', data: scenarioA, desc: 'Original Schedule', color: 'blue' },
                    { name: 'Scenario B', data: scenarioB, desc: 'With Bulk Prepayment', color: 'green' },
                    { name: 'Scenario C', data: scenarioC, desc: 'Aggressive Repayment', color: 'purple' }
                ].map(scenario => (
                    <div key={scenario.name} className={`bg-gradient-to-br from-${scenario.color}-50 to-${scenario.color}-100 rounded-lg p-6 border-2 border-${scenario.color}-200`}>
                        <h3 className="text-xl font-bold text-gray-800 mb-2">{scenario.name}</h3>
                        <p className="text-sm text-gray-600 mb-4">{scenario.desc}</p>
                        <div className="space-y-3">
                            <div>
                                <p className="text-sm text-gray-600">Monthly EMI</p>
                                <p className="text-2xl font-bold text-gray-800">
                                    €{currentEMI.toFixed(2)}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Total Interest</p>
                                <p className="text-xl font-bold text-gray-800">€{scenario.data.totalInterest.toFixed(2)}</p>
                                <p className="text-xs text-gray-500">₹{(scenario.data.totalInterest * eurToInr).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
                            </div>
                            {scenario.data.totalPenalty > 0 && (
                                <div>
                                    <p className="text-sm text-gray-600">Penalty</p>
                                    <p className="text-lg font-semibold text-red-600">€{scenario.data.totalPenalty.toFixed(2)}</p>
                                </div>
                            )}
                            <div>
                                <p className="text-sm text-gray-600">Total Payment</p>
                                <p className="text-xl font-bold text-gray-800">€{scenario.data.totalPayment.toFixed(2)}</p>
                                <p className="text-xs text-gray-500">₹{(scenario.data.totalPayment * eurToInr).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Loan Duration</p>
                                <p className="text-lg font-semibold text-gray-800">
                                    {Math.floor(scenario.data.actualTerm / 12)} years {scenario.data.actualTerm % 12} months
                                </p>
                            </div>
                            {scenario.name !== 'Scenario A' && (
                                <div className="pt-3 border-t border-gray-300">
                                    <p className="text-sm text-gray-600">Savings vs Scenario A</p>
                                    <p className="text-xl font-bold text-green-600">
                                        €{(scenarioA.totalInterest - scenario.data.totalInterest).toFixed(2)}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        ₹{((scenarioA.totalInterest - scenario.data.totalInterest) * eurToInr).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                                    </p>
                                    <p className="text-xs text-gray-600 mt-1 italic">
                                        Net savings after deducting penalties
                                    </p>
                                </div>
                            )}
                            <button
                                onClick={() => exportToCSV(scenario.data, scenario.name)}
                                className={`w-full mt-3 flex items-center justify-center gap-2 px-4 py-2 bg-${scenario.color}-600 text-white rounded-lg hover:bg-${scenario.color}-700 transition-colors`}
                            >
                                <Download size={16} />
                                Export CSV
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Detailed Schedule Tables */}
            {[
                { name: 'Scenario A', data: scenarioA, color: 'blue' },
                { name: 'Scenario B', data: scenarioB, color: 'green' },
                { name: 'Scenario C', data: scenarioC, color: 'purple' }
            ].map(scenario => (
                <div key={scenario.name} className="bg-white rounded-lg p-6 shadow-md border">
                    <h3 className="text-xl font-bold text-gray-800 mb-4">{scenario.name} - Detailed Schedule</h3>
                    <div className="overflow-x-auto max-h-96 overflow-y-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-100 sticky top-0">
                                <tr>
                                    <th className="px-3 py-2 text-left">Month</th>
                                    <th className="px-3 py-2 text-right">EMI</th>
                                    <th className="px-3 py-2 text-right">Extra</th>
                                    <th className="px-3 py-2 text-right">Bulk</th>
                                    {scenario.data.totalPenalty > 0 && <th className="px-3 py-2 text-right">Penalty</th>}
                                    <th className="px-3 py-2 text-right">Total Payment</th>
                                    <th className="px-3 py-2 text-right">Principal</th>
                                    <th className="px-3 py-2 text-right">Interest</th>
                                    <th className="px-3 py-2 text-right">Balance (€)</th>
                                    <th className="px-3 py-2 text-right">Balance (₹)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {scenario.data.schedule.map((row: any, idx: number) => (
                                    <tr key={idx} className={idx % 2 === 0 ? 'bg-gray-50' : ''}>
                                        <td className="px-3 py-2">{row.month}</td>
                                        <td className="px-3 py-2 text-right">€{row.emi.toFixed(2)}</td>
                                        <td className="px-3 py-2 text-right">€{row.extraMonthly.toFixed(2)}</td>
                                        <td className="px-3 py-2 text-right">€{row.bulkPayment.toFixed(2)}</td>
                                        {scenario.data.totalPenalty > 0 && (
                                            <td className="px-3 py-2 text-right text-red-600">€{row.penalty.toFixed(2)}</td>
                                        )}
                                        <td className="px-3 py-2 text-right font-semibold">€{row.payment.toFixed(2)}</td>
                                        <td className="px-3 py-2 text-right">€{row.principal.toFixed(2)}</td>
                                        <td className="px-3 py-2 text-right">€{row.interest.toFixed(2)}</td>
                                        <td className="px-3 py-2 text-right font-medium">€{row.balance.toFixed(2)}</td>
                                        <td className="px-3 py-2 text-right text-gray-600">₹{(row.balance * eurToInr).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ))}

            {/* Chart */}
            <div className="bg-white rounded-lg p-6 shadow-md border">
                <h3 className="text-xl font-bold text-gray-800 mb-4">Balance Comparison Over Time</h3>
                <ResponsiveContainer width="100%" height={400}>
                    <LineChart>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                            dataKey="month"
                            type="number"
                            domain={[0, Math.max(scenarioA.actualTerm, scenarioB.actualTerm, scenarioC.actualTerm)]}
                            label={{ value: 'Month', position: 'insideBottom', offset: -5 }}
                        />
                        <YAxis label={{ value: 'Balance (€)', angle: -90, position: 'insideLeft' }} />
                        <Tooltip formatter={(value: number) => `€${value.toFixed(2)}`} />
                        <Legend />
                        <Line
                            data={scenarioA.schedule}
                            type="monotone"
                            dataKey="balance"
                            stroke="#3b82f6"
                            name="Scenario A"
                            strokeWidth={2}
                        />
                        <Line
                            data={scenarioB.schedule}
                            type="monotone"
                            dataKey="balance"
                            stroke="#10b981"
                            name="Scenario B"
                            strokeWidth={2}
                        />
                        <Line
                            data={scenarioC.schedule}
                            type="monotone"
                            dataKey="balance"
                            stroke="#8b5cf6"
                            name="Scenario C"
                            strokeWidth={2}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default LoanCalculator;
