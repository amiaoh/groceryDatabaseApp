"use server";

import prisma from "@/lib/prisma";

export async function credentialsAreValid(
  inputUsername: string,
  inputPassword: string
) {
  const result = await prisma.user.findFirst({
    where: { password: inputPassword, username: inputUsername },
  });
  return result !== null;
}
