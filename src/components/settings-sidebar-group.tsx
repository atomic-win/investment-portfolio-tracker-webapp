import { cn } from "cn";
import { ChevronRight } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	SidebarGroup,
	SidebarGroupLabel,
	SidebarMenu,
	SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useDemoMode } from "@/hooks/use-demo-mode";
import { useUpdateUserMutation, useUserQuery } from "@/hooks/users";
import { Currency, Locale } from "@/types";

export default function SettingsSidebarGroup() {
	const { data, isFetching, error } = useUserQuery();
	const { mutate: updateUser } = useUpdateUserMutation();

	if (
		isFetching ||
		error ||
		!data ||
		!data.preferredLocale ||
		!data.preferredCurrency
	) {
		return <SidebarGroup className="mt-auto" />;
	}

	const settings = [
		{
			name: "currency",
			title: "Currency",
			value: data.preferredCurrency,
			options: Object.values(Currency).filter((x) => x !== Currency.Unknown),
		},
		{
			name: "locale",
			title: "Locale",
			value: data.preferredLocale,
			options: Object.values(Locale),
		},
	];

	return (
		<SidebarGroup className="mt-auto">
			<SidebarGroupLabel>Settings</SidebarGroupLabel>
			<SidebarMenu>
				{settings.map((setting) => (
					<DropdownMenu key={setting.name}>
						<DropdownMenuTrigger
							className={cn(
								"w-full rounded-lg px-3 py-2 flex justify-between",
								buttonVariants({
									variant: "outline",
								}),
							)}
							aria-label="Select a value"
						>
							<span>
								{setting.title} - {setting.value}
							</span>
							<ChevronRight className="h-4 w-4 opacity-50" />
						</DropdownMenuTrigger>
						<DropdownMenuContent side="right" align="center">
							{setting.options.map((option) => (
								<DropdownMenuCheckboxItem
									key={option}
									checked={option === setting.value}
									onCheckedChange={() =>
										updateUser(
											setting.name === "currency"
												? {
														preferredCurrency: option as Currency,
													}
												: {
														preferredLocale: option as Locale,
													},
										)
									}
								>
									{option}
								</DropdownMenuCheckboxItem>
							))}
						</DropdownMenuContent>
					</DropdownMenu>
				))}
				<SidebarMenuItem>
					<DemoButton />
				</SidebarMenuItem>
			</SidebarMenu>
		</SidebarGroup>
	);
}

function DemoButton() {
	const [demoModeFactor, setDemoModeFactor] = useDemoMode();
	const isDemoMode = demoModeFactor !== null;

	return (
		<>
			<Button
				type="button"
				className="w-full cursor-pointer rounded-lg px-3 py-2"
				variant={isDemoMode ? "destructive" : "outline"}
				onClick={() =>
					setDemoModeFactor(isDemoMode ? null : Math.random() * 0.1)
				}
			>
				{isDemoMode ? "Turn Demo Mode Off" : "Turn Demo Mode On"}
			</Button>
			{isDemoMode && (
				<p className="px-3 pt-2 text-xs text-muted-foreground">
					Valuation amounts are scaled for demo.
				</p>
			)}
		</>
	);
}
