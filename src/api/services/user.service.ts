import { supabase } from "@/integrations/supabase/client"
import { workService } from "./work.service"
import { projectService } from "./project.service"

export const userService = {
    async getMe(id: string) {
        const { data, error } = await supabase.from('profiles').select("*").eq('id', id).single()
        if (error) throw error
        return data
    },
    async getById(id: string) {
        const { data, error } = await supabase.from('profiles').select("*").eq('id', id).single()
        if (error) throw error
        return data
    },
    async getByUsername(uName: string) {
        const { data, error } = await supabase.from('profiles').select("*").ilike('username', `%${uName}%`)
        if (error) throw error
        return data
    },
    async getWorks(id: string) {
        return workService.getByUser(id)
    },

    async getProjects(id: string) {
        return projectService.getByUser(id)
    },

}