import { useNavigate, useSearch } from "@tanstack/react-router";
import { cn } from "cn";
import { SlidersHorizontalIcon } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
	FieldDescription,
	FieldGroup,
	FieldLabel,
	FieldLegend,
	FieldSeparator,
	FieldSet,
} from "@/components/ui/field";
import { displayAssetClassText, displayAssetTypeText } from "@/lib/utils";
import { AssetClass, type AssetItem, AssetType } from "@/types";

export default function InvestmentsFilterForm({
	assetItems,
}: {
	assetItems: AssetItem[];
}) {
	const search = useSearch({ strict: false }) as Record<string, unknown>;
	const navigate = useNavigate();

	const selectedAssetClasses = (search.assetClass as AssetClass[]) || [];
	const selectedAssetTypes = (search.assetType as AssetType[]) || [];
	const selectedAssetItemIds = (search.assetItemId as string[]) || [];

	function onCheckedChange(data: {
		filterType: "assetClass" | "assetType" | "assetItemId";
		toggledValue: string;
	}) {
		const currentValues = {
			assetClass: selectedAssetClasses,
			assetType: selectedAssetTypes,
			assetItemId: selectedAssetItemIds,
		};

		const currentValueList = currentValues[data.filterType] as string[];

		if (currentValueList.includes(data.toggledValue)) {
			currentValueList.splice(currentValueList.indexOf(data.toggledValue), 1);
		} else {
			currentValueList.push(data.toggledValue);
		}

		navigate({
			// @ts-expect-error shared component - search params not bound to a specific route
			search: (prev: Record<string, unknown>) => ({
				...prev,
				[data.filterType]:
					currentValueList.length > 0 ? currentValueList : undefined,
			}),
		});
	}

	return (
		<Card className="mx-auto my-2 p-4 rounded-lg shadow-md">
			<FieldGroup className="px-2 gap-y-4">
				<FieldSet>
					<FieldLegend className="flex items-center ">
						<SlidersHorizontalIcon className="h-4 w-4" />
						<span className="ml-2">Filters</span>
					</FieldLegend>
					<FieldDescription>
						Select filters to apply for portfolio calculation
					</FieldDescription>
				</FieldSet>
				<FieldSeparator />
				<FieldSet className="gap-y-3">
					<FieldLegend>Asset Class</FieldLegend>
					<FieldDescription>
						Select the Asset Classes for portfolio calculation
					</FieldDescription>
					{Object.values(AssetClass).map((assetClass) => (
						<div
							key={assetClass}
							className="flex flex-row items-center space-x-3 space-y-0"
						>
							<Checkbox
								checked={selectedAssetClasses.includes(assetClass)}
								onCheckedChange={() =>
									onCheckedChange({
										filterType: "assetClass",
										toggledValue: assetClass,
									})
								}
							/>
							<FieldLabel className="font-normal">
								{displayAssetClassText(assetClass)}
							</FieldLabel>
						</div>
					))}
				</FieldSet>
				<FieldSeparator />
				<FieldSet className="gap-y-3">
					<FieldLegend>Asset Type</FieldLegend>
					<FieldDescription>
						Select the Asset Types for portfolio calculation
					</FieldDescription>
					{Object.values(AssetType).map((assetType) => (
						<div
							key={assetType}
							className={cn(
								"flex flex-row items-center space-x-3 space-y-0",
								isAssetTypeDisabled(
									selectedAssetClasses,
									assetItems,
									assetType,
								) && "opacity-50",
							)}
						>
							<Checkbox
								checked={
									selectedAssetTypes.includes(assetType) &&
									!isAssetTypeDisabled(
										selectedAssetClasses,
										assetItems,
										assetType,
									)
								}
								onCheckedChange={() =>
									onCheckedChange({
										filterType: "assetType",
										toggledValue: assetType,
									})
								}
								disabled={isAssetTypeDisabled(
									selectedAssetClasses,
									assetItems,
									assetType,
								)}
							/>
							<FieldLabel className="font-normal">
								{displayAssetTypeText(assetType)}
							</FieldLabel>
						</div>
					))}
				</FieldSet>
				<FieldSeparator />
				<FieldSet className="gap-y-3">
					<FieldLegend>Asset Items</FieldLegend>
					<FieldDescription>
						Select the Asset Items for portfolio calculation
					</FieldDescription>
					{assetItems.map((assetItem) => (
						<div
							key={assetItem.id}
							className={cn(
								"flex flex-row items-center space-x-3 space-y-0",
								isAssetItemDisabled(
									selectedAssetClasses,
									selectedAssetTypes,
									assetItem,
								) && "opacity-50",
							)}
						>
							<Checkbox
								checked={
									selectedAssetItemIds.includes(assetItem.id) &&
									!isAssetItemDisabled(
										selectedAssetClasses,
										selectedAssetTypes,
										assetItem,
									)
								}
								onCheckedChange={() =>
									onCheckedChange({
										filterType: "assetItemId",
										toggledValue: assetItem.id,
									})
								}
								disabled={isAssetItemDisabled(
									selectedAssetClasses,
									selectedAssetTypes,
									assetItem,
								)}
							/>
							<FieldLabel className="font-normal">{assetItem.name}</FieldLabel>
						</div>
					))}
				</FieldSet>
			</FieldGroup>
		</Card>
	);
}

function isAssetTypeDisabled(
	selectedAssetClasses: AssetClass[],
	assetItems: AssetItem[],
	assetType: AssetType,
): boolean {
	const filteredAssetItems = assetItems.filter((assetItem) =>
		selectedAssetClasses.length
			? selectedAssetClasses.includes(assetItem.assetClass)
			: true,
	);

	return !filteredAssetItems
		.map((assetItem) => assetItem.assetType)
		.includes(assetType);
}

function isAssetItemDisabled(
	selectedAssetClasses: AssetClass[],
	selectedAssetTypes: AssetType[],
	assetItem: AssetItem,
): boolean {
	if (
		selectedAssetClasses.length > 0 &&
		!selectedAssetClasses.includes(assetItem.assetClass)
	) {
		return true;
	}

	if (
		selectedAssetTypes.length > 0 &&
		!selectedAssetTypes.includes(assetItem.assetType)
	) {
		return true;
	}

	return false;
}
