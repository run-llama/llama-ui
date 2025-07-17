import type {
  ExtractedData,
  TypedAgentData,
} from "@llamaindex/cloud/beta/agent";

export type ProcessingStatus =
  | "pending"
  | "pending_review"
  | "approved"
  | "rejected"
  | "completed";

export type InvoiceData = {
  invoice_number: string;
  total_amount: number;
  vendor_name: string;
  invoice_date: string;
  due_date: string;
  payment_terms: string;
  line_items: Array<{
    description: string;
    quantity: number;
    rate: number;
  }>;
};

export type ContractData = {
  contract_number: string;
  contract_value: number;
  start_date: string;
  end_date: string;
  renewal_terms: string;
  governing_law: string;
  signatory_company: string;
  signatory_individual: string;
};

export type GenericDocumentData = {
  document_title: string;
  processed_date: string;
};

export type DocumentData = InvoiceData | ContractData | GenericDocumentData;

// Mock item data by ID
const mockItemData: Record<
  string,
  TypedAgentData<ExtractedData<InvoiceData | ContractData>>
> = {
  "invoice-001": {
    id: "invoice-001",
    agentUrlId: "extraction-agent",
    collection: "mock-collection",
    data: {
      file_name: "acme-corp-invoice-2024-001.pdf",
      file_hash: "hash_invoice_001_1736789234567",
      file_id: "invoice-001",
      status: "pending_review",
      metadata: {
        document_type: "invoice",
        source_system: "email",
        vendor_category: "professional_services",
        overall_confidence: 0.89,
      },
      data: {
        invoice_number: "INV-2024-001",
        total_amount: 1250.5,
        vendor_name: "Acme Corp",
        invoice_date: "2024-01-15",
        due_date: "2024-02-15",
        payment_terms: "Net 30",
        line_items: [
          { description: "Professional Services", quantity: 10, rate: 125.05 },
        ],
      },
      original_data: {
        invoice_number: "Original INV-2024-001",
        total_amount: 1000.0,
        vendor_name: "Original Acme Corp",
        invoice_date: "1900-01-01",
        due_date: "1900-01-01",
        payment_terms: "Original Net 30",
        line_items: [],
      },
      confidence: {
        invoice_number: 0.98,
        total_amount: 0.95,
        vendor_name: 0.92,
        invoice_date: 0.89,
        due_date: 0.87,
        payment_terms: 0.93,
        line_items: 0.85,
      },
    },
    createdAt: new Date("2024-01-15T10:30:00Z"),
    updatedAt: new Date("2024-01-15T14:22:00Z"),
  },
  "contract-002": {
    id: "contract-002",
    agentUrlId: "extraction-agent",
    collection: "mock-collection",
    data: {
      file_name: "tech-solutions-contract-2024.pdf",
      file_hash: "hash_contract_002_1736789234568",
      file_id: "contract-002",
      status: "approved",
      metadata: {
        document_type: "contract",
        source_system: "docusign",
        contract_type: "service_agreement",
        overall_confidence: 0.94,
      },
      data: {
        contract_number: "CNT-2024-TECH-001",
        contract_value: 50000,
        start_date: "2024-03-01",
        end_date: "2025-02-28",
        renewal_terms: "Auto-renewal with 30 days notice",
        governing_law: "State of California",
        signatory_company: "Tech Solutions Inc",
        signatory_individual: "Jane Smith, CEO",
      },
      original_data: {
        contract_number: "Original CNT-2024-TECH-001",
        contract_value: 45000,
        start_date: "1900-01-01",
        end_date: "1900-01-01",
        renewal_terms: "Original Auto-renewal",
        governing_law: "Original State of California",
        signatory_company: "Original Tech Solutions Inc",
        signatory_individual: "Original Jane Smith, CEO",
      },
      confidence: {
        contract_number: 0.96,
        contract_value: 0.94,
        start_date: 0.98,
        end_date: 0.97,
        renewal_terms: 0.89,
        governing_law: 0.92,
        signatory_company: 0.95,
        signatory_individual: 0.88,
      },
    },
    createdAt: new Date("2024-02-28T09:15:00Z"),
    updatedAt: new Date("2024-03-01T11:45:00Z"),
  },
};

// Default fallback item
const defaultMockItem = (
  itemId: string,
): TypedAgentData<ExtractedData<GenericDocumentData>> => ({
  id: itemId,
  agentUrlId: "extraction-agent",
  collection: "mock-collection",
  data: {
    file_name: `document-${itemId}.pdf`,
    file_hash: `hash_${itemId}_${Date.now()}`,
    file_id: itemId,
    status: "pending",
    metadata: {
      document_type: "unknown",
      source_system: "upload",
    },
    data: {
      document_title: `Sample Document ${itemId}`,
      processed_date: new Date().toISOString().split("T")[0],
    },
    original_data: {
      document_title: `Original Sample Document ${itemId}`,
      processed_date: "1900-01-01",
    },
    confidence: {
      document_title: 0.82,
      processed_date: 0.95,
    },
  },
  createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
  updatedAt: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000),
});

export const getMockItemResponse = (
  itemId: string,
): TypedAgentData<ExtractedData<DocumentData>> => {
  // First try to find by string key (for backward compatibility)
  if (mockItemData[itemId]) {
    return mockItemData[itemId];
  }

  // Then try to find by numeric ID
  const numericId = parseInt(itemId);
  if (!isNaN(numericId)) {
    const itemByNumericId = Object.values(mockItemData).find(
      (item) => item.id === itemId,
    );
    if (itemByNumericId) {
      return itemByNumericId;
    }
  }

  return defaultMockItem(itemId);
};
