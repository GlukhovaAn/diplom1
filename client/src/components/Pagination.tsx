import { ChevronRightIcon } from "lucide-react";

interface PaginationProps {
  pagination: any;
  onPageChange: any;
}

export const Pagination = ({ pagination, onPageChange }: PaginationProps) => {
  return (
    <div className="mt-12 flex justify-center">
      <div className="flex items-center space-x-2 bg-white rounded-lg shadow-sm p-2">
        <button
          onClick={() => onPageChange(Math.max(1, pagination.page - 1))}
          disabled={pagination.page === 1}
          className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRightIcon className="w-5 h-5 rotate-180" />
        </button>

        {(() => {
          const totalPages = pagination.pages;
          const currentPage = pagination.page;
          const pages = [];

          pages.push(1);

          if (currentPage > 3) {
            pages.push("...");
          }

          for (
            let i = Math.max(2, currentPage - 1);
            i <= Math.min(totalPages - 1, currentPage + 1);
            i++
          ) {
            if (!pages.includes(i)) {
              pages.push(i);
            }
          }

          if (currentPage < totalPages - 2) {
            pages.push("...");
          }

          if (totalPages > 1 && !pages.includes(totalPages)) {
            pages.push(totalPages);
          }

          return pages.map((pageNum, idx) => {
            if (pageNum === "...") {
              return (
                <span key={`dots-${idx}`} className="px-2 text-gray-400">
                  ...
                </span>
              );
            }

            return (
              <button
                key={pageNum}
                onClick={() => onPageChange(Number(pageNum))}
                className={`w-10 h-10 rounded-lg font-medium transition-all ${
                  currentPage === pageNum
                    ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg"
                    : "hover:bg-gray-100 text-gray-700"
                }`}
              >
                {pageNum}
              </button>
            );
          });
        })()}

        <button
          onClick={() =>
            onPageChange(Math.min(pagination.pages, pagination.page + 1))
          }
          disabled={pagination.page === pagination.pages}
          className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRightIcon className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
