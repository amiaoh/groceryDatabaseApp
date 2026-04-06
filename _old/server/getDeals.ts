"use server";

import { Deal, DealWithStore } from "@/app/types";
import prisma from "@/lib/prisma";

export async function getDeals(): Promise<DealWithStore[]> {
  const results = await prisma.deal.findMany({
    include: { store: true },
  });
  const filteredResults = results.filter(hasValidUnit);
  return filteredResults;
}

function hasValidUnit(
  dealWithUnknownUnit: {
    store: {
      id: string;
      displayName: string;
      fullName: string;
      suburb: string;
    };
  } & {
    id: string;
    item: string;
    pricePerUnit: number;
    unitType: string;
    dateObserved: Date;
    storeID: string;
  }
): dealWithUnknownUnit is DealWithStore {
  return (
    dealWithUnknownUnit.unitType === "kg" ||
    dealWithUnknownUnit.unitType === "L" ||
    dealWithUnknownUnit.unitType === "unit"
  );
}
