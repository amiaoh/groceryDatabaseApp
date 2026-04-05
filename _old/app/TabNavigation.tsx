import { ReactElement, useState } from "react";
import { Wrapper } from "./ui/Wrapper";
import { Deals } from "./Deals";
import { redActiveButton, greyInactiveButton, black } from "./ui/colourLibrary";
import { LargeButton } from "./ui/LargeButton";
import { Stores } from "./Stores";

enum TabDisplay {
  Deals,
  Stores,
}

export function TabNavigation(): ReactElement {
  const [displayTab, setdisplayTab] = useState(TabDisplay.Deals);

  return (
    <Wrapper>
      <div
        style={{
          display: "flex",
          backgroundColor: black,
          alignSelf: "stretch",
          justifyContent: "center",
        }}
      >
        <LargeButton
          width={150}
          backgroundColor={
            displayTab === TabDisplay.Deals
              ? redActiveButton
              : greyInactiveButton
          }
          onClick={() => {
            setdisplayTab(TabDisplay.Deals);
          }}
        >
          Deals
        </LargeButton>
        <LargeButton
          width={150}
          backgroundColor={
            displayTab === TabDisplay.Stores
              ? redActiveButton
              : greyInactiveButton
          }
          onClick={() => {
            setdisplayTab(TabDisplay.Stores);
          }}
        >
          Stores
        </LargeButton>
      </div>
      {displayTab === TabDisplay.Deals && <Deals />}
      {displayTab === TabDisplay.Stores && <Stores />}
    </Wrapper>
  );
}
