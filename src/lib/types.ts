type Plan = {
    id: string;
    name: string;
    price_ngn: number;
    period: string;
    blurb: string;
    cta: string;
    features: string[];
    highlight: boolean;
    is_active: boolean;
    sort_order: number;
};

type Sub = {
    id: string;
    plan: string;
    status: string;
    current_period_end: string | null;
    cancel_at_period_end: boolean;
};

type Job = {
    id: string;
    title: string;
    company: string | null;
    location: string | null;
    remote: boolean;
    job_type: string;
    budget_min: number | null;
    budget_max: number | null;
    currency: string;
    discipline: string;
    created_at: string;
    status: string;
    user_id: string;
    is_featured: boolean;
    featured_until: string | null;
    views_count: number;
    description: string;
    deadline?: string;
    tags: string[]
};

type JobFilters = {
    tab: "all" | "mine";
    userId?: string;
    showClosed: boolean;
    discipline?: string;
    jobType?: string;
    remote?: "any" | "remote" | "onsite";
    minBudget?: number;
    maxBudget?: number;
};

type NewJob = {
    user_id: string;
    title: string;
    company?: string;
    description: string;
    discipline: string;
    job_type: "project" | "full-time" | "contract" | "freelance";
    location?: string;
    remote: boolean;
    budget_min?: number;
    budget_max?: number;
    currency: string;
    deadline?: string;
    tags: string[];
    feature: boolean;
    isPro: boolean;
};
type UpdateJob = {
    title: string;
    company?: string;
    description: string;
    discipline: string;
    job_type: "project" | "full-time" | "contract" | "freelance";
    location?: string;
    remote: boolean;
    budget_min?: number;
    budget_max?: number;
    currency: string;
    deadline?: string;
    status: "open" | "closed";
    tags: string[];
    is_featured: boolean;
    isPro: boolean;
};
type App = {
    id: string;
    applicant_id: string;
    message: string;
    quote_amount: number | null;
    currency: string;
    status: string;
    created_at: string;
    resume_url: string | null;
    proof_url: string | null;
};
type FavoriteItem = {
    id: string;
    type: "work" | "project";
    title: string;
    cover: string;
    discipline: string | null;
};
type Profile = {
    id: string;
    username: string | null;
    full_name: string | null;
    headline: string | null;
    bio: string | null;
    discipline: string | null;
    location: string | null;
    website: string | null;
    avatar_url: string | null;
    is_pro: boolean;
    available_for_hire: boolean;
    skills: string[];
    instagram: string | null;
    behance: string | null;
    dribbble: string | null;
    linkedin: string | null;
    twitter: string | null;
};

type Service = {
    id: string;
    user_id: string;
    title: string;
    description: string | null;
    price_amount: number | null;
    currency: string;
    price_unit: string;
    delivery_days: number | null;
    is_visible: boolean;
    sort_order: number;
};
type Booking = {
    id: string;
    client_id: string;
    creative_id: string;
    service_id: string | null;
    title: string;
    notes: string | null;
    scheduled_at: string;
    duration_minutes: number;
    status: string;
};
type Work = {
    id: string;
    title: string;
    description: string | null;
    cover_url: string;
    discipline: string | null;
    user_id: string;
    likes_count: number;
    views_count: number;
    gallery: { url: string; caption: string | null }[];
    tags: string[];
    is_published: boolean;
    is_featured?: boolean;

};
type UpdateProfile = Partial<
    Pick<
        Profile,
        | 'full_name' | 'username' | 'headline' | 'bio' | 'discipline' | 'location'
        | 'website' | 'available_for_hire' | 'skills' | 'instagram' | 'behance'
        | 'dribbble' | 'linkedin' | 'twitter'
    >
>;

type ProjectSummary = {
    id: string;
    title: string;
    subtitle: string | null;
    cover_url: string;
    created_at: string;
};

type NewService = Omit<Service, "id">;
type UpdateService = Partial<Omit<Service, "id" | "user_id">>;

type NewBooking = {
    creative_id: string;
    service_id: string | null;
    title: string;
    notes: string | null;
    scheduled_at: string;
    duration_minutes: number;
    status: string
};

type Studio = {
    id: string;
    owner_id: string;
    name: string;
    slug: string;
    bio: string | null;
    custom_domain: string | null;
    cover_url: string | null
    avatar_url: string | null
};
type Member = {
    id: string;
    studio_id: string;
    user_id: string;
    role: string;
    profile?: Profile;
};
type Invite = {
    id: string;
    studio_id: string;
    invited_user_id: string | null;
    invited_email: string | null;
    role: string;
    status: string;
    studio?: Studio;
};

type NewStudio = { name: string; slug: string };
type StudioUpdate = { name: string; bio: string | null; custom_domain: string | null };


type Section =
    { type: 'text'; heading: string; body: string } | { type: 'image'; url: string; caption: string };

type Project = {
    id: string;
    title: string;
    subtitle: string | null;
    cover_url: string;
    sections: Section[];
    tags: string[];
    discipline: string | null;
    client: string | null;
    location: string | null;
    year: string | null;
    user_id: string;
    views_count: number;
    likes_count: number;
    is_published: boolean;
};

type NewProject = {
    title: string;
    location?: string | null;
    cover_url: string;
    discipline: string | null;
    user_id?: string;
    sections: Section[];
    tags: string[];
    is_published?: Boolean
};

type UpdateProject = {
    title: string;
    location?: string | null;
    cover_url: string;
    discipline: string | null;
    subtitle: string | null;
    user_id?: string;
    sections: Section[];
    tags: string[];
    year: number | null;
    is_published: boolean | null;
};