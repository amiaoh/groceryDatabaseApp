import { ReactElement, useState } from "react";
import { Wrapper } from "./ui/Wrapper";
import { greenActiveButton, greyInactiveButton } from "./ui/colourLibrary";
import { LargeButton } from "./ui/LargeButton";
import { StyledForm } from "./ui/StyledForm";
import { PageHeader } from "./ui/PageHeader";
import { FormLabel } from "./ui/FormLabel";
import { FormGroup } from "./ui/FormGroup";
import { FormControlString } from "./ui/FormControlString";
import { createNewStore } from "@/server/createNewStore";
import { displayNameAndSuburbAlreadyExist } from "@/server/displayNameAndSuburbAlreadyExists";
import { fullNameAndSuburbAlreadyExist } from "@/server/fullNameAndSuburbAlreadyExist";

export function CreateStore(props: {
  onCreateStoreClick: () => void;
  onCancelClick: () => void;
}): ReactElement {
  const [errorMessage, setErrorMessage] = useState("");

  const [displayName, setDisplayName] = useState("");
  const [fullName, setFullName] = useState("");
  const [suburb, setSuburb] = useState("");
  const [fullNameHasBeenModified, setFullNameHasBeenModified] = useState(false);
  const [awaitingCreateStoreCheck, setAwaitingCreateStoreCheck] =
    useState(false);
  const { onCreateStoreClick, onCancelClick } = props;
  const setDisplayNameAndFullName = (displayName: string) => {
    setDisplayName(displayName);
    setFullName(displayName);
  };
  const setFullNameAndFullNameModified = (fullName: string) => {
    setFullNameHasBeenModified(true);
    setFullName(fullName);
  };
  return (
    <Wrapper>
      <PageHeader> Create Store</PageHeader>
      <div>
        <StyledForm>
          <FormGroup>
            <FormLabel>Display name</FormLabel>
            <FormControlString
              type="text"
              placeholder="enter display name of store"
              value={displayName}
              onChange={
                fullNameHasBeenModified
                  ? setDisplayName
                  : setDisplayNameAndFullName
              }
            />
          </FormGroup>

          <FormGroup>
            <FormLabel>Full name</FormLabel>

            <FormControlString
              type="text"
              placeholder="enter full name of store"
              value={fullName}
              onChange={setFullNameAndFullNameModified}
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

      <div style={{ display: "flex" }}>
        <LargeButton
          onClick={() => {
            onCancelClick();
            setFullNameHasBeenModified(false);
          }}
          backgroundColor={greyInactiveButton}
          isDisabled={awaitingCreateStoreCheck}
        >
          Cancel
        </LargeButton>
        <LargeButton
          isLoading={awaitingCreateStoreCheck}
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
            setAwaitingCreateStoreCheck(true);
            if (await displayNameAndSuburbAlreadyExist(displayName, suburb)) {
              setAwaitingCreateStoreCheck(false);
              return setErrorMessage(
                "Display name and suburb combination already exists"
              );
            }
            if (await fullNameAndSuburbAlreadyExist(fullName, suburb)) {
              setAwaitingCreateStoreCheck(false);
              return setErrorMessage(
                "Full name and suburb combination already exists"
              );
            }
            setErrorMessage("");
            onCreateStoreClick();
            createNewStore(displayName, fullName, suburb);
            setAwaitingCreateStoreCheck(false);
          }}
          backgroundColor={greenActiveButton}
        >
          Create
        </LargeButton>
      </div>
    </Wrapper>
  );
}
