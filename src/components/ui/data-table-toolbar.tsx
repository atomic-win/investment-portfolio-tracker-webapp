import type { Column, Table } from "@tanstack/react-table";
import { cn } from "cn";
import { CheckIcon, PlusCircleIcon, XIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
	CommandSeparator,
} from "@/components/ui/command";
import { DataTableViewOptions } from "@/components/ui/data-table-view-options";
import { Input } from "@/components/ui/input";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";

export type DataTableFilterConfig =
	| {
			type: "text";
			columnId: string;
			placeholder: string;
	  }
	| {
			type: "faceted";
			columnId: string;
			title: string;
			options: { label: string; value: string }[];
	  };

interface DataTableToolbarProps<TData> {
	table: Table<TData>;
	filters?: DataTableFilterConfig[];
}

export function DataTableToolbar<TData>({
	table,
	filters,
}: DataTableToolbarProps<TData>) {
	const isFiltered = table.getState().columnFilters.length > 0;

	return (
		<div className="flex items-center justify-between gap-2">
			<div className="flex flex-1 items-center gap-2">
				{filters?.map((filter) => {
					const column = table.getColumn(filter.columnId);
					if (!column) return null;

					if (filter.type === "text") {
						return (
							<Input
								key={filter.columnId}
								placeholder={filter.placeholder}
								value={(column.getFilterValue() as string) ?? ""}
								onChange={(event) => column.setFilterValue(event.target.value)}
								className="h-8 w-40 lg:w-60"
							/>
						);
					}

					if (filter.type === "faceted") {
						return (
							<DataTableFacetedFilter
								key={filter.columnId}
								column={column}
								title={filter.title}
								options={filter.options}
							/>
						);
					}

					return null;
				})}
				{isFiltered && (
					<Button
						variant="ghost"
						onClick={() => table.resetColumnFilters()}
						className="h-8 px-2 lg:px-3"
					>
						Reset
						<XIcon className="ml-2 h-4 w-4" />
					</Button>
				)}
			</div>
			<DataTableViewOptions table={table} />
		</div>
	);
}

interface DataTableFacetedFilterProps<TData, TValue> {
	column: Column<TData, TValue>;
	title: string;
	options: { label: string; value: string }[];
}

function DataTableFacetedFilter<TData, TValue>({
	column,
	title,
	options,
}: DataTableFacetedFilterProps<TData, TValue>) {
	const facets = column.getFacetedUniqueValues();
	const selectedValues = new Set((column.getFilterValue() as string[]) ?? []);

	return (
		<Popover>
			<PopoverTrigger
				render={
					<Button variant="outline" size="sm" className="h-8 border-dashed" />
				}
			>
				<PlusCircleIcon className="mr-2 h-4 w-4" />
				{title}
				{selectedValues.size > 0 && (
					<>
						<div className="mx-2 h-4 w-px shrink-0 bg-border" />
						<Badge
							variant="secondary"
							className="rounded-sm px-1 font-normal lg:hidden"
						>
							{selectedValues.size}
						</Badge>
						<div className="hidden space-x-1 lg:flex">
							{selectedValues.size > 2 ? (
								<Badge
									variant="secondary"
									className="rounded-sm px-1 font-normal"
								>
									{selectedValues.size} selected
								</Badge>
							) : (
								options
									.filter((option) => selectedValues.has(option.value))
									.map((option) => (
										<Badge
											variant="secondary"
											key={option.value}
											className="rounded-sm px-1 font-normal"
										>
											{option.label}
										</Badge>
									))
							)}
						</div>
					</>
				)}
			</PopoverTrigger>
			<PopoverContent className="w-50 p-0" align="start">
				<Command>
					<CommandInput placeholder={title} />
					<CommandList>
						<CommandEmpty>No results found.</CommandEmpty>
						<CommandGroup>
							{options.map((option) => {
								const isSelected = selectedValues.has(option.value);
								return (
									<CommandItem
										key={option.value}
										onSelect={() => {
											if (isSelected) {
												selectedValues.delete(option.value);
											} else {
												selectedValues.add(option.value);
											}
											const filterValues = Array.from(selectedValues);
											column.setFilterValue(
												filterValues.length ? filterValues : undefined,
											);
										}}
									>
										<div
											className={cn(
												"mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
												isSelected
													? "bg-primary text-primary-foreground"
													: "opacity-50 [&_svg]:invisible",
											)}
										>
											<CheckIcon className="h-4 w-4" />
										</div>
										<span>{option.label}</span>
										{facets?.get(option.value) != null && (
											<span className="ml-auto flex h-4 w-4 items-center justify-center font-mono text-xs">
												{facets.get(option.value)}
											</span>
										)}
									</CommandItem>
								);
							})}
						</CommandGroup>
						{selectedValues.size > 0 && (
							<>
								<CommandSeparator />
								<CommandGroup>
									<CommandItem
										onSelect={() => column.setFilterValue(undefined)}
										className="justify-center text-center"
									>
										Clear filters
									</CommandItem>
								</CommandGroup>
							</>
						)}
					</CommandList>
				</Command>
			</PopoverContent>
		</Popover>
	);
}
