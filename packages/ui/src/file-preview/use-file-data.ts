import { useEffect, useState } from "react";
import {
  readFileContentApiV1FilesIdContentGet,
  getFileApiV1FilesIdGet,
} from "llama-cloud-services/api";

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
        const getFilePromise = getFileApiV1FilesIdGet({
          headers: {
            "Content-Type": "application/json",
          },
          path: {
            id: fileId,
          },
        });

        const getFileContentPromise: Promise<
          Awaited<ReturnType<typeof readFileContentApiV1FilesIdContentGet>>
        > = readFileContentApiV1FilesIdContentGet({
          headers: {
            "Content-Type": "application/json",
          },
          path: {
            id: fileId,
          },
        });

        // Wait for both promises to resolve
        const fileResponse = await getFilePromise;
        const contentResponse = await getFileContentPromise;

        // Transform the response to our expected format
        const fileType = fileResponse.data?.file_type;

        const url = contentResponse.data?.url;
        setData({
          url,
          name: fileResponse.data?.name,
          type: fileType || undefined,
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
