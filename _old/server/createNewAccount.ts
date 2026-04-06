"use server";

import prisma from "@/lib/prisma";

export async function createNewAccount(
  newUsername: string,
  newPassword: string
) {
  await prisma.user.create({
    data: { username: newUsername, password: newPassword },
  });
}

