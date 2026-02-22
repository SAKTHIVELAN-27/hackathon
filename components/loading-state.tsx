import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingStateProps {
  message?: string;
  size?: "sm" | "md" | "lg";
  fullScreen?: boolean;
  className?: string;
}

export function LoadingState({
  message = "Loading...",
  size = "md",
  fullScreen = false,
  className,
}: LoadingStateProps) {
  const sizeMap = {
    sm: "h-6 w-6",
    md: "h-8 w-8",
    lg: "h-12 w-12",
  };

  const containerHeight = fullScreen ? "min-h-screen" : "h-[50vh]";

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center space-y-4",
        containerHeight,
        className,
      )}
    >
      <Loader2 className={cn("animate-spin text-primary", sizeMap[size])} />
      {message && (
        <p className="text-muted-foreground animate-pulse text-center text-sm">
          {message}
        </p>
      )}
    </div>
  );
}
