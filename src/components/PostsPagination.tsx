import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { PaginationInfo } from '@/lib/api';

interface PostsPaginationProps {
  pagination: PaginationInfo;
  currentPage: number;
  onPageChange: (page: number) => void;
}

export function PostsPagination({ pagination, currentPage, onPageChange }: PostsPaginationProps) {
  const { page, pages, total } = pagination;

  if (pages <= 1) {
    return null;
  }

  const renderPageNumbers = () => {
    const pageNumbers = [];
    const maxVisiblePages = 5;
    
    if (pages <= maxVisiblePages) {
      // Show all pages if total pages is small
      for (let i = 1; i <= pages; i++) {
        pageNumbers.push(i);
      }
    } else {
      // Show first page, last page, and pages around current page
      pageNumbers.push(1);
      
      if (page > 3) {
        pageNumbers.push('ellipsis-start');
      }
      
      const start = Math.max(2, page - 1);
      const end = Math.min(pages - 1, page + 1);
      
      for (let i = start; i <= end; i++) {
        pageNumbers.push(i);
      }
      
      if (page < pages - 2) {
        pageNumbers.push('ellipsis-end');
      }
      
      if (pages > 1) {
        pageNumbers.push(pages);
      }
    }
    
    return pageNumbers;
  };

  return (
    <Pagination className="mt-8">
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious 
            onClick={() => onPageChange(page - 1)}
            className={page <= 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
          />
        </PaginationItem>
        
        {renderPageNumbers().map((pageNum, index) => (
          <PaginationItem key={index}>
            {pageNum === 'ellipsis-start' || pageNum === 'ellipsis-end' ? (
              <PaginationEllipsis />
            ) : (
              <PaginationLink
                onClick={() => onPageChange(pageNum as number)}
                isActive={pageNum === page}
                className="cursor-pointer"
              >
                {pageNum}
              </PaginationLink>
            )}
          </PaginationItem>
        ))}
        
        <PaginationItem>
          <PaginationNext 
            onClick={() => onPageChange(page + 1)}
            className={page >= pages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
} 