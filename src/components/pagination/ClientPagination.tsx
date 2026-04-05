import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { buildPaginationItems } from "@/lib/utils";

type ClientPaginationProps = {
    page: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    disabled?: boolean;
    className?: string;
};

const ClientPagination = ({
    page,
    totalPages,
    onPageChange,
    disabled = false,
    className = "",
}: ClientPaginationProps) => {
    if (totalPages <= 1) {
        return null;
    }

    const pageItems = buildPaginationItems(page, totalPages);

    return (
        <div className={`flex flex-wrap items-center justify-center gap-2 ${className}`.trim()}>
            <Button
                variant="outline"
                size="icon-sm"
                onClick={() => onPageChange(page - 1)}
                disabled={disabled || page <= 1}
            >
                <ChevronLeft className="size-4" />
            </Button>

            {pageItems.map((item, index) => {
                const previous = pageItems[index - 1];
                const shouldRenderEllipsis = previous !== undefined && item - previous > 1;

                return (
                    <div key={item} className="flex items-center gap-2">
                        {shouldRenderEllipsis ? <span className="px-1 text-slate-400">...</span> : null}
                        <Button
                            variant={item === page ? "default" : "outline"}
                            size="sm"
                            onClick={() => onPageChange(item)}
                            className={item === page ? "bg-primary text-white" : ""}
                            disabled={disabled}
                        >
                            {item}
                        </Button>
                    </div>
                );
            })}

            <Button
                variant="outline"
                size="icon-sm"
                onClick={() => onPageChange(page + 1)}
                disabled={disabled || page >= totalPages}
            >
                <ChevronRight className="size-4" />
            </Button>
        </div>
    );
};

export default ClientPagination;