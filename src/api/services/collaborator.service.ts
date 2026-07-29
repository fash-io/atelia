import { supabase } from "@/integrations/supabase/client"

export const collaboratorService = {
    async getCollaborators(id: string) {
        const { data, error } = await supabase.from('content_collaborators')
            .select('*')
            .eq('target_id', id)
            .eq('target_type', 'work')
        if (error) throw error
        return data
    },
    async addCollaborator({ id, user_id }: { id: string, user_id: string }) {
        const { success } = await supabase.from('content_collaborators')
            .upsert({
                user_id,
                target_id: id,
                target_type: 'work',
            })
        return success
    },

    async removeCollaborator({ id, user_id }: { id: string, user_id: string }) {
        const { success, error } = await supabase.from('content_collaborators')
            .delete()
            .eq('user_id', user_id)
            .eq('target_id', id)
            .eq('target_type', 'work')
        if (error) throw error
        return success

    },

    async updateRole({ id, user_id, role }: { id: string, user_id: string, role: string }) {
        const { success, error } = await supabase.from('content_collaborators')
            .update({
                role
            })
            .eq('user_id', user_id)
            .eq('target_id', id)
            .eq('target_type', 'work')
        if (error) throw error
        return success

    },
}