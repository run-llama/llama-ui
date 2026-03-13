import * as React from "react";

export const ThemeComparison = ({
  children,
}: {
  children: React.ReactNode;
}) => (
  <div className="flex gap-4">
    <div className="flex-1 rounded-lg border bg-background p-6">
      <p className="mb-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        Light
      </p>
      {children}
    </div>
    <div className="dark flex-1 rounded-lg border bg-background p-6">
      <p className="mb-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        Dark
      </p>
      {children}
    </div>
  </div>
);
