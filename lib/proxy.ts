import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import { NextRequest } from "next/server";

type Role = "admin" | "judge" | "team";

type Handler = (req: NextRequest, context: any) => Promise<Response>;

export function proxy(handler: Handler, allowedRoles: Role[]) {
    return async (req: NextRequest, context: any) => {
        try {
            const session = await getServerSession(authOptions);

            if (!session || !session.user || !session.user.email) {
                return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
            }

            const userRole = session.user.role as Role;

            if (!userRole || !allowedRoles.includes(userRole)) {
                return NextResponse.json({ error: "Forbidden" }, { status: 403 });
            }

            return handler(req, context);
        } catch (error) {
            console.error("Auth Wrapper Error:", error);
            return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
        }
    };
}
