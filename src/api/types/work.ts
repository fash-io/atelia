import { account_type } from "./user";


export type NewWork = {
    title: string;
    description?: string | null;
    cover_url: string;
    discipline: string | null;
    user_id?: string;
    likes_count?: number;
    views_count?: number;
    gallery: { url: string; caption: string | null }[];
    tags: string[];
    is_published?: boolean
};

export type Author = {
    id: string;
    username: string | null;
    full_name: string | null;
    location: string | null;
    avatar_url: string | null;
    is_pro: boolean;
    bio: string | null;
    headline: string | null;
    available_for_hire: string | null;
    account_type?: account_type;
    discipline?: string;
    skills?: string[];
};

export interface WorkFilters {
    category?: string;
    featured?: boolean;
    search?: string;
    page?: number;
    limit?: number;
    order?: {
        by: string;
        asc?: boolean
    }
}

export interface DisplayWork {
    id: string;
    title: string;
    cover_url: string;
    author?: { id: string, full_name?: string, username?: string, is_pro?: boolean, avatar_url?: string } | null;
    discipline: string;
    likes_count: number;
    views_count: number;
    description?: string;
    client?: string;
    year?: string;
    tags?: string[];
    is_featured?: boolean;
    is_liked?: boolean;
    is_bookmarked?: boolean
}

export type ExploreWorkWithAuthor = Work & { author: Author | null };
export type ExploreWorkWithAuthorAndCollabs = Work & { author: Author | null, collaborators: Author[] };

export type Collab = { target_id: string; user_id: string };
