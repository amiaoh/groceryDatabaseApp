import { ReactElement } from "react";
import { Form, FormControlProps } from "react-bootstrap";
import { greyButtonBackground } from "./colourLibrary";

export function FormControlNumber(
  props: Omit<FormControlProps, "onChange"> & {
    onChange: (newInput: string) => void;
    width?: number;
  }
): ReactElement {
  const { width, onChange, ...otherProps } = props;
  return (
    <Form.Control
      {...otherProps}
      onChange={(e) => {
        const value = e.target.value;
        const valueAsNumber = Number(value);

        if (isNaN(valueAsNumber)) {
          return;
        }
        onChange(value);
      }}
      style={{
        width: width !== undefined ? width : 160,
        height: 32,
        background: greyButtonBackground,
        borderRadius: 12,
        marginRight: 20,
        padding: 5,
      }}
    ></Form.Control>
  );
}
