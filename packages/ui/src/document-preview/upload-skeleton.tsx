import { Skeleton } from "@/base/skeleton";

export function UploadSkeleton() {
  return (
    <div className="flex h-full flex-col space-y-3 p-6">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-4/5" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-2/3" />
          {i < 7 && <div className="h-2" />}
        </div>
      ))}
    </div>
  );
}
