import type { ChartTheme } from "@tanstack/charts";
import { cn } from "cn";

export type ChartConfig = Record<string, { label: string; color: string }>;

export const chartTheme = {
	foreground: "var(--foreground)",
	muted: "var(--muted-foreground)",
	grid: "var(--border)",
	background: "var(--card)",
} satisfies Partial<ChartTheme>;

export function ChartLegend({
	config,
	className,
}: {
	config: ChartConfig;
	className?: string;
}) {
	return (
		<ul className={cn("grid gap-2 text-xs", className)}>
			{Object.entries(config).map(([id, { label, color }]) => (
				<li key={id} className="flex min-w-0 items-center gap-1.5">
					<span
						className="h-2 w-2 shrink-0 rounded-[2px]"
						style={{ backgroundColor: color }}
					/>
					<span>{label}</span>
				</li>
			))}
		</ul>
	);
}
