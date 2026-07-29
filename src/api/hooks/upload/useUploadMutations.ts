import { uploadService } from "@/api/services/upload.service"
import { useMutation } from "@tanstack/react-query"

export function useUploadMutations() {
    const uploadWorkImage = useMutation({
        mutationFn: uploadService.uploadWorkImage
    })
    const uploadAvatar = useMutation({
        mutationFn: uploadService.uploadAvatar
    })
    const uploadApplicationFile = useMutation({
        mutationFn: uploadService.uploadApplicationFile
    })
    return { uploadWorkImage, uploadAvatar, uploadApplicationFile }
}