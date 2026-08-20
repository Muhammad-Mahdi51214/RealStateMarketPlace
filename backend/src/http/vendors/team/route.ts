import { z } from "zod";
import { requireSessionUser, requireVendorRole } from "@backend/auth/session";
import { fail, fromService, ok } from "@backend/vendors/http-helpers";
import { addTeamMember, listTeam } from "@backend/vendors/service";

const addSchema = z.object({
  email: z.string().email(),
  full_name: z.string().min(2),
  phone: z.string().min(10),
  password: z.string().min(8),
  role: z.enum(["manager", "worker"]),
});

export async function GET() {
  try {
    const user = await requireVendorRole();
    return ok({ members: listTeam(user) });
  } catch (error) {
    return fromService(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireSessionUser();
    const body = addSchema.parse(await request.json());
    const member = addTeamMember(user, body);
    return ok({ member }, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return fail("VALIDATION_ERROR", "Invalid payload", 400, error.flatten());
    }
    return fromService(error);
  }
}
