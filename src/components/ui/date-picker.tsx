import { cn } from "cn";
import { Calendar as CalendarIcon } from "lucide-react";
import { DateTime } from "luxon";
import { buttonVariants } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";

export function DatePicker({
	date,
	onSelect,
}: {
	date: Date | undefined;
	// biome-ignore lint/suspicious/noConfusingVoidType: onSelect can return void, but it can also return undefined, so the return type is void | undefined
	onSelect?: (date: Date | undefined) => void | undefined;
}) {
	return (
		<Popover>
			<PopoverTrigger
				disabled={!onSelect}
				className={cn(
					!date && "text-muted-foreground",
					buttonVariants({ variant: "outline" }),
					"w-full justify-start font-normal items-center",
				)}
			>
				<CalendarIcon />
				{date ? (
					DateTime.fromJSDate(date).toLocaleString(DateTime.DATE_FULL)
				) : (
					<span>Pick a date</span>
				)}
			</PopoverTrigger>
			<PopoverContent className="w-auto p-0">
				<Calendar
					mode="single"
					selected={date}
					onSelect={onSelect}
					autoFocus
					fixedWeeks
					className="rounded-md border shadow-sm"
					captionLayout="dropdown"
				/>
			</PopoverContent>
		</Popover>
	);
}
