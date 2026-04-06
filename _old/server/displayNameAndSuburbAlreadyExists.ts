"use server";

import prisma from "@/lib/prisma";

export async function displayNameAndSuburbAlreadyExist(
  displayName: string,
  suburb: string
) {
  const result = await prisma.store.findFirst({
    where: { displayName: displayName, suburb: suburb },
  });
  return result !== null;
}
