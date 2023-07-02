"use client";

import { Slot } from "@radix-ui/react-slot";

import { Toast, ToastClose, ToastDescription, ToastProvider, ToastTitle, ToastViewport } from "~/components/ui/toast";
import { useToast } from "~/components/ui/use-toast";
import { cn } from "~/lib/utils";

export function Toaster() {
	const { toasts } = useToast();

	return (
		<ToastProvider>
			{toasts.map(function ({ id, icon, title, description, action, ...props }) {
				return (
					<Toast key={id} {...props}>
						<div className="flex w-full items-start">
							{icon && (
								<div className="shrink-0">
									<Slot aria-hidden="true">{icon}</Slot>
								</div>
							)}
							<div className={cn("w-0 flex-1 pt-0.5", icon && "ml-2")}>
								<div className="grid gap-1">
									{title && <ToastTitle>{title}</ToastTitle>}
									{description && <ToastDescription>{description}</ToastDescription>}
								</div>
							</div>
						</div>
						{action}
						<ToastClose />
					</Toast>
				);
			})}
			<ToastViewport />
		</ToastProvider>
	);
}
