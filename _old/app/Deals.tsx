import { ReactElement, useState } from "react";
import { Wrapper } from "./ui/Wrapper";
import { ViewDeals } from "./ViewDeals";
import { CreateDeal } from "./CreateDeal";

enum DealsPage {
  View,
  Create,
}

export function Deals(): ReactElement {
  const [dealsPage, setDealsPage] = useState(DealsPage.View);

  return (
    <Wrapper>
      {dealsPage === DealsPage.View && (
        <ViewDeals
          onCreateClick={() => {
            setDealsPage(DealsPage.Create);
          }}
        />
      )}
      {dealsPage === DealsPage.Create && (
        <CreateDeal
          onCreateDealSuccess={() => {
            setDealsPage(DealsPage.View);
          }}
          onCancelClick={() => {
            setDealsPage(DealsPage.View);
          }}
        />
      )}
    </Wrapper>
  );
}
