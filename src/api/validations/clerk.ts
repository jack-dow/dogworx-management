import { z } from "zod";

// Simplified Clerk User Schema used for validation in forms and determines what data is passed from server actions to the client
const UserSchema = z.object({
	id: z.string(),
	firstName: z.string().nullable(),
	lastName: z.string().nullable(),
	emailAddresses: z.array(
		z.object({
			id: z.string(),
			emailAddress: z.string(),
		}),
	),
});
type UserSchema = z.infer<typeof UserSchema>;

export { UserSchema };
