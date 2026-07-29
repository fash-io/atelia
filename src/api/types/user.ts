export interface UserFilters {

    discipline?: string;
    location?: string;
    accountType?: account_type;
    q?: string;
    isPro?: boolean;
    hireOnly?: boolean;
    page?: number;
    order?: {
        by: string;
        asc?: boolean
    }
}

export type account_type = "any" | "artist" | "architect" | "builder" | "designer" | "photographer" | "engineer" | "studio" | "other"