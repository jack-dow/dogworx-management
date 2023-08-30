/* eslint-disable @typescript-eslint/restrict-template-expressions */
"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams, type ReadonlyURLSearchParams } from "next/navigation";
import {
	flexRender,
	getCoreRowModel,
	getFacetedRowModel,
	getFacetedUniqueValues,
	getFilteredRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	useReactTable,
	type ColumnDef,
} from "@tanstack/react-table";

import {
	ChevronDoubleLeftIcon,
	ChevronDoubleRightIcon,
	ChevronLeftIcon,
	ChevronRightIcon,
	SortAscIcon,
	SortDescIcon,
	UserPlusIcon,
} from "~/components/ui/icons";
import { type SortableColumns } from "~/actions/sortable-columns";
import { type PaginationSearchParams } from "~/actions/utils";
import { useDidUpdate } from "~/hooks/use-did-update";
import { useViewportSize } from "~/hooks/use-viewport-size";
import { Button } from "./button";
import { Label } from "./label";
import { Loader } from "./loader";
import { SearchCombobox, SearchComboboxAction, type SearchComboboxProps } from "./search-combobox";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "./select";
import { Separator } from "./separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./table";

declare module "@tanstack/table-core" {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	interface ColumnMeta<TData, TValue> {
		className?: string;
	}
}

function setSearchParams(currentParams: ReadonlyURLSearchParams, newParams: PaginationSearchParams) {
	const searchParams = new URLSearchParams(currentParams);

	Object.entries(newParams).forEach(([key, value]) => {
		if (value) {
			searchParams.set(key, value.toString());
		} else {
			searchParams.delete(key);
		}
	});

	return searchParams;
}

type DataTablePagination = Omit<DataTablePaginationProps, "setIsLoading"> & {
	count: number;
	sortBy: string;
	sortDirection: string;
};

interface DataTableProps<TData, TValue, SearchResultType extends { id: string }> {
	pagination: DataTablePagination;
	columns: ColumnDef<TData, TValue>[];
	sortableColumns: SortableColumns;
	data: TData[];
	search:
		| (Pick<SearchComboboxProps<SearchResultType>, "onSearch" | "resultLabel"> & { component?: undefined })
		| { component: ({ setIsLoading }: { setIsLoading?: (isLoading: boolean) => void }) => JSX.Element };
}

function DataTable<TData extends { id: string }, TValue, SearchResultType extends { id: string }>({
	search,
	pagination: { count, sortBy, sortDirection, page, maxPage, limit },
	columns,
	sortableColumns,
	data,
}: DataTableProps<TData, TValue, SearchResultType>) {
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();

	const windowSize = useViewportSize();

	const [rowSelection, setRowSelection] = React.useState({});
	const [isLoading, setIsLoading] = React.useState(false);

	const table = useReactTable({
		data,
		columns,
		state: {
			rowSelection,
			pagination: {
				pageIndex: 0,
				pageSize: limit,
			},
		},
		enableRowSelection: true,
		onRowSelectionChange: setRowSelection,
		getCoreRowModel: getCoreRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getFacetedRowModel: getFacetedRowModel(),
		getFacetedUniqueValues: getFacetedUniqueValues(),
	});

	useDidUpdate(() => {
		if (isLoading) {
			setIsLoading(false);
		}
	}, [pathname, searchParams]);

	let name = pathname.split("/")[1];
	name?.endsWith("s") ? (name = name.slice(0, -1)) : (name = name);
	name = name?.split("-").join(" ");

	return (
		<div className="space-y-4">
			<header className="flex flex-col gap-4 md:flex-row md:items-center">
				<div className="flex flex-1 items-center space-x-3">
					{!search.component ? (
						<div className="relative w-full md:max-w-[288px]">
							<SearchCombobox
								{...search}
								onSelectChange={(result) => {
									if (result) {
										setIsLoading(true);
										router.push(`${pathname.slice(0, -1)}/${result.id}`);
									}
								}}
								placeholder={`Search ${count} ${name}s...`}
								className="h-8"
								classNames={{
									results: "max-w-[288px]",
								}}
								renderActions={({ searchTerm }) => (
									<SearchComboboxAction
										onSelect={() => {
											setIsLoading(true);
											router.push(
												`${pathname.slice(0, -1)}/new${
													searchTerm ? `?searchTerm=${encodeURIComponent(searchTerm)}` : ""
												}`,
											);
											return;
										}}
									>
										<UserPlusIcon className="mr-2 h-4 w-4" />
										<span className="truncate">
											Create new {name} {searchTerm && `"${searchTerm}"`}
										</span>
									</SearchComboboxAction>
								)}
							/>
						</div>
					) : (
						<search.component setIsLoading={setIsLoading} />
					)}

					{isLoading && <Loader variant="black" size="sm" />}
				</div>

				<div className="flex flex-1 items-center justify-end gap-x-3 md:flex-none md:gap-x-5">
					<div className="flex flex-1 items-center space-x-2">
						<Select>
							<SelectTrigger className="flex h-8 gap-1 space-x-0 bg-white text-xs">
								<span>Sort by</span>
							</SelectTrigger>
							<SelectContent className="pointer-events-none w-44" align={windowSize.width >= 768 ? "end" : "start"}>
								<SelectGroup>
									{Object.values(sortableColumns).map((column) => {
										return (
											<SelectItem value={column.id} asChild key={column.id} className="">
												<Link
													href={`${pathname}?${setSearchParams(searchParams, {
														sortBy: column.id,
														sortDirection: column.id === sortBy ? (sortDirection === "asc" ? "desc" : "asc") : "asc",
													}).toString()}`}
													onClick={(e) => {
														e.stopPropagation();
														setIsLoading(true);
													}}
													className="hover:cursor-pointer"
												>
													{column.label}
													<span className="absolute right-2 flex h-4 w-4 items-center justify-center">
														{column.id === sortBy ? (
															sortDirection === "asc" ? (
																<SortAscIcon className="h-4 w-4" />
															) : (
																<SortDescIcon className="h-4 w-4" />
															)
														) : null}
													</span>
												</Link>
											</SelectItem>
										);
									})}
								</SelectGroup>
							</SelectContent>
						</Select>
					</div>
					<Separator orientation="vertical" className="h-4" />
					<Button size="sm" asChild className="flex-1 md:flex-none">
						<Link href={`${name?.split(" ").join("-")}/new`} onClick={() => setIsLoading(true)}>
							Create {name}
						</Link>
					</Button>
				</div>
			</header>
			<main className="rounded-md border">
				<Table>
					<TableHeader>
						{table.getHeaderGroups().map((headerGroup) => (
							<TableRow key={headerGroup.id} clickable={false}>
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
									onClick={(event) => {
										setIsLoading(true);
										if (event.metaKey || event.ctrlKey) {
											window.open(`${pathname.slice(0, -1)}/${row.original.id}`, "_blank");
										} else {
											router.push(`${pathname.slice(0, -1)}/${row.original.id}`, {
												scroll: false,
											});
										}
									}}
									key={row.id}
									data-state={row.getIsSelected() && "selected"}
									className="cursor-pointer"
								>
									{row.getVisibleCells().map((cell) => (
										<TableCell key={cell.id} className={cell.column.columnDef.meta?.className}>
											{flexRender(cell.column.columnDef.cell, cell.getContext())}
										</TableCell>
									))}
								</TableRow>
							))
						) : (
							<TableRow clickable={false}>
								<TableCell colSpan={columns.length} className="h-24 text-center">
									No results.
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</main>
			<DataTablePagination page={page} maxPage={maxPage} limit={limit} setIsLoading={setIsLoading} />
		</div>
	);
}

function PaginationLink({
	href,
	onClick,
	disabled,
	children,
}: {
	href: string;
	onClick: () => void;
	disabled: boolean;
	children: React.ReactNode;
}) {
	if (disabled) {
		return (
			<Button variant="outline" className="hidden h-8 w-8 p-0 lg:flex" disabled={disabled}>
				{children}
			</Button>
		);
	}

	return (
		<Button variant="outline" className="hidden h-8 w-8 p-0 lg:flex" disabled={disabled} asChild>
			<Link href={href} onClick={onClick}>
				{children}
			</Link>
		</Button>
	);
}

type DataTablePaginationProps = {
	page: number;
	maxPage: number;
	limit: number;
	setIsLoading: (isLoading: boolean) => void;
};

function DataTablePagination({ page, maxPage, limit, setIsLoading }: DataTablePaginationProps) {
	const pathname = usePathname();
	const params = useSearchParams();

	return (
		<div className="flex w-full items-center justify-between space-x-6 lg:space-x-8">
			<div className="flex items-center space-x-2">
				<Label htmlFor="pagination-limit-select-trigger">Rows per page</Label>
				<Select>
					<SelectTrigger id="pagination-limit-select-trigger" className="h-8 w-[70px]">
						<SelectValue>{limit}</SelectValue>
					</SelectTrigger>
					<SelectContent className="pointer-events-none">
						{[20, 30, 40, 50].map((pageSize) => {
							const currentOffset = (page - 1) * limit;
							const newPage = Math.floor(currentOffset / Number(pageSize)) + 1;

							return (
								<SelectItem value={`${pageSize}`} key={pageSize} asChild>
									<Link
										href={`${pathname}?${setSearchParams(params, {
											page: newPage,
											limit: pageSize,
										}).toString()}`}
										onClick={() => setIsLoading(true)}
										className="hover:cursor-pointer"
									>
										{pageSize}
									</Link>
								</SelectItem>
							);
						})}
					</SelectContent>
				</Select>
			</div>
			<div className="flex">
				<div className="flex w-[100px] items-center justify-center text-sm font-medium">
					Page {page} of {maxPage}
				</div>
				<div className="flex items-center space-x-2">
					<PaginationLink
						href={`${pathname}?${setSearchParams(params, {
							page: 1,
						})}`}
						onClick={() => setIsLoading(true)}
						disabled={page === 1}
					>
						<span className="sr-only">Go to first page</span>
						<ChevronDoubleLeftIcon className="h-4 w-4" />
					</PaginationLink>
					<PaginationLink
						href={`${pathname}?${setSearchParams(params, {
							page: page === 1 ? 1 : page - 1,
						})}`}
						onClick={() => setIsLoading(true)}
						disabled={page === 1}
					>
						<span className="sr-only">Go to previous page</span>
						<ChevronLeftIcon className="h-4 w-4" />
					</PaginationLink>

					<PaginationLink
						href={`${pathname}?${setSearchParams(params, {
							page: page === maxPage ? maxPage : page + 1,
						})}`}
						onClick={() => setIsLoading(true)}
						disabled={page === maxPage}
					>
						<span className="sr-only">Go to next page</span>
						<ChevronRightIcon className="h-4 w-4" />
					</PaginationLink>
					<PaginationLink
						href={`${pathname}?${setSearchParams(params, {
							page: maxPage,
						})}`}
						onClick={() => setIsLoading(true)}
						disabled={page === maxPage}
					>
						<span className="sr-only">Go to last page</span>
						<ChevronDoubleRightIcon className="h-4 w-4" />
					</PaginationLink>
				</div>
			</div>
		</div>
	);
}

export { DataTable };
