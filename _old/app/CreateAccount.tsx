import { ReactElement, useState } from "react";
import { PageHeader } from "./ui/PageHeader";
import { FormGroup } from "./ui/FormGroup";
import { Wrapper } from "./ui/Wrapper";
import { StyledForm } from "./ui/StyledForm";
import { FormLabel } from "./ui/FormLabel";
import { FormControlString } from "./ui/FormControlString";
import { usernameAlreadyExists } from "@/server/usernameAlreadyExists";
import { LargeButton } from "./ui/LargeButton";
import { createNewAccount } from "@/server/createNewAccount";

export function CreateAccount(props: {
  onGoBackClick: () => void;
  onSubmitSuccess: () => void;
}): ReactElement {
  const { onGoBackClick, onSubmitSuccess } = props;
  const [errorMessage, setErrorMessage] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [awaitingCreateAccountCheck, setAwaitingCreateAccountCheck] =
    useState(false);

  return (
    <Wrapper>
      {errorMessage}
      <StyledForm>
        <PageHeader>Create your account</PageHeader>

        <FormGroup>
          <FormLabel>Username</FormLabel>
          <FormControlString
            type="text"
            placeholder="enter your username"
            value={username}
            onChange={setUsername}
          />
        </FormGroup>

        <FormGroup>
          <FormLabel>Password</FormLabel>

          <FormControlString
            type="password"
            placeholder="enter your password"
            value={password}
            onChange={setPassword}
          />
        </FormGroup>
      </StyledForm>
      <LargeButton
        isLoading={awaitingCreateAccountCheck}
        onClick={async () => {
          if (username === "") {
            return setErrorMessage("Username cannot be empty");
          }
          if (password === "") {
            return setErrorMessage("Password cannot be empty");
          }
          setAwaitingCreateAccountCheck(true);
          if (await usernameAlreadyExists(username)) {
            setAwaitingCreateAccountCheck(false);
            return setErrorMessage("Username already exists");
          }
          setErrorMessage("");
          createNewAccount(username, password);
          onSubmitSuccess();
          setAwaitingCreateAccountCheck(false);
        }}
      >
        Submit
      </LargeButton>
      <LargeButton
        onClick={onGoBackClick}
        isDisabled={awaitingCreateAccountCheck}
      >
        Go back
      </LargeButton>
    </Wrapper>
  );
}
