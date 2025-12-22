'use client';

import React from 'react';
import { useAppState, InvestmentAllocation } from '@/context/AppContext';
import { INVESTMENT_INSTRUMENTS, COUNTRY_OPTIONS, getInstrumentById } from '@/lib/riskProfiles';
import { Input, Select, Button } from '@/components/ui';
import { RiskIndicator } from './RiskIndicator';
import { formatEUR, formatPercent } from '@/lib/formatters';

export function AllocationManager() {
    const {
        investment,
        setInvestment,
        updateAllocation,
        addAllocation,
        removeAllocation,
        recalculateAllocations,
    } = useAppState();

    const handleModeSwitch = (mode: 'percentage' | 'amount') => {
        recalculateAllocations(mode);
    };

    const handleTotalChange = (newTotal: number) => {
        setInvestment({ totalAmount: newTotal });
        if (investment.inputMode === 'percentage') {
            recalculateAllocations('percentage', newTotal);
        }
    };

    const handlePercentageChange = (index: number, percentage: number) => {
        updateAllocation(index, { percentage });
        if (investment.inputMode === 'percentage') {
            const amount = (percentage / 100) * investment.totalAmount;
            updateAllocation(index, { percentage, amount: Math.round(amount * 100) / 100 });
        }
    };

    const handleAmountChange = (index: number, amount: number) => {
        updateAllocation(index, { amount });
        if (investment.inputMode === 'amount') {
            // Recalculate total and percentages
            const newTotal = investment.allocations.reduce((sum, a, i) =>
                sum + (i === index ? amount : a.amount), 0);
            const percentage = newTotal > 0 ? (amount / newTotal) * 100 : 0;
            updateAllocation(index, { amount, percentage: Math.round(percentage * 100) / 100 });
        }
    };

    const handleAddInstrument = (instrumentId: string) => {
        addAllocation(instrumentId);
    };

    const totalPercentage = investment.allocations.reduce((sum, a) => sum + a.percentage, 0);
    const isValid = investment.inputMode === 'percentage'
        ? Math.abs(totalPercentage - 100) < 0.01
        : true;

    const availableInstruments = INVESTMENT_INSTRUMENTS.filter(
        inst => !investment.allocations.some(a => a.instrumentId === inst.id)
    );

    return (
        <div className="space-y-4">
            {/* Mode Toggle */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <span className="text-sm font-medium text-gray-700">Input Mode:</span>
                <div className="flex gap-1 p-1 bg-white rounded-lg shadow-sm">
                    <button
                        onClick={() => handleModeSwitch('percentage')}
                        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${investment.inputMode === 'percentage'
                                ? 'bg-blue-500 text-white'
                                : 'text-gray-600 hover:bg-gray-100'
                            }`}
                    >
                        Percentage
                    </button>
                    <button
                        onClick={() => handleModeSwitch('amount')}
                        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${investment.inputMode === 'amount'
                                ? 'bg-blue-500 text-white'
                                : 'text-gray-600 hover:bg-gray-100'
                            }`}
                    >
                        Amount
                    </button>
                </div>
            </div>

            {/* Total Amount (only editable in percentage mode) */}
            {investment.inputMode === 'percentage' && (
                <Input
                    label="Total Investment"
                    type="number"
                    prefix="€"
                    value={investment.totalAmount}
                    onChange={(e) => handleTotalChange(Number(e.target.value))}
                />
            )}

            {/* Allocations List */}
            <div className="space-y-3">
                {investment.allocations.map((allocation, index) => {
                    const instrument = getInstrumentById(allocation.instrumentId);
                    if (!instrument) return null;

                    return (
                        <AllocationRow
                            key={`${allocation.instrumentId}-${index}`}
                            allocation={allocation}
                            instrument={instrument}
                            index={index}
                            inputMode={investment.inputMode}
                            totalAmount={investment.totalAmount}
                            onPercentageChange={handlePercentageChange}
                            onAmountChange={handleAmountChange}
                            onRateChange={(rate) => updateAllocation(index, { annualRate: rate })}
                            onCountryChange={(country) => updateAllocation(index, { country })}
                            onRemove={() => removeAllocation(index)}
                            canRemove={investment.allocations.length > 1}
                        />
                    );
                })}
            </div>

            {/* Validation Message */}
            {investment.inputMode === 'percentage' && !isValid && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700">
                    ⚠️ Allocations must sum to 100%. Current: {totalPercentage.toFixed(1)}%
                </div>
            )}

            {/* Calculated Total (in amount mode) */}
            {investment.inputMode === 'amount' && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl">
                    <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-blue-700">Calculated Total:</span>
                        <span className="text-lg font-bold text-blue-800">
                            {formatEUR(investment.allocations.reduce((sum, a) => sum + a.amount, 0))}
                        </span>
                    </div>
                </div>
            )}

            {/* Add Instrument */}
            {availableInstruments.length > 0 && (
                <div className="pt-2">
                    <Select
                        label="Add Investment Type"
                        options={[
                            { value: '', label: 'Select to add...' },
                            ...availableInstruments.map(i => ({ value: i.id, label: i.name }))
                        ]}
                        value=""
                        onChange={(e) => {
                            if (e.target.value) handleAddInstrument(e.target.value);
                        }}
                    />
                </div>
            )}
        </div>
    );
}

interface AllocationRowProps {
    allocation: InvestmentAllocation;
    instrument: { id: string; name: string; riskLevel: any; returnGuarantee: number; requiresCountry?: boolean };
    index: number;
    inputMode: 'percentage' | 'amount';
    totalAmount: number;
    onPercentageChange: (index: number, percentage: number) => void;
    onAmountChange: (index: number, amount: number) => void;
    onRateChange: (rate: number) => void;
    onCountryChange: (country: string) => void;
    onRemove: () => void;
    canRemove: boolean;
}

function AllocationRow({
    allocation,
    instrument,
    index,
    inputMode,
    onPercentageChange,
    onAmountChange,
    onRateChange,
    onCountryChange,
    onRemove,
    canRemove,
}: AllocationRowProps) {
    return (
        <div className="p-4 bg-white border border-gray-200 rounded-xl space-y-3">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h4 className="font-semibold text-gray-800">{instrument.name}</h4>
                    <RiskIndicator
                        level={instrument.riskLevel}
                        returnGuarantee={instrument.returnGuarantee}
                        size="sm"
                    />
                </div>
                {canRemove && (
                    <button
                        onClick={onRemove}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Remove"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                )}
            </div>

            {/* Country selector for equity/MF */}
            {instrument.requiresCountry && (
                <Select
                    label="Market"
                    options={COUNTRY_OPTIONS}
                    value={allocation.country || 'india'}
                    onChange={(e) => onCountryChange(e.target.value)}
                />
            )}

            {/* Inputs Grid */}
            <div className="grid grid-cols-3 gap-3">
                <Input
                    label="Rate (%)"
                    type="number"
                    step="0.1"
                    value={allocation.annualRate}
                    onChange={(e) => onRateChange(Number(e.target.value))}
                />
                <Input
                    label={inputMode === 'percentage' ? '% Allocation' : 'Amount (€)'}
                    type="number"
                    step={inputMode === 'percentage' ? '1' : '100'}
                    value={inputMode === 'percentage' ? allocation.percentage : allocation.amount}
                    onChange={(e) => {
                        const val = Number(e.target.value);
                        if (inputMode === 'percentage') {
                            onPercentageChange(index, val);
                        } else {
                            onAmountChange(index, val);
                        }
                    }}
                />
                <div className="flex flex-col justify-end">
                    <span className="text-xs text-gray-500 mb-1">
                        {inputMode === 'percentage' ? 'Amount' : 'Percentage'}
                    </span>
                    <span className="text-sm font-medium text-gray-700 py-2">
                        {inputMode === 'percentage'
                            ? formatEUR(allocation.amount)
                            : formatPercent(allocation.percentage)
                        }
                    </span>
                </div>
            </div>
        </div>
    );
}
