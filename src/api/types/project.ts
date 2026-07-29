
export interface ProjectFilters {
    category?: string;
    featured?: boolean;
    search?: string;
    page?: number;
    order?: {
        by: string;
        asc?: boolean
    }
}

