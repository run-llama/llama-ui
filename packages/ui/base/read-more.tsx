"use client";

import * as React from "react";
import { cn } from "../lib/utils";
import type * as CollapsiblePrimitive from "@radix-ui/react-collapsible";
import { useState } from "react";
import { Button } from "./button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "./collapsible";

type CollapsibleProps = React.ComponentPropsWithoutRef<
  typeof CollapsiblePrimitive.Root
>;

const ReadMore = ({
  className,
  beforeText,
  afterText,
  ...props
}: CollapsibleProps & { beforeText: string; afterText: string }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className={cn(className, "w-[350px] space-y-2")}
      {...props}
    >
      <div>{beforeText}</div>
      <div>
        <CollapsibleTrigger asChild>
          <Button variant="link" size="sm" label="Read More" />
        </CollapsibleTrigger>
      </div>
      <CollapsibleContent className="space-y-2">
        <div>{afterText}</div>
      </CollapsibleContent>
    </Collapsible>
  );
};

export { ReadMore };
