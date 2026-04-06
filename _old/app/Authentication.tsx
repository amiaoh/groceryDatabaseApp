import { ReactElement, useState } from "react";
import { Wrapper } from "./ui/Wrapper";
import { Login } from "./Login";
import { CreateAccount } from "./CreateAccount";

enum PageDisplay {
  Login,
  AccountCreation,
}

export function Authentication(props: {
  onLoginSuccess: () => void;
}): ReactElement {
  const [displayPage, setdisplayPage] = useState(PageDisplay.Login);
  const [displayAccountCreatedMessage, setDisplayAccountCreatedMessage] =
    useState(false);
  const { onLoginSuccess } = props;
  return (
    <Wrapper>
      {displayPage === PageDisplay.Login && (
        <Login
          onLoginSuccess={() => {
            onLoginSuccess();
            setDisplayAccountCreatedMessage(false);
          }}
          onAccountCreationClick={() => {
            setdisplayPage(PageDisplay.AccountCreation);
            setDisplayAccountCreatedMessage(false);
          }}
          displayAccountCreatedMessage={
            displayAccountCreatedMessage ? "Account created" : null
          }
        />
      )}
      {displayPage === PageDisplay.AccountCreation && (
        <CreateAccount
          onGoBackClick={() => {
            setdisplayPage(PageDisplay.Login);
          }}
          onSubmitSuccess={() => {
            setdisplayPage(PageDisplay.Login);
            setDisplayAccountCreatedMessage(true);
          }}
        />
      )}
    </Wrapper>
  );
}
