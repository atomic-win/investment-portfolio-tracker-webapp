import _ from "lodash";
import ErrorComponent from "@/components/error-component";
import LoadingComponent from "@/components/loading-component";
import useValuationsQueries from "@/features/portfolio/hooks/valuations";
import {
	type AssetItem,
	type Portfolio,
	PortfolioType,
	type Valuation,
} from "@/types";

export function withValuations<
	TPortfolio extends Portfolio,
	T extends {
		portfolios: TPortfolio[];
	},
>(
	Component: React.ComponentType<T>,
	idSelector: (assetItem: AssetItem) => string,
	portfolioFn?: (assetItems: AssetItem[], portfolio: Portfolio) => TPortfolio,
) {
	return function WithValuations(
		props: Omit<T, "portfolios"> & {
			assetItems: AssetItem[];
			assetItemIds: string[];
			latest: boolean;
			currency: string;
		},
	) {
		const valuationQueryResults = useValuationsQueries(
			props.assetItems,
			props.assetItemIds.length > 0
				? props.assetItemIds
				: props.assetItems.map((assetItem) => assetItem.id),
			props.currency,
			idSelector,
		);

		if (valuationQueryResults.some((result) => result.isFetching)) {
			return <LoadingComponent loadingMessage="Fetching valuations" />;
		}

		if (valuationQueryResults.some((result) => result.isError)) {
			return <ErrorComponent errorMessage="Failed while fetching valuations" />;
		}

		return (
			<Component
				{...(props as unknown as T)}
				portfolios={calculatePortfolios(
					valuationQueryResults.flatMap((result) => result.data || []),
					props.latest,
				).map((portfolio) =>
					portfolioFn
						? portfolioFn(props.assetItems, portfolio)
						: (portfolio as TPortfolio),
				)}
			/>
		);
	};
}

function calculatePortfolios(
	valuations: Valuation[],
	isLatest: boolean,
): Portfolio[] {
	const dateToValuations = new Map<string, Valuation[]>();
	const latestDate = _.max(valuations.map((valuation) => valuation.date));

	for (const valuation of valuations) {
		if (
			!isLatest &&
			valuation.investedValue === 0 &&
			valuation.currentValue === 0 &&
			valuation.xirrPercent === 0
		) {
			continue;
		}

		if (isLatest && valuation.date !== latestDate) {
			continue;
		}

		const valuations = dateToValuations.get(valuation.date) || [];
		valuations.push(valuation);
		dateToValuations.set(valuation.date, valuations);
	}

	return Array.from(dateToValuations.values()).flatMap((valuations) => {
		return calculatePortfolio(valuations);
	});
}

function calculatePortfolio(valuations: Valuation[]): Portfolio[] {
	const totalInvestedValue = valuations.reduce((sum, valuation) => {
		return sum + valuation.investedValue;
	}, 0);

	const totalCurrentValue = valuations.reduce((sum, valuation) => {
		return sum + valuation.currentValue;
	}, 0);

	return valuations.map((valuation) => {
		return {
			id: valuation.id,
			date: valuation.date,
			type: PortfolioType.Unknown,
			investedValue: valuation.investedValue,
			investedValuePercent:
				(valuation.investedValue / (totalInvestedValue || 1)) * 100,
			currentValue: valuation.currentValue,
			currentValuePercent:
				(valuation.currentValue / (totalCurrentValue || 1)) * 100,
			xirrPercent: valuation.xirrPercent,
		};
	});
}
