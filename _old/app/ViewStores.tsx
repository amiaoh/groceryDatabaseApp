import { ReactElement, useEffect, useState } from "react";
import { Wrapper } from "./ui/Wrapper";
import { styled } from "styled-components";
import { Store } from "./types";
import {
  darkGrey,
  black,
  greyInactiveButton,
  skyBlue,
} from "./ui/colourLibrary";
import { LargeButton } from "./ui/LargeButton";
import { getStores } from "@/server/getStores";
import { UpdateStore } from "./UpdateStore";
import { LoadingSpinner } from "./ui/LoadingSpinner";

export function ViewStores(props: { onCreateClick: () => void }): ReactElement {
  const { onCreateClick } = props;
  const [storeList, setStoreList] = useState<Store[] | undefined>(undefined);
  const [storeBeingUpdated, setStoreBeingUpdated] = useState<
    Store | undefined
  >();
  useEffect(() => {
    const fetchData = async () => {
      const result = await getStores();
      setStoreList(result);
    };
    fetchData();
  }, []);

  if (storeBeingUpdated !== undefined) {
    return (
      <Wrapper>
        <UpdateStore
          onBackClick={() => {
            setStoreBeingUpdated(undefined);
          }}
          onUpdateStoreSuccess={async () => {
            const result = await getStores();
            setStoreList(result);
            setStoreBeingUpdated(undefined);
          }}
          store={storeBeingUpdated}
        ></UpdateStore>
      </Wrapper>
    );
  }
  const createStoreButton = (
    <LargeButton onClick={onCreateClick} backgroundColor={greyInactiveButton}>
      Create
    </LargeButton>
  );

  if (storeList === undefined) {
    return (
      <Wrapper>
        <LoadingSpinner size="large"></LoadingSpinner>
        {createStoreButton}
      </Wrapper>
    );
  }
  const displayedStores = storeList.map((store) => {
    return (
      <div
        onClick={() => {
          setStoreBeingUpdated(store);
        }}
        key={store.displayName}
        style={{
          display: "flex",
          backgroundColor: skyBlue,
          borderBottom: "2px",
          width: "100%",
          justifyContent: "space-between",
          height: "49px",
          alignItems: "center",
        }}
      >
        <Cell style={{ color: black }}>{store.displayName}</Cell>
        <Cell style={{ color: darkGrey }}>{store.suburb}</Cell>
      </div>
    );
  });
  return (
    <Wrapper>
      {displayedStores}
      {createStoreButton}
    </Wrapper>
  );
}

const Cell = styled.div`
  font-size: 20px;
  border-width: 0px;
  border-style: solid;
  padding: 5px;
`;
