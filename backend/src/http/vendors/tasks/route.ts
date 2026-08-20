import { z } from "zod";
import { requireVendorRole } from "@backend/auth/session";
import { fail, fromService, ok } from "@backend/vendors/http-helpers";
import {
  createTask,
  listTasksForUser,
  updateTaskStatus,
} from "@backend/vendors/service";

const createSchema = z.object({
  project_id: z.string().min(1),
  title: z.string().min(2).max(200),
  assignee_member_id: z.string().optional().nullable(),
  due_at: z.string().optional().nullable(),
});

const patchSchema = z.object({
  task_id: z.string().min(1),
  status: z.enum(["todo", "in_progress", "done"]),
});

export async function GET() {
  try {
    const user = await requireVendorRole();
    return ok({ tasks: listTasksForUser(user) });
  } catch (error) {
    return fromService(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireVendorRole();
    const body = createSchema.parse(await request.json());
    const task = createTask(user, body);
    return ok({ task }, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return fail("VALIDATION_ERROR", "Invalid payload", 400, error.flatten());
    }
    return fromService(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await requireVendorRole();
    const body = patchSchema.parse(await request.json());
    const task = updateTaskStatus(user, body.task_id, body.status);
    return ok({ task });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return fail("VALIDATION_ERROR", "Invalid payload", 400, error.flatten());
    }
    return fromService(error);
  }
}
