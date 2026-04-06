"use server";

import prisma from "@/lib/prisma";

export async function getStores() {
  const result = await prisma.store.findMany();
  return result;
}
