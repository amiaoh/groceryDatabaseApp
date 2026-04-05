"use server";

import prisma from "@/lib/prisma";
import { Store } from "@prisma/client";

export async function updateStore(
  store: Store,
  newDisplayName: string,
  newFullName: string,
  newSuburb: string
) {
  await prisma.store.update({
    where: {
      id: store.id,
    },
    data: {
      displayName: newDisplayName,
      fullName: newFullName,
      suburb: newSuburb,
    },
  });
}
