"use client";

import * as React from "react";
import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import sanitizeHtml from "sanitize-html";

import { cn } from "~/lib/client-utils";
import { BubbleMenu } from "./bubble-menu";
import { TiptapExtensions } from "./extensions";

type RichEditorProps = {
	className?: string;
	onEditorChange?: (editor: Editor) => void;
	onValueChange?: ({ html, text }: { html: string; text: string }) => void;
	id?: string;
	content?: string;
	autofocus?: boolean;
};

const RichTextEditor = React.forwardRef<HTMLDivElement, RichEditorProps>(
	({ className, onEditorChange, onValueChange, id, content, autofocus = false }, ref) => {
		const editor = useEditor({
			extensions: TiptapExtensions,
			editorProps: {
				attributes: {
					class: `prose dark:prose-invert prose-headings:font-display prose-h1:text-3xl font-default focus:outline-none max-w-full`,
				},
				handleDOMEvents: {
					keydown: (_view, event) => {
						// prevent default event listeners from firing when slash command is active
						if (["ArrowUp", "ArrowDown", "Enter"].includes(event.key)) {
							const slashCommand = document.querySelector("#slash-command");
							if (slashCommand) {
								return true;
							}
						}
					},
				},
			},
			onUpdate: (e) => {
				if (onValueChange) {
					onValueChange({
						html: sanitizeHtml(e.editor.getHTML(), { allowedAttributes: { ol: ["start"] } }),
						text: e.editor.getText(),
					});
				}
			},
			content,
			autofocus: autofocus ? "end" : false,
		});

		React.useEffect(() => {
			if (editor && onEditorChange) {
				onEditorChange(editor);
			}
		}, [editor, onEditorChange]);

		return (
			<div className="flex flex-1 flex-col space-y-4">
				<div
					onClick={() => {
						editor?.chain().focus().run();
					}}
					className={cn(
						"relative min-h-[150px] w-full rounded-md ring-1 ring-inset ring-input px-3 py-2 text-sm shadow-sm transition-colors focus-within:ring-inset focus-within:ring-ring",
						className,
					)}
				>
					{editor && <BubbleMenu editor={editor} />}
					<EditorContent id={id} editor={editor} ref={ref} />
				</div>
			</div>
		);
	},
);
RichTextEditor.displayName = "RichTextEditor";

export { RichTextEditor };
