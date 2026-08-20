import { z } from "zod";
import { requireSessionUser } from "@backend/auth/session";
import { fail, fromService, ok } from "@backend/vendors/http-helpers";
import {
  addProjectMaterialLog,
  listProjectMaterials,
} from "@backend/vendors/service";

const createSchema = z.object({
  project_id: z.string().min(1),
  catalog_id: z.string().optional().nullable(),
  name: z.string().min(1),
  qty: z.number().positive(),
  unit: z.string().min(1),
  cost: z.number().min(0),
});

export async function GET(request: Request) {
  try {
    const user = await requireSessionUser();
    const projectId = new URL(request.url).searchParams.get("project_id");
    if (!projectId) return fail("VALIDATION_ERROR", "project_id required", 400);
    return ok({ logs: listProjectMaterials(user, projectId) });
  } catch (error) {
    return fromService(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireSessionUser();
    const body = createSchema.parse(await request.json());
    const log = addProjectMaterialLog(user, body);
    return ok({ log }, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return fail("VALIDATION_ERROR", "Invalid payload", 400, error.flatten());
    }
    return fromService(error);
  }
}
