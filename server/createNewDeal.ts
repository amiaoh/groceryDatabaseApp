"use server";

import prisma from "@/lib/prisma";

export async function createNewDeal(
  item: string,
  pricePerUnit: number,
  unitType: string,
  dateObserved: Date,
  storeID: string
) {
  await prisma.deal.create({
    data: {
      item,
      pricePerUnit,
      unitType,
      dateObserved,
      storeID,
    },
  });
}
