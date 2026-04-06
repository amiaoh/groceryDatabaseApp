"use server";

import prisma from "@/lib/prisma";

export async function fullNameAndSuburbAlreadyExist(
  fullName: string,
  suburb: string
) {
  const result = await prisma.store.findFirst({
    where: { fullName: fullName, suburb: suburb },
  });
  return result !== null;
}
