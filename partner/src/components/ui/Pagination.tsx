import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";

interface PaginationProps {
	page: number;
	pageCount: number;
	onPageChange: (page: number) => void;
	className?: string;
}

export function Pagination({ page, pageCount, onPageChange, className = "" }: PaginationProps) {
	if (pageCount <= 1) return null;
	const currentPage = Math.min(Math.max(1, page), pageCount);
	const startPage = Math.max(1, Math.min(currentPage - 2, pageCount - 4));
	const endPage = Math.min(pageCount, startPage + 4);
	const pages = Array.from({ length: endPage - startPage + 1 }, (_, index) => startPage + index);

	return (
		<nav aria-label="Pagination" className={`flex flex-wrap items-center justify-center gap-1.5 ${className}`.trim()}>
			<button type="button" aria-label="Previous page" disabled={currentPage === 1} onClick={() => onPageChange(currentPage - 1)} className="grid h-9 w-9 place-items-center rounded-lg border border-stone-300 text-stone-700 hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-40"><ChevronLeft size={16} /></button>
			{startPage > 1 ? <><button type="button" aria-label="Page 1" onClick={() => onPageChange(1)} className="h-9 min-w-9 rounded-lg border border-stone-300 px-2 text-sm font-medium text-stone-700 hover:bg-stone-100">1</button>{startPage > 2 ? <MoreHorizontal size={16} aria-hidden="true" className="text-stone-500" /> : null}</> : null}
			{pages.map((item) => <button key={item} type="button" aria-label={`Page ${item}`} aria-current={item === currentPage ? "page" : undefined} onClick={() => onPageChange(item)} className={`h-9 min-w-9 rounded-lg px-2 text-sm font-medium ${item === currentPage ? "bg-amber-700 text-white" : "border border-stone-300 text-stone-700 hover:bg-stone-100"}`}>{item}</button>)}
			{endPage < pageCount ? <>{endPage < pageCount - 1 ? <MoreHorizontal size={16} aria-hidden="true" className="text-stone-500" /> : null}<button type="button" aria-label={`Page ${pageCount}`} onClick={() => onPageChange(pageCount)} className="h-9 min-w-9 rounded-lg border border-stone-300 px-2 text-sm font-medium text-stone-700 hover:bg-stone-100">{pageCount}</button></> : null}
			<button type="button" aria-label="Next page" disabled={currentPage === pageCount} onClick={() => onPageChange(currentPage + 1)} className="grid h-9 w-9 place-items-center rounded-lg border border-stone-300 text-stone-700 hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-40"><ChevronRight size={16} /></button>
		</nav>
	);
}