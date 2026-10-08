import { Modal } from "./Modal";
import { Button } from "./Button";

interface ConfirmDialogProps {
	open: boolean;
	title: string;
	description: string;
	confirmLabel?: string;
	cancelLabel?: string;
	destructive?: boolean;
	busy?: boolean;
	onConfirm: () => void;
	onCancel: () => void;
}

export function ConfirmDialog({
	open,
	title,
	description,
	confirmLabel = "Confirm",
	cancelLabel = "Cancel",
	destructive = false,
	busy = false,
	onConfirm,
	onCancel,
}: ConfirmDialogProps) {
	return (
		<Modal open={open} onClose={onCancel} title={title} description={description} className="max-w-md">
			<div className="mt-6 flex flex-col-reverse justify-end gap-2 sm:flex-row">
				<Button variant="secondary" onClick={onCancel} disabled={busy}>{cancelLabel}</Button>
				<Button variant={destructive ? "danger" : "primary"} onClick={onConfirm} disabled={busy}>
					{busy ? "Please wait…" : confirmLabel}
				</Button>
			</div>
		</Modal>
	);
}