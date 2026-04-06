import { ReactElement, useState } from "react";
import { Authentication } from "./Authentication";
import { styled } from "styled-components";
import { TabNavigation } from "./TabNavigation";

enum PageDisplay {
  Authentication,
  TabNavigation,
}

function App(): ReactElement {
  const [displayPage, setdisplayPage] = useState(PageDisplay.Authentication);
  return (
    <AppStyling>
      {displayPage === PageDisplay.Authentication && (
        <Authentication
          onLoginSuccess={() => {
            setdisplayPage(PageDisplay.TabNavigation);
          }}
        />
      )}
      {displayPage === PageDisplay.TabNavigation && <TabNavigation />}
    </AppStyling>
  );
}

export default App;

const AppStyling = styled.div`
  display: flex;
  flex: 1;
`;
