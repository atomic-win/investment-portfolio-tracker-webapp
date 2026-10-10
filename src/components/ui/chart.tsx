import type { ChartTheme } from "@tanstack/charts";

export type ChartConfig = Record<string, { label: string; color: string }>;

export const chartTheme = {
	foreground: "var(--foreground)",
	muted: "var(--muted-foreground)",
	grid: "var(--border)",
	background: "var(--card)",
} satisfies Partial<ChartTheme>;

export function ChartLegend({ config }: { config: ChartConfig }) {
	return (
		<div className="@container">
			<ul className="mx-auto grid w-fit max-w-full grid-cols-2 gap-x-6 gap-y-2 text-xs @min-[32rem]:grid-cols-3">
				{Object.entries(config).map(([id, { label, color }]) => (
					<li key={id} className="flex min-w-0 max-w-full items-center gap-1.5">
						<span
							className="h-2.5 w-2.5 shrink-0 rounded-[2px]"
							style={{ backgroundColor: color }}
						/>
						<span className="min-w-0 wrap-anywhere">{label}</span>
					</li>
				))}
			</ul>
		</div>
	);
}
