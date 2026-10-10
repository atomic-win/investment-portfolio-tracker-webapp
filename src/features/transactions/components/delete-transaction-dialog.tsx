import { cn } from "cn";
import { Trash2Icon } from "lucide-react";
import type React from "react";
import CurrencyAmount from "@/components/currency-amount";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { buttonVariants } from "@/components/ui/button";
import { useDeleteTransactionMutation } from "@/features/transactions/hooks/transactions";
import type { AssetItemPortfolio, Transaction } from "@/types";

export default function DeleteTransactionDialog({
	assetItem,
	transaction,
}: {
	assetItem: AssetItemPortfolio;
	transaction: Transaction;
}) {
	const { mutateAsync: deleteTransactionAsync } =
		useDeleteTransactionMutation();

	return (
		<AlertDialog>
			<AlertDialogTrigger
				className={cn(
					"cursor-pointer",
					buttonVariants({ variant: "destructive" }),
				)}
			>
				<Trash2Icon />
				Delete
			</AlertDialogTrigger>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
					<AlertDialogDescription>
						This action cannot be undone. This will permanently delete the
						transaction.
					</AlertDialogDescription>
				</AlertDialogHeader>
				<div>
					<InfoLine label="Date" value={transaction.date} />
					<InfoLine label="Transaction Name" value={transaction.name} />
					<InfoLine
						label="Transaction Type"
						value={transaction.transactionType}
					/>
					<InfoLine label="Asset Item Name" value={assetItem.name} />
					<InfoLine label="Units" value={transaction.units.toString()} />
					<InfoLine
						label="Transaction Amount"
						value={<CurrencyAmount amount={transaction.amount} />}
					/>
				</div>
				<AlertDialogFooter>
					<AlertDialogCancel>Cancel</AlertDialogCancel>
					<AlertDialogAction
						variant="destructive"
						className="cursor-pointer"
						onClick={async () => {
							await deleteTransactionAsync({
								assetItemId: assetItem.id,
								transactionId: transaction.id,
							});
						}}
					>
						Delete
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}

function InfoLine({ label, value }: { label: string; value: React.ReactNode }) {
	return (
		<div className="flex">
			<div className="text-sm font-semibold mr-2">{label}:</div>
			<div className="text-sm">{value}</div>
		</div>
	);
}
