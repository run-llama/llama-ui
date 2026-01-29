"use client";

import { useEffect, useState } from "react";
import { Card } from "@/base/card";
import { cn } from "@/lib/utils";
import {
  type FilterOperation,
  type AgentDataConfig,
} from "@/src/lib/agent-data";
import { useAgentDataConfig, useCloudApiClient } from "../lib/api-provider";
import type LlamaCloud from "@llamaindex/llama-cloud";

export interface ItemCountProps {
  title: string;
  filter?: Record<string, FilterOperation>;
  variant?: "total" | "awaiting" | "approved" | "rejected";
  subtitle?: string;
}

const variantStyles = {
  total: {
    dot: "bg-gray-800",
    subtitle: "text-gray-600",
  },
  awaiting: {
    dot: "bg-orange-500",
  },
  approved: {
    dot: "bg-green-500",
  },
  rejected: {
    dot: "bg-red-500",
  },
};

async function fetchCountData(params: {
  filter?: Record<string, FilterOperation>;
  client: LlamaCloud;
  config: AgentDataConfig;
}): Promise<number> {
  const pageResponse = await params.client.beta.agentData.search({
    deployment_name: params.config.deploymentName,
    collection: params.config.collection,
    page_size: 0,
    filter: params.filter,
    include_total: true,
  });

  // Access total_size from the underlying response body
  const body = pageResponse as unknown as {
    total_size?: number | null;
  };
  return body.total_size ?? 0;
}

export function ItemCount({
  title,
  filter = {},
  variant = "total",
  subtitle,
}: ItemCountProps) {
  const client = useCloudApiClient();
  const config = useAgentDataConfig();
  const [count, setCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const styles = variantStyles[variant];

  useEffect(() => {
    fetchCountData({ filter, client, config })
      .then(setCount)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [filter, client, config]);

  return (
    <Card className="p-6 bg-white border border-gray-200 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <div className={cn("w-2 h-2 rounded-full", styles.dot)} />
            <h4 className={cn("text-md font-medium")}>{title}</h4>
          </div>

          {loading && (
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
              <span className="text-gray-500 text-sm">Loading...</span>
            </div>
          )}

          {error && <div className="text-red-500 text-sm">Error: {error}</div>}

          {count !== null && (
            <div>
              {subtitle && (
                <p className={cn("text-sm", "text-zinc-500")}>{subtitle}</p>
              )}
              <p className="text-3xl font-bold text-gray-900 mt-3">
                {count.toLocaleString()}
              </p>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
