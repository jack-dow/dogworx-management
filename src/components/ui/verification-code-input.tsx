"use client";

import * as React from "react";
import { cva } from "class-variance-authority";
import { CodeInput, getSegmentCssWidth } from "rci";

import { cn } from "~/lib/utils";

const useIsFocused = (inputRef: React.RefObject<HTMLInputElement>) => {
	const [isFocused, setIsFocused] = React.useState<boolean | undefined>(undefined);
	const isFocusedRef = React.useRef<boolean | undefined>(isFocused);

	isFocusedRef.current = isFocused;

	React.useEffect(() => {
		const input = inputRef.current;
		if (!input) return;

		const onFocus = () => setIsFocused(true);
		const onBlur = () => setIsFocused(false);
		input.addEventListener("focus", onFocus);
		input.addEventListener("blur", onBlur);

		if (isFocusedRef.current === undefined) setIsFocused(document.activeElement === input);

		return () => {
			input.removeEventListener("focus", onFocus);
			input.removeEventListener("blur", onBlur);
		};
	}, [inputRef, setIsFocused]);

	return isFocused;
};

const segmentVariants = cva(
	'flex h-full appearance-none rounded-md border-2 border-slate-300 bg-white [--segment-color:#94a3b8] data-[state="error"]:[--segment-color:#ef4444] data-[state="success"]:[--segment-color:#10b981]',
	{
		variants: {
			state: {
				active: "shadow-[var(--segment-color)_0_0_0_1px] data-[state]:border-[var(--segment-color)]",
				loading: "opacity-50",
			},
		},
	},
);

type CodeState = "input" | "loading" | "error" | "success";

const VerificationCodeInput = ({ onSubmit }: { onSubmit: (code: string) => Promise<void> }) => {
	const [state, setState] = React.useState<CodeState>("input");
	const inputRef = React.useRef<HTMLInputElement>(null);
	const focused = useIsFocused(inputRef);

	const length = 6;
	const padding = "10px";
	const width = getSegmentCssWidth(padding);
	const isError = state === "error";
	const errorClassName = "motion-safe:animate-[shake_0.15s_ease-in-out_0s_2]";

	return (
		<div className="space-y-2">
			<CodeInput
				id="verify-email-address-code-input"
				className={isError ? errorClassName : ""}
				inputClassName="caret-transparent selection:bg-transparent"
				length={length}
				readOnly={state !== "input"}
				disabled={state === "loading"}
				inputRef={inputRef}
				padding={padding}
				spacing={padding}
				autoFocus={true}
				spellCheck={false}
				inputMode="numeric"
				pattern="[0-9]*"
				autoComplete="one-time-code"
				onChange={({ currentTarget: input }) => {
					// only accept numbers
					input.value = input.value.replace(/\D+/g, "");

					// auto submit on input fill
					if (input.value.length === length) {
						setState("loading");

						onSubmit(input.value)
							.then(() => {
								setState("success");
							})
							.catch(() => {
								setState("error");
								setTimeout(() => {
									setState("input");
									input.value = "";
									input.dispatchEvent(new Event("input"));
									input.focus();
								}, 750);
							});
					}
				}}
				renderSegment={(segment) => {
					const isCaret = focused && segment.state === "cursor";
					const isSelection = focused && segment.state === "selected";
					const isLoading = state === "loading";
					const isSuccess = state === "success";
					const isError = state === "error";
					const isActive = isSuccess || isError || isSelection || isCaret;

					return (
						<div
							key={segment.index}
							data-state={state}
							className={segmentVariants({ state: isActive ? "active" : isLoading ? "loading" : undefined })}
							style={{ width }}
						>
							<div
								className={cn(
									isSelection && "flex-1 m-[3px] rounded-sm bg-[var(--segment-color)] opacity-[0.15625]",
									isCaret &&
										"flex-[0_0_2px] justify-self-center mx-auto my-2 w-0.5 bg-black animate-[blink-caret_1.2s_step-end_infinite]",
								)}
							/>
						</div>
					);
				}}
			/>
			{state === "error" && <p className="text-[0.8rem] font-medium text-destructive">Incorrect code</p>}
		</div>
	);
};

export { VerificationCodeInput };
