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
      item: item,
      pricePerUnit: pricePerUnit,
      unitType: unitType,
      dateObserved: dateObserved,
      storeID: storeID,
    },
  });
}
