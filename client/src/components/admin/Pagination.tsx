interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onCurrentPage: (val: number) => void;
}

export const Pagination = ({
  currentPage,
  totalPages,
  onCurrentPage,
}: PaginationProps) => {
  return (
    <div className="flex justify-center space-x-2">
      <button
        onClick={() => onCurrentPage(currentPage - 1)}
        disabled={currentPage === 1}
        className="px-3 py-1 border rounded hover:bg-gray-100 disabled:opacity-50"
      >
        Пред
      </button>
      {[...Array(totalPages)].map((_, i) => (
        <button
          key={i + 1}
          onClick={() => onCurrentPage(i + 1)}
          className={`px-3 py-1 border rounded ${
            currentPage === i + 1
              ? "bg-blue-600 text-white"
              : "hover:bg-gray-100"
          }`}
        >
          {i + 1}
        </button>
      ))}
      <button
        onClick={() => onCurrentPage(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="px-3 py-1 border rounded hover:bg-gray-100 disabled:opacity-50"
      >
        След
      </button>
    </div>
  );
};
