"use client";

import * as React from "react";

import { cn } from "~/lib/utils";
import { Button, type ButtonProps } from "./button";
import { CheckIcon, XIcon } from "./icons";
import { Tooltip, TooltipContent, TooltipTrigger } from "./tooltip";

const ClickToCopy = React.forwardRef<HTMLButtonElement, ButtonProps & { text: string }>(
	({ text, className, children, ...props }, ref) => {
		const [hasCopied, setHasCopied] = React.useState(false);
		const [failedToCopy, setFailedToCopy] = React.useState(false);

		return (
			<Tooltip
				delayDuration={0}
				onOpenChange={(value) => {
					if (value === false) {
						// Wait for the tooltip close animation before resetting the state
						setTimeout(() => {
							setHasCopied(false);
							setFailedToCopy(false);
						}, 150);
					}
				}}
			>
				<TooltipTrigger asChild>
					<Button
						variant="link"
						className={cn("p-0 text-muted-foreground h-auto justify-start truncate", className)}
						size="sm"
						{...props}
						ref={ref}
						onClick={(e) => {
							e.preventDefault();
							try {
								void navigator.clipboard.writeText(text);
								setHasCopied(true);
							} catch (error) {
								setFailedToCopy(true);
							}
						}}
					>
						{children}
					</Button>
				</TooltipTrigger>
				<TooltipContent
					onPointerDownOutside={(e) => {
						e.preventDefault();
					}}
				>
					{failedToCopy ? (
						<span className="flex">
							<XIcon className="mr-1 h-4" /> Failed to copy
						</span>
					) : hasCopied ? (
						<span className="flex">
							<CheckIcon className="mr-1 h-4 w-4" />
							Copied!
						</span>
					) : (
						<span>Click to copy</span>
					)}
				</TooltipContent>
			</Tooltip>
		);
	},
);
ClickToCopy.displayName = "ClickToCopy";

export { ClickToCopy };
