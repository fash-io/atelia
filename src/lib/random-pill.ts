import { ALL_DISCIPLINES } from "./disciplines"

export const randomBlobKey = (): string => {
    const n = Math.floor(Math.random() * ALL_DISCIPLINES.length)
    return `blob ${ALL_DISCIPLINES[n].replaceAll(" ", '_').toLowerCase()}`
}