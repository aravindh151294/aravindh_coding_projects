export type Frequency = 'Monthly' | 'Quarterly' | 'Yearly';

export interface Prepayment {
    date: number; // Month index (1-based)
    amount: number;
}

export interface MonthlyPayment {
    month: number;
    payment: number;
    principal: number;
    interest: number;
    balance: number;
    penalty: number;
}

export interface LoanSchedule {
    monthlyData: MonthlyPayment[];
    totalInterest: number;
    totalPayment: number;
    monthsSaved: number;
    interestSaved: number;
}

export function calculateEMI(principal: number, rate: number, months: number): number {
    if (rate === 0) return principal / months;
    const r = rate / 12 / 100;
    return (principal * r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1);
}

export function generateLoanSchedule(
    principal: number,
    annualRate: number,
    totalMonths: number,
    scenario: 'A' | 'B' | 'C' = 'A',
    prepayments: Prepayment[] = [], // For bulk prepayments (Scenario B)
    extraMonthly: number = 0,       // For aggressive monthly (Scenario C)
    penaltyRate: number = 0         // Percentage of prepaid amount (e.g., 2%)
): LoanSchedule {
    let balance = principal;
    const r = annualRate / 12 / 100;
    const regularEMI = calculateEMI(principal, annualRate, totalMonths);

    const monthlyData: MonthlyPayment[] = [];
    let totalInterest = 0;
    let totalWithPenalty = 0;

    // For Scenario C, we might increase the payment
    const actualMonthlyPayment = regularEMI + extraMonthly;

    for (let m = 1; m <= totalMonths && balance > 0.01; m++) {
        const interest = balance * r;
        let payment = Math.min(balance + interest, actualMonthlyPayment);
        let principalComponent = payment - interest;
        let penalty = 0;

        // Check for bulk prepayment in this month (Scenario B mostly)
        let extra = 0;
        if (scenario === 'B') {
            const prepayment = prepayments.find(p => p.date === m);
            if (prepayment) {
                extra = prepayment.amount;
                // Apply penalty if any
                penalty = extra * (penaltyRate / 100);
            }
        }

        // Apply extra payment constraints if needed (e.g. only pay extra if it doesn't exceed balance)
        if (extra > 0) {
            if (balance - principalComponent < extra) {
                extra = balance - principalComponent; // Cap extra to remaining balance
            }
            principalComponent += extra;
            payment += extra; // The actual cash flow out this month includes the extra
        }

        balance -= principalComponent;
        totalInterest += interest;
        totalWithPenalty += payment + penalty;

        monthlyData.push({
            month: m,
            payment: payment,
            principal: principalComponent,
            interest: interest,
            balance: balance > 0 ? balance : 0,
            penalty: penalty
        });

        if (balance <= 0) break;
    }

    // Calculate Base Case for Savings Comparison
    // We need the total interest of the "Original" scenario to compare against
    // But strictly, this function returns absolute values. The caller should compare Scenarios.
    // However, we can approximate "months saved" based on totalMonths.

    const monthsSaved = totalMonths - monthlyData.length;
    // Note: Interest saved requires knowing the base scenario total interest. 
    // We'll calculate interest saved in the component by comparing scenarios.

    return {
        monthlyData,
        totalInterest,
        totalPayment: totalWithPenalty,
        monthsSaved,
        interestSaved: 0 // specific savings logic handled in component
    };
}


export interface FDResult {
    maturityAmount: number;
    totalInterest: number;
    monthlyGrowth: { month: number; balance: number; interestEarned: number }[];
}

export function calculateFD(
    principal: number,
    rate: number,
    months: number,
    compounding: Frequency = 'Quarterly'
): FDResult {
    const r = rate / 100;
    let freq = 1; // Yearly
    if (compounding === 'Monthly') freq = 12;
    if (compounding === 'Quarterly') freq = 4;

    // Formula: A = P(1 + r/n)^(nt)
    // t = months / 12
    const t = months / 12;
    const maturityAmount = principal * Math.pow(1 + r / freq, freq * t);
    const totalInterest = maturityAmount - principal;

    // Generate monthly growth for chart
    const monthlyGrowth = [];
    let currentBalance = principal;
    for (let m = 1; m <= months; m++) {
        // Approximate monthly view (accumulating interest not strictly compounded monthly if freq is different, but for viz we smoothing)
        // Actually strictly: calculate value at month m
        const timeInYears = m / 12;
        const valueAtTime = principal * Math.pow(1 + r / freq, freq * timeInYears);
        monthlyGrowth.push({
            month: m,
            balance: valueAtTime,
            interestEarned: valueAtTime - principal
        });
    }

    return {
        maturityAmount,
        totalInterest,
        monthlyGrowth
    };
}

// FORMATTERS
export const formatCurrency = (amount: number, currency: 'INR' | 'USD' | 'EUR' = 'USD', rate: number = 1) => {
    const value = amount * rate;
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value);
};

export const formatDecimal = (num: number) => num.toFixed(2);
