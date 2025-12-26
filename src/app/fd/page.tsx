'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardHeader, Input, Select, Toggle, Hint, StatCard, Tabs, Badge } from '@/components/ui';
import { useAppState, InvestmentAllocation } from '@/context/AppContext';
import { useFormatters, formatDuration } from '@/hooks/useFormatters';
import { COMPOUNDING_OPTIONS } from '@/lib/constants';
import {
    calculatePortfolioMaturity,
    calculateSIPPortfolioMaturity,
} from '@/lib/calculations';
import { getInstrumentById, getInstrumentsByMode, RISK_LABELS, RISK_COLORS, InvestmentMode } from '@/lib/riskProfiles';

export default function InvestmentPage() {
    const {
        investment,
        setInvestment,
        setLumpsum,
        setSIP,
        updateAllocation,
        addAllocation,
        removeAllocation,
        loan,
        currency,
    } = useAppState();
    const { formatEUR, formatINR, formatPercent } = useFormatters();

    const convertToINR = (eur: number) => eur * currency.eurToInr;

    // Get effective lumpsum amount
    const getLumpsumAmount = () => investment.lumpsum.linkedToLoan
        ? loan.principal
        : investment.lumpsum.totalAmount;

    // Calculate total from allocations (for amount mode)
    const calculateTotalFromAllocations = (allocations: InvestmentAllocation[]) =>
        allocations.reduce((sum, a) => sum + a.amount, 0);

    // Recalculate percentages from amounts
    const recalculatePercentages = (allocations: InvestmentAllocation[], total: number) =>
        allocations.map(a => ({
            ...a,
            percentage: total > 0 ? Math.round((a.amount / total) * 10000) / 100 : 0,
        }));

    // Recalculate amounts from percentages
    const recalculateAmounts = (allocations: InvestmentAllocation[], total: number) =>
        allocations.map(a => ({
            ...a,
            amount: Math.round((a.percentage / 100) * total * 100) / 100,
        }));

    // Handle input mode switch for Lumpsum
    const handleLumpsumModeSwitch = (mode: 'percentage' | 'amount') => {
        const total = getLumpsumAmount();
        if (mode === 'percentage') {
            const updated = recalculateAmounts(investment.lumpsum.allocations, total);
            setLumpsum({ inputMode: mode, allocations: updated });
        } else {
            const updated = recalculatePercentages(investment.lumpsum.allocations, total);
            setLumpsum({ inputMode: mode, allocations: updated });
        }
    };

    // Handle input mode switch for SIP
    const handleSIPModeSwitch = (mode: 'percentage' | 'amount') => {
        const total = investment.sip.monthlyAmount;
        if (mode === 'percentage') {
            const updated = recalculateAmounts(investment.sip.allocations, total);
            setSIP({ inputMode: mode, allocations: updated });
        } else {
            const updated = recalculatePercentages(investment.sip.allocations, total);
            setSIP({ inputMode: mode, allocations: updated });
        }
    };

    // Handle allocation changes
    const handleAllocationChange = (
        mode: InvestmentMode,
        index: number,
        field: 'percentage' | 'amount',
        value: number
    ) => {
        const state = mode === 'lumpsum' ? investment.lumpsum : investment.sip;
        const inputMode = state.inputMode;
        const total = mode === 'lumpsum' ? getLumpsumAmount() : investment.sip.monthlyAmount;

        if (inputMode === 'percentage' && field === 'percentage') {
            // Cap at 100
            const cappedValue = Math.min(100, Math.max(0, value));
            const amount = Math.round((cappedValue / 100) * total * 100) / 100;
            updateAllocation(mode, index, { percentage: cappedValue, amount });
        } else if (inputMode === 'amount' && field === 'amount') {
            const newAllocations = [...state.allocations];
            newAllocations[index] = { ...newAllocations[index], amount: value };
            const newTotal = newAllocations.reduce((s, a) => s + a.amount, 0);
            const updated = recalculatePercentages(newAllocations, newTotal);
            if (mode === 'lumpsum') {
                setLumpsum({ allocations: updated, totalAmount: newTotal });
            } else {
                setSIP({ allocations: updated, monthlyAmount: newTotal });
            }
        }
    };

    // Lumpsum calculations
    const lumpsumResult = useMemo(() => {
        const totalAmount = getLumpsumAmount();
        const allocationsWithAmount = investment.lumpsum.allocations.map(a => ({
            ...a,
            amount: (a.percentage / 100) * totalAmount,
        }));

        const result = calculatePortfolioMaturity(
            totalAmount,
            allocationsWithAmount,
            investment.termMonths,
            investment.compoundingFrequency
        );

        // Calculate weighted expense ratio
        const totalPct = allocationsWithAmount.reduce((s, a) => s + a.percentage, 0);
        const weightedExpenseRatio = totalPct > 0
            ? allocationsWithAmount.reduce((sum, a) => sum + (a.percentage * a.expenseRatio), 0) / totalPct
            : 0;

        let totalTaxPaid = 0;
        let totalExpenseCost = 0;
        const afterTaxInterest = allocationsWithAmount.reduce((sum, a, i) => {
            const allocationInterest = result.allocationReturns[i]?.interest || 0;
            // Expense ratio reduces effective return
            const expenseCost = a.amount * (a.expenseRatio / 100) * (investment.termMonths / 12);
            totalExpenseCost += expenseCost;
            const netInterest = allocationInterest - expenseCost;
            const tax = netInterest * (a.taxRate / 100);
            totalTaxPaid += tax;
            return sum + (netInterest - tax);
        }, 0);

        return {
            ...result,
            totalAmount,
            totalTaxPaid,
            totalExpenseCost,
            weightedExpenseRatio: Math.round(weightedExpenseRatio * 100) / 100,
            afterTaxInterest,
            netMaturity: totalAmount + afterTaxInterest,
        };
    }, [investment.lumpsum, investment.termMonths, investment.compoundingFrequency, loan.principal]);

    // SIP calculations
    const sipResult = useMemo(() => {
        const allocationsWithTax = investment.sip.allocations.map(a => ({
            instrumentId: a.instrumentId,
            amount: (a.percentage / 100) * investment.sip.monthlyAmount,
            percentage: a.percentage,
            annualRate: a.annualRate,
            taxRate: a.taxRate,
        }));

        return calculateSIPPortfolioMaturity(
            investment.sip.monthlyAmount,
            allocationsWithTax,
            investment.termMonths,
            true
        );
    }, [investment.sip, investment.termMonths]);

    // Check if percentages sum to 100
    const getLumpsumTotalPercent = () =>
        investment.lumpsum.allocations.reduce((s, a) => s + a.percentage, 0);
    const getSIPTotalPercent = () =>
        investment.sip.allocations.reduce((s, a) => s + a.percentage, 0);

    // Render allocation row with risk indicator
    const renderAllocationRow = (mode: InvestmentMode, alloc: InvestmentAllocation, index: number) => {
        const inst = getInstrumentById(alloc.instrumentId);
        if (!inst) return null;
        const state = mode === 'lumpsum' ? investment.lumpsum : investment.sip;
        const inputMode = state.inputMode;
        const total = mode === 'lumpsum' ? getLumpsumAmount() : investment.sip.monthlyAmount;

        return (
            <div key={`${alloc.instrumentId}-${index}`} className="p-4 bg-white border border-gray-200 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: RISK_COLORS[inst.riskLevel] }}
                            title={`${RISK_LABELS[inst.riskLevel]} Risk`}
                        />
                        <div>
                            <h4 className="font-semibold text-gray-800">{alloc.instanceLabel || inst.name}</h4>
                            <div className="flex items-center gap-2">
                                <span
                                    className="text-xs px-2 py-0.5 rounded"
                                    style={{ backgroundColor: `${RISK_COLORS[inst.riskLevel]}20`, color: RISK_COLORS[inst.riskLevel] }}
                                >
                                    {RISK_LABELS[inst.riskLevel]}
                                </span>
                                <span className="text-xs text-gray-400" title="Return guarantee confidence">
                                    {inst.returnGuarantee}% confident
                                </span>
                            </div>
                        </div>
                    </div>
                    {state.allocations.length > 1 && (
                        <button
                            onClick={() => removeAllocation(mode, index)}
                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    )}
                </div>
                <div className="grid grid-cols-4 gap-2">
                    <Input
                        label="Rate %"
                        type="number"
                        step="0.1"
                        value={alloc.annualRate}
                        onChange={(e) => updateAllocation(mode, index, { annualRate: Number(e.target.value) })}
                    />
                    {inputMode === 'percentage' ? (
                        <>
                            <Input
                                label="Alloc %"
                                type="number"
                                step="1"
                                max={100}
                                value={alloc.percentage}
                                onChange={(e) => handleAllocationChange(mode, index, 'percentage', Number(e.target.value))}
                            />
                            <div className="flex flex-col">
                                <span className="text-xs text-gray-500 mb-1">Amount</span>
                                <span className="text-sm font-medium text-gray-700 py-2">
                                    {formatEUR((alloc.percentage / 100) * total)}
                                </span>
                            </div>
                        </>
                    ) : (
                        <>
                            <Input
                                label="Amount €"
                                type="number"
                                step="100"
                                value={alloc.amount}
                                onChange={(e) => handleAllocationChange(mode, index, 'amount', Number(e.target.value))}
                            />
                            <div className="flex flex-col">
                                <span className="text-xs text-gray-500 mb-1">Percent</span>
                                <span className="text-sm font-medium text-gray-700 py-2">
                                    {formatPercent(alloc.percentage)}
                                </span>
                            </div>
                        </>
                    )}
                    <Input
                        label="Tax %"
                        type="number"
                        step="1"
                        value={alloc.taxRate}
                        onChange={(e) => updateAllocation(mode, index, { taxRate: Number(e.target.value) })}
                    />
                </div>
                {/* Expense Ratio - only show for MF/ETF/Gold */}
                {(alloc.instrumentId === 'mutual_funds' || alloc.instrumentId === 'gold') && (
                    <div className="mt-2">
                        <Input
                            label="Expense Ratio %"
                            type="number"
                            step="0.01"
                            value={alloc.expenseRatio}
                            onChange={(e) => updateAllocation(mode, index, { expenseRatio: Number(e.target.value) })}
                        />
                    </div>
                )}
            </div>
        );
    };

    // Allow adding multiple of same instrument type
    const getLumpsumInstruments = () => getInstrumentsByMode('lumpsum');
    const getSIPInstruments = () => getInstrumentsByMode('sip');

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-4 pb-24 md:pb-8">
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header */}
                <div className="text-center mb-6">
                    <h1 className="text-2xl font-bold text-gray-800">Investment Planner</h1>
                    <p className="text-gray-600 text-sm">Compare Lumpsum and SIP strategies</p>
                </div>

                {/* Tabs */}
                <Tabs
                    tabs={[
                        { id: 'lumpsum', label: 'Lumpsum' },
                        { id: 'sip', label: 'SIP' },
                    ]}
                    activeTab={investment.activeTab}
                    onChange={(tab) => setInvestment({ activeTab: tab as 'lumpsum' | 'sip' })}
                />

                {/* Shared Settings */}
                <Card>
                    <CardHeader title="Investment Settings" />
                    <div className="grid md:grid-cols-2 gap-4">
                        <div>
                            <Input
                                label="Duration (Months)"
                                type="number"
                                min={1}
                                max={360}
                                value={investment.termMonths}
                                onChange={(e) => setInvestment({ termMonths: Number(e.target.value) })}
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                ℹ️ Duration is locked between Lumpsum and SIP for fair comparison
                            </p>
                        </div>
                        <Select
                            label="Compounding"
                            options={[...COMPOUNDING_OPTIONS]}
                            value={investment.compoundingFrequency}
                            onChange={(e) => setInvestment({ compoundingFrequency: e.target.value as 'monthly' | 'quarterly' | 'half-yearly' | 'yearly' })}
                        />
                    </div>
                    <div className="mt-4 flex items-center gap-4">
                        <Toggle
                            label="Adjust for Inflation"
                            checked={investment.adjustInflation}
                            onChange={(v) => setInvestment({ adjustInflation: v })}
                        />
                        {investment.adjustInflation && (
                            <Input
                                label="Inflation %"
                                type="number"
                                step="0.1"
                                value={investment.inflationRate}
                                onChange={(e) => setInvestment({ inflationRate: Number(e.target.value) })}
                                className="w-24"
                            />
                        )}
                    </div>
                </Card>

                {/* Lumpsum Tab Content */}
                {investment.activeTab === 'lumpsum' && (
                    <>
                        <Card>
                            <CardHeader title="Lumpsum Investment" subtitle="One-time investment allocation" />

                            {/* Linked to Loan Toggle */}
                            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-xl">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <span className="text-sm font-medium text-blue-800">Linked to Loan</span>
                                        <p className="text-xs text-blue-600">Amount matches your loan principal</p>
                                    </div>
                                    <Toggle
                                        label=""
                                        checked={investment.lumpsum.linkedToLoan}
                                        onChange={(v) => setLumpsum({ linkedToLoan: v })}
                                    />
                                </div>
                            </div>

                            {/* Input Mode Toggle */}
                            <div className="flex items-center justify-between mb-4 p-3 bg-gray-50 rounded-xl">
                                <span className="text-sm font-medium text-gray-700">Input by:</span>
                                <div className="flex gap-1 p-1 bg-white rounded-lg shadow-sm">
                                    <button
                                        onClick={() => handleLumpsumModeSwitch('percentage')}
                                        className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${investment.lumpsum.inputMode === 'percentage'
                                            ? 'bg-blue-500 text-white'
                                            : 'text-gray-600 hover:bg-gray-100'
                                            }`}
                                    >
                                        %
                                    </button>
                                    <button
                                        onClick={() => handleLumpsumModeSwitch('amount')}
                                        className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${investment.lumpsum.inputMode === 'amount'
                                            ? 'bg-blue-500 text-white'
                                            : 'text-gray-600 hover:bg-gray-100'
                                            }`}
                                    >
                                        €
                                    </button>
                                </div>
                            </div>

                            {/* Total Amount (for percentage mode) */}
                            {investment.lumpsum.inputMode === 'percentage' && (
                                <Input
                                    label="Total Investment"
                                    type="number"
                                    prefix="€"
                                    value={getLumpsumAmount()}
                                    disabled={investment.lumpsum.linkedToLoan}
                                    onChange={(e) => {
                                        const newTotal = Number(e.target.value);
                                        setLumpsum({ totalAmount: newTotal });
                                        // Recalculate amounts
                                        const updated = recalculateAmounts(investment.lumpsum.allocations, newTotal);
                                        setLumpsum({ allocations: updated });
                                    }}
                                />
                            )}
                            {investment.lumpsum.linkedToLoan && (
                                <p className="text-xs text-gray-500 mt-1">
                                    🔒 Amount locked to loan principal ({formatEUR(loan.principal)})
                                </p>
                            )}

                            {/* Allocations */}
                            <div className="mt-4 space-y-3">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-sm font-medium text-gray-700">Allocations</h4>
                                    {investment.lumpsum.inputMode === 'percentage' && (
                                        <span className={`text-sm font-medium ${Math.abs(getLumpsumTotalPercent() - 100) < 0.01 ? 'text-green-600' : 'text-red-600'}`}>
                                            Total: {formatPercent(getLumpsumTotalPercent())}
                                        </span>
                                    )}
                                    {investment.lumpsum.inputMode === 'amount' && (
                                        <span className="text-sm font-medium text-blue-600">
                                            Total: {formatEUR(calculateTotalFromAllocations(investment.lumpsum.allocations))}
                                        </span>
                                    )}
                                </div>
                                {investment.lumpsum.allocations.map((a, i) => renderAllocationRow('lumpsum', a, i))}

                                {getLumpsumInstruments().length > 0 && (
                                    <Select
                                        label="Add Instrument"
                                        options={[
                                            { value: '', label: 'Select to add...' },
                                            ...getLumpsumInstruments().map(i => ({ value: i.id, label: i.name }))
                                        ]}
                                        value=""
                                        onChange={(e) => e.target.value && addAllocation('lumpsum', e.target.value)}
                                    />
                                )}
                            </div>

                            {/* Validation Warning */}
                            {investment.lumpsum.inputMode === 'percentage' && Math.abs(getLumpsumTotalPercent() - 100) >= 0.01 && (
                                <Hint type="warning" className="mt-4">
                                    ⚠️ Allocations must sum to 100%. Current: {formatPercent(getLumpsumTotalPercent())}
                                </Hint>
                            )}
                        </Card>

                        {/* Lumpsum Results */}
                        <div className="grid md:grid-cols-3 gap-4">
                            <StatCard
                                label="Net Gain (After Tax)"
                                value={formatEUR(lumpsumResult.afterTaxInterest)}
                                subValue={`Tax: ${formatEUR(lumpsumResult.totalTaxPaid)}`}
                                trend="up"
                            />
                            <StatCard
                                label="Maturity Value"
                                value={formatEUR(lumpsumResult.netMaturity)}
                                subValue={formatINR(convertToINR(lumpsumResult.netMaturity))}
                            />
                            <StatCard
                                label="Weighted CAGR"
                                value={formatPercent(lumpsumResult.weightedRate)}
                                subValue={`Expense: ${formatPercent(lumpsumResult.weightedExpenseRatio)}`}
                            />
                        </div>
                        {lumpsumResult.totalExpenseCost > 0 && (
                            <Hint type="info" className="mt-2">
                                📊 Expense ratio reduces gains by {formatEUR(lumpsumResult.totalExpenseCost)} over {formatDuration(investment.termMonths)}
                            </Hint>
                        )}
                    </>
                )}

                {/* SIP Tab Content */}
                {investment.activeTab === 'sip' && (
                    <>
                        <Card>
                            <CardHeader title="SIP Investment" subtitle="Monthly systematic investment" />

                            {/* Input Mode Toggle */}
                            <div className="flex items-center justify-between mb-4 p-3 bg-gray-50 rounded-xl">
                                <span className="text-sm font-medium text-gray-700">Input by:</span>
                                <div className="flex gap-1 p-1 bg-white rounded-lg shadow-sm">
                                    <button
                                        onClick={() => handleSIPModeSwitch('percentage')}
                                        className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${investment.sip.inputMode === 'percentage'
                                            ? 'bg-green-500 text-white'
                                            : 'text-gray-600 hover:bg-gray-100'
                                            }`}
                                    >
                                        %
                                    </button>
                                    <button
                                        onClick={() => handleSIPModeSwitch('amount')}
                                        className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${investment.sip.inputMode === 'amount'
                                            ? 'bg-green-500 text-white'
                                            : 'text-gray-600 hover:bg-gray-100'
                                            }`}
                                    >
                                        €
                                    </button>
                                </div>
                            </div>

                            {/* Monthly Amount (for percentage mode) */}
                            {investment.sip.inputMode === 'percentage' && (
                                <Input
                                    label="Monthly Amount"
                                    type="number"
                                    prefix="€"
                                    value={investment.sip.monthlyAmount}
                                    onChange={(e) => {
                                        const newTotal = Number(e.target.value);
                                        setSIP({ monthlyAmount: newTotal });
                                        const updated = recalculateAmounts(investment.sip.allocations, newTotal);
                                        setSIP({ allocations: updated });
                                    }}
                                />
                            )}

                            {/* Allocations */}
                            <div className="mt-4 space-y-3">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-sm font-medium text-gray-700">Allocations</h4>
                                    {investment.sip.inputMode === 'percentage' && (
                                        <span className={`text-sm font-medium ${Math.abs(getSIPTotalPercent() - 100) < 0.01 ? 'text-green-600' : 'text-red-600'}`}>
                                            Total: {formatPercent(getSIPTotalPercent())}
                                        </span>
                                    )}
                                    {investment.sip.inputMode === 'amount' && (
                                        <span className="text-sm font-medium text-green-600">
                                            Monthly: {formatEUR(calculateTotalFromAllocations(investment.sip.allocations))}
                                        </span>
                                    )}
                                </div>
                                {investment.sip.allocations.map((a, i) => renderAllocationRow('sip', a, i))}

                                {getSIPInstruments().length > 0 && (
                                    <Select
                                        label="Add Instrument"
                                        options={[
                                            { value: '', label: 'Select to add...' },
                                            ...getSIPInstruments().map(i => ({ value: i.id, label: i.name }))
                                        ]}
                                        value=""
                                        onChange={(e) => e.target.value && addAllocation('sip', e.target.value)}
                                    />
                                )}
                            </div>

                            {/* Validation Warning */}
                            {investment.sip.inputMode === 'percentage' && Math.abs(getSIPTotalPercent() - 100) >= 0.01 && (
                                <Hint type="warning" className="mt-4">
                                    ⚠️ Allocations must sum to 100%. Current: {formatPercent(getSIPTotalPercent())}
                                </Hint>
                            )}
                        </Card>

                        {/* SIP Results */}
                        <div className="grid md:grid-cols-3 gap-4">
                            <StatCard
                                label="Net Gain (After Tax)"
                                value={formatEUR(sipResult.totalGain)}
                                subValue={`ROI: ${formatPercent((sipResult.totalGain / sipResult.totalInvested) * 100)}`}
                                trend="up"
                            />
                            <StatCard
                                label="Total Invested"
                                value={formatEUR(sipResult.totalInvested)}
                                subValue={`${investment.termMonths} × ${formatEUR(investment.sip.monthlyAmount)}`}
                            />
                            <StatCard
                                label="Weighted XIRR"
                                value={formatPercent(sipResult.weightedRate)}
                                subValue={formatDuration(investment.termMonths)}
                            />
                        </div>

                        {/* SIP Maturity Card */}
                        <Card className="bg-gradient-to-r from-green-500 to-teal-600 text-white">
                            <div className="text-center">
                                <p className="text-white/80 text-sm">Maturity Value</p>
                                <p className="text-3xl font-bold">{formatEUR(sipResult.maturityAmount)}</p>
                            </div>
                        </Card>
                    </>
                )}

                {/* Quick Comparison */}
                <Card>
                    <CardHeader title="Quick Comparison" subtitle="Gains at a glance" />
                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="p-4 bg-blue-50 rounded-xl">
                            <h4 className="font-semibold text-blue-800">Lumpsum Gain</h4>
                            <p className="text-2xl font-bold text-blue-900">{formatEUR(lumpsumResult.afterTaxInterest)}</p>
                            <p className="text-sm text-blue-600">Invested: {formatEUR(lumpsumResult.totalAmount)}</p>
                        </div>
                        <div className="p-4 bg-green-50 rounded-xl">
                            <h4 className="font-semibold text-green-800">SIP Gain</h4>
                            <p className="text-2xl font-bold text-green-900">{formatEUR(sipResult.totalGain)}</p>
                            <p className="text-sm text-green-600">Invested: {formatEUR(sipResult.totalInvested)}</p>
                        </div>
                    </div>
                    <Hint type="tip" className="mt-4">
                        💡 Go to Compare page for Loan + Lumpsum vs SIP analysis with What-If scenarios.
                    </Hint>
                </Card>
            </div>
        </div>
    );
}
