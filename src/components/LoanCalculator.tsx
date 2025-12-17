import React, { useState, useEffect } from 'react';
import { Card, Input, Button } from './ui-base';
import { generateLoanSchedule, formatCurrency, formatDecimal, LoanSchedule } from '../utils/finance';
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, Legend, BarChart, Bar } from 'recharts';
import { Download, Table as TableIcon, TrendingDown } from 'lucide-react';

export default function LoanCalculator({ currency, rate }: any) {
    const [amount, setAmount] = useState(5000000); // 50 Lakhs
    const [interest, setInterest] = useState(8.5);
    const [term, setTerm] = useState(240); // 20 Years in months

    // Scenario B: Bulk Prepayment
    const [prepayAmount, setPrepayAmount] = useState(100000);
    const [prepayMonth, setPrepayMonth] = useState(12);
    const [prepayPenalty, setPrepayPenalty] = useState(0);

    // Scenario C: Aggressive
    const [extraMonthly, setExtraMonthly] = useState(5000);

    const [activeTab, setActiveTab] = useState<'chart' | 'table'>('chart');

    // Calculations
    const scenarioA = generateLoanSchedule(amount, interest, term, 'A');
    const scenarioB = generateLoanSchedule(amount, interest, term, 'B', [{ date: prepayMonth, amount: prepayAmount }], 0, prepayPenalty);
    const scenarioC = generateLoanSchedule(amount, interest, term, 'C', [], extraMonthly);

    // Comparison Data
    const comparisonData = [
        { name: 'Original', interest: scenarioA.totalInterest, color: '#ef4444' },
        { name: 'With Bulk Pay', interest: scenarioB.totalInterest, color: '#f59e0b' },
        { name: 'Aggressive', interest: scenarioC.totalInterest, color: '#10b981' },
    ];

    const exportCSV = () => {
        const headers = "Month,Principal,Interest,Balance,Total Payment\n";
        const rows = scenarioA.monthlyData.map(r =>
            `${r.month},${r.principal.toFixed(2)},${r.interest.toFixed(2)},${r.balance.toFixed(2)},${r.payment.toFixed(2)}`
        ).join("\n");
        const blob = new Blob([headers + rows], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = "loan_schedule.csv";
        a.click();
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="md:col-span-1 space-y-4">
                    <h3 className="font-semibold text-lg flex items-center gap-2"><TrendingDown className="w-5 h-5 text-blue-500" /> Loan Details</h3>
                    <Input label="Loan Amount" value={amount} onChange={(v: any) => setAmount(Number(v))} suffix={currency} />
                    <Input label="Interest Rate" value={interest} onChange={(v: any) => setInterest(Number(v))} suffix="%" step="0.1" />
                    <Input label="Tenure (Months)" value={term} onChange={(v: any) => setTerm(Number(v))} suffix="mo" />

                    <div className="pt-4 border-t">
                        <h4 className="text-sm font-semibold mb-2">Scenario B: Bulk Prepayment</h4>
                        <Input label="Amount" value={prepayAmount} onChange={(v: any) => setPrepayAmount(Number(v))} suffix={currency} />
                        <Input label="At Month" value={prepayMonth} onChange={(v: any) => setPrepayMonth(Number(v))} suffix="mo" />
                        <Input label="Penalty" value={prepayPenalty} onChange={(v: any) => setPrepayPenalty(Number(v))} suffix="%" />
                    </div>

                    <div className="pt-4 border-t">
                        <h4 className="text-sm font-semibold mb-2">Scenario C: Extra Monthly</h4>
                        <Input label="Extra EMI" value={extraMonthly} onChange={(v: any) => setExtraMonthly(Number(v))} suffix={currency} />
                    </div>
                </Card>

                <div className="md:col-span-2 space-y-6">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-3 gap-4">
                        <Card className="bg-blue-50/50 dark:bg-blue-900/10 border-blue-100">
                            <div className="text-xs text-muted-foreground uppercase tracking-wider">Regular EMI</div>
                            <div className="text-xl font-bold text-blue-600 mt-1">
                                {formatCurrency(scenarioA.monthlyData[0]?.payment || 0, currency, rate)}
                            </div>
                        </Card>
                        <Card className="bg-green-50/50 dark:bg-green-900/10 border-green-100">
                            <div className="text-xs text-muted-foreground uppercase tracking-wider">Interest Saved (Aggressive)</div>
                            <div className="text-xl font-bold text-green-600 mt-1">
                                {formatCurrency(scenarioA.totalInterest - scenarioC.totalInterest, currency, rate)}
                            </div>
                        </Card>
                        <Card className="bg-amber-50/50 dark:bg-amber-900/10 border-amber-100">
                            <div className="text-xs text-muted-foreground uppercase tracking-wider">Time Saved (Aggressive)</div>
                            <div className="text-xl font-bold text-amber-600 mt-1">
                                {scenarioA.monthlyData.length - scenarioC.monthlyData.length} mo
                            </div>
                        </Card>
                    </div>

                    <Card className="h-[400px] flex flex-col">
                        <div className="flex justify-between items-center mb-4">
                            <div className="flex gap-2">
                                <Button variant={activeTab === 'chart' ? 'primary' : 'ghost'} onClick={() => setActiveTab('chart')} size="sm">Chart</Button>
                                <Button variant={activeTab === 'table' ? 'primary' : 'ghost'} onClick={() => setActiveTab('table')} size="sm">Table</Button>
                            </div>
                            <Button variant="outline" onClick={exportCSV} icon={Download} size="sm">Export</Button>
                        </div>

                        {activeTab === 'chart' ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={comparisonData}>
                                    <XAxis dataKey="name" />
                                    <YAxis />
                                    <Tooltip formatter={(value: number) => formatCurrency(value, currency, rate)} />
                                    <Bar dataKey="interest" name="Total Interest Paid">
                                        {comparisonData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="overflow-auto flex-1">
                                <table className="w-full text-sm">
                                    <thead className="text-xs text-muted-foreground bg-muted/50 sticky top-0">
                                        <tr>
                                            <th className="p-2 text-left">Month</th>
                                            <th className="p-2 text-right">EMI</th>
                                            <th className="p-2 text-right">Principal</th>
                                            <th className="p-2 text-right">Interest</th>
                                            <th className="p-2 text-right">Balance</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {scenarioA.monthlyData.map((row) => (
                                            <tr key={row.month} className="border-b border-border/50 hover:bg-muted/50">
                                                <td className="p-2">{row.month}</td>
                                                <td className="p-2 text-right">{formatDecimal(row.payment)}</td>
                                                <td className="p-2 text-right">{formatDecimal(row.principal)}</td>
                                                <td className="p-2 text-right">{formatDecimal(row.interest)}</td>
                                                <td className="p-2 text-right">{formatDecimal(row.balance)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </Card>
                </div>
            </div>
        </div>
    );
}
