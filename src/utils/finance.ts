
export const calculateEMI = (principal: number, rate: number, termMonths: number) => {
    const monthlyRate = rate / 12 / 100;
    if (monthlyRate === 0) return principal / termMonths;
    const emi = principal * monthlyRate * Math.pow(1 + monthlyRate, termMonths) /
        (Math.pow(1 + monthlyRate, termMonths) - 1);
    return emi;
};

export const generateLoanSchedule = (
    principal: number,
    rate: number,
    termMonths: number,
    extraMonthlyAmount = 0,
    bulkAmount = 0,
    bulkMonth = 0,
    penalty = 0,
    timing = 'none' // 'before', 'after', 'both', 'none'
) => {
    const monthlyRate = rate / 12 / 100;
    const emi = calculateEMI(principal, rate, termMonths);
    let balance = principal;
    const schedule = [];
    let month = 1;
    let totalInterest = 0;
    let totalPrincipal = 0;
    let totalPenalty = 0;

    // Use a safety limit to prevent infinite loops (e.g., 50 years max)
    while (balance > 0.01 && month <= termMonths + 360) {
        let monthlyPayment = Math.min(emi, balance * (1 + monthlyRate));
        let extraPayment = 0;
        let bulkPayment = 0;
        let penaltyAmount = 0;

        // Apply extra monthly payment based on timing
        if (timing === 'before' && month < bulkMonth) {
            extraPayment = extraMonthlyAmount;
        } else if (timing === 'after' && month > bulkMonth) {
            extraPayment = extraMonthlyAmount;
        } else if (timing === 'both') {
            extraPayment = extraMonthlyAmount;
        }

        const interest = balance * monthlyRate;
        let principalPayment = monthlyPayment - interest;

        // Apply bulk prepayment
        if (month === bulkMonth && bulkAmount > 0) {
            bulkPayment = Math.min(bulkAmount, balance - principalPayment);
            penaltyAmount = bulkPayment * (penalty / 100);
            totalPenalty += penaltyAmount;
        }

        // Apply extra monthly payment logic (capped at remaining balance)
        if (extraPayment > 0) {
            extraPayment = Math.min(extraPayment, balance - principalPayment - bulkPayment);
        }

        principalPayment += extraPayment + bulkPayment;
        const totalPayment = monthlyPayment + extraPayment + bulkPayment + penaltyAmount;

        balance -= principalPayment;
        totalInterest += interest;
        totalPrincipal += principalPayment;

        schedule.push({
            month,
            payment: totalPayment,
            emi: monthlyPayment,
            extraMonthly: extraPayment,
            bulkPayment,
            penalty: penaltyAmount,
            principal: principalPayment,
            interest,
            balance: Math.max(0, balance)
        });

        if (balance <= 0.01) break;
        month++;
    }

    return {
        schedule,
        totalInterest,
        totalPrincipal,
        totalPenalty,
        totalPayment: totalPrincipal + totalInterest + totalPenalty,
        actualTerm: schedule.length
    };
};

export const calculateFD = (
    principal: number,
    rate: number,
    termMonths: number,
    compounding = 'quarterly',
    payoutFrequency = 'maturity',
    taxRate = 0
) => {
    const compoundingFrequency: Record<string, number> = {
        'monthly': 12,
        'quarterly': 4,
        'half-yearly': 2,
        'yearly': 1
    };

    const payoutFrequencyMonths: Record<string, number> = {
        'monthly': 1,
        'quarterly': 3,
        'yearly': 12,
        'maturity': termMonths
    };

    const n = compoundingFrequency[compounding] || 4;
    const r = rate / 100;
    const payoutPeriod = payoutFrequencyMonths[payoutFrequency] || termMonths;

    let currentBalance = principal;
    let totalInterestEarned = 0;
    let totalPayouts = 0;
    const breakdown = [];

    // If payout is at maturity, use compound interest formula for final amounts
    if (payoutFrequency === 'maturity') {
        const years = termMonths / 12;
        const maturityAmount = principal * Math.pow((1 + r / n), n * years);
        const interest = maturityAmount - principal;
        const taxOnInterest = interest * (taxRate / 100);
        const postTaxMaturity = maturityAmount - taxOnInterest;

        // Generate monthly breakdown for chart/table
        for (let month = 1; month <= termMonths; month++) {
            const amount = principal * Math.pow((1 + r / n), n * (month / 12));
            const interestEarned = amount - principal;
            const tax = interestEarned * (taxRate / 100);
            breakdown.push({
                month,
                amount: amount,
                interest: interestEarned,
                payout: month === termMonths ? interestEarned : 0,
                tax: month === termMonths ? tax : 0,
                netAmount: amount - tax
            });
        }

        return {
            maturityAmount,
            interest,
            taxOnInterest,
            postTaxMaturity,
            totalPayouts: interest,
            breakdown
        };
    }

    // For regular payouts
    for (let month = 1; month <= termMonths; month++) {
        const monthlyRate = r / 12;
        const interestThisMonth = currentBalance * monthlyRate;
        totalInterestEarned += interestThisMonth;

        const isPayout = month % payoutPeriod === 0 || month === termMonths;
        let payoutAmount = 0;
        let taxAmount = 0;

        if (isPayout) {
            // Simplified payout logic: calculate interest for the period
            // More accurate would be compounding within period then paying out
            const periodsInPayout = Math.min(payoutPeriod, month);
            const periodRate = r / (12 / periodsInPayout);
            const periodInterest = currentBalance * periodRate;

            payoutAmount = periodInterest;
            taxAmount = payoutAmount * (taxRate / 100);
            totalPayouts += payoutAmount;

            // Balance resets to principal if interest is paid out
            currentBalance = principal;
        } else {
            // Compound
            currentBalance += interestThisMonth;
        }

        breakdown.push({
            month,
            amount: currentBalance + (isPayout ? 0 : interestThisMonth),
            interest: interestThisMonth,
            payout: payoutAmount,
            tax: taxAmount,
            netAmount: currentBalance + (isPayout ? payoutAmount - taxAmount : interestThisMonth)
        });
    }

    const finalAmount = principal + totalPayouts;
    const totalTax = totalPayouts * (taxRate / 100);
    const postTaxTotal = finalAmount - totalTax;

    return {
        maturityAmount: finalAmount,
        interest: totalPayouts,
        taxOnInterest: totalTax,
        postTaxMaturity: postTaxTotal,
        totalPayouts,
        breakdown
    };
};
