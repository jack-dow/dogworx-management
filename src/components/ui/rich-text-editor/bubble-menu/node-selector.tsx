import { type Dispatch, type FC, type SetStateAction } from "react";
import { type Editor } from "@tiptap/core";

import {
	CheckIcon,
	CheckSquareIcon,
	ChevronDownIcon,
	ListBulletsIcon,
	ListNumbersIcon,
	QuotesIcon,
	TextH1Icon,
	TextH2Icon,
	TextH3Icon,
	TextTIcon,
} from "~/components/ui/icons";
import { type BubbleMenuItem } from "./bubble-menu";

interface NodeSelectorProps {
	editor: Editor;
	isOpen: boolean;
	setIsOpen: Dispatch<SetStateAction<boolean>>;
}

export const NodeSelector: FC<NodeSelectorProps> = ({ editor, isOpen, setIsOpen }) => {
	const items: BubbleMenuItem[] = [
		{
			name: "Text",
			icon: TextTIcon,
			command: () => editor.chain().focus().toggleNode("paragraph", "paragraph").run(),
			// I feel like there has to be a more efficient way to do this – feel free to PR if you know how!
			isActive: () => editor.isActive("paragraph") && !editor.isActive("bulletList") && !editor.isActive("orderedList"),
		},
		{
			name: "Heading 1",
			icon: TextH1Icon,
			command: () => editor.chain().focus().toggleHeading({ level: 1 }).run(),
			isActive: () => editor.isActive("heading", { level: 1 }),
		},
		{
			name: "Heading 2",
			icon: TextH2Icon,
			command: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
			isActive: () => editor.isActive("heading", { level: 2 }),
		},
		{
			name: "Heading 3",
			icon: TextH3Icon,
			command: () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
			isActive: () => editor.isActive("heading", { level: 3 }),
		},
		{
			name: "To-do List",
			icon: CheckSquareIcon,
			command: () => editor.chain().focus().toggleTaskList().run(),
			isActive: () => editor.isActive("taskItem"),
		},
		{
			name: "Bullet List",
			icon: ListBulletsIcon,
			command: () => editor.chain().focus().toggleBulletList().run(),
			isActive: () => editor.isActive("bulletList"),
		},
		{
			name: "Numbered List",
			icon: ListNumbersIcon,
			command: () => editor.chain().focus().toggleOrderedList().run(),
			isActive: () => editor.isActive("orderedList"),
		},
		{
			name: "Quote",
			icon: QuotesIcon,
			command: () => {
				editor.chain().focus().toggleNode("paragraph", "paragraph").run();
				editor.chain().focus().toggleBlockquote().run();
			},
			isActive: () => editor.isActive("blockquote"),
		},
		// {
		// 	name: "Code",
		// 	icon: CodeIcon,
		// 	command: () => editor.chain().focus().toggleCodeBlock().run(),
		// 	isActive: () => editor.isActive("codeBlock"),
		// },
	];

	const activeItem = items.filter((item) => item.isActive()).pop() ?? {
		name: "Multiple",
	};

	return (
		<div className="relative h-full">
			<button
				type="button"
				className="flex h-full items-center gap-1 whitespace-nowrap p-2 text-sm font-medium text-stone-600 hover:bg-stone-100 active:bg-stone-200"
				onClick={() => {
					setIsOpen(!isOpen);
				}}
			>
				<span>{activeItem?.name}</span>
				<ChevronDownIcon className="h-4 w-4" />
			</button>

			{isOpen && (
				<section className="fixed top-full z-[99999] mt-1 flex w-48 flex-col overflow-hidden rounded border border-stone-200 bg-white p-1 shadow-xl animate-in fade-in slide-in-from-top-1">
					{items.map((item, index) => (
						<button
							key={index}
							type="button"
							onClick={(e) => {
								e.stopPropagation();
								if (editor.isActive("blockquote")) {
									editor.chain().focus().toggleBlockquote().run();
								}
								item.command();
								setIsOpen(false);
							}}
							className="flex items-center justify-between rounded-sm px-2 py-1 text-sm text-stone-600 hover:bg-stone-100"
						>
							<div className="flex items-center space-x-2">
								<div className="rounded-sm border border-stone-200 p-1">
									<item.icon className="h-3 w-3" />
								</div>
								<span>{item.name}</span>
							</div>
							{activeItem.name === item.name && <CheckIcon className="h-4 w-4" />}
						</button>
					))}
				</section>
			)}
		</div>
	);
};
