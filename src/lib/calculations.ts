// Core calculation functions for FinDash

/**
 * Calculate EMI (Equated Monthly Installment)
 * EMI = P × r × (1+r)^n / ((1+r)^n - 1)
 */
export function calculateEMI(principal: number, annualRate: number, months: number): number {
  if (months === 0 || annualRate === 0) return principal / (months || 1);

  const monthlyRate = annualRate / 12 / 100;
  const emi = principal * monthlyRate * Math.pow(1 + monthlyRate, months) /
    (Math.pow(1 + monthlyRate, months) - 1);
  return emi;
}

/**
 * Monthly schedule entry structure
 */
export interface MonthlyScheduleEntry {
  month: number;
  payment: number;
  principal: number;
  interest: number;
  balance: number;
  penalty?: number;
  prepayment?: number;
}

/**
 * Generate amortization schedule for a loan
 */
export function generateAmortizationSchedule(
  principal: number,
  annualRate: number,
  months: number,
  extraMonthlyPayment: number = 0,
  prepaymentAmount: number = 0,
  prepaymentMonth: number = 0,
  penaltyRate: number = 1
): MonthlyScheduleEntry[] {
  const schedule: MonthlyScheduleEntry[] = [];
  let balance = principal;
  const monthlyRate = annualRate / 12 / 100;
  const baseEMI = calculateEMI(principal, annualRate, months);

  for (let month = 1; month <= months && balance > 0; month++) {
    const interest = balance * monthlyRate;
    let payment = baseEMI + extraMonthlyPayment;
    let principalPayment = payment - interest;
    let penalty = 0;
    let prepayment = 0;

    // Handle prepayment
    if (prepaymentAmount > 0 && month === prepaymentMonth) {
      prepayment = Math.min(prepaymentAmount, balance - principalPayment);
      penalty = prepayment * penaltyRate / 100;
      principalPayment += prepayment;
      payment += prepayment + penalty;
    }

    // Ensure we don't overpay
    if (principalPayment > balance) {
      principalPayment = balance;
      payment = interest + principalPayment + penalty;
    }

    balance = Math.max(0, balance - principalPayment);

    schedule.push({
      month,
      payment: Math.round(payment * 100) / 100,
      principal: Math.round(principalPayment * 100) / 100,
      interest: Math.round(interest * 100) / 100,
      balance: Math.round(balance * 100) / 100,
      penalty: penalty > 0 ? Math.round(penalty * 100) / 100 : undefined,
      prepayment: prepayment > 0 ? Math.round(prepayment * 100) / 100 : undefined,
    });

    if (balance <= 0) break;
  }

  return schedule;
}

/**
 * Scenario A: Original loan schedule (no prepayment, no extra payments)
 */
export function calculateScenarioA(
  principal: number,
  annualRate: number,
  months: number
): { schedule: MonthlyScheduleEntry[]; totalInterest: number; totalPayment: number; emi: number } {
  const schedule = generateAmortizationSchedule(principal, annualRate, months);
  const emi = calculateEMI(principal, annualRate, months);
  const totalPayment = schedule.reduce((sum, entry) => sum + entry.payment, 0);
  const totalInterest = totalPayment - principal;

  return { schedule, totalInterest, totalPayment, emi };
}

/**
 * Scenario B: With prepayment (includes penalty)
 */
export function calculateScenarioB(
  principal: number,
  annualRate: number,
  months: number,
  prepaymentAmount: number,
  prepaymentMonth: number,
  penaltyRate: number = 1,
  extraMonthlyPayment: number = 0,
  applyExtraPayment: 'before' | 'after' | 'both' = 'both'
): { schedule: MonthlyScheduleEntry[]; totalInterest: number; totalPayment: number; totalPenalty: number; emi: number; monthsSaved: number } {
  // Determine when to apply extra payment
  let extraBefore = 0;
  let extraAfter = 0;
  if (applyExtraPayment === 'before') extraBefore = extraMonthlyPayment;
  else if (applyExtraPayment === 'after') extraAfter = extraMonthlyPayment;
  else { extraBefore = extraMonthlyPayment; extraAfter = extraMonthlyPayment; }

  const schedule: MonthlyScheduleEntry[] = [];
  let balance = principal;
  const monthlyRate = annualRate / 12 / 100;
  const baseEMI = calculateEMI(principal, annualRate, months);
  let totalPenalty = 0;

  for (let month = 1; month <= months && balance > 0; month++) {
    const interest = balance * monthlyRate;
    const extra = month < prepaymentMonth ? extraBefore : extraAfter;
    let payment = baseEMI + extra;
    let principalPayment = payment - interest;
    let penalty = 0;
    let prepayment = 0;

    if (prepaymentAmount > 0 && month === prepaymentMonth) {
      prepayment = Math.min(prepaymentAmount, balance - principalPayment);
      penalty = prepayment * penaltyRate / 100;
      totalPenalty += penalty;
      principalPayment += prepayment;
      payment += prepayment + penalty;
    }

    if (principalPayment > balance) {
      principalPayment = balance;
      payment = interest + principalPayment + penalty;
    }

    balance = Math.max(0, balance - principalPayment);

    schedule.push({
      month,
      payment: Math.round(payment * 100) / 100,
      principal: Math.round(principalPayment * 100) / 100,
      interest: Math.round(interest * 100) / 100,
      balance: Math.round(balance * 100) / 100,
      penalty: penalty > 0 ? Math.round(penalty * 100) / 100 : undefined,
      prepayment: prepayment > 0 ? Math.round(prepayment * 100) / 100 : undefined,
    });

    if (balance <= 0) break;
  }

  const totalPayment = schedule.reduce((sum, entry) => sum + entry.payment, 0);
  const totalInterest = totalPayment - principal - totalPenalty;
  const monthsSaved = months - schedule.length;

  return { schedule, totalInterest, totalPayment, totalPenalty, emi: baseEMI, monthsSaved };
}

/**
 * Scenario C: Aggressive repayment (extra monthly payments)
 */
export function calculateScenarioC(
  principal: number,
  annualRate: number,
  months: number,
  extraMonthlyPayment: number
): { schedule: MonthlyScheduleEntry[]; totalInterest: number; totalPayment: number; emi: number; monthsSaved: number } {
  const schedule = generateAmortizationSchedule(principal, annualRate, months, extraMonthlyPayment);
  const baseEMI = calculateEMI(principal, annualRate, months);
  const totalPayment = schedule.reduce((sum, entry) => sum + entry.payment, 0);
  const totalInterest = totalPayment - principal;
  const monthsSaved = months - schedule.length;

  return { schedule, totalInterest, totalPayment, emi: baseEMI, monthsSaved };
}

/**
 * Calculate FD maturity amount with compound interest and payout types
 * Cumulative: A = P × (1 + r/n)^(n×t) - all interest reinvested
 * Periodic payout: Interest paid out, only principal compounds
 */
export function calculateFDMaturity(
  principal: number,
  annualRate: number,
  months: number,
  compoundingFrequency: 'monthly' | 'quarterly' | 'half-yearly' | 'yearly' = 'quarterly',
  payoutType: 'cumulative' | 'monthly' | 'quarterly' | 'yearly' = 'cumulative'
): {
  maturityAmount: number;
  totalInterest: number;
  periodicPayout: number;
  growthData: { month: number; amount: number }[]
} {
  const frequencyMap = {
    'monthly': 12,
    'quarterly': 4,
    'half-yearly': 2,
    'yearly': 1
  };

  const payoutFrequencyMap = {
    'cumulative': 0, // No periodic payout
    'monthly': 12,
    'quarterly': 4,
    'yearly': 1
  };

  const n = frequencyMap[compoundingFrequency];
  const r = annualRate / 100;
  const t = months / 12;

  let maturityAmount: number;
  let totalInterest: number;
  let periodicPayout: number = 0;
  const growthData: { month: number; amount: number }[] = [];

  if (payoutType === 'cumulative') {
    // Cumulative FD: All interest is reinvested (compounded)
    maturityAmount = principal * Math.pow(1 + r / n, n * t);
    totalInterest = maturityAmount - principal;

    // Generate monthly growth data for chart
    for (let m = 0; m <= months; m++) {
      const currentT = m / 12;
      const amount = principal * Math.pow(1 + r / n, n * currentT);
      growthData.push({ month: m, amount: Math.round(amount * 100) / 100 });
    }
  } else {
    // Periodic payout FD: Interest is compounded within the payout period and then paid out
    const payoutFrequency = payoutFrequencyMap[payoutType];

    // Compounding periods per payout period
    // e.g. compounding = monthly (12), payout = quarterly (4) -> 3 compounding periods per payout
    const n_p = n / payoutFrequency;

    // Calculate effective rate for the payout period
    // If n_p < 1 (e.g. payout monthly (12), compounding yearly (1)), this correctly handles geometric mean equivalent
    const effectivePayoutRate = Math.pow(1 + r / n, n_p) - 1;

    periodicPayout = Math.round(principal * effectivePayoutRate * 100) / 100;

    // Total interest is simply periodic payout * number of payouts
    const numberOfPayouts = t * payoutFrequency;
    totalInterest = periodicPayout * numberOfPayouts;
    maturityAmount = principal; // Only principal returned at maturity

    // Generate monthly growth data (shows accumulated payouts + principal)
    // We assume payouts accumulate linearly in the growth chart for simplicity of visualization
    for (let m = 0; m <= months; m++) {
      const currentT = m / 12;
      // Approximate accumulated value for visualization
      const accumulatedPayouts = totalInterest * (m / months);
      growthData.push({ month: m, amount: Math.round((principal + accumulatedPayouts) * 100) / 100 });
    }
  }

  return {
    maturityAmount: Math.round(maturityAmount * 100) / 100,
    totalInterest: Math.round(totalInterest * 100) / 100,
    periodicPayout,
    growthData
  };
}

/**
 * Calculate tax on FD interest (simple calculation)
 */
export function calculateFDTax(interest: number, taxRate: number = 30): number {
  return Math.round(interest * taxRate / 100 * 100) / 100;
}

/**
 * Adjust amount for inflation
 */
export function adjustForInflation(amount: number, years: number, inflationRate: number = 6): number {
  return Math.round(amount / Math.pow(1 + inflationRate / 100, years) * 100) / 100;
}

// ============================================
// Portfolio / Multi-Investment Calculations
// ============================================

export interface AllocationInput {
  amount: number;
  percentage: number;
  annualRate: number;
}

/**
 * Calculate weighted average annual rate from allocations
 */
export function calculateWeightedAverageRate(allocations: AllocationInput[]): number {
  const totalPercentage = allocations.reduce((sum, a) => sum + a.percentage, 0);
  if (totalPercentage === 0) return 0;

  const weightedSum = allocations.reduce((sum, a) => sum + (a.percentage * a.annualRate), 0);
  return Math.round((weightedSum / totalPercentage) * 100) / 100;
}

/**
 * Calculate portfolio weighted average risk (0-100 scale)
 */
export function calculatePortfolioRisk(
  allocations: { percentage: number; riskScore: number }[]
): number {
  const totalPercentage = allocations.reduce((sum, a) => sum + a.percentage, 0);
  if (totalPercentage === 0) return 0;

  const weightedRisk = allocations.reduce((sum, a) => sum + (a.percentage * a.riskScore), 0);
  return Math.round((weightedRisk / totalPercentage) * 100) / 100;
}

/**
 * Calculate portfolio maturity with multiple instruments
 * Uses weighted average rate for simplicity
 */
export function calculatePortfolioMaturity(
  totalAmount: number,
  allocations: AllocationInput[],
  months: number,
  compoundingFrequency: 'monthly' | 'quarterly' | 'half-yearly' | 'yearly' = 'quarterly'
): {
  maturityAmount: number;
  totalInterest: number;
  weightedRate: number;
  growthData: { month: number; amount: number }[];
  allocationReturns: { amount: number; interest: number }[];
} {
  const frequencyMap = {
    'monthly': 12,
    'quarterly': 4,
    'half-yearly': 2,
    'yearly': 1
  };

  const n = frequencyMap[compoundingFrequency];
  const t = months / 12;

  // Calculate returns for each allocation
  const allocationReturns = allocations.map(a => {
    const r = a.annualRate / 100;
    const maturity = a.amount * Math.pow(1 + r / n, n * t);
    return {
      amount: Math.round(maturity * 100) / 100,
      interest: Math.round((maturity - a.amount) * 100) / 100,
    };
  });

  const maturityAmount = allocationReturns.reduce((sum, r) => sum + r.amount, 0);
  const totalInterest = allocationReturns.reduce((sum, r) => sum + r.interest, 0);
  const weightedRate = calculateWeightedAverageRate(allocations);

  // Generate growth data using weighted average rate
  const growthData: { month: number; amount: number }[] = [];
  const avgR = weightedRate / 100;
  for (let m = 0; m <= months; m++) {
    const currentT = m / 12;
    const amount = totalAmount * Math.pow(1 + avgR / n, n * currentT);
    growthData.push({ month: m, amount: Math.round(amount * 100) / 100 });
  }

  return {
    maturityAmount: Math.round(maturityAmount * 100) / 100,
    totalInterest: Math.round(totalInterest * 100) / 100,
    weightedRate,
    growthData,
    allocationReturns,
  };
}

/**
 * Calculate break-even point: when investment returns exceed loan interest
 * Returns months until break-even, or -1 if never
 */
export function calculateBreakEvenMonth(
  investmentAmount: number,
  investmentRate: number,
  loanInterestTotal: number,
  maxMonths: number = 360
): number {
  const monthlyRate = investmentRate / 12 / 100;
  let balance = investmentAmount;

  for (let month = 1; month <= maxMonths; month++) {
    balance = balance * (1 + monthlyRate);
    const interest = balance - investmentAmount;
    if (interest >= loanInterestTotal) {
      return month;
    }
  }

  return -1; // Never breaks even within maxMonths
}

/**
 * Calculate net savings: Investment returns minus loan cost
 */
export function calculateNetSavings(
  investmentReturns: number,
  loanTotalInterest: number,
  loanPenalty: number = 0
): number {
  return Math.round((investmentReturns - loanTotalInterest - loanPenalty) * 100) / 100;
}

/**
 * SIP Allocation with tax rate
 */
export interface SIPAllocation {
  instrumentId: string;
  amount: number;
  percentage: number;
  annualRate: number; // User's expected XIRR
  taxRate: number;
  expenseRatio?: number;
}

/**
 * Calculate SIP maturity using future value of annuity formula
 * FV = PMT × [((1+r)^n - 1) / r]
 * where r = monthly rate, n = months
 */
export function calculateSIPMaturity(
  monthlyAmount: number,
  annualRate: number,
  months: number
): { maturityAmount: number; totalInvested: number; gain: number } {
  const monthlyRate = annualRate / 12 / 100;
  const totalInvested = monthlyAmount * months;

  let maturityAmount: number;
  if (monthlyRate === 0) {
    maturityAmount = totalInvested;
  } else {
    // Future Value of Annuity: PMT × [((1+r)^n - 1) / r]
    maturityAmount = monthlyAmount * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate);
  }

  return {
    maturityAmount: Math.round(maturityAmount * 100) / 100,
    totalInvested,
    gain: Math.round((maturityAmount - totalInvested) * 100) / 100,
  };
}

/**
 * Calculate weighted average rate for SIP portfolio
 */
export function calculateWeightedSIPRate(allocations: SIPAllocation[]): number {
  const totalPercentage = allocations.reduce((sum, a) => sum + a.percentage, 0);
  if (totalPercentage === 0) return 0;

  const weighted = allocations.reduce((sum, a) => sum + (a.percentage * a.annualRate), 0);
  return Math.round((weighted / totalPercentage) * 100) / 100;
}

/**
 * Calculate SIP portfolio maturity with multiple allocations
 */
export function calculateSIPPortfolioMaturity(
  monthlyTotal: number,
  allocations: SIPAllocation[],
  months: number,
  applyTax: boolean = false
): {
  maturityAmount: number;
  totalInvested: number;
  totalGain: number;
  weightedRate: number;
  allocationReturns: { instrumentId: string; invested: number; maturity: number; gain: number; postTaxGain: number }[];
} {
  let totalInvestedPortfolio = 0;
  let totalGainPortfolio = 0;
  const allocationReturns: { instrumentId: string; invested: number; maturity: number; gain: number; postTaxGain: number }[] = [];

  allocations.forEach((alloc) => {
    const monthlyAmount = (alloc.percentage / 100) * monthlyTotal;
    // Effective rate is annual rate minus expense ratio
    const effectiveRate = alloc.annualRate - (alloc.expenseRatio || 0);

    const { maturityAmount, totalInvested, gain } = calculateSIPMaturity(
      monthlyAmount,
      effectiveRate,
      months
    );

    // Apply Tax on Gain
    const postTaxGain = applyTax ? gain * (1 - alloc.taxRate / 100) : gain;

    totalInvestedPortfolio += totalInvested;
    totalGainPortfolio += postTaxGain;

    allocationReturns.push({
      instrumentId: alloc.instrumentId,
      invested: totalInvested,
      maturity: maturityAmount, // This is pre-tax maturity
      gain: gain, // This is pre-tax gain
      postTaxGain: Math.round(postTaxGain * 100) / 100,
    });
  });

  const weightedRate = calculateWeightedSIPRate(allocations);

  return {
    maturityAmount: Math.round((totalInvestedPortfolio + totalGainPortfolio) * 100) / 100,
    totalInvested: Math.round(totalInvestedPortfolio * 100) / 100,
    totalGain: Math.round(totalGainPortfolio * 100) / 100,
    weightedRate,
    allocationReturns,
  };
}

/**
 * Calculate break-even month: when SIP maturity equals Lumpsum maturity
 * Returns -1 if SIP never catches up within maxMonths
 */
export function calculateLumpsumVsSIPBreakeven(
  lumpsumAmount: number,
  lumpsumRate: number,
  sipMonthlyAmount: number,
  sipRate: number,
  maxMonths: number = 360
): number {
  const lumpsumMonthlyRate = lumpsumRate / 12 / 100;
  const sipMonthlyRate = sipRate / 12 / 100;

  for (let month = 1; month <= maxMonths; month++) {
    const lumpsumValue = lumpsumAmount * Math.pow(1 + lumpsumMonthlyRate, month);

    let sipValue: number;
    if (sipMonthlyRate === 0) {
      sipValue = sipMonthlyAmount * month;
    } else {
      sipValue = sipMonthlyAmount * ((Math.pow(1 + sipMonthlyRate, month) - 1) / sipMonthlyRate);
    }

    if (sipValue >= lumpsumValue) {
      return month;
    }
  }

  return -1;
}

/**
 * Generate Lumpsum vs SIP comparison data over time
 */
export function generateLumpsumVsSIPComparison(
  lumpsumAmount: number,
  lumpsumRate: number,
  sipMonthlyAmount: number,
  sipRate: number,
  months: number
): {
  data: { month: number; lumpsum: number; sip: number }[];
  breakEvenMonth: number;
  finalLumpsum: number;
  finalSIP: number;
} {
  const lumpsumMonthlyRate = lumpsumRate / 12 / 100;
  const sipMonthlyRate = sipRate / 12 / 100;
  const data: { month: number; lumpsum: number; sip: number }[] = [];
  let breakEvenMonth = -1;

  for (let month = 0; month <= months; month++) {
    const lumpsum = lumpsumAmount * Math.pow(1 + lumpsumMonthlyRate, month);

    let sip: number;
    if (month === 0) {
      sip = 0;
    } else if (sipMonthlyRate === 0) {
      sip = sipMonthlyAmount * month;
    } else {
      sip = sipMonthlyAmount * ((Math.pow(1 + sipMonthlyRate, month) - 1) / sipMonthlyRate);
    }

    data.push({
      month,
      lumpsum: Math.round(lumpsum * 100) / 100,
      sip: Math.round(sip * 100) / 100,
    });

    if (breakEvenMonth === -1 && sip >= lumpsum && month > 0) {
      breakEvenMonth = month;
    }
  }

  return {
    data,
    breakEvenMonth,
    finalLumpsum: data[data.length - 1].lumpsum,
    finalSIP: data[data.length - 1].sip,
  };
}

