"use client";

import { cn } from "~/lib/utils";
import { Input } from "./input";

interface TimeInputProps {
	step?: number;
	className?: string;
	defaultValue?: string;
	value?: string;
	onChange?: (value: string) => void;
}

function TimeInput({ className, defaultValue, value, onChange, ...props }: TimeInputProps) {
	return (
		<div>
			{/* Each segment has a really long name so most styling is done in globals.css */}
			<Input
				{...props}
				type="time"
				onChange={(e) => {
					onChange?.(e.target.value);
				}}
				value={value}
				defaultValue={value ? undefined : defaultValue}
				onKeyDown={(e) => {
					if (e.key === " ") {
						e.preventDefault();
					}
				}}
				className={cn("min-w-[108px] items-center justify-start text-start", className)}
			/>
		</div>
	);
}

export { TimeInput };
