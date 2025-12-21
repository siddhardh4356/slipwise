export type SplitType = 'EQUAL' | 'EXACT' | 'PERCENTAGE';

export interface SplitInput {
    userId: string;
    amount?: number;
    percentage?: number;
}

export interface CalculatedSplit {
    userId: string;
    amount: number;
    percentage?: number;
}

export function calculateEqualSplit(totalAmount: number, userIds: string[]): CalculatedSplit[] {
    if (userIds.length === 0) {
        throw new Error('At least one user is required for split');
    }

    const sharePerUser = totalAmount / userIds.length;

    return userIds.map(userId => ({
        userId,
        amount: Math.round(sharePerUser * 100) / 100
    }));
}

export function calculateExactSplit(totalAmount: number, splits: SplitInput[]): CalculatedSplit[] {
    if (splits.length === 0) {
        throw new Error('At least one split is required');
    }

    const sum = splits.reduce((acc, split) => acc + (split.amount || 0), 0);

    if (Math.abs(sum - totalAmount) > 0.01) {
        throw new Error(`Split amounts (${sum}) must equal total amount (${totalAmount})`);
    }

    return splits.map(split => ({
        userId: split.userId,
        amount: split.amount || 0
    }));
}

export function calculatePercentageSplit(totalAmount: number, splits: SplitInput[]): CalculatedSplit[] {
    if (splits.length === 0) {
        throw new Error('At least one split is required');
    }

    const totalPercentage = splits.reduce((acc, split) => acc + (split.percentage || 0), 0);

    if (Math.abs(totalPercentage - 100) > 0.01) {
        throw new Error(`Percentages (${totalPercentage}%) must sum to 100%`);
    }

    return splits.map(split => {
        const percentage = split.percentage || 0;
        const amount = (percentage / 100) * totalAmount;

        return {
            userId: split.userId,
            amount: Math.round(amount * 100) / 100,
            percentage
        };
    });
}

export function calculateSplit(totalAmount: number, splitType: SplitType, splits: SplitInput[]): CalculatedSplit[] {
    switch (splitType) {
        case 'EQUAL':
            return calculateEqualSplit(totalAmount, splits.map(s => s.userId));
        case 'EXACT':
            return calculateExactSplit(totalAmount, splits);
        case 'PERCENTAGE':
            return calculatePercentageSplit(totalAmount, splits);
        default:
            throw new Error(`Unknown split type: ${splitType}`);
    }
}
