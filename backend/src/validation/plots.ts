import { z } from "zod";

export const plotsQuerySchema = z.object({
  phaseIds: z
    .string()
    .optional()
    .transform((v) => (v ? v.split(",").filter(Boolean) : undefined)),
  types: z
    .string()
    .optional()
    .transform((v) => {
      if (!v) return undefined;
      return v
        .split(",")
        .filter((t): t is "residential" | "commercial" =>
          t === "residential" || t === "commercial",
        );
    }),
  minPrice: z.coerce.number().nonnegative().optional(),
  maxPrice: z.coerce.number().nonnegative().optional(),
  statuses: z
    .string()
    .optional()
    .transform((v) => (v ? v.split(",").filter(Boolean) : undefined)),
  bbox: z
    .string()
    .optional()
    .transform((v) => {
      if (!v) return undefined;
      const parts = v.split(",").map(Number);
      if (parts.length !== 4 || parts.some((n) => Number.isNaN(n))) {
        return undefined;
      }
      return parts as [number, number, number, number];
    }),
  limit: z.coerce.number().int().min(1).max(500).optional().default(300),
});

export type PlotsQuery = z.infer<typeof plotsQuerySchema>;
