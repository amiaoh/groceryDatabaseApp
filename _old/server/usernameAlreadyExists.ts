"use server";

import prisma from "@/lib/prisma";

export async function usernameAlreadyExists(inputUsername: string) {
  const result = await prisma.user.findFirst({
    where: { username: inputUsername },
  });
  return result !== null;
}
