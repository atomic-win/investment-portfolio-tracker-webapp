import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { withValuations } from "@/features/portfolio/hoc/with-valuations";
import useValuationsQueries from "@/features/portfolio/hooks/valuations";
import { useDemoMode } from "@/hooks/use-demo-mode";
import {
	AssetClass,
	type AssetItem,
	AssetType,
	Currency,
	type Portfolio,
	type Valuation,
} from "@/types";

vi.mock("@/hooks/use-demo-mode", () => ({
	useDemoMode: vi.fn(),
}));

vi.mock("@/hooks/use-primal-api-client", () => ({
	usePrimalApiClient: () => ({
		get: vi.fn(() => {
			throw new Error("Demo mode must not need a network request");
		}),
	}),
}));

const assetItems: AssetItem[] = ["a", "b"].map((id) => ({
	id,
	name: id,
	assetType: AssetType.BankAccount,
	assetClass: AssetClass.Debt,
	currency: Currency.USD,
}));

const original: Valuation[] = [
	{
		id: "server-id",
		date: "2026-01-01",
		investedValue: 100,
		currentValue: 120,
		xirrPercent: 20,
	},
	{
		id: "server-id",
		date: "2026-01-02",
		investedValue: 0,
		currentValue: -50,
		xirrPercent: -10,
	},
];

const clients: QueryClient[] = [];

afterEach(() => {
	for (const client of clients) client.clear();
	clients.length = 0;
});

function setFactor(factor: number | null) {
	vi.mocked(useDemoMode).mockReturnValue([factor, vi.fn(), vi.fn()]);
}

function queryKey(id: string) {
	return ["valuations", { assetItemIds: [id], currency: Currency.USD }];
}

function createClient() {
	const client = new QueryClient({
		defaultOptions: { queries: { staleTime: Infinity, retry: false } },
	});
	clients.push(client);
	for (const { id } of assetItems) {
		client.setQueryData(queryKey(id), structuredClone(original));
	}
	return client;
}

function readValuations(client: QueryClient) {
	let data: Valuation[][] = [];
	function Probe() {
		data = useValuationsQueries(
			assetItems,
			assetItems.map(({ id }) => id),
			Currency.USD,
			({ id }) => id,
		).map((query) => query.data ?? []);
		return null;
	}
	renderToStaticMarkup(
		<QueryClientProvider client={client}>
			<Probe />
		</QueryClientProvider>,
	);
	return data;
}

describe("demo valuations", () => {
	it("scales all groups and dates consistently without changing the cache, then restores originals", () => {
		const client = createClient();
		setFactor(0.05);

		const scaled = readValuations(client);
		expect(scaled).toEqual(
			assetItems.map(({ id }) =>
				original.map((valuation) => ({
					...valuation,
					id,
					investedValue: valuation.investedValue * 0.05,
					currentValue: valuation.currentValue * 0.05,
				})),
			),
		);
		expect(readValuations(client)).toEqual(scaled);
		for (const { id } of assetItems) {
			expect(client.getQueryData(queryKey(id))).toEqual(original);
		}

		setFactor(null);
		expect(readValuations(client)).toEqual(
			assetItems.map(({ id }) =>
				original.map((valuation) => ({ ...valuation, id })),
			),
		);
	});

	it("treats zero as enabled rather than restoring real amounts", () => {
		setFactor(0);
		const values = readValuations(createClient()).flat();
		expect(values).toHaveLength(4);
		for (const valuation of values) {
			expect(valuation.investedValue === 0).toBe(true);
			expect(valuation.currentValue === 0).toBe(true);
		}
		expect(values.map(({ xirrPercent }) => xirrPercent)).toEqual([
			20, -10, 20, -10,
		]);
	});

	it.each([
		0.0001, 0,
	])("keeps allocations correct and finite for factor %s", (factor) => {
		setFactor(factor);
		const client = createClient();
		for (const { id } of assetItems) {
			client.setQueryData(queryKey(id), [original[0]]);
		}
		let portfolios: Portfolio[] = [];
		const Probe = withValuations(
			(props: { portfolios: Portfolio[] }) => {
				portfolios = props.portfolios;
				return null;
			},
			({ id }) => id,
		);
		renderToStaticMarkup(
			<QueryClientProvider client={client}>
				<Probe
					assetItems={assetItems}
					assetItemIds={[]}
					currency={Currency.USD}
					latest
				/>
			</QueryClientProvider>,
		);
		expect(portfolios).toHaveLength(2);
		for (const portfolio of portfolios) {
			expect(portfolio.investedValuePercent).toBe(factor === 0 ? 0 : 50);
			expect(portfolio.currentValuePercent).toBe(factor === 0 ? 0 : 50);
		}
	});
});
