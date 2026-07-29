import { useMutation } from "@tanstack/react-query";
import { workService } from "../../services/work.service";

export function useWorkMutations() {
    const create = useMutation({
        mutationFn: workService.create,
    })
    const update = useMutation({
        mutationFn: workService.update,
    })
    const publish = useMutation({
        mutationFn: workService.publish,
    })
    const archive = useMutation({
        mutationFn: workService.archive,
    })
    const remove = useMutation({
        mutationFn: workService.delete,
    })
    const incrementView = useMutation({
        mutationFn: workService.incrementViews
    })
    return { create, update, remove, incrementView, publish, archive }
}