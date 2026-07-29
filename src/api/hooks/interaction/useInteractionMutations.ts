import { toast } from "sonner";
import { interactionService } from "../../services/interactions.service";
import { useMutation, useQueryClient } from "@tanstack/react-query";

type WorkLike = { id: string; likes_count?: number; is_liked?: boolean;[key: string]: unknown };
type WorkDetail = { work: WorkLike;[key: string]: unknown };

function patchLike(w: WorkLike, id: string, wasLiked: boolean): WorkLike {
    if (w.id !== id) return w;
    return {
        ...w,
        is_liked: !wasLiked,
        likes_count: Math.max(0, (w.likes_count ?? 0) + (wasLiked ? -1 : 1)),
    };
}

const KEYS = {
    work: {
        x: 'works',
        y: 'work'
    },
    project: {
        x: 'projects',
        y: 'project'
    }
}

export function useToggleLike(targetType: 'work' | 'project' = 'work') {
    const queryClient = useQueryClient();

    const key = KEYS[targetType]
    return useMutation({
        mutationFn: ({ id, wasLiked }: { id: string; wasLiked: boolean }) =>
            wasLiked
                ? interactionService.unlike({ id, targetType })
                : interactionService.like({ id, targetType }),

        onMutate: async ({ id, wasLiked }) => {
            await queryClient.cancelQueries({ queryKey: [key.x] });
            await queryClient.cancelQueries({ queryKey: [key.y, id] });

            const prevLists = queryClient.getQueriesData<WorkLike[]>({ queryKey: [key.x] });
            const prevDetail = queryClient.getQueryData<WorkDetail>([key.y, id]);

            queryClient.setQueriesData<WorkLike[]>({ queryKey: [key.x] }, (old) =>
                old?.map((w) => patchLike(w, id, wasLiked)),
            );

            queryClient.setQueryData<WorkDetail>([key.y, id], (old) =>
                old ? { ...old, work: patchLike(old.work, id, wasLiked) } : old,
            );

            return { prevLists, prevDetail, id };
        },

        onError: (error, _vars, context) => {
            if (context) {
                context.prevLists.forEach(([key, data]) => queryClient.setQueryData(key, data));
                queryClient.setQueryData([key.y, context.id], context.prevDetail);
            }
            if (error instanceof Error && error.message !== 'Not authenticated') {
                toast.error("Couldn't update like");
            }
        },


    });
}

export function useToggleBookmark(targetType: 'work' | 'project' = 'work') {
    const queryClient = useQueryClient();
    const key = KEYS[targetType]

    return useMutation({
        mutationFn: ({ id, wasBookmarked }: { id: string; wasBookmarked: boolean }) =>
            wasBookmarked
                ? interactionService.unbookmark({ id, targetType })
                : interactionService.bookmark({ id, targetType }),

        onMutate: async ({ id, wasBookmarked }) => {
            await queryClient.cancelQueries({ queryKey: [key.x] });
            await queryClient.cancelQueries({ queryKey: [key.y, id] });

            const prevLists = queryClient.getQueriesData<WorkLike[]>({ queryKey: [key.x] });
            const prevDetail = queryClient.getQueryData<WorkDetail>([key.y, id]);

            const patch = (w: WorkLike) => w.id === id ? { ...w, is_bookmarked: !wasBookmarked } : w;

            queryClient.setQueriesData<WorkLike[]>({ queryKey: [key.x] }, (old) => old?.map(patch));
            queryClient.setQueryData<WorkDetail>([key.y, id], (old) =>
                old ? { ...old, work: patch(old.work) } : old,
            );

            return { prevLists, prevDetail, id };
        },

        onError: (_err, _vars, context) => {
            if (!context) return;
            context.prevLists.forEach(([key, data]) => queryClient.setQueryData(key, data));
            queryClient.setQueryData([key.y, context.id], context.prevDetail);
        },

        onSettled: (_data, _err, { id }) => {
            queryClient.invalidateQueries({ queryKey: [key.x] });
            queryClient.invalidateQueries({ queryKey: [key.y, id] });
            queryClient.invalidateQueries({ queryKey: ['favorites'] }); // ← add this line
        },
    });
}