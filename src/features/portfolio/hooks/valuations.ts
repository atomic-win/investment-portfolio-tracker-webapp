import { useQueries } from "@tanstack/react-query";

import { useDemoMode } from "@/hooks/use-demo-mode";
import { usePrimalApiClient } from "@/hooks/use-primal-api-client";
import type { AssetItem, Valuation } from "@/types";

export default function useValuationsQueries(
	assetItems: AssetItem[],
	assetItemIds: string[] | undefined,
	currency: string | undefined,
	idSelector: (assetItem: AssetItem) => string,
) {
	const primalApiClient = usePrimalApiClient();
	const [demoModeFactor] = useDemoMode();
	const multiplier = demoModeFactor ?? 1;
	assetItemIds = (assetItemIds || []).sort();
	assetItems = assetItems || [];

	const queryInputs = getQueryInputs(assetItems, assetItemIds, idSelector);

	return useQueries({
		queries: queryInputs.map(({ id, assetItemIds }) => ({
			queryKey: [
				"valuations",
				{
					assetItemIds,
					currency,
				},
			],
			queryFn: async () => {
				const response = await primalApiClient.get(
					`asset-items/valuations?${assetItemIds
						.map((id) => `assetItemIds=${id}`)
						.join("&")}&currency=${currency}`,
				);
				return response.data as Valuation[];
			},
			enabled: !!currency && assetItemIds.length > 0 && assetItems.length > 0,
			select: (valuations: Valuation[]) =>
				valuations.map((valuation) => ({
					...valuation,
					id,
					investedValue: valuation.investedValue * multiplier,
					currentValue: valuation.currentValue * multiplier,
				})),
		})),
	});
}

function getQueryInputs(
	assetItems: AssetItem[],
	assetItemIds: string[],
	idSelector: (assetItem: AssetItem) => string,
): { id: string; assetItemIds: string[] }[] {
	const idToAssetItemIds = new Map<string, string[]>();

	for (const assetItemId of assetItemIds) {
		// biome-ignore lint/style/noNonNullAssertion: we assume that all assetItemIds are valid and exist in assetItems
		const assetItem = assetItems.find((x) => x.id === assetItemId)!;

		const id = idSelector(assetItem);

		if (!idToAssetItemIds.has(id)) {
			idToAssetItemIds.set(id, []);
		}

		// biome-ignore lint/style/noNonNullAssertion: we assume that all assetItemIds are valid and exist in assetItems
		idToAssetItemIds.get(id)!.push(assetItemId);
	}

	return Array.from(idToAssetItemIds.entries()).map(([id, assetItemIds]) => ({
		id,
		assetItemIds,
	}));
}
