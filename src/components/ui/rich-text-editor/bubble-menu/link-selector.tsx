import { useEffect, useRef, type Dispatch, type FC, type SetStateAction } from "react";
import { type Editor } from "@tiptap/core";

import { CheckIcon, TrashIcon } from "~/components/ui/icons";
import { cn } from "~/lib/client-utils";

interface LinkSelectorProps {
	editor: Editor;
	isOpen: boolean;
	setIsOpen: Dispatch<SetStateAction<boolean>>;
}

export const LinkSelector: FC<LinkSelectorProps> = ({ editor, isOpen, setIsOpen }) => {
	const inputRef = useRef<HTMLInputElement>(null);

	// Autofocus on input by default
	useEffect(() => {
		inputRef.current && inputRef.current?.focus();
	});

	return (
		<div className="relative">
			<button
				type="button"
				className="flex h-full items-center space-x-2 px-3 py-1.5 text-sm font-medium text-stone-600 hover:bg-stone-100 active:bg-stone-200"
				onClick={() => {
					setIsOpen(!isOpen);
				}}
			>
				<p className="text-base">↗</p>
				<p
					className={cn("underline decoration-stone-400 underline-offset-4", {
						"text-blue-500": editor.isActive("link"),
					})}
				>
					Link
				</p>
			</button>
			{isOpen && (
				<form
					onSubmit={(e) => {
						e.preventDefault();
						e.stopPropagation();
						const input = (e.target as HTMLFormElement).elements[0] as HTMLInputElement;

						editor.chain().focus().setLink({ href: input.value }).run();
						setIsOpen(false);
					}}
					className="fixed top-full z-[99999] mt-1 flex w-60 overflow-hidden rounded border border-stone-200 bg-white p-1 shadow-xl animate-in fade-in slide-in-from-top-1"
				>
					<input
						ref={inputRef}
						type="url"
						placeholder="Paste a link"
						className="flex-1 bg-white p-1 text-sm outline-none"
						defaultValue={(editor.getAttributes("link").href as string) || ""}
					/>
					{editor.getAttributes("link").href ? (
						<button
							type="button"
							className="flex items-center rounded-sm p-1 text-red-600 transition-all hover:bg-red-100 dark:hover:bg-red-800"
							onClick={() => {
								editor.chain().focus().unsetLink().run();
								setIsOpen(false);
							}}
						>
							<TrashIcon className="h-4 w-4" />
						</button>
					) : (
						<button
							type="button"
							className="flex items-center rounded-sm p-1 text-stone-600 transition-all hover:bg-stone-100"
						>
							<CheckIcon className="h-4 w-4" />
						</button>
					)}
				</form>
			)}
		</div>
	);
};
