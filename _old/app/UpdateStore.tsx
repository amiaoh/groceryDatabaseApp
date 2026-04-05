import { ReactElement, useState } from "react";
import { Wrapper } from "./ui/Wrapper";
import { greenActiveButton, greyInactiveButton } from "./ui/colourLibrary";
import { LargeButton } from "./ui/LargeButton";
import { StyledForm } from "./ui/StyledForm";
import { PageHeader } from "./ui/PageHeader";
import { FormLabel } from "./ui/FormLabel";
import { FormGroup } from "./ui/FormGroup";
import { FormControlString } from "./ui/FormControlString";
import { Store } from "./types";
import { updateStore } from "@/server/updateStore";

export function UpdateStore(props: {
  onUpdateStoreSuccess: () => void;
  onBackClick: () => void;
  store: Store;
}): ReactElement {
  const [errorMessage, setErrorMessage] = useState("");
  const { onUpdateStoreSuccess, onBackClick, store } = props;
  const [displayName, setdisplayName] = useState(store.displayName);
  const [fullName, setFullName] = useState(store.fullName);
  const [suburb, setSuburb] = useState(store.suburb);
  const [awaitingUpdateStoreCheck, setAwaitingUpdateStoreCheck] =
    useState(false);
  return (
    <Wrapper>
      <PageHeader>{store.displayName}</PageHeader>
      <div>
        <StyledForm>
          <FormGroup>
            <FormLabel>Display name</FormLabel>
            <FormControlString
              type="text"
              placeholder="enter display name of store"
              value={displayName}
              onChange={setdisplayName}
            />
          </FormGroup>

          <FormGroup>
            <FormLabel>Full name</FormLabel>

            <FormControlString
              type="text"
              placeholder="enter full name of store"
              value={fullName}
              onChange={setFullName}
            />
          </FormGroup>
          <FormGroup>
            <FormLabel>Suburb</FormLabel>

            <FormControlString
              type="text"
              placeholder="enter suburb"
              value={suburb}
              onChange={setSuburb}
            />
          </FormGroup>
        </StyledForm>
      </div>
      {errorMessage}

      <div>
        <LargeButton
          onClick={onBackClick}
          backgroundColor={greyInactiveButton}
          isDisabled={awaitingUpdateStoreCheck}
        >
          Cancel
        </LargeButton>
        <LargeButton
          isLoading={awaitingUpdateStoreCheck}
          onClick={async () => {
            if (displayName === "") {
              return setErrorMessage("Display name cannot be empty");
            }
            if (fullName === "") {
              return setErrorMessage("Full name cannot be empty");
            }
            if (suburb === "") {
              return setErrorMessage("Suburb cannot be empty");
            }
            setAwaitingUpdateStoreCheck(true);
            await updateStore(store, displayName, fullName, suburb);
            onUpdateStoreSuccess();
            setAwaitingUpdateStoreCheck(false);
          }}
          backgroundColor={greenActiveButton}
        >
          Update
        </LargeButton>
      </div>
    </Wrapper>
  );
}
