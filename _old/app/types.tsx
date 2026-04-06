export type Store = {
  id: string;
  displayName: string;
  fullName: string;
  suburb: string;
};

export type Size = "large" | "small";

export type Unit = "kg" | "L" | "unit";

export type DealWithStore = Deal & { store: Store };

export type Deal = {
  id: string;
  item: string;
  pricePerUnit: number;
  unitType: Unit;
  dateObserved: Date;
  storeID: string;
};

