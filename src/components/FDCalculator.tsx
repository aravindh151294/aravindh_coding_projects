
import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface FDCalculatorProps {
    fdPrincipal: number;
    setFdPrincipal: (val: number) => void;
    fdRate: number;
    setFdRate: (val: number) => void;
    fdTerm: number;
    setFdTerm: (val: number) => void;
    fdCompounding: string;
    setFdCompounding: (val: string) => void;
    fdPayoutFrequency: string;
    setFdPayoutFrequency: (val: string) => void;
    fdTaxRate: number;
    setFdTaxRate: (val: number) => void;
    fdResult: any;
    eurToInr: number;
}

const FDCalculator = ({
    fdPrincipal, setFdPrincipal, fdRate, setFdRate, fdTerm, setFdTerm,
    fdCompounding, setFdCompounding, fdPayoutFrequency, setFdPayoutFrequency,
    fdTaxRate, setFdTaxRate, fdResult, eurToInr
}: FDCalculatorProps) => {
    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold text-gray-800 mb-6">Fixed Deposit Calculator</h2>

            {/* Input Form */}
            <div className="bg-white rounded-lg p-6 shadow-md border">
                <h3 className="text-xl font-semibold mb-4 text-gray-800">FD Details</h3>
                <div className="grid md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Principal Amount (€)
                        </label>
                        <input
                            type="number"
                            value={fdPrincipal}
                            onChange={(e) => setFdPrincipal(Number(e.target.value))}
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Interest Rate (% p.a.)
                        </label>
                        <input
                            type="number"
                            value={fdRate}
                            onChange={(e) => setFdRate(Number(e.target.value))}
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            step="0.1"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Term (Months)
                        </label>
                        <input
                            type="number"
                            value={fdTerm}
                            onChange={(e) => setFdTerm(Number(e.target.value))}
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        />
                        <p className="text-xs text-gray-500 mt-1">{(fdTerm / 12).toFixed(1)} years</p>
                    </div>
                </div>

                <div className="grid md:grid-cols-3 gap-4 mt-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Compounding Frequency
                        </label>
                        <select
                            value={fdCompounding}
                            onChange={(e) => setFdCompounding(e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        >
                            <option value="monthly">Monthly</option>
                            <option value="quarterly">Quarterly</option>
                            <option value="half-yearly">Half-Yearly</option>
                            <option value="yearly">Yearly</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Interest Payout
                        </label>
                        <select
                            value={fdPayoutFrequency}
                            onChange={(e) => setFdPayoutFrequency(e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        >
                            <option value="maturity">At Maturity (Reinvested)</option>
                            <option value="monthly">Monthly Payout</option>
                            <option value="quarterly">Quarterly Payout</option>
                            <option value="yearly">Yearly Payout</option>
                        </select>
                        <p className="text-xs text-gray-500 mt-1">
                            {fdPayoutFrequency === 'maturity' ? 'Interest compounds' : 'Interest paid out regularly'}
                        </p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Tax Rate (%)
                        </label>
                        <input
                            type="number"
                            value={fdTaxRate}
                            onChange={(e) => setFdTaxRate(Number(e.target.value))}
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            step="0.1"
                        />
                    </div>
                </div>
            </div>

            {/* Results */}
            <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6 border-2 border-green-200">
                    <h3 className="text-xl font-bold text-gray-800 mb-4">Maturity Summary</h3>
                    <div className="space-y-3">
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                            <p className="text-xs font-semibold text-blue-800 mb-1">💡 Payout Impact</p>
                            <p className="text-xs text-blue-700">
                                {fdPayoutFrequency === 'maturity'
                                    ? 'Full compounding effect - all interest reinvested until maturity for maximum returns'
                                    : `With ${fdPayoutFrequency} payouts, interest is withdrawn regularly, reducing compounding benefits but providing regular income`}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Principal Amount</p>
                            <p className="text-2xl font-bold text-gray-800">€{fdPrincipal.toLocaleString()}</p>
                            <p className="text-sm text-gray-500">₹{(fdPrincipal * eurToInr).toLocaleString('en-IN')}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Interest Earned</p>
                            <p className="text-xl font-bold text-green-600">€{fdResult.interest.toFixed(2)}</p>
                            <p className="text-sm text-gray-500">₹{(fdResult.interest * eurToInr).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Tax on Interest ({fdTaxRate}%)</p>
                            <p className="text-lg font-semibold text-red-600">-€{fdResult.taxOnInterest.toFixed(2)}</p>
                            <p className="text-sm text-gray-500">-₹{(fdResult.taxOnInterest * eurToInr).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
                        </div>
                        {fdPayoutFrequency !== 'maturity' && (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                <p className="text-sm text-gray-600">Total Payouts Received</p>
                                <p className="text-lg font-bold text-blue-600">€{fdResult.totalPayouts.toFixed(2)}</p>
                                <p className="text-xs text-gray-500">Regular {fdPayoutFrequency} income</p>
                            </div>
                        )}
                        <div className="pt-3 border-t border-green-300">
                            <p className="text-sm text-gray-600">Maturity Amount (Pre-Tax)</p>
                            <p className="text-2xl font-bold text-gray-800">€{fdResult.maturityAmount.toFixed(2)}</p>
                            <p className="text-sm text-gray-500">₹{(fdResult.maturityAmount * eurToInr).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
                        </div>
                        <div className="pt-3 border-t border-green-300">
                            <p className="text-sm text-gray-600">Post-Tax Maturity</p>
                            <p className="text-3xl font-bold text-green-600">€{fdResult.postTaxMaturity.toFixed(2)}</p>
                            <p className="text-sm text-gray-500">₹{(fdResult.postTaxMaturity * eurToInr).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
                            <p className="text-xs text-gray-500 mt-2 italic">
                                {fdPayoutFrequency === 'maturity'
                                    ? '💰 Full compounding - interest reinvested'
                                    : `💸 Regular ${fdPayoutFrequency} payouts - reduced compounding`}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg p-6 shadow-md border">
                    <h3 className="text-xl font-bold text-gray-800 mb-4">Growth Breakdown</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={[
                                    { name: 'Principal', value: fdPrincipal },
                                    { name: 'Interest (Post-Tax)', value: fdResult.interest - fdResult.taxOnInterest }
                                ]}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                            >
                                <Cell fill="#10b981" />
                                <Cell fill="#34d399" />
                            </Pie>
                            <Tooltip formatter={(value: number) => `€${value.toFixed(2)}`} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Yearly Breakdown */}
            <div className="bg-white rounded-lg p-6 shadow-md border">
                <h3 className="text-xl font-bold text-gray-800 mb-4">Monthly Breakdown</h3>
                <div className="overflow-x-auto max-h-96 overflow-y-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-100 sticky top-0">
                            <tr>
                                <th className="px-4 py-2 text-left">Month</th>
                                <th className="px-4 py-2 text-right">Balance (€)</th>
                                <th className="px-4 py-2 text-right">Balance (₹)</th>
                                <th className="px-4 py-2 text-right">Interest (€)</th>
                                <th className="px-4 py-2 text-right">Payout (€)</th>
                                <th className="px-4 py-2 text-right">Tax (€)</th>
                                <th className="px-4 py-2 text-right">Net Value (€)</th>
                                <th className="px-4 py-2 text-right">Net Value (₹)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {fdResult.breakdown.map((row: any, idx: number) => (
                                <tr key={idx} className={row.payout > 0 ? 'bg-green-50 font-medium' : (idx % 2 === 0 ? 'bg-gray-50' : '')}>
                                    <td className="px-4 py-2">
                                        {row.month} {row.payout > 0 && '💰'}
                                    </td>
                                    <td className="px-4 py-2 text-right font-medium">€{row.amount.toFixed(2)}</td>
                                    <td className="px-4 py-2 text-right text-gray-600">₹{(row.amount * eurToInr).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</td>
                                    <td className="px-4 py-2 text-right text-green-600">€{row.interest.toFixed(2)}</td>
                                    <td className="px-4 py-2 text-right font-semibold text-blue-600">
                                        {row.payout > 0 ? `€${row.payout.toFixed(2)}` : '-'}
                                    </td>
                                    <td className="px-4 py-2 text-right text-red-600">
                                        {row.tax > 0 ? `€${row.tax.toFixed(2)}` : '-'}
                                    </td>
                                    <td className="px-4 py-2 text-right font-semibold">€{row.netAmount.toFixed(2)}</td>
                                    <td className="px-4 py-2 text-right text-gray-600">₹{(row.netAmount * eurToInr).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Growth Chart */}
            <div className="bg-white rounded-lg p-6 shadow-md border">
                <h3 className="text-xl font-bold text-gray-800 mb-4">Growth Over Time</h3>
                <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={fdResult.breakdown}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                            dataKey="month"
                            label={{ value: 'Month', position: 'insideBottom', offset: -5 }}
                            interval={Math.floor(fdTerm / 10)}
                        />
                        <YAxis label={{ value: 'Amount (€)', angle: -90, position: 'insideLeft' }} />
                        <Tooltip formatter={(value: number) => `€${value.toFixed(2)}`} />
                        <Legend />
                        <Line type="monotone" dataKey="amount" stroke="#10b981" name="Balance" strokeWidth={2} />
                        <Line type="monotone" dataKey="netAmount" stroke="#34d399" name="Net Value (Post-Tax)" strokeWidth={2} />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default FDCalculator;
