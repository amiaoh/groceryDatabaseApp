import { ReactElement, useState } from "react";
import { PageHeader } from "./ui/PageHeader";
import { FormGroup } from "./ui/FormGroup";
import { credentialsAreValid } from "@/server/credentialsAreValid";
import { Wrapper } from "./ui/Wrapper";
import { StyledForm } from "./ui/StyledForm";
import { FormLabel } from "./ui/FormLabel";
import { FormControlString } from "./ui/FormControlString";
import { LargeButton } from "./ui/LargeButton";
import { LoadingSpinner } from "./ui/LoadingSpinner";

export function Login(props: {
  onLoginSuccess: () => void;
  onAccountCreationClick: () => void;
  displayAccountCreatedMessage: string | null;
}): ReactElement {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [awaitingAuthentication, setAwaitingAuthentication] = useState(false);

  const {
    onLoginSuccess,
    onAccountCreationClick,
    displayAccountCreatedMessage,
  } = props;
  const [displayInvalidMessage, setDisplayInvalidMessage] = useState(false);

  return (
    <Wrapper>
      {displayInvalidMessage ? "Invalid login details" : null}
      {displayAccountCreatedMessage}
      <StyledForm>
        <PageHeader>Let&apos;s find some deals</PageHeader>

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
        onClick={async () => {
          setAwaitingAuthentication(true);
          if (await credentialsAreValid(username, password)) {
            onLoginSuccess();
          } else {
            setDisplayInvalidMessage(true);
            setAwaitingAuthentication(false);
          }
        }}
        isLoading={awaitingAuthentication}
      >
        Log in
      </LargeButton>
      <LargeButton
        onClick={onAccountCreationClick}
        isDisabled={awaitingAuthentication}
      >
        Create account
      </LargeButton>
    </Wrapper>
  );
}
