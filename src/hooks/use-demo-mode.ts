import { useLocalStorage } from "usehooks-ts";

export function useDemoMode() {
	return useLocalStorage<number | null>("demoModeFactor", null);
}
