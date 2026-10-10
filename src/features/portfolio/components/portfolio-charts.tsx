import { Chart } from "@tanstack/charts/react";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { type ChartConfig, ChartLegend } from "@/components/ui/chart";
import {
	createAllocationChart,
	createPortfolioChartConfig,
} from "@/features/portfolio/lib/charts";
import type { Portfolio } from "@/types";

export default function PortfolioCharts<TPortfolio extends Portfolio>({
	portfolios,
	labelFn,
}: {
	portfolios: TPortfolio[];
	labelFn: (portfolio: TPortfolio) => string;
}) {
	const chartConfig = createPortfolioChartConfig(portfolios, labelFn);

	return (
		<div className="grid grid-cols-2 gap-2 mb-2">
			<PortfolioChart
				portfolios={portfolios}
				chartConfig={chartConfig}
				title="Invested Value Allocation (%)"
				valuePercentFn={(portfolio) => portfolio.investedValuePercent}
			/>
			<PortfolioChart
				portfolios={portfolios}
				chartConfig={chartConfig}
				title="Current Value Allocation (%)"
				valuePercentFn={(portfolio) => portfolio.currentValuePercent}
			/>
		</div>
	);
}

function PortfolioChart<TPortfolio extends Portfolio>({
	portfolios,
	chartConfig,
	title,
	valuePercentFn,
}: {
	portfolios: TPortfolio[];
	chartConfig: ChartConfig;
	title: string;
	valuePercentFn: (portfolio: TPortfolio) => number;
}) {
	const definition = createAllocationChart(
		portfolios,
		chartConfig,
		valuePercentFn,
	);

	return (
		<Card className="m-auto rounded-lg w-full min-w-0">
			<CardTitle className="text-center m-2 text-base">{title}</CardTitle>
			<CardContent className="p-2">
				<Chart
					definition={definition}
					ariaLabel={title}
					aspectRatio={1}
					initialWidth={320}
					className="text-xs"
				/>
				<ChartLegend config={chartConfig} className="grid-cols-2" />
			</CardContent>
		</Card>
	);
}
