"use client";
import React from "react";
import { cn } from "@/lib/utils";

type SkeletonTableProps = {
  columns: number;
  rows?: number;
  className?: string;
};

export default function SkeletonTable({
  columns,
  rows = 6,
  className,
}: SkeletonTableProps) {
  return (
    <div className={cn("w-full", className)}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr>
              {Array.from({ length: columns }).map((_, i) => (
                <th key={i} className="table-header-cell text-left">
                  <div className="h-4 w-24 skeleton-line" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rows }).map((_, r) => (
              <tr key={r} className="border-t">
                {Array.from({ length: columns }).map((__, c) => (
                  <td key={c} className="table-body-cell">
                    <div className="h-4 w-full max-w-[180px] skeleton-line" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <style jsx>{`
        .skeleton-line {
          position: relative;
          overflow: hidden;
          border-radius: 0.25rem;
          background-color: hsl(214, 32%, 91%);
        }
        .skeleton-line::after {
          content: "";
          position: absolute;
          inset: 0;
          transform: translateX(-100%);
          background: linear-gradient(
            90deg,
            rgba(255, 255, 255, 0) 0%,
            rgba(255, 255, 255, 0.6) 50%,
            rgba(255, 255, 255, 0) 100%
          );
          animation: skeleton-shimmer 1.2s infinite;
        }
        @keyframes skeleton-shimmer {
          100% {
            transform: translateX(100%);
          }
        }
      `}</style>
    </div>
  );
}
