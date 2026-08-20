import { z } from "zod";
import { requireSessionUser } from "@backend/auth/session";
import { fail, fromService, ok } from "@backend/vendors/http-helpers";
import { submitReview } from "@backend/vendors/service";

const schema = z.object({
  project_id: z.string().min(1),
  stars: z.number().int().min(1).max(5),
  remarks: z.string().min(3).max(1000),
});

export async function POST(request: Request) {
  try {
    const user = await requireSessionUser();
    const body = schema.parse(await request.json());
    const review = submitReview(user, body);
    return ok({ review }, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return fail("VALIDATION_ERROR", "Invalid payload", 400, error.flatten());
    }
    return fromService(error);
  }
}
