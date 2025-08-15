// Shared data and schemas for all stories
export const sampleData = {
  receiptNumber: "uyte1213",
  invoiceNumber: "8336",
  merchant: {
    name: "Wehner LLC", // This is required
    // phone is missing (optional) - should show "(added)"
    address: {
      street: "Princess", // This is required
      city: "Funkhaven", // This is required
      state: "-", // This is optional
      postalCode: "24843-7916", // This is optional
      country: "-", // This is optional
    },
    tags: ["urgent", "paid", "processed"],
  },
  items: [
    {
      description: "Labour Charges", // This is required
      period: {
        start: "09/06/2025", // This is required
        end: "10/06/2025", // This is required
      },
      items: ["a", "b", "c"],
      // amount is missing (optional) - should show "(added)"
    },
    {
      description: "Material", // This is required
      period: {
        start: "08/06/2025", // This is required
        end: "09/06/2025", // This is required
      },
      items: ["x", "y", "z"],
      // amount is missing (optional) - should show "(added)"
    },
  ],
  tags: ["urgent", "paid", "processed"], // This is required
  // email is missing (optional) - should show "(added)"
  // totalAmount is missing (optional) - should show "(added)"
};

// Schema to demonstrate required/optional field display
export const sampleSchema = {
  type: "object" as const,
  properties: {
    receiptNumber: {
      type: "string" as const,
      title: "Receipt Number",
      description: "Unique receipt identifier",
    },
    invoiceNumber: {
      type: "string" as const,
      title: "Invoice Number",
      description: "Invoice reference number",
    },
    email: {
      type: "string" as const,
      title: "Email Address",
      description: "Contact email address",
    },
    totalAmount: {
      type: "number" as const,
      title: "Total Amount",
      description: "Total invoice amount",
    },
    merchant: {
      type: "object" as const,
      title: "Merchant Information",
      properties: {
        name: {
          type: "string" as const,
          title: "Merchant Name",
        },
        phone: {
          type: "string" as const,
          title: "Phone Number",
          description: "Contact phone number",
        },
        address: {
          type: "object" as const,
          title: "Address",
          properties: {
            street: { type: "string" as const, title: "Street" },
            city: { type: "string" as const, title: "City" },
            state: { type: "string" as const, title: "State" },
            postalCode: { type: "string" as const, title: "Postal Code" },
            country: { type: "string" as const, title: "Country" },
          },
          required: ["street", "city"],
        },
        tags: {
          type: "array" as const,
          title: "Tags",
          items: { type: "string" as const },
        },
      },
      required: ["name", "tags"], // phone is optional
    },
    items: {
      type: "array" as const,
      title: "Line Items",
      items: {
        type: "object" as const,
        properties: {
          description: { type: "string" as const, title: "Description" },
          amount: {
            type: "number" as const,
            title: "Amount",
            description: "Line item amount",
          },
          period: {
            type: "object" as const,
            title: "Period",
            properties: {
              start: { type: "string" as const, title: "Start Date" },
              end: { type: "string" as const, title: "End Date" },
            },
            required: ["start", "end"], // Both dates are required
          },
          items: {
            type: "array" as const,
            title: "Items",
            items: { type: "string" as const },
          },
        },
        required: ["description"], // amount is optional
      },
    },
    tags: {
      type: "array" as const,
      title: "Tags",
      items: { type: "string" as const },
    },
  },
  required: ["receiptNumber", "invoiceNumber", "tags"], // email and totalAmount are optional
};

// Create field_metadata with tree structure that mirrors the data structure
export const sampleFieldMetadata = {
  receiptNumber: {
    confidence: 0.95,
    reasoning: "Receipt number clearly identified",
    citation: [{ page_number: 1, matching_text: "uyte1213" }],
  },
  invoiceNumber: {
    confidence: 0.87,
    reasoning: "Invoice number extracted from header",
    citation: [{ page_number: 1, matching_text: "8336" }],
  },
  merchant: {
    name: {
      confidence: 0.92,
      reasoning: "Merchant name identified",
      citation: [{ page_number: 1, matching_text: "Wehner LLC" }],
    },
    address: {
      street: {
        confidence: 0.65, // Low confidence field for testing
        reasoning: "Street address extracted with uncertainty",
        citation: [{ page_number: 1, matching_text: "Princess" }],
      },
      city: {
        confidence: 0.89,
        reasoning: "City name identified",
        citation: [{ page_number: 1, matching_text: "Funkhaven" }],
      },
    },
    tags: [
      {
        confidence: 0.96,
        reasoning: "First tag identified",
        citation: [{ page_number: 1, matching_text: "urgent" }],
      },
      {
        confidence: 0.85,
        reasoning: "Second tag identified",
        citation: [{ page_number: 1, matching_text: "paid" }],
      },
      {
        confidence: 0.9,
        reasoning: "Third tag identified",
        citation: [{ page_number: 1, matching_text: "processed" }],
      },
    ],
  },
  items: [
    {
      description: {
        confidence: 0.94,
        reasoning: "First item description extracted",
        citation: [{ page_number: 1, matching_text: "Labour Charges" }],
      },
      period: {
        start: {
          confidence: 0.91,
          reasoning: "Start date extracted from first item",
          citation: [{ page_number: 1, matching_text: "09/06/2025" }],
        },
        end: {
          confidence: 0.88,
          reasoning: "End date extracted from first item",
          citation: [{ page_number: 1, matching_text: "10/06/2025" }],
        },
      },
    },
    {
      description: {
        confidence: 0.88,
        reasoning: "Second item description extracted",
        citation: [{ page_number: 1, matching_text: "Material" }],
      },
      period: {
        start: {
          confidence: 0.89,
          reasoning: "Start date extracted from second item",
          citation: [{ page_number: 1, matching_text: "08/06/2025" }],
        },
        end: {
          confidence: 0.85,
          reasoning: "End date extracted from second item",
          citation: [{ page_number: 1, matching_text: "09/06/2025" }],
        },
      },
    },
  ],
  tags: [
    {
      confidence: 0.96,
      reasoning: "First tag identified",
      citation: [{ page_number: 1, matching_text: "urgent" }],
    },
    {
      confidence: 0.85,
      reasoning: "Second tag identified",
      citation: [{ page_number: 1, matching_text: "paid" }],
    },
    {
      confidence: 0.9,
      reasoning: "Third tag identified",
      citation: [{ page_number: 1, matching_text: "processed" }],
    },
  ],
};
