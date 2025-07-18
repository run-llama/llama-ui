import { Filter } from "lucide-react";
import { Button } from "./button";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./dropdown-menu";

export interface ColumnFilterProps {
  options: string[];
  selectedValues: string[];
  onFilterChange: (values: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export const ColumnFilter: React.FC<ColumnFilterProps> = ({
  options,
  selectedValues,
  onFilterChange,
}) => {
  const handleToggleOption = (option: string, checked: boolean) => {
    const newValues = checked
      ? [...selectedValues, option]
      : selectedValues.filter((value) => value !== option);

    onFilterChange(newValues);
  };

  const handleClearAll = () => {
    onFilterChange([]);
  };

  if (options.length === 0) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "h-6 w-6 p-0",
            selectedValues.length > 0
              ? "text-primary"
              : "text-muted-foreground",
          )}
        >
          <Filter className="h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-48">
        {options.map((option) => (
          <DropdownMenuCheckboxItem
            key={option}
            checked={selectedValues.includes(option)}
            onCheckedChange={(checked) => handleToggleOption(option, checked)}
          >
            {option}
          </DropdownMenuCheckboxItem>
        ))}
        {selectedValues.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleClearAll}>
              Clear filters
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
