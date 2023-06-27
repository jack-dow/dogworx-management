"use client";

import { type Control } from "react-hook-form";

import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { Switch } from "~/components/ui/switch";
import { Textarea } from "~/components/ui/textarea";
import { type ManageDogFormSchema } from "./manage-dog-form";

function GeneralInformation({ control }: { control: Control<ManageDogFormSchema> }) {
	return (
		<div className="grid grid-cols-1 gap-6 sm:gap-8 md:grid-cols-3">
			<div>
				<h2 className="text-base font-semibold leading-7 text-foreground">General Information</h2>
				<p className="text-sm leading-6 text-muted-foreground">Use a permanent address where you can receive mail.</p>
			</div>

			<div className="sm:rounded-xl sm:bg-white sm:shadow-sm sm:ring-1 sm:ring-gray-900/5 md:col-span-2">
				<div className="sm:p-8">
					<div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
						<div className="sm:col-span-2">
							<FormField
								control={control}
								name="givenName"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Name</FormLabel>
										<FormControl>
											<Input {...field} value={field.value ?? ""} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>

						<div className="sm:col-span-2">
							<FormField
								control={control}
								name="breed"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Breed</FormLabel>
										<FormControl>
											<Input {...field} value={field.value ?? ""} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>

						<div className="sm:col-span-2">
							<FormField
								control={control}
								name="color"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Color</FormLabel>
										<FormControl>
											<Input {...field} value={field.value ?? ""} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>

						<div className="sm:col-span-2">
							<FormField
								control={control}
								name="age"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Age</FormLabel>
										<FormControl>
											<Input {...field} value={field.value ?? ""} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>

						<div className="sm:col-span-2">
							<FormField
								control={control}
								name="sex"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Sex</FormLabel>
										<Select onValueChange={field.onChange} value={field.value ?? ""}>
											<FormControl>
												<SelectTrigger>
													<SelectValue placeholder="Select a sex">
														{/* This is required because field is black for a second on page load otherwise */}
														<span className="capitalize">{field.value ?? ""}</span>
													</SelectValue>
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												<SelectItem value="male">Male</SelectItem>
												<SelectItem value="female">Female</SelectItem>
											</SelectContent>
										</Select>

										<FormMessage />
									</FormItem>
								)}
							/>
						</div>

						<div className="sm:col-span-2">
							<FormField
								control={control}
								name="desexed"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Desexed</FormLabel>
										<FormControl>
											<div className="flex h-10 items-center">
												<Switch checked={field.value ?? ""} onCheckedChange={field.onChange} />
											</div>
										</FormControl>

										<FormMessage />
									</FormItem>
								)}
							/>
						</div>

						<div className="sm:col-span-6">
							<FormField
								control={control}
								name="notes"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Notes</FormLabel>
										<FormControl>
											<Textarea {...field} value={field.value ?? ""} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

export { GeneralInformation };
