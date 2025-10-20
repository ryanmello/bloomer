// components/ui/badge.tsx
import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
  {
    variants: {
      variant: {
        default:
          "bg-gray-100 text-gray-700 ring-gray-300",
        success:
          "bg-emerald-50 text-emerald-700 ring-emerald-200",
        danger:
          "bg-rose-50 text-rose-700 ring-rose-200",
        warning:
          "bg-amber-50 text-amber-800 ring-amber-200",
        info:
          "bg-blue-50 text-blue-700 ring-blue-200",
        outline:
          "text-gray-600 ring-gray-300 bg-transparent",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}
