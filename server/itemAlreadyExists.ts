"use server";

import prisma from "@/lib/prisma";

export async function itemAlreadyExists(
  item: string,
  pricePerUnit: number,
  storeID: string
): Promise<boolean> {
  const result = await prisma.deal.findFirst({
    where: { item: item, pricePerUnit: pricePerUnit, storeID: storeID },
  });
  return result !== null;
}
