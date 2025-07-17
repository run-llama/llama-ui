import type {
  ExtractedData,
  TypedAgentData,
  TypedAgentDataItems,
} from "@llamaindex/cloud/beta/agent";
import type {
  InvoiceData,
  ContractData,
} from "../../extracted-data/mock-item-response";

const items: TypedAgentData<
  ExtractedData<{ invoice_number?: string; total_amount?: number }>
>[] = Array.from({ length: 5 }, (_, i) => {
  const index = i + 1;
  const statuses = ["pending_review", "approved", "rejected"];
  const status = statuses[index % 3];
  return {
    id: `item-${index}`,
    agentUrlId: "test-app-id",
    collection: "mock-collection",
    data: {
      file_id: `file-${index}`,
      file_hash: `hash-${index}`,
      file_name: `document-${index}.pdf`,
      status,
      metadata: {},
      data: {
        invoice_number: `INV-2023-00${index}`,
        total_amount: index * 100,
      },
      original_data: {},
      confidence: {} as Partial<
        Record<keyof (InvoiceData | ContractData), number>
      >,
    },
    createdAt: new Date(2023, 0, index),
    updatedAt: new Date(2023, 1, index),
  };
});

export const mockResponse: TypedAgentDataItems<ExtractedData> = {
  items,
  totalSize: items.length,
};
