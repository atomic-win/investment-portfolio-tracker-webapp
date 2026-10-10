import { Chart } from "@tanstack/charts/react";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { type ChartConfig, ChartLegend } from "@/components/ui/chart";
import {
	createAllocationChart,
	createPortfolioChartConfig,
} from "@/features/portfolio/lib/charts";
import { useUserQuery } from "@/hooks/users";
import { displayCurrencyAmountText } from "@/lib/utils";
import type { Portfolio } from "@/types";

export default function PortfolioCharts<TPortfolio extends Portfolio>({
	portfolios,
	labelFn,
}: {
	portfolios: TPortfolio[];
	labelFn: (portfolio: TPortfolio) => string;
}) {
	const { data: user, isFetching, error } = useUserQuery();
	if (isFetching || error || !user) {
		return null;
	}

	const chartConfig = createPortfolioChartConfig(portfolios, labelFn);
	const formatAmount = (amount: number) =>
		displayCurrencyAmountText(
			user.preferredLocale,
			user.preferredCurrency,
			amount,
			"compact",
			2,
		);

	return (
		<div className="grid grid-cols-2 gap-2 mb-2">
			<PortfolioChart
				portfolios={portfolios}
				chartConfig={chartConfig}
				title="Invested Value Allocation (%)"
				valuePercentFn={(portfolio) => portfolio.investedValuePercent}
				amountFn={(portfolio) => portfolio.investedValue}
				formatAmount={formatAmount}
			/>
			<PortfolioChart
				portfolios={portfolios}
				chartConfig={chartConfig}
				title="Current Value Allocation (%)"
				valuePercentFn={(portfolio) => portfolio.currentValuePercent}
				amountFn={(portfolio) => portfolio.currentValue}
				formatAmount={formatAmount}
			/>
		</div>
	);
}

function PortfolioChart<TPortfolio extends Portfolio>({
	portfolios,
	chartConfig,
	title,
	valuePercentFn,
	amountFn,
	formatAmount,
}: {
	portfolios: TPortfolio[];
	chartConfig: ChartConfig;
	title: string;
	valuePercentFn: (portfolio: TPortfolio) => number;
	amountFn: (portfolio: TPortfolio) => number;
	formatAmount: (amount: number) => string;
}) {
	const definition = createAllocationChart(
		portfolios,
		chartConfig,
		valuePercentFn,
		amountFn,
		formatAmount,
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
