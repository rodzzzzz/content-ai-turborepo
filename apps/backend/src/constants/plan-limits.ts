interface UsageLimits {
    credits: number; // Amount in cents
    organizations: number;
}

export const TRIAL_CREDITS = 500; // $5 in cents

export const PLAN_LIMITS: Record<string, UsageLimits> = {
    Trial: {
        credits: TRIAL_CREDITS,
        organizations: 1,
    },
    Starter: {
        credits: 2000, // $20 in cents
        organizations: 1,
    },
    Growth: {
        credits: 5000, // $50 in cents
        organizations: 5,
    },
    Pro: {
        credits: 8000, // $80 in cents
        organizations: 999,
    },
};
