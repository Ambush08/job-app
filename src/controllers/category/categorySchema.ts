import z from 'zod';
import Category from '../../models/category.model.js';
import { name } from 'nodemailer/lib/package-info.js';


export const createCategorySchema = z.object({
    name: z.string().trim()
});


export const updateCategorySchema = z.object({
    name: z.string().trim()
})