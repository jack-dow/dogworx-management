import { jwtVerify, SignJWT } from "jose";

import { env } from "~/env.mjs";

async function sign<Token extends Record<string, unknown>>(payload: Token) {
	const iat = Math.floor(Date.now() / 1000);

	// Didn't include exp here because jose throws error if exp is passed and we want to be able to access the payload of expired jwt's in middleware
	// To delete all user sessions if the user's token is stolen
	return new SignJWT(payload)
		.setProtectedHeader({ alg: "HS256", typ: "JWT" })
		.setIssuedAt(iat)
		.setNotBefore(iat)
		.sign(new TextEncoder().encode(env.JWT_SECRET));
}

async function verify(token: string) {
	return jwtVerify(token, new TextEncoder().encode(env.JWT_SECRET))
		.then((result) => {
			return result.payload;
		})
		.catch((error) => {
			console.log(error);
			return null;
		});
}

export const jwt = {
	sign,
	verify,
};
