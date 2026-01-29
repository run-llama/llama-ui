import { useEffect, useState } from "react";
import { getCloudClient } from "../lib/cloud-client";

export interface FileData {
  url?: string;
  name?: string;
  type?: string;
}

export function useFileData(fileId: string, mockData?: FileData) {
  const [data, setData] = useState<FileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFileData = async () => {
      if (!fileId) {
        setLoading(false);
        return;
      }

      // Use mock data if provided (for Storybook)
      if (mockData) {
        setData(mockData);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const client = getCloudClient();

        // Get file content URL (presigned URL)
        const contentResponse = await client.files.get(fileId);

        // For file metadata, we need to query the files list
        // The files.get() returns a PresignedURL, not file metadata
        // We can use files.list() with file_ids filter to get metadata
        const fileListResponse = await client.files.list({
          file_ids: [fileId],
        });

        const fileMetadata = fileListResponse.items[0];

        setData({
          url: contentResponse.url,
          name: fileMetadata?.name,
          type: fileMetadata?.file_type || undefined,
        });
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error("Error fetching file data:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load file data"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchFileData();
  }, [fileId, mockData]);

  return { data, loading, error };
}
