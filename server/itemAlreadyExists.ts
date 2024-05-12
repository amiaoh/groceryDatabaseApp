"use server";

import prisma from "@/lib/prisma";

export async function itemAlreadyExists(
  item: string,
  pricePerUnit: number,
  storeID: string
): Promise<boolean> {
  const result = await prisma.deal.findFirst({
    where: { item, pricePerUnit, storeID },
  });
  return result !== null;
}
