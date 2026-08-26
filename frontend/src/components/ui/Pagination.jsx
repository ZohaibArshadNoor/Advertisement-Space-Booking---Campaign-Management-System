import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export const Pagination = ({
  currentPage = 1,
  totalPages = 1,
  totalRecords = 0,
  pageSize = 10,
  onPageChange,
}) => {
  if (totalRecords === 0) return null;

  const startRecord = (currentPage - 1) * pageSize + 1;
  const endRecord = Math.min(currentPage * pageSize, totalRecords);

  return (
    <div className="pagination-ui">
      <div>
        Showing <span className="fw-semibold text-primary-emphasis">{startRecord}</span> to{' '}
        <span className="fw-semibold text-primary-emphasis">{endRecord}</span> of{' '}
        <span className="fw-semibold text-primary-emphasis">{totalRecords}</span> records
      </div>

      <div className="pagination-controls">
        <button
          type="button"
          className="btn-ui btn-ui-secondary btn-ui-sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          aria-label="Previous page"
        >
          <ChevronLeft size={14} />
          <span>Previous</span>
        </button>

        <span className="px-2 text-xs font-semibold text-muted">
          Page {currentPage} of {totalPages || 1}
        </span>

        <button
          type="button"
          className="btn-ui btn-ui-secondary btn-ui-sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          aria-label="Next page"
        >
          <span>Next</span>
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
};

export default Pagination;
