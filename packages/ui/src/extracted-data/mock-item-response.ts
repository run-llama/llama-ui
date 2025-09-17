import type {
  ExtractedData,
  TypedAgentData,
  StatusType,
} from "llama-cloud-services/beta/agent";

// Use the StatusType from llama-cloud-services instead
export type ProcessingStatus =
  | StatusType
  | "pending"
  | "approved"
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
    deploymentName: "extraction-agent",
    collection: "mock-collection",
    data: {
      file_name: "acme-corp-invoice-2024-001.pdf",
      file_hash: "hash_invoice_001_1736789234567",
      file_id: "invoice-001",
      status: "pending_review",
      overall_confidence: 0.89,
      metadata: {
        document_type: "invoice",
        source_system: "email",
        vendor_category: "professional_services",
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
      field_metadata: {
        invoice_number: {
          confidence: 0.98,
          reasoning: "Clear invoice number found in header section",
          citation: [
            {
              page_number: 1,
              matching_text: "INV-2024-001",
            },
          ],
        },
        total_amount: {
          confidence: 0.95,
          reasoning: "Total amount clearly identified in summary table",
          citation: [
            {
              page_number: 1,
              matching_text: "$1,250.50",
            },
            {
              page_number: 1,
              matching_text: "Total: $1,250.50",
            },
            {
              page_number: 1,
              matching_text: "Amount Due: $1,250.50",
            },
          ],
        },
        vendor_name: {
          confidence: 0.92,
          reasoning: "Company name found in header and billing address",
          citation: [
            {
              page_number: 1,
              matching_text: "Acme Corp",
            },
            {
              page_number: 1,
              matching_text: "Acme Corporation",
            },
            {
              page_number: 2,
              matching_text: "Bill to: Acme Corp",
            },
          ],
        },
        invoice_date: {
          confidence: 0.89,
          reasoning: "Date format matches standard invoice date pattern",
          citation: [
            {
              page_number: 1,
              matching_text: "January 15, 2024",
            },
          ],
        },
        due_date: {
          confidence: 0.87,
          reasoning: "Due date calculated from invoice date and payment terms",
          citation: [
            {
              page_number: 1,
              matching_text: "February 15, 2024",
            },
          ],
        },
        payment_terms: {
          confidence: 0.93,
          reasoning: "Standard payment terms clearly stated",
          citation: [
            {
              page_number: 1,
              matching_text: "Net 30 days",
            },
          ],
        },
        line_items: [
          {
            confidence: 0.85,
            reasoning: "Line items extracted from itemized table section",
            citation: [
              {
                page_number: 1,
                matching_text: "Professional Services - Qty: 10, Rate: $125.05",
              },
            ],
          },
        ],
      },
    },
    createdAt: new Date("2024-01-15T10:30:00Z"),
    updatedAt: new Date("2024-01-15T14:22:00Z"),
  },
  "contract-002": {
    id: "contract-002",
    deploymentName: "extraction-agent",
    collection: "mock-collection",
    data: {
      file_name: "tech-solutions-contract-2024.pdf",
      file_hash: "hash_contract_002_1736789234568",
      file_id: "contract-002",
      status: "accepted",
      overall_confidence: 0.94,
      metadata: {
        document_type: "contract",
        source_system: "docusign",
        contract_type: "service_agreement",
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
      field_metadata: {
        contract_number: {
          confidence: 0.96,
          reasoning: "Contract number clearly identified in document header",
          citation: [
            {
              page_number: 1,
              matching_text: "CNT-2024-TECH-001",
            },
          ],
        },
        contract_value: {
          confidence: 0.94,
          reasoning: "Total contract value found in financial terms section",
          citation: [
            {
              page_number: 2,
              matching_text: "$50,000.00",
            },
          ],
        },
        start_date: {
          confidence: 0.98,
          reasoning: "Contract commencement date clearly stated",
          citation: [
            {
              page_number: 1,
              matching_text: "March 1, 2024",
            },
          ],
        },
        end_date: {
          confidence: 0.97,
          reasoning: "Contract expiration date specified in term section",
          citation: [
            {
              page_number: 1,
              matching_text: "February 28, 2025",
            },
          ],
        },
        renewal_terms: {
          confidence: 0.89,
          reasoning: "Renewal clause found in contract terms section",
          citation: [
            {
              page_number: 3,
              matching_text:
                "This agreement shall auto-renew unless terminated with 30 days written notice",
            },
          ],
        },
        governing_law: {
          confidence: 0.92,
          reasoning: "Governing law clause clearly specified",
          citation: [
            {
              page_number: 4,
              matching_text:
                "This agreement shall be governed by the laws of the State of California",
            },
          ],
        },
        signatory_company: {
          confidence: 0.95,
          reasoning: "Company name found in signature block",
          citation: [
            {
              page_number: 4,
              matching_text: "Tech Solutions Inc",
            },
          ],
        },
        signatory_individual: {
          confidence: 0.88,
          reasoning: "Signatory name and title identified in signature section",
          citation: [
            {
              page_number: 4,
              matching_text: "Jane Smith, Chief Executive Officer",
            },
          ],
        },
      },
    },
    createdAt: new Date("2024-02-28T09:15:00Z"),
    updatedAt: new Date("2024-03-01T11:45:00Z"),
  },
};

// Default fallback item
const defaultMockItem = (
  itemId: string
): TypedAgentData<ExtractedData<GenericDocumentData>> => ({
  id: itemId,
  deploymentName: "extraction-agent",
  collection: "mock-collection",
  data: {
    file_name: `document-${itemId}.pdf`,
    file_hash: `hash_${itemId}_${Date.now()}`,
    file_id: itemId,
    status: "pending_review",
    overall_confidence: 0.78,
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
    field_metadata: {
      document_title: {
        confidence: 0.82,
        reasoning: "Document title extracted from header or filename",
        citation: [
          {
            page_number: 1,
            matching_text: `Sample Document ${itemId}`,
          },
        ],
      },
      processed_date: {
        confidence: 0.95,
        reasoning: "Processing date automatically generated",
        citation: [
          {
            page_number: 1,
            matching_text: new Date().toISOString().split("T")[0],
          },
        ],
      },
    },
  },
  createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
  updatedAt: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000),
});

export const getMockItemResponse = (
  itemId: string
): TypedAgentData<ExtractedData<DocumentData>> => {
  // First try to find by string key (for backward compatibility)
  if (mockItemData[itemId]) {
    return mockItemData[itemId];
  }

  // Then try to find by numeric ID
  const numericId = parseInt(itemId);
  if (!isNaN(numericId)) {
    const itemByNumericId = Object.values(mockItemData).find(
      (item) => item.id === itemId
    );
    if (itemByNumericId) {
      return itemByNumericId;
    }
  }

  return defaultMockItem(itemId);
};
