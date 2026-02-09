import * as React from "react";

import { MultiInput } from "../../base/multi-input";

// eslint-disable-next-line no-restricted-syntax
export default {
  title: "Base/MultiInput",
  component: MultiInput,
};

export const Default = () => <MultiInput placeholder="Enter something" />;

export const Empty = () => <MultiInput defaultValue="" />;
