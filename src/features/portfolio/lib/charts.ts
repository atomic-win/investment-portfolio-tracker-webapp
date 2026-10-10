import { defineChart, lineY } from "@tanstack/charts";
import { crosshair } from "@tanstack/charts/crosshair";
import { d3Curve } from "@tanstack/charts/d3/shape";
import { pie, polar, radialArc } from "@tanstack/charts/polar";
import { scaleLinear } from "@tanstack/charts/scales/linear";
import { tooltip } from "@tanstack/charts/tooltip";
import { scaleTime } from "d3-scale";
import { curveMonotoneX } from "d3-shape";
import { DateTime } from "luxon";
import { type ChartConfig, chartTheme } from "@/components/ui/chart";
import type { Portfolio } from "@/types";

export function createPortfolioChartConfig<TPortfolio extends Portfolio>(
	portfolios: TPortfolio[],
	labelFn: (portfolio: TPortfolio) => string,
): ChartConfig {
	return Object.fromEntries(
		[...portfolios]
			.sort((a, b) => a.investedValuePercent - b.investedValuePercent)
			.reverse()
			.map((portfolio, index) => [
				portfolio.id,
				{
					label: labelFn(portfolio),
					color: `var(--chart-${(index % 15) + 1})`,
				},
			]),
	);
}

export function createAllocationChart<TPortfolio extends Portfolio>(
	portfolios: TPortfolio[],
	config: ChartConfig,
	valueFn: (portfolio: TPortfolio) => number,
) {
	const byId = new Map(
		portfolios.map((portfolio) => [portfolio.id, portfolio]),
	);
	const rows = Object.keys(config).flatMap((id) => {
		const portfolio = byId.get(id);
		return portfolio
			? [{ id, value: Number(valueFn(portfolio).toFixed(2)) }]
			: [];
	});

	return defineChart({
		marks: [
			polar({
				scales: { angle: null, radius: null },
				marks: [
					radialArc(
						pie(rows, {
							value: "value",
							startAngle: Math.PI / 2,
							endAngle: -Math.PI * 1.5,
						}),
						{
							key: "id",
							color: "id",
							innerRadius: ({ radius }) => Math.min(40, radius * 0.5),
							outerRadius: ({ radius }) => radius * 0.8,
						},
					),
				],
			}),
		],
		scales: { x: null, y: null },
		color: {
			domain: Object.keys(config),
			range: Object.values(config).map(({ color }) => color),
		},
		theme: chartTheme,
		tooltip: {
			use: tooltip,
			className: "portfolio-chart-tooltip",
			sticky: false,
			content: (points) => ({
				rows: points.map(({ datum, color }) => ({
					label: config[datum.id].label,
					value: `${datum.value}%`,
					color,
				})),
			}),
		},
	});
}

export function createTrendsChart<TPortfolio extends Portfolio>(
	portfolios: TPortfolio[],
	config: ChartConfig,
	valueFn: (portfolio: TPortfolio) => number,
	formatValue: (value: number) => string,
	showTotal: boolean,
) {
	const byDate = new Map<number, Map<string, number>>();
	for (const portfolio of portfolios) {
		const date = DateTime.fromISO(portfolio.date).toMillis();
		let values = byDate.get(date);
		if (!values) {
			values = new Map();
			byDate.set(date, values);
		}
		values.set(portfolio.id, valueFn(portfolio));
	}
	const dates = [...byDate.keys()].sort((a, b) => a - b);
	const rows = Object.keys(config).flatMap((id) =>
		dates.map((date) => ({
			key: `${id}:${date}`,
			id,
			date: new Date(date),
			// Keep absent observations as gaps, not zeroes or connected segments.
			value: byDate.get(date)?.get(id) ?? null,
		})),
	);
	const [minimum, maximum] = rows.reduce(
		([min, max], { value }) =>
			value !== null && Number.isFinite(value)
				? [Math.min(min, value), Math.max(max, value)]
				: [min, max],
		[0, 0],
	);

	return defineChart({
		marks: [
			lineY(rows, {
				x: "date",
				y: "value",
				z: "id",
				color: "id",
				key: "key",
				curve: d3Curve(curveMonotoneX),
				strokeWidth: 2,
				points: false,
			}),
			crosshair({ x: true, y: false }),
		],
		scales: {
			x: {
				scale: scaleTime,
				grid: true,
				axis: {
					ticks: {
						spacing: 100,
						padding: 8,
						format: (date: Date) => DateTime.fromJSDate(date).toISODate() ?? "",
					},
				},
			},
			y: {
				scale: scaleLinear().domain([
					minimum,
					minimum === maximum ? maximum + 1 : maximum,
				]),
				nice: true,
				grid: true,
				axis: { ticks: { spacing: 48, padding: 8, format: formatValue } },
			},
		},
		color: {
			domain: Object.keys(config),
			range: Object.values(config).map(({ color }) => color),
		},
		theme: chartTheme,
		focus: "group-x",
		maxFocusDistance: Number.POSITIVE_INFINITY,
		tooltip: {
			use: tooltip,
			className: showTotal
				? "portfolio-chart-tooltip portfolio-chart-tooltip--total"
				: "portfolio-chart-tooltip",
			sticky: false,
			sort: "color-domain",
			content: (points) => ({
				title: points[0]
					? (DateTime.fromJSDate(points[0].datum.date).toISODate() ?? "")
					: undefined,
				rows: [
					...points.map(({ datum, color }) => ({
						label: config[datum.id].label,
						value: formatValue(datum.value ?? 0),
						color,
					})),
					...(showTotal && points.length
						? [
								{
									label: "Total",
									value: formatValue(
										points.reduce(
											(sum, { datum }) => sum + (datum.value ?? 0),
											0,
										),
									),
								},
							]
						: []),
				],
			}),
		},
	});
}
