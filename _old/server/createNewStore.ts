"use server";

import prisma from "@/lib/prisma";

export async function createNewStore(
  newDisplayName: string,
  newFullName: string,
  newSuburb: string
) {
  await prisma.store.create({
    data: {
      displayName: newDisplayName,
      fullName: newFullName,
      suburb: newSuburb,
    },
  });
}
