// Default values and constants for FinDash

export const DEFAULT_LOAN = {
    principal: 100000,
    annualRate: 7.5,
    termMonths: 120, // 10 years
    prepaymentAmount: 10000,
    prepaymentMonth: 12,
    penaltyRate: 1, // 1% default
    extraMonthlyPayment: 200,
};

export const DEFAULT_FD = {
    principal: 100000,
    annualRate: 7.0,
    termMonths: 60, // 5 years
    compoundingFrequency: 'quarterly' as const,
    taxRate: 30,
    inflationRate: 6,
};

export const DEFAULT_CURRENCY = {
    eurToInr: 89,
};

export const COMPOUNDING_OPTIONS = [
    { value: 'monthly', label: 'Monthly (12x/year)' },
    { value: 'quarterly', label: 'Quarterly (4x/year)' },
    { value: 'half-yearly', label: 'Half-Yearly (2x/year)' },
    { value: 'yearly', label: 'Yearly (1x/year)' },
] as const;

export const EXTRA_PAYMENT_OPTIONS = [
    { value: 'before', label: 'Before Prepayment' },
    { value: 'after', label: 'After Prepayment' },
    { value: 'both', label: 'Throughout Loan' },
] as const;

// Helpful hints for users
export const HINTS = {
    loan: {
        emi: "EMI (Equated Monthly Installment) remains constant throughout the loan tenure.",
        prepayment: "Making a lump-sum prepayment reduces your principal and saves interest over time.",
        penalty: "Prepayment penalty is typically 1-3% of the prepaid amount. Check your loan agreement.",
        aggressive: "Even small extra monthly payments can significantly reduce total interest paid.",
        scenarioA: "This is your baseline — the total cost if you follow the original loan schedule.",
        scenarioB: "Prepayment helps reduce loan tenure. Consider making prepayments when you have surplus funds.",
        scenarioC: "Aggressive repayment maximizes savings. Even €50-100 extra per month makes a difference.",
    },
    fd: {
        compounding: "Quarterly compounding is most common. Higher frequency = slightly higher returns.",
        tax: "FD interest is taxable as per your income tax slab. TDS is deducted if interest exceeds ₹40,000.",
        inflation: "Real returns = Interest Rate - Inflation. Adjust expectations accordingly.",
        comparison: "Compare loan interest saved vs FD returns to make optimal financial decisions.",
    },
    general: {
        savings: "Net savings = Interest saved from loan strategy - Penalties - Opportunity cost (FD returns)",
        eurToInr: "Exchange rate is used for reference. Actual rates may vary.",
    },
};
