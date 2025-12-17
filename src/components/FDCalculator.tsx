import { useState } from 'react';
import { Card, Input } from './ui-base';
import { calculateFD, formatCurrency } from '../utils/finance';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp } from 'lucide-react';

export default function FDCalculator({ currency, rate }: any) {
    const [principal, setPrincipal] = useState(100000);
    const [interest, setInterest] = useState(7.0);
    const [months, setMonths] = useState(60);

    const result = calculateFD(principal, interest, months, 'Quarterly');

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="space-y-4">
                    <h3 className="font-semibold text-lg flex items-center gap-2"><TrendingUp className="w-5 h-5 text-emerald-500" /> Investment Details</h3>
                    <Input label="Principal Amount" value={principal} onChange={(v: any) => setPrincipal(Number(v))} suffix={currency} />
                    <Input label="Interest Rate" value={interest} onChange={(v: any) => setInterest(Number(v))} suffix="%" step="0.1" />
                    <Input label="Term (Months)" value={months} onChange={(v: any) => setMonths(Number(v))} suffix="mo" />
                </Card>

                <Card className="md:col-span-2 flex flex-col justify-between h-[400px]">
                    <div className="flex gap-8 mb-4">
                        <div>
                            <div className="text-sm text-muted-foreground">Maturity Value</div>
                            <div className="text-2xl font-bold text-emerald-600">{formatCurrency(result.maturityAmount, currency, rate)}</div>
                        </div>
                        <div>
                            <div className="text-sm text-muted-foreground">Total Interest</div>
                            <div className="text-2xl font-bold text-emerald-500">{formatCurrency(result.totalInterest, currency, rate)}</div>
                        </div>
                    </div>

                    <div className="flex-1 w-full min-h-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={result.monthlyGrowth}>
                                <defs>
                                    <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="month" hide />
                                <YAxis hide />
                                <Tooltip
                                    formatter={(value: number) => formatCurrency(value, currency, rate)}
                                    labelFormatter={(label) => `Month ${label}`}
                                />
                                <Area type="monotone" dataKey="balance" stroke="#10b981" fillOpacity={1} fill="url(#colorVal)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </Card>
            </div>
        </div>
    );
}
