"use client";

import * as React from "react";
import { compareItems, rankItem, type RankingInfo } from "@tanstack/match-sorter-utils";
import {
	flexRender,
	getCoreRowModel,
	getFacetedRowModel,
	getFacetedUniqueValues,
	getFilteredRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	sortingFns,
	useReactTable,
	type ColumnDef,
	type ColumnFiltersState,
	type FilterFn,
	type SortingFn,
	type SortingState,
	type Table as TanstackTable,
	type VisibilityState,
} from "@tanstack/react-table";

import {
	AdjustmentsHorizontalIcon,
	ChevronDoubleLeftIcon,
	ChevronDoubleRightIcon,
	ChevronLeftIcon,
	ChevronRightIcon,
} from "~/components/ui/icons";
import { cn } from "~/lib/utils";
import { Button } from "./button";
import {
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "./dropdown-menu";
import { Input } from "./input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./table";

declare module "@tanstack/table-core" {
	interface FilterFns {
		fuzzy: FilterFn<unknown>;
	}
	interface FilterMeta {
		itemRank: RankingInfo;
	}
	interface SortingFns {
		fuzzy: SortingFn<unknown>;
	}
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	interface ColumnMeta<TData, TValue> {
		className?: string;
	}
}

const fuzzyFilter: FilterFn<unknown> = (row, columnId, value: string, addMeta) => {
	// Rank the item
	const itemRank = rankItem(row.getValue(columnId), value);

	// Store the itemRank info
	addMeta({
		itemRank,
	});

	// Return if the item should be filtered in/out
	return itemRank.passed;
};

const fuzzySort: SortingFn<unknown> = (rowA, rowB, columnId) => {
	let dir = 0;

	// Only sort by rank if the column has ranking information
	if (rowA.columnFiltersMeta[columnId]) {
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-non-null-asserted-optional-chain
		dir = compareItems(rowA.columnFiltersMeta[columnId]?.itemRank!, rowB.columnFiltersMeta[columnId]?.itemRank!);
	}

	// Provide an alphanumeric fallback for when the item ranks are equal
	return dir === 0 ? sortingFns.alphanumeric(rowA, rowB, columnId) : dir;
};

interface DataTableProps<TData, TValue> {
	columns: ColumnDef<TData, TValue>[];
	data: TData[];
	onTableRowClick?: (row: TData) => void;
	filterInputPlaceholder?: string;
}

function DataTable<TData, TValue>({
	columns,
	data,
	onTableRowClick,
	filterInputPlaceholder,
}: DataTableProps<TData, TValue>) {
	const [rowSelection, setRowSelection] = React.useState({});
	const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
	const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
	const [sorting, setSorting] = React.useState<SortingState>([]);
	const [globalFilterValue, setGlobalFilterValue] = React.useState("");

	const table = useReactTable({
		data,
		columns,
		filterFns: {
			fuzzy: fuzzyFilter,
		},
		sortingFns: {
			fuzzy: fuzzySort,
		},
		state: {
			sorting,
			columnVisibility,
			rowSelection,
			columnFilters,
			globalFilter: globalFilterValue,
		},
		initialState: {
			pagination: {
				pageIndex: 0,
				pageSize: 20,
			},
		},
		enableRowSelection: true,
		onRowSelectionChange: setRowSelection,
		onSortingChange: setSorting,
		onColumnFiltersChange: setColumnFilters,
		onColumnVisibilityChange: setColumnVisibility,
		onGlobalFilterChange: setGlobalFilterValue,
		getCoreRowModel: getCoreRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getFacetedRowModel: getFacetedRowModel(),
		getFacetedUniqueValues: getFacetedUniqueValues(),
	});

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<div className="flex flex-1 items-center space-x-2">
					<Input
						placeholder={filterInputPlaceholder ?? "Filter..."}
						value={globalFilterValue ?? ""}
						onChange={(event) => {
							setGlobalFilterValue(event.target.value);
						}}
						className="h-8 w-[150px] lg:w-[250px]"
					/>
				</div>
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button variant="outline" size="sm" className="ml-auto hidden h-8 lg:flex">
							<AdjustmentsHorizontalIcon className="mr-2 h-4 w-4" />
							View
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end" className="w-[150px]">
						<DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
						<DropdownMenuSeparator />
						{table
							.getAllColumns()
							.filter((column) => typeof column.accessorFn !== "undefined" && column.getCanHide())
							.map((column) => {
								return (
									<DropdownMenuCheckboxItem
										key={column.id}
										className="capitalize"
										checked={column.getIsVisible()}
										onCheckedChange={(value) => column.toggleVisibility(!!value)}
									>
										{column.id}
									</DropdownMenuCheckboxItem>
								);
							})}
					</DropdownMenuContent>
				</DropdownMenu>
			</div>
			<div className="rounded-md border">
				<Table>
					<TableHeader>
						{table.getHeaderGroups().map((headerGroup) => (
							<TableRow key={headerGroup.id}>
								{headerGroup.headers.map((header) => {
									return (
										<TableHead key={header.id} className={header.column.columnDef.meta?.className}>
											{header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
										</TableHead>
									);
								})}
							</TableRow>
						))}
					</TableHeader>
					<TableBody>
						{table.getRowModel().rows?.length ? (
							table.getRowModel().rows.map((row) => (
								<TableRow
									onClick={() => {
										if (onTableRowClick) {
											onTableRowClick(row.original);
										}
									}}
									key={row.id}
									data-state={row.getIsSelected() && "selected"}
									className={cn(onTableRowClick && "cursor-pointer")}
								>
									{row.getVisibleCells().map((cell) => (
										<TableCell key={cell.id} className={cell.column.columnDef.meta?.className}>
											{flexRender(cell.column.columnDef.cell, cell.getContext())}
										</TableCell>
									))}
								</TableRow>
							))
						) : (
							<TableRow>
								<TableCell colSpan={columns.length} className="h-24 text-center">
									No results.
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</div>
			<DataTablePagination table={table} />
		</div>
	);
}

interface DataTablePaginationProps<TData> {
	table: TanstackTable<TData>;
}

function DataTablePagination<TData>({ table }: DataTablePaginationProps<TData>) {
	return (
		<div className="flex items-center justify-between px-2">
			<div className="flex-1 text-sm text-muted-foreground">
				{/* {table.getFilteredSelectedRowModel().rows.length} of {table.getFilteredRowModel().rows.length} row(s) selected. */}
			</div>
			<div className="flex items-center space-x-6 lg:space-x-8">
				<div className="flex items-center space-x-2">
					<p className="text-sm font-medium">Rows per page</p>
					<Select
						value={`${table.getState().pagination.pageSize}`}
						onValueChange={(value) => {
							table.setPageSize(Number(value));
						}}
					>
						<SelectTrigger className="h-8 w-[70px]">
							<SelectValue placeholder={table.getState().pagination.pageSize} />
						</SelectTrigger>
						<SelectContent side="top" className="pointer-events-none">
							{[20, 30, 40, 50].map((pageSize) => (
								<SelectItem
									key={pageSize}
									value={`${pageSize}`}
									onClick={(e) => {
										e.preventDefault();
										e.stopPropagation();
									}}
								>
									{pageSize}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
				<div className="flex w-[100px] items-center justify-center text-sm font-medium">
					Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
				</div>
				<div className="flex items-center space-x-2">
					<Button
						variant="outline"
						className="hidden h-8 w-8 p-0 lg:flex"
						onClick={() => table.setPageIndex(0)}
						disabled={!table.getCanPreviousPage()}
					>
						<span className="sr-only">Go to first page</span>
						<ChevronDoubleLeftIcon className="h-4 w-4" />
					</Button>
					<Button
						variant="outline"
						className="h-8 w-8 p-0"
						onClick={() => table.previousPage()}
						disabled={!table.getCanPreviousPage()}
					>
						<span className="sr-only">Go to previous page</span>
						<ChevronLeftIcon className="h-4 w-4" />
					</Button>
					<Button
						variant="outline"
						className="h-8 w-8 p-0"
						onClick={() => table.nextPage()}
						disabled={!table.getCanNextPage()}
					>
						<span className="sr-only">Go to next page</span>
						<ChevronRightIcon className="h-4 w-4" />
					</Button>
					<Button
						variant="outline"
						className="hidden h-8 w-8 p-0 lg:flex"
						onClick={() => table.setPageIndex(table.getPageCount() - 1)}
						disabled={!table.getCanNextPage()}
					>
						<span className="sr-only">Go to last page</span>
						<ChevronDoubleRightIcon className="h-4 w-4" />
					</Button>
				</div>
			</div>
		</div>
	);
}

export { DataTable };
