import { db } from "@/lib/prisma";
import { auth } from "@/auth";

export const getCurrentUser = async () => {
  try {
    const session = await auth();
    if (!session?.user?.email) return null;

    const user = await db.user.findUnique({
      where: {
        email: session.user.email as string,
      },
    });

    console.log(user);

    if (!user) {
      return null;
    }

    return user;
  } catch (error: any) {
    return null;
  }
};
