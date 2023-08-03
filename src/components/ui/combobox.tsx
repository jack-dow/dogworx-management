import * as React from "react";
import {
	Combobox as ComboboxPrimitive,
	type ComboboxInputProps,
	type ComboboxOptionProps,
	type ComboboxOptionsProps,
} from "@headlessui/react";

import { cn } from "~/utils";
import { ChevronUpDownIcon } from "./icons";
import { Input } from "./input";

const Combobox = ComboboxPrimitive;

const ComboboxInput = React.forwardRef<
	React.ElementRef<typeof ComboboxPrimitive.Input>,
	ComboboxInputProps<"input", string | undefined>
>(({ ...props }, ref) => (
	<div className="relative">
		<ComboboxPrimitive.Input as={Input} ref={ref} {...props} />
		<ComboboxPrimitive.Button className="absolute inset-y-0 right-0 flex items-center pr-3">
			<ChevronUpDownIcon className="h-4 w-4 opacity-50" />
		</ComboboxPrimitive.Button>
	</div>
));
ComboboxInput.displayName = ComboboxPrimitive.Input.displayName;

const ComboboxPopover = React.forwardRef<
	React.ElementRef<typeof ComboboxPrimitive.Options>,
	ComboboxOptionsProps<"div">
>(({ className, children, ...props }, ref) => (
	<ComboboxPrimitive.Options
		ref={ref}
		{...props}
		className={cn(
			"absolute mt-1 z-50 w-72 rounded-md p-1 border bg-popover text-popover-foreground shadow-md outline-none ui-open:animate-in ui-not-open:animate-out ui-not-open:fade-out-0 ui-open:fade-in-0 ui-not-open:zoom-out-95 ui-open:zoom-in-95 slide-in-from-top-2",
			className,
		)}
	>
		{children}
	</ComboboxPrimitive.Options>
));
ComboboxPopover.displayName = ComboboxPrimitive.Options.displayName;

const ComboboxItem = React.forwardRef<
	React.ElementRef<typeof ComboboxPrimitive.Option>,
	ComboboxOptionProps<"div", unknown>
>(({ className, children, ...props }, ref) => (
	<ComboboxPrimitive.Option
		ref={ref}
		{...props}
		className={cn(
			"relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none ui-active:bg-accent ui-active:text-accent-foreground ui-disabled:pointer-events-none ui-disabled:opacity-50",
			className,
		)}
	>
		{children}
	</ComboboxPrimitive.Option>
));
ComboboxItem.displayName = ComboboxPrimitive.Option.displayName;

export { Combobox, ComboboxInput, ComboboxPopover, ComboboxItem };
