import { ReactElement, useEffect, useState } from "react";
import { Wrapper } from "./ui/Wrapper";
import { greenActiveButton, greyInactiveButton } from "./ui/colourLibrary";
import { LargeButton } from "./ui/LargeButton";
import { StyledForm } from "./ui/StyledForm";
import { PageHeader } from "./ui/PageHeader";
import { FormLabel } from "./ui/FormLabel";
import { FormGroup } from "./ui/FormGroup";
import { FormControlString } from "./ui/FormControlString";
import { InputGroup } from "react-bootstrap";
import { FormControlNumber } from "./ui/FormControlNumber";
import { FormCheckRadio } from "./ui/FormCheckRadio";
import { Store, Unit } from "./types";
import { getStores } from "@/server/getStores";
import { createNewDeal } from "@/server/createNewDeal";
import { itemAlreadyExists } from "@/server/itemAlreadyExists";

const units: Unit[] = ["kg", "L", "unit"];

export function CreateDeal(props: {
  onCreateDealSuccess: () => void;
  onCancelClick: () => void;
}): ReactElement {
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [itemName, setItemName] = useState<string>("");
  const [pricePerUnit, setPricePerUnit] = useState<string>("0");
  const [selectedUnit, setSelectedUnit] = useState<Unit | undefined>(undefined);
  const [selectedDate, setSelectedDate] = useState<string | undefined>(
    undefined
  );
  const [selectedStoreId, setSelectedStoreId] = useState<
    Store["id"] | undefined
  >(undefined);
  const [awaitingCreateDealCheck, setAwaitingCreateDealCheck] = useState(false);
  const { onCancelClick, onCreateDealSuccess: onCreateDealSuccess } = props;
  const [stores, setStores] = useState<Store[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const result = await getStores();
      setStores(result);
    };
    fetchData();
  }, []);

  return (
    <Wrapper>
      <PageHeader> Create Deal</PageHeader>
      <div style={{ display: "flex" }}>
        <StyledForm>
          <FormGroup>
            <FormLabel>Item</FormLabel>
            <FormControlString
              type="text"
              placeholder="enter item name"
              value={itemName}
              onChange={setItemName}
            />
          </FormGroup>
          <div
            id="priceAndUnit"
            style={{
              display: "flex",
              flexDirection: "row",
            }}
          >
            <FormGroup>
              <FormLabel>Price per unit</FormLabel>
              <div
                style={{
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                }}
              >
                <InputGroup.Text>$</InputGroup.Text>
                <FormControlNumber
                  type="text"
                  placeholder="enter price"
                  value={pricePerUnit}
                  onChange={setPricePerUnit}
                  width={60}
                />
              </div>
            </FormGroup>
            <FormGroup>
              <FormLabel>Unit</FormLabel>
              {units.map((unit: Unit) => {
                return (
                  <FormCheckRadio
                    key={unit}
                    onClick={() => {
                      setSelectedUnit(unit);
                    }}
                    label={unit}
                    value={unit === selectedUnit}
                  />
                );
              })}
            </FormGroup>
            <FormGroup>
              <FormLabel>Date the deal observed</FormLabel>
              <input
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                }}
                style={{ padding: 5 }}
                type="date"
              ></input>
            </FormGroup>
          </div>
          <FormGroup>
            <FormLabel>Store</FormLabel>
            {stores.map((store: Store) => {
              return (
                <FormCheckRadio
                  key={store.id}
                  onClick={() => {
                    setSelectedStoreId(store.id);
                  }}
                  label={store.displayName}
                  value={selectedStoreId === store.id}
                />
              );
            })}
          </FormGroup>
        </StyledForm>
      </div>
      {errorMessage}

      <div style={{ display: "flex" }}>
        <LargeButton
          onClick={() => {
            onCancelClick();
          }}
          backgroundColor={greyInactiveButton}
          isDisabled={awaitingCreateDealCheck}
        >
          Cancel
        </LargeButton>
        <LargeButton
          isLoading={awaitingCreateDealCheck}
          onClick={async () => {
            if (itemName === "") {
              return setErrorMessage("Item name cannot be empty");
            }
            if (pricePerUnit === "0") {
              return setErrorMessage("Price cannot be $0");
            }
            if (selectedUnit === undefined) {
              return setErrorMessage("Must select a unit");
            }
            if (selectedStoreId === undefined) {
              return setErrorMessage("Must select a store");
            }
            if (selectedDate === undefined) {
              return setErrorMessage("Must select a date");
            }
            setErrorMessage("");
            setAwaitingCreateDealCheck(true);
            if (
              await itemAlreadyExists(
                itemName,
                Number(pricePerUnit),
                selectedStoreId
              )
            ) {
              setAwaitingCreateDealCheck(false);
              return setErrorMessage(
                "An item with the same details already exists"
              );
            }
            await createNewDeal(
              itemName,
              Number(pricePerUnit),
              selectedUnit,
              new Date(selectedDate),
              selectedStoreId
            );
            setAwaitingCreateDealCheck(false);
            onCreateDealSuccess();
          }}
          backgroundColor={greenActiveButton}
        >
          Create
        </LargeButton>
      </div>
    </Wrapper>
  );
}
