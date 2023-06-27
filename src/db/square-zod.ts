import { z } from "zod";

const InsertClientSchema = z.object({
	givenName: z.string().min(2, {
		message: "First name must be at least 2 characters long",
	}),
	familyName: z
		.string()
		.min(2, {
			message: "First name must be at least 2 characters long",
		})
		.optional(),
	emailAddress: z.string().email({
		message: "Email must be a valid email address",
	}),
	phoneNumber: z
		.string()
		.min(9, {
			message: "Phone number must be at least 7 characters long",
		})
		.max(16, {
			message: "Phone number must be at most 16 characters long",
		}),
	note: z
		.string()
		.max(500, {
			message: "Note must be at most 500 characters long",
		})
		.optional(),
	address: z.object({
		addressLine1: z.string().min(2, {
			message: "Address line 1 must be at least 2 characters long",
		}),
		administrativeDistrictLevel1: z.string().min(2, {
			message: "State must be at least 2 characters long",
		}),
		locality: z.string().min(2, {
			message: "City must be at least 2 characters long",
		}),
		postalCode: z
			.string()
			.min(2, {
				message: "Postal code must be at least 2 characters long",
			})
			.optional(),
		country: z
			.string()
			.min(2, {
				message: "Country must be at least 2 characters long",
			})
			.default("AU"),
	}),
});

type InsertClientSchema = z.infer<typeof InsertClientSchema>;

const UpdateClientSchema = InsertClientSchema.partial();

type UpdateClientSchema = z.infer<typeof UpdateClientSchema>;

export { InsertClientSchema, UpdateClientSchema };
