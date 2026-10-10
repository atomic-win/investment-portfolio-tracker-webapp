import {
	createChartScene,
	findNearestPoint,
	renderChartSvg,
	type SceneNode,
} from "@tanstack/charts";
import { focusGroupX } from "@tanstack/charts/focus";
import { createChartTooltipContent } from "@tanstack/charts/tooltip/model";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import PortfolioCharts from "@/features/portfolio/components/portfolio-charts";
import type { Portfolio } from "@/types";
import {
	createAllocationChart,
	createPortfolioChartConfig,
	createTrendsChart,
} from "./charts";

function portfolio(
	id: string,
	date: string,
	overrides: Partial<Portfolio> = {},
): Portfolio {
	return {
		id,
		date,
		investedValue: 100,
		currentValue: 120,
		investedValuePercent: 50,
		currentValuePercent: 50,
		xirrPercent: 10,
		...overrides,
	};
}

const allocations = [
	portfolio("small", "2026-01-01", {
		investedValuePercent: 33.333,
		currentValuePercent: 25,
	}),
	portfolio("large", "2026-01-01", {
		investedValuePercent: 66.667,
		currentValuePercent: 75,
	}),
];
const label = ({ id }: Portfolio) => `Portfolio ${id}`;
const config = createPortfolioChartConfig(allocations, label);

function flatten(nodes: readonly SceneNode[]): SceneNode[] {
	return nodes.flatMap((node) =>
		node.kind === "group" ? flatten(node.children) : [node],
	);
}

describe("allocation charts", () => {
	it.each([
		180, 640,
	])("preserves slices, colors and hover values at %ipx", (width) => {
		const originalOrder = allocations.map(({ id }) => id);
		const definition = createAllocationChart(
			allocations,
			config,
			(row) => row.investedValuePercent,
		);
		const scene = createChartScene(definition, { width, height: width });
		expect(allocations.map(({ id }) => id)).toEqual(originalOrder);
		expect(scene.points.map(({ datum }) => [datum.id, datum.value])).toEqual([
			["large", 66.67],
			["small", 33.33],
		]);
		const point = scene.points[0];
		expect(point.color).toBe(config.large.color);
		expect(findNearestPoint(scene, point.x, point.y)?.datum.id).toBe("large");
		expect(
			createChartTooltipContent([point], scene, false, definition.tooltip),
		).toEqual({
			rows: [
				{
					label: "Portfolio large",
					value: "66.67%",
					color: config.large.color,
				},
			],
		});
		expect(renderChartSvg(scene, { ariaLabel: "Allocation" })).not.toMatch(
			/NaN|Infinity/,
		);
	});

	it("uses the current percentages without changing series colors and labels", () => {
		const definition = createAllocationChart(
			allocations,
			config,
			(row) => row.currentValuePercent,
		);
		const scene = createChartScene(definition, { width: 320, height: 320 });
		expect(scene.points.map(({ datum }) => datum.value)).toEqual([75, 25]);
		const markup = renderToStaticMarkup(
			<PortfolioCharts portfolios={allocations} labelFn={label} />,
		);
		expect(markup).toContain('aria-label="Invested Value Allocation (%)"');
		expect(markup).toContain('aria-label="Current Value Allocation (%)"');
		expect(markup).toContain("Portfolio small");
		expect(markup).toContain("Portfolio large");
	});
});

describe("trend charts", () => {
	const rows = [
		portfolio("large", "2026-01-11", { investedValue: 150 }),
		portfolio("small", "2026-01-01", { investedValue: 40 }),
		portfolio("large", "2026-01-01", { investedValue: 100 }),
		portfolio("small", "2026-01-02", { investedValue: 50 }),
		portfolio("small", "2026-01-11", { investedValue: 60 }),
	];
	const currency = (value: number) => `$${value.toFixed(2)}`;

	it.each([
		320, 960,
	])("preserves time spacing, zero baseline, line gaps and grouped totals at %ipx", (width) => {
		const definition = createTrendsChart(
			rows,
			config,
			(row) => row.investedValue,
			currency,
			true,
		);
		const scene = createChartScene(definition, { width, height: 360 });
		expect(scene.scales.y.domain[0]).toBe(0);
		expect(scene.chart.width).toBeGreaterThan(0);
		const small = scene.points.filter(({ datum }) => datum.id === "small");
		expect((small[1].x - small[0].x) / (small[2].x - small[0].x)).toBeCloseTo(
			0.1,
		);
		const largePaths = flatten(scene.nodes).filter(
			(node) =>
				node.kind === "polyline" &&
				node.interaction?.points?.[0]?.group === "large",
		);
		expect(largePaths).toHaveLength(2);
		const navigation = focusGroupX.navigation(scene.points);
		expect(navigation).toHaveLength(3);
		const firstGroup = focusGroupX.group(scene.points, {
			point: navigation[0],
		});
		expect(
			createChartTooltipContent(firstGroup, scene, false, definition.tooltip),
		).toEqual({
			title: "2026-01-01",
			rows: [
				{
					label: "Portfolio large",
					value: "$100.00",
					color: config.large.color,
				},
				{
					label: "Portfolio small",
					value: "$40.00",
					color: config.small.color,
				},
				{ label: "Total", value: "$140.00" },
			],
		});
		const gapGroup = focusGroupX.group(scene.points, { point: navigation[1] });
		expect(
			createChartTooltipContent(gapGroup, scene, false, definition.tooltip),
		).toMatchObject({
			title: "2026-01-02",
			rows: [
				{ label: "Portfolio small", value: "$50.00" },
				{ label: "Total", value: "$50.00" },
			],
		});
		expect(renderChartSvg(scene, { ariaLabel: "Trends" })).not.toMatch(
			/NaN|Infinity/,
		);
	});

	it.each([
		{
			name: "current value",
			value: (row: Portfolio) => row.currentValue,
			format: currency,
			expected: "$120.00",
		},
		{
			name: "XIRR",
			value: (row: Portfolio) => row.xirrPercent,
			format: (value: number) => `${value}%`,
			expected: "-5%",
		},
		{
			name: "ratio",
			value: (row: Portfolio) =>
				row.currentValue / Math.max(1, row.investedValue),
			format: String,
			expected: "1.2",
		},
	])("preserves $name formatting without unwanted totals", ({
		value,
		format,
		expected,
	}) => {
		const definition = createTrendsChart(
			[portfolio("large", "2026-01-01", { xirrPercent: -5 })],
			config,
			value,
			format,
			false,
		);
		const scene = createChartScene(definition, { width: 640, height: 360 });
		expect(
			createChartTooltipContent(scene.points, scene, false, definition.tooltip),
		).toMatchObject({
			rows: [{ label: "Portfolio large", value: expected }],
		});
		expect(renderChartSvg(scene, { ariaLabel: "Trends" })).not.toMatch(
			/NaN|Infinity/,
		);
	});
});

it("renders empty and all-zero allocations and trends without invalid geometry", () => {
	for (const rows of [
		[],
		[
			portfolio("large", "2026-01-01", {
				investedValuePercent: 0,
				investedValue: 0,
			}),
		],
	]) {
		const config = createPortfolioChartConfig(rows, label);
		for (const scene of [
			createChartScene(
				createAllocationChart(rows, config, (row) => row.investedValuePercent),
				{ width: 320, height: 240 },
			),
			createChartScene(
				createTrendsChart(
					rows,
					config,
					(row) => row.investedValue,
					String,
					true,
				),
				{ width: 320, height: 240 },
			),
		]) {
			expect(renderChartSvg(scene, { ariaLabel: "Empty chart" })).not.toMatch(
				/NaN|Infinity/,
			);
		}
	}
});
