import { ReactElement, useState } from "react";
import { Wrapper } from "./ui/Wrapper";
import { ViewStores } from "./ViewStores";
import { CreateStore } from "./CreateStore";

enum StoresPage {
  View,
  Create,
}

export function Stores(): ReactElement {
  const [storesPage, setStoresPage] = useState(StoresPage.View);

  return (
    <Wrapper>
      {storesPage === StoresPage.View && (
        <ViewStores
          onCreateClick={() => {
            setStoresPage(StoresPage.Create);
          }}
        />
      )}
      {storesPage === StoresPage.Create && (
        <CreateStore
          onCancelClick={() => {
            setStoresPage(StoresPage.View);
          }}
          onCreateStoreClick={() => {
            setStoresPage(StoresPage.View);
          }}
        />
      )}
    </Wrapper>
  );
}
