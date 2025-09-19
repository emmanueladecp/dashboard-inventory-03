"use client"

import * as React from "react"
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  MoreHorizontalIcon,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button, buttonVariants } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// Primitive pagination container (nav)
// Enhanced below to optionally render a full pagination control when pagination props are provided.

type PaginationCompositeProps = {
  currentPage?: number
  page?: number
  totalPages?: number
  pageSize?: number
  totalItems?: number
  onPageChange?: (page: number) => void
  onPageSizeChange?: (size: number) => void
  pageSizeOptions?: number[]
  className?: string
} & React.ComponentProps<"nav">

function Pagination(props: PaginationCompositeProps) {
  const {
    className,
    currentPage,
    page,
    totalPages,
    pageSize,
    totalItems,
    onPageChange,
    onPageSizeChange,
    pageSizeOptions,
    ...rest
  } = props

  const hasCompositeProps = typeof totalPages === "number" && typeof onPageChange === "function"

  if (!hasCompositeProps) {
    // Fallback: behave as a plain nav wrapper (shadcn primitive behavior)
    return (
      <nav
        role="navigation"
        aria-label="pagination"
        data-slot="pagination"
        className={cn("mx-auto flex w-full justify-center", className)}
        {...rest}
      />
    )
  }

  const current = Math.min(Math.max((currentPage ?? page ?? 1), 1), totalPages!)
  const size = pageSize ?? (pageSizeOptions && pageSizeOptions[0]) ?? undefined

  const buildPages = (total: number, curr: number): (number | "ellipsis")[] => {
    const items: (number | "ellipsis")[] = []
    if (total <= 7) {
      for (let i = 1; i <= total; i++) items.push(i)
      return items
    }

    const addRange = (start: number, end: number) => {
      for (let i = start; i <= end; i++) items.push(i)
    }

    items.push(1)
    const left = Math.max(2, curr - 1)
    const right = Math.min(total - 1, curr + 1)

    if (left > 2) items.push("ellipsis")
    addRange(left, right)
    if (right < total - 1) items.push("ellipsis")

    items.push(total)
    return items
  }

  const pages = buildPages(totalPages!, current)

  const from = totalItems && size ? (current - 1) * size + 1 : undefined
  const to = totalItems && size ? Math.min(current * size, totalItems) : undefined

  const handlePrev = () => onPageChange!(Math.max(1, current - 1))
  const handleNext = () => onPageChange!(Math.min(totalPages!, current + 1))

  return (
    <nav
      role="navigation"
      aria-label="pagination"
      data-slot="pagination"
      className={cn("mx-auto flex w-full items-center justify-between gap-2", className)}
      {...rest}
    >
      <div className="text-sm text-muted-foreground hidden sm:block">
        {typeof totalItems === "number" && typeof size === "number" && from && to ? (
          <span>
            {from.toLocaleString()}–{to.toLocaleString()} of {totalItems.toLocaleString()}
          </span>
        ) : (
          <span>
            Page {current} of {totalPages}
          </span>
        )}
      </div>

      <div className="ml-auto flex items-center gap-2">
        {pageSizeOptions && pageSizeOptions.length > 0 && onPageSizeChange && (
          <div className="hidden sm:flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Rows:</span>
            <Select
              value={(size ?? pageSizeOptions[0]).toString()}
              onValueChange={(v) => onPageSizeChange?.(parseInt(v))}
            >
              <SelectTrigger className="h-9 w-[84px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent align="end">
                {pageSizeOptions.map((opt) => (
                  <SelectItem key={opt} value={opt.toString()}>
                    {opt}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious onClick={handlePrev} disabled={current <= 1} />
          </PaginationItem>

          {pages.map((p, idx) => (
            <PaginationItem key={`${p}-${idx}`}>
              {p === "ellipsis" ? (
                <PaginationEllipsis />
              ) : (
                <PaginationLink
                  isActive={p === current}
                  onClick={() => onPageChange!(p as number)}
                >
                  {p}
                </PaginationLink>
              )}
            </PaginationItem>
          ))}

          <PaginationItem>
            <PaginationNext onClick={handleNext} disabled={current >= totalPages!} />
          </PaginationItem>
        </PaginationContent>
      </div>
    </nav>
  )
}

function PaginationContent({
  className,
  ...props
}: React.ComponentProps<"ul">) {
  return (
    <ul
      data-slot="pagination-content"
      className={cn("flex flex-row items-center gap-1", className)}
      {...props}
    />
  )
}

function PaginationItem({ ...props }: React.ComponentProps<"li">) {
  return <li data-slot="pagination-item" {...props} />
}

type PaginationLinkProps = {
  isActive?: boolean
} & Pick<React.ComponentProps<typeof Button>, "size"> &
  React.ComponentProps<"button">

function PaginationLink({
  className,
  isActive,
  size = "icon",
  ...props
}: PaginationLinkProps) {
  return (
    <button
      aria-current={isActive ? "page" : undefined}
      data-slot="pagination-link"
      data-active={isActive}
      className={cn(
        buttonVariants({
          variant: isActive ? "outline" : "ghost",
          size,
        }),
        className
      )}
      {...props}
    />
  )
}

function PaginationPrevious({
  className,
  ...props
}: React.ComponentProps<typeof PaginationLink>) {
  return (
    <PaginationLink
      aria-label="Go to previous page"
      size="default"
      className={cn("gap-1 px-2.5 sm:pl-2.5", className)}
      {...props}
    >
      <ChevronLeftIcon className="h-4 w-4" />
      <span className="hidden sm:block">Previous</span>
    </PaginationLink>
  )
}

function PaginationNext({
  className,
  ...props
}: React.ComponentProps<typeof PaginationLink>) {
  return (
    <PaginationLink
      aria-label="Go to next page"
      size="default"
      className={cn("gap-1 px-2.5 sm:pr-2.5", className)}
      {...props}
    >
      <span className="hidden sm:block">Next</span>
      <ChevronRightIcon className="h-4 w-4" />
    </PaginationLink>
  )
}

function PaginationEllipsis({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      aria-hidden
      data-slot="pagination-ellipsis"
      className={cn("flex size-9 items-center justify-center", className)}
      {...props}
    >
      <MoreHorizontalIcon className="size-4" />
      <span className="sr-only">More pages</span>
    </span>
  )
}

export {
  Pagination,
  PaginationContent,
  PaginationLink,
  PaginationItem,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
}