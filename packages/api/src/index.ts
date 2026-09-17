import { ORPCError, os } from "@orpc/server";
import type { Context } from "./context";

export const o = os.$context<Context>();

export const publicProcedure = o;

const requireAuth = o.middleware(async ({ context, next }) => {
  if (context.session?.user == null) {
    throw new ORPCError("UNAUTHORIZED");
  }
  return await next({
    context: {
      session: context.session,
    },
  });
});

export const protectedProcedure = publicProcedure.use(requireAuth);

/** Throw NOT_FOUND unless the book exists and belongs to the signed-in user. */
export async function assertBookOwnership({
  db,
  bookId,
  userId,
}: {
  db: Context["db"];
  bookId: string;
  userId: string;
}): Promise<void> {
  const book = await db.book.findFirst({ where: { id: bookId, userId }, select: { id: true } });
  if (book == null) {
    throw new ORPCError("NOT_FOUND", { message: "Book not found" });
  }
}
