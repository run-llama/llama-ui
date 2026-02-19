import React from "react";
type InputGroupProps = {
  label?: string;
  children: React.ReactNode;
};

export const InputGroup = (props: InputGroupProps) => {
  return <div className="flex flex-col space-y-2">{props.children}</div>;
};
