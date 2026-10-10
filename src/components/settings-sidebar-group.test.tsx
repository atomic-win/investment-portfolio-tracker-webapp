import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { useDemoMode } from "@/hooks/use-demo-mode";
import SettingsSidebarGroup from "./settings-sidebar-group";

vi.mock("@/hooks/use-demo-mode", () => ({
	useDemoMode: vi.fn(),
}));

vi.mock("@/hooks/users", () => ({
	useUserQuery: () => ({
		data: { preferredLocale: "en-US", preferredCurrency: "USD" },
		isFetching: false,
		error: null,
	}),
	useUpdateUserMutation: () => ({ mutate: vi.fn() }),
}));

describe("demo mode settings", () => {
	it("offers an outline button and no note when disabled", () => {
		vi.mocked(useDemoMode).mockReturnValue([null, vi.fn(), vi.fn()]);
		const html = renderToStaticMarkup(<SettingsSidebarGroup />);
		expect(html).toMatch(/<button[^>]*bg-background[^>]*>Turn Demo Mode On/);
		expect(html).toContain("Turn Demo Mode On");
		expect(html).not.toContain("Turn Demo Mode Off");
		expect(html).not.toContain("Valuation amounts are scaled for demo.");
	});

	it.each([
		0, 0.05,
	])("offers a destructive button and note for enabled factor %s", (factor) => {
		vi.mocked(useDemoMode).mockReturnValue([factor, vi.fn(), vi.fn()]);
		const html = renderToStaticMarkup(<SettingsSidebarGroup />);
		expect(html).toContain("bg-destructive/10");
		expect(html).toContain("Turn Demo Mode Off");
		expect(html).not.toContain("Turn Demo Mode On");
		expect(html).toContain("Valuation amounts are scaled for demo.");
	});
});
