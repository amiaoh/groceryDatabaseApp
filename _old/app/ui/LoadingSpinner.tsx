import { ReactElement, ReactNode, useState } from "react";
import { loadingRed } from "./colourLibrary";
import styled, { keyframes } from "styled-components";
import { Size } from "../types";

export function LoadingSpinner(props: { size: Size }): ReactElement {
  const { size } = props;
  return (
    <StyledDiv
      style={{
        height: size === "large" ? 48 : 24,
        width: size === "large" ? 48 : 24,
      }}
    />
  );
}

const spin = keyframes` 
0% {
  rotate: 0deg;
}
100% {
  rotate: 360deg;
}
`;

const StyledDiv = styled.div`
  animation: 1s linear infinite ${spin};
  border-radius: 50px;
  border: ${loadingRed};
  border-style: dashed;
  height: 20px;
  width: 20px;
`;
