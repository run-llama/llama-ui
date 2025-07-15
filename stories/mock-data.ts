export interface MockFileData {
  file_id: string;
  file_name: string;
  status_counts: Record<string, number>;
  extracted: {
    vendor?: string;
  } | null;
  attributes: {
    department?: string;
  } | null;
  synced_at: string | null;
  created_at: string;
}

export function generateMockFileData(): MockFileData[] {
  const vendors = [
    "Acme Corp",
    "Tech Solutions",
    "Global Industries",
    "Innovation Co",
    "Digital Systems",
  ];
  const departments = [
    "Engineering",
    "Marketing",
    "Sales",
    "Finance",
    "Operations",
    "HR",
  ];
  const fileTypes = ["invoice", "contract", "report", "proposal", "receipt"];

  const mockData: MockFileData[] = [];

  for (let i = 1; i <= 25; i++) {
    const statusCounts: Record<string, number> = {};
    const random = Math.random();

    // Generate different status combinations
    if (random < 0.3) {
      // Pending review
      statusCounts["pending_review"] = Math.floor(Math.random() * 3) + 1;
    } else if (random < 0.7) {
      // Approved
      statusCounts["approved"] = Math.floor(Math.random() * 5) + 1;
    } else {
      // Rejected
      statusCounts["rejected"] = Math.floor(Math.random() * 3) + 1;
    }

    // Sometimes add mixed statuses
    if (Math.random() < 0.2) {
      statusCounts["approved"] = Math.floor(Math.random() * 2) + 1;
      statusCounts["rejected"] = Math.floor(Math.random() * 2) + 1;
    }

    const vendor =
      Math.random() < 0.85
        ? vendors[Math.floor(Math.random() * vendors.length)]
        : undefined;
    const department =
      Math.random() < 0.95
        ? departments[Math.floor(Math.random() * departments.length)]
        : undefined;
    const fileType = fileTypes[Math.floor(Math.random() * fileTypes.length)];

    const createdAt = new Date();
    createdAt.setDate(createdAt.getDate() - Math.floor(Math.random() * 30));

    mockData.push({
      file_id: `file_${i.toString().padStart(3, "0")}`,
      file_name: `${fileType}_${i.toString().padStart(3, "0")}.pdf`,
      status_counts: statusCounts,
      extracted: vendor ? { vendor } : null,
      attributes: department ? { department } : null,
      synced_at: Math.random() < 0.7 ? createdAt.toISOString() : null,
      created_at: createdAt.toISOString(),
    });
  }

  return mockData;
}
