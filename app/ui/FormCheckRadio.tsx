import { ReactElement } from "react";
import { Form } from "react-bootstrap";

export function FormCheckRadio(props: {
  onClick: () => void;
  label: string;
  value: boolean;
}): ReactElement {
  const { label, value, onClick } = props;
  return (
    <Form.Check type="radio" label={label} checked={value} onClick={onClick} />
  );
}
