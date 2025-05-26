import {z} from "zod";

export const registerSchema = z.object({
    name: z.string().min(2),
    url: z.string().url(),
    user_id: z.string(),
    token: z.string()
})