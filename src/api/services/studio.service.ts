import { supabase } from "@/integrations/supabase/client";

export const studioService = {
    async getMyStudios(userId: string): Promise<Studio[]> {
        const [{ data: owned, error: e1 }, { data: memberRows, error: e2 }] = await Promise.all([
            supabase.from("studios").select("*").eq("owner_id", userId).order("created_at", { ascending: false }),
            supabase.from("studio_members").select("studio_id").eq("user_id", userId),
        ]);
        if (e1) throw e1;
        if (e2) throw e2;

        const memberStudioIds = [...new Set((memberRows ?? []).map(m => m.studio_id))];
        let joined: Studio[] = [];
        if (memberStudioIds.length) {
            const { data, error } = await supabase.from("studios").select("*").in("id", memberStudioIds);
            if (error) throw error;
            joined = (data as Studio[]) ?? [];
        }

        const all = [...((owned as Studio[]) ?? []), ...joined];
        return all.filter((s, i, arr) => arr.findIndex(x => x.id === s.id) === i);
    },

    async getMyPendingInvites(userId: string): Promise<Invite[]> {
        const { data, error } = await supabase
            .from("studio_invites")
            .select("*")
            .eq("invited_user_id", userId)
            .eq("status", "pending");
        if (error) throw error;
        return (data as Invite[]) ?? [];
    },

    async getStudioDetails(studioId: string): Promise<{ members: Member[]; invites: Invite[] }> {
        const [{ data: ms, error: e1 }, { data: inv, error: e2 }] = await Promise.all([
            supabase.from("studio_members").select("*").eq("studio_id", studioId).order("created_at", { ascending: true }),
            supabase.from("studio_invites").select("*").eq("studio_id", studioId).order("created_at", { ascending: false }),
        ]);
        if (e1) throw e1;
        if (e2) throw e2;

        const rows = (ms as Member[]) ?? [];
        const ids = rows.map(m => m.user_id);
        let profiles: any[] = [];
        if (ids.length) {
            const { data, error } = await supabase.from("profiles").select("id, full_name, username").in("id", ids);
            if (error) throw error;
            profiles = data ?? [];
        }
        const map = new Map(profiles.map(p => [p.id, p]));
        const members = rows.map(m => ({ ...m, profile: map.get(m.user_id) }));

        return { members, invites: (inv as Invite[]) ?? [] };
    },

    async create(userId: string, input: NewStudio): Promise<Studio> {
        const { data, error } = await supabase
            .from("studios")
            .insert({ owner_id: userId, name: input.name, slug: input.slug })
            .select()
            .single();
        if (error) throw error;

        const { error: memberError } = await supabase
            .from("studio_members")
            .insert({ studio_id: data.id, user_id: userId, role: "owner" });
        if (memberError) throw memberError;

        return data as Studio;
    },

    async update(studioId: string, payload: StudioUpdate): Promise<void> {
        const { error } = await supabase.from("studios").update(payload).eq("id", studioId);
        if (error) throw error;
    },

    async invite({
        studioId,
        invitedBy,
        value,
        role,
    }: {
        studioId: string;
        invitedBy: string;
        value: string;
        role: string;
    }): Promise<void> {
        const isEmail = value.includes("@");
        let invited_user_id: string | null = null;
        let invited_email: string | null = isEmail ? value : null;

        if (!isEmail) {
            const { data: profile, error } = await supabase
                .from("profiles")
                .select("id")
                .eq("username", value.replace(/^@/, ""))
                .maybeSingle();
            if (error) throw error;
            if (!profile) throw new Error("No profile found with that username");
            invited_user_id = profile.id;
        }

        const { error } = await supabase.from("studio_invites").insert({
            studio_id: studioId,
            invited_by: invitedBy,
            invited_user_id,
            invited_email,
            role,
        });
        if (error) throw error;
    },

    async updateMemberRole(memberId: string, role: string): Promise<void> {
        const { error } = await supabase.from("studio_members").update({ role }).eq("id", memberId);
        if (error) throw error;
    },

    async removeMember(memberId: string): Promise<void> {
        const { error } = await supabase.from("studio_members").delete().eq("id", memberId);
        if (error) throw error;
    },

    async acceptInvite({ inviteId, studioId, userId, role }: {
        inviteId: string;
        studioId: string;
        userId: string;
        role: string;
    }): Promise<void> {
        const { error: memberError } = await supabase
            .from("studio_members")
            .upsert({ studio_id: studioId, user_id: userId, role }, { onConflict: "studio_id,user_id" });
        if (memberError) throw memberError;

        const { error } = await supabase.from("studio_invites").update({ status: "accepted" }).eq("id", inviteId);
        if (error) throw error;
    },
    async getPublicStudioProfile(slug: string) {
        const { data: studioData, error: studioError } = await supabase
            .from("studios")
            .select("*")
            .eq("slug", slug)
            .maybeSingle();

        if (studioError) throw studioError;

        if (!studioData) {
            return {
                studio: null,
                members: [],
                works: [],
                projects: [],
            };
        }

        const studio = studioData as Studio;

        const [
            { data: memberRows, error: memberError },
            { data: worksData, error: worksError },
            { data: projectsData, error: projectsError },
        ] = await Promise.all([
            supabase
                .from("studio_members")
                .select("id, user_id, role")
                .eq("studio_id", studio.id)
                .order("created_at", { ascending: true }),

            supabase
                .from("works")
                .select("id, title, cover_url, discipline")
                .eq("studio_id", studio.id)
                .eq("is_published", true)
                .order("created_at", { ascending: false }),

            supabase
                .from("projects")
                .select("id, title, subtitle, cover_url")
                .eq("studio_id", studio.id)
                .eq("is_published", true)
                .order("created_at", { ascending: false }),
        ]);

        if (memberError) throw memberError;
        if (worksError) throw worksError;
        if (projectsError) throw projectsError;

        const rows = (memberRows as Member[]) ?? [];
        const ids = rows.map((m) => m.user_id);

        let profiles: Profile[] = [];

        if (ids.length) {
            const { data, error } = await supabase
                .from("profiles")
                .select(
                    "id, full_name, username, avatar_url, discipline"
                )
                .in("id", ids);

            if (error) throw error;

            profiles = (data as Profile[]) ?? [];
        }

        const profileMap = new Map(
            profiles.map((profile) => [profile.id, profile])
        );

        const members = rows.map((member) => ({
            ...member,
            profile: profileMap.get(member.user_id),
        }));

        return {
            studio,
            members,
            works: (worksData as Work[]) ?? [],
            projects: (projectsData as Project[]) ?? [],
        };
    }
};