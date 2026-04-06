import { ReactElement, useEffect, useState } from "react";
import { Wrapper } from "./ui/Wrapper";
import { styled } from "styled-components";
import { Deal, DealWithStore } from "./types";
import {
  darkGrey,
  black,
  skyBlue,
  greyInactiveButton,
} from "./ui/colourLibrary";
import { getDeals } from "@/server/getDeals";
import { LoadingSpinner } from "./ui/LoadingSpinner";
import { LargeButton } from "./ui/LargeButton";

export function ViewDeals(props: { onCreateClick: () => void }): ReactElement {
  const { onCreateClick } = props;
  const [dealList, setDealList] = useState<DealWithStore[] | undefined>(
    undefined
  );
  const [dealBeingUpdated, setDealBeingUpdated] = useState<Deal | undefined>(
    undefined
  );
  useEffect(() => {
    const fetchData = async () => {
      const result = await getDeals();
      setDealList(result);
    };
    fetchData();
  }, []);

  const createDealButton = (
    <LargeButton onClick={onCreateClick} backgroundColor={greyInactiveButton}>
      Create
    </LargeButton>
  );

  if (dealList === undefined) {
    return (
      <Wrapper>
        {" "}
        <LoadingSpinner size="large"></LoadingSpinner>
        {createDealButton}
      </Wrapper>
    );
  }

  const displayedDeals = dealList.map((deal) => {
    return (
      <div
        key={deal.item}
        style={{
          display: "flex",
          backgroundColor: skyBlue,
          borderBottom: "2px",
          borderColor: black,
          width: "100%",
          justifyContent: "space-between",
          height: "49px",
          alignItems: "center",
        }}
      >
        <div>
          <Cell style={{ color: black }}>{deal.item}</Cell>
          <div>
            <div style={{ display: "flex" }}>
              <Cell style={{ color: black }}>
                {`$${deal.pricePerUnit.toFixed(2)}/${deal.unitType}`}
              </Cell>
              <Cell style={{ color: darkGrey }}>
                {"· " + deal.dateObserved.toLocaleDateString()}
              </Cell>
            </div>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "row" }}>
          <Cell style={{ color: black }}>{deal.store.displayName}</Cell>
          <Cell style={{ color: darkGrey }}>{deal.store.suburb}</Cell>
        </div>
      </div>
    );
  });
  return (
    <Wrapper>
      {displayedDeals}
      {createDealButton}
    </Wrapper>
  );
}

const Cell = styled.div`
  font-size: 16px;
  border-width: 0px;
  border-style: solid;
  padding: 2px;
`;
