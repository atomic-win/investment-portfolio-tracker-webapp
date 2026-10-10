import { Chart } from "@tanstack/charts/react";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { type ChartConfig, ChartLegend } from "@/components/ui/chart";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	createPortfolioChartConfig,
	createTrendsChart,
} from "@/features/portfolio/lib/charts";
import { displayPortfolioType } from "@/features/portfolio/lib/utils";
import { useUserQuery } from "@/hooks/users";
import { displayCurrencyAmountText, displayPercentage } from "@/lib/utils";
import type { Portfolio, PortfolioType } from "@/types";

enum TrendType {
	InvestedValue = "InvestedValue",
	CurrentValue = "CurrentValue",
	XIRR = "XIRR",
	Ratio = "Ratio",
}

export default function withPortfolioTrendsSection<
	TPortfolio extends Portfolio,
>({
	portfolioType,
	labelFn,
	showTotalInTooltip = true,
}: {
	portfolioType: PortfolioType;
	labelFn: (portfolio: TPortfolio) => string;
	showTotalInTooltip?: boolean;
}) {
	return function PortfolioTrendsSection({
		portfolios,
	}: {
		portfolios: TPortfolio[];
	}) {
		const { data: user, isFetching: isUserFetching, error } = useUserQuery();

		const search = useSearch({ strict: false }) as Record<string, unknown>;
		const navigate = useNavigate();

		if (isUserFetching || error || !user) {
			return null;
		}

		const chartConfig = createPortfolioChartConfig(
			filterLatestPortfolios(portfolios),
			labelFn,
		);

		const { preferredCurrency, preferredLocale } = user;
		const activeTrendType =
			(search.trendType as TrendType) || TrendType.InvestedValue;

		function handleTabChange(trendType: TrendType) {
			navigate({
				// @ts-expect-error shared component - search params not bound to a specific route
				search: (prev: Record<string, unknown>) => ({ ...prev, trendType }),
			});
		}

		return (
			<Tabs
				value={activeTrendType}
				onValueChange={(value) => handleTabChange(value as TrendType)}
			>
				<TabsList className="grid w-full grid-cols-4">
					<TabsTrigger value={TrendType.InvestedValue}>
						{displayTrendType(TrendType.InvestedValue)}
					</TabsTrigger>
					<TabsTrigger value={TrendType.CurrentValue}>
						{displayTrendType(TrendType.CurrentValue)}
					</TabsTrigger>
					<TabsTrigger value={TrendType.XIRR}>
						{displayTrendType(TrendType.XIRR)}
					</TabsTrigger>
					<TabsTrigger value={TrendType.Ratio}>
						{displayTrendType(TrendType.Ratio)}
					</TabsTrigger>
				</TabsList>
				<TabsContent value={TrendType.InvestedValue}>
					<TrendsChart
						portfolioType={portfolioType}
						portfolios={portfolios}
						chartConfig={chartConfig}
						chartTitle="Invested Value Trend"
						valueFn={(portfolio) => portfolio.investedValue}
						yAxisFormat={(value) =>
							displayCurrencyAmountText(
								// biome-ignore lint/style/noNonNullAssertion: we know that preferredLocale will be defined since we check for user and error states above
								preferredLocale!,
								// biome-ignore lint/style/noNonNullAssertion: we know that preferredCurrency will be defined since we check for user and error states above
								preferredCurrency!,
								value,
								"compact",
								2,
							)
						}
						showTotalInTooltip={showTotalInTooltip}
					/>
				</TabsContent>
				<TabsContent value={TrendType.CurrentValue}>
					<TrendsChart
						portfolioType={portfolioType}
						portfolios={portfolios}
						chartConfig={chartConfig}
						chartTitle="Current Value Trend"
						valueFn={(portfolio) => portfolio.currentValue}
						yAxisFormat={(value) =>
							displayCurrencyAmountText(
								// biome-ignore lint/style/noNonNullAssertion: we know that preferredLocale will be defined since we check for user and error states above
								preferredLocale!,
								// biome-ignore lint/style/noNonNullAssertion: we know that preferredCurrency will be defined since we check for user and error states above
								preferredCurrency!,
								value,
								"compact",
								2,
							)
						}
						showTotalInTooltip={showTotalInTooltip}
					/>
				</TabsContent>
				<TabsContent value={TrendType.XIRR}>
					<TrendsChart
						portfolioType={portfolioType}
						portfolios={portfolios}
						chartConfig={chartConfig}
						chartTitle="XIRR % Trend"
						valueFn={(portfolio) => portfolio.xirrPercent}
						yAxisFormat={(value) => displayPercentage(value)}
						showTotalInTooltip={false}
					/>
				</TabsContent>
				<TabsContent value={TrendType.Ratio}>
					<TrendsChart
						portfolioType={portfolioType}
						portfolios={portfolios}
						chartConfig={chartConfig}
						chartTitle="Current Value / Invested Value Ratio Trend"
						valueFn={(portfolio) =>
							portfolio.currentValue / Math.max(1, portfolio.investedValue)
						}
						yAxisFormat={(value) => displayNumber(value)}
						showTotalInTooltip={false}
					/>
				</TabsContent>
			</Tabs>
		);
	};
}

function TrendsChart<TPortfolio extends Portfolio>({
	portfolioType,
	portfolios,
	chartConfig,
	chartTitle,
	valueFn,
	yAxisFormat,
	showTotalInTooltip,
}: {
	portfolioType: PortfolioType;
	portfolios: TPortfolio[];
	chartConfig: ChartConfig;
	chartTitle: string;
	valueFn: (portfolio: TPortfolio) => number;
	yAxisFormat: (value: number) => string;
	showTotalInTooltip: boolean;
}) {
	const definition = createTrendsChart(
		portfolios,
		chartConfig,
		valueFn,
		yAxisFormat,
		showTotalInTooltip,
	);

	return (
		<Card className="mx-auto mt-8 border-0 shadow-none">
			<CardHeader className="flex items-center gap-4 space-y-0 p-4 mt-2 sm:flex-row">
				<div className="grid text-center sm:text-left w-full gap-2 justify-center">
					<CardTitle>
						{chartTitle} - {displayPortfolioType(portfolioType)}
					</CardTitle>
				</div>
			</CardHeader>
			<CardContent>
				<Chart
					definition={definition}
					ariaLabel={`${chartTitle} - ${displayPortfolioType(portfolioType)}`}
					aspectRatio={16 / 9}
					className="mt-2 text-xs"
				/>
				<ChartLegend config={chartConfig} className="grid-cols-4" />
			</CardContent>
		</Card>
	);
}

function filterLatestPortfolios<TPortfolio extends Portfolio>(
	portfolios: TPortfolio[],
) {
	const latestDate = portfolios
		.map((p) => p.date)
		.reduce((acc, date) => (date > acc ? date : acc), "1900-01-01");

	return portfolios.filter((p) => p.date === latestDate);
}

function displayTrendType(trendType: TrendType) {
	switch (trendType) {
		case TrendType.InvestedValue:
			return "Invested Value";
		case TrendType.CurrentValue:
			return "Current Value";
		case TrendType.XIRR:
			return "XIRR";
		case TrendType.Ratio:
			return "Ratio";
		default:
			throw new Error(`Unknown trend type: ${trendType}`);
	}
}

function displayNumber(number: number) {
	return Intl.NumberFormat("en-IN").format(number);
}
