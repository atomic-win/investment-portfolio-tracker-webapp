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
		<div className="@container mt-3 px-8">
			<ul className="grid w-full grid-cols-[repeat(2,minmax(0,max-content))] justify-between gap-x-6 gap-y-2 text-xs @min-[32rem]:grid-cols-[repeat(3,minmax(0,max-content))]">
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
