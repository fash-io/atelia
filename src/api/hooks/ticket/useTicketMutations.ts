import { tciketService } from "@/api/services/ticket.service"
import { useMutation } from "@tanstack/react-query"

export function useTicketMutations() {
    const createTicket = useMutation({
        mutationFn: tciketService.createTicket
    })
    return { createTicket }
}