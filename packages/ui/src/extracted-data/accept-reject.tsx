import { Button } from "@/base/button";
import { toast } from "sonner";
import { type ItemHookData } from "./use-item-data";
import type { JsonShape } from "./types";

export function AcceptReject<T extends JsonShape<T>>({
  itemData,
  onComplete,
}: {
  itemData: ItemHookData<T>;
  onComplete?: () => void;
}) {
  const handleSave = (status: "approved" | "rejected") => {
    itemData
      .save(status)
      .then(() => {
        toast.success("Item " + status);
        onComplete?.();
      })
      .catch((error) => {
        // eslint-disable-next-line no-console
        console.error("Error updating item to " + status, error);
        toast.error("Error updating item to " + status);
      });
  };

  return (
    <div className="flex gap-2 justify-center">
      <div className="text-destructive">
        <Button
          onClick={() => handleSave("rejected")}
          variant="outline"
          size="sm"
          label="Reject File"
        />
      </div>
      <div className="text-success">
        <Button
          onClick={() => handleSave("approved")}
          variant="outline"
          size="sm"
          label="Approve File"
        />
      </div>
    </div>
  );
}
