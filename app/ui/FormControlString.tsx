import { ReactElement } from "react";
import { Form, FormControlProps } from "react-bootstrap";
import { greyButtonBackground } from "./colourLibrary";

export function FormControlString(
  props: Omit<FormControlProps, "onChange"> & {
    onChange: (newInput: string) => void;
  }
): ReactElement {
  const { onChange, ...otherProps } = props;
  return (
    <Form.Control
      {...otherProps}
      onChange={(e) => {
        onChange(e.target.value);
      }}
      style={{
        width: 160,
        height: 32,
        background: greyButtonBackground,
        borderRadius: 12,
        padding: 5,
      }}
    ></Form.Control>
  );
}
