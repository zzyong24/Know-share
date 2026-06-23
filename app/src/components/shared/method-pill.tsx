import { Badge } from "@/components/ui/badge";
import { SUBTLE_TONE } from "./tone";
import { cn } from "@/lib/utils";
import type { Tone } from "@/lib/types";

/*
  COMP-023 MethodPill（HTTP 方法药丸）。色 + 方法文字（方法名本身即文字，满足非仅颜色）。
*/
export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

const METHOD_TONE: Record<HttpMethod, Tone> = {
  GET: "info",
  POST: "success",
  PUT: "warning",
  PATCH: "warning",
  DELETE: "danger",
};

export interface MethodPillProps {
  method: HttpMethod;
  size?: "sm" | "md";
}

export function MethodPill({ method, size = "md" }: MethodPillProps) {
  return (
    <Badge
      className={cn(
        "rounded-control border-transparent font-mono font-semibold tracking-wide",
        SUBTLE_TONE[METHOD_TONE[method]],
        size === "sm" ? "text-[10px] px-1.5 py-0" : "text-xs px-2 py-0.5"
      )}
    >
      {method}
    </Badge>
  );
}
