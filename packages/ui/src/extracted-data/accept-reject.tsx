import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { type ItemHookData } from "./use-item-data";

export function AcceptReject<T extends Record<string, unknown>>({
  itemData,
  onComplete,
}: {
  itemData: ItemHookData<T>;
  onComplete?: () => void;
}) {
  const handleSave = (status: "approved" | "rejected") => {
    itemData
      .save({ status })
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
      <Button
        onClick={() => handleSave("rejected")}
        variant="outline"
        size="sm"
        className="bg-red-100 hover:bg-red-200 text-red-700 border-red-200 cursor-pointer"
      >
        Reject File
      </Button>
      <Button
        onClick={() => handleSave("approved")}
        variant="outline"
        size="sm"
        className="bg-green-100 hover:bg-green-200 text-green-700 border-green-200 cursor-pointer"
      >
        Approve File
      </Button>
    </div>
  );
}
