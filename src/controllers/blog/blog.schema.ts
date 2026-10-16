import z, { string } from 'zod';


export const createBlogSchema = z.object({
    title: z.string().trim().min(1, { message: "Title is required"}),
    snippet: z.string().trim().min(1, { message: "Snippet is required"}),
    body: z.string().trim().min(1, { message: "Body is required" }),
    category: z.enum(['tech','business','fashion','politics','engineering', 'sports']),
});


export const updateBlogSchema = z.object({
    title: z.string().trim().min(1, { message: "Title is required"}),
    snippet: z.string().trim().min(1, { message: "Snippet is required"}),
    body: z.string().trim().min(1, { message: "Body is required" }),
    category: z.enum(['tech','business','fashion','politics','engineering', 'sports']),
});