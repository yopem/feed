import { createTRPCRouter, protectedProcedure } from "@/lib/api/trpc"

export const userRouter = createTRPCRouter({
  getCurrentUser: protectedProcedure.query(({ ctx }) => {
    return {
      id: ctx.session.id,
      email: ctx.session.email,
      name: ctx.session.name,
      username: ctx.session.username,
      image: ctx.session.image,
      role: ctx.session.role,
    }
  }),
})
