import { AssetClass, AssetType } from "@/types";

export function displayCurrencyAmountText(
	locale: string,
	currency: string,
	amount: number,
	notation: "standard" | "compact",
	maximumFractionDigits: number,
) {
	return Intl.NumberFormat(locale, {
		style: "currency",
		currency,
		currencyDisplay: "symbol",
		maximumFractionDigits,
		notation,
	}).format(amount);
}

export function displayPercentage(percent: number) {
	return Intl.NumberFormat("en-IN", {
		style: "percent",
		maximumFractionDigits: 2,
	}).format(percent / 100);
}

export function displayAssetTypeText(assetType: AssetType) {
	switch (assetType) {
		case AssetType.BankAccount:
			return "Bank Account";
		case AssetType.Wallet:
			return "Wallet";
		case AssetType.TradingAccount:
			return "Trading Account";
		case AssetType.FixedDeposit:
			return "Fixed Deposit";
		case AssetType.EPF:
			return "Employee Provident Fund";
		case AssetType.PPF:
			return "Public Provident Fund";
		case AssetType.MutualFund:
			return "Mutual Fund";
		case AssetType.Stock:
			return "Stock";
		case AssetType.ETF:
			return "ETF";
		case AssetType.Bond:
			return "Bond";
		default:
			throw new Error(`Unknown asset type: ${assetType}`);
	}
}

export function displayAssetClassText(assetClass: AssetClass) {
	switch (assetClass) {
		case AssetClass.Equity:
			return "Equity";
		case AssetClass.Debt:
			return "Debt";
		case AssetClass.Commodities:
			return "Commodities";
		case AssetClass.EmergencyFund:
			return "Emergency Fund";
		default:
			throw new Error(`Unknown asset class: ${assetClass}`);
	}
}
