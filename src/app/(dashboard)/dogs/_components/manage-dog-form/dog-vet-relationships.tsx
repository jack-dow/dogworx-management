"use client";

import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectLabel,
	SelectTrigger,
	SelectValue,
} from "~/components/ui/select";

function DogVetRelationships() {
	return (
		<div className="grid grid-cols-1 gap-4 sm:grid-cols-6">
			<div className="col-span-full">
				<h3 className="text-base font-semibold leading-7 text-slate-900">Vets</h3>
				<p className="mt-1 text-sm leading-6 text-muted-foreground">
					Manage the relationships between this dog and its vets.
				</p>
			</div>
			<div className="sm:col-span-6">
				<Label htmlFor="dog-search">Search Vets</Label>
				<div className="mt-2">
					<Input type="text" id="dog-search" name="dog-search" autoComplete="none" />
				</div>
			</div>
			<div className="sm:col-span-6">
				<ul role="list" className="divide-y divide-slate-100">
					<li className="flex items-center justify-between gap-x-6 py-4">
						<div className="flex items-center gap-x-4">
							<div className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-slate-50">
								{/* <ContactIcon className="h-5 w-5" /> */}
							</div>
							{/* <img className="h-12 w-12 flex-none rounded-full bg-slate-50" src={person.imageUrl} alt="" /> */}
							<div className="min-w-0 flex-auto">
								<p className="text-sm font-semibold leading-6 text-slate-900">Alice Doe</p>
								<p className="truncate text-xs leading-5 text-slate-500">alicedoe@vets.com</p>
							</div>
						</div>
						<Select>
							<SelectTrigger className="w-[180px]">
								<SelectValue placeholder="Owner" defaultValue="Owner" />
							</SelectTrigger>
							<SelectContent>
								<SelectGroup>
									<SelectLabel>Relationships</SelectLabel>
									<SelectItem value="apple">Apple</SelectItem>
									<SelectItem value="banana">Banana</SelectItem>
									<SelectItem value="blueberry">Blueberry</SelectItem>
									<SelectItem value="grapes">Grapes</SelectItem>
									<SelectItem value="pineapple">Pineapple</SelectItem>
								</SelectGroup>
							</SelectContent>
						</Select>
					</li>
				</ul>
			</div>
		</div>
	);
}

export { DogVetRelationships };
