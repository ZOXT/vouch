import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Pagination as PaginationMeta } from "@/lib/api/types";

interface PaginationProps {
  pagination: PaginationMeta;
  onPageChange: (page: number) => void;
}

export const PaginationControls = ({ pagination, onPageChange }: PaginationProps) => {
  const { page, totalPages, total, hasNext, hasPrevious } = pagination;
  if (total === 0) return null;

  return (
    <div className="mt-8 flex items-center justify-between">
      <p className="text-sm text-gray-500">
        Page {page} of {totalPages} · {total} total
      </p>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" disabled={!hasPrevious} onClick={() => onPageChange(page - 1)}>
          <ChevronLeft className="h-4 w-4" /> Previous
        </Button>
        <Button variant="outline" size="sm" disabled={!hasNext} onClick={() => onPageChange(page + 1)}>
          Next <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
