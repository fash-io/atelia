export type JobFilters = {
    tab: "all" | "mine";
    userId?: string;
    showClosed: boolean;
    discipline?: string;
    jobType?: string;
    remote?: "any" | "remote" | "onsite";
    minBudget?: number;
    maxBudget?: number;
};