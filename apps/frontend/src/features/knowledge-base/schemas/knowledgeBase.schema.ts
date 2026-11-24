import { z } from "zod";

export const knowledgeArticleSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, "Title must be at least 3 characters")
    .max(150, "Title must be less than 150 characters"),

  summary: z
    .string()
    .trim()
    .min(10, "Summary must be at least 10 characters")
    .max(300, "Summary must be less than 300 characters"),

  content: z
    .string()
    .trim()
    .min(30, "Content must be at least 30 characters"),

  category_id: z.string().uuid("Please select a valid category"),

  cover_image_url: z
    .string()
    .trim()
    .url("Please enter a valid image URL")
    .optional()
    .or(z.literal("")),

  tags: z.array(z.string().trim().min(1)).default([]),

  read_time_minutes: z
    .number()
    .int("Reading time must be a whole number")
    .min(1, "Reading time must be at least 1 minute")
    .max(120, "Reading time cannot exceed 120 minutes"),

  status: z.enum(["Draft", "Published"]),
});

export type KnowledgeArticleFormValues = z.infer<
  typeof knowledgeArticleSchema
>;