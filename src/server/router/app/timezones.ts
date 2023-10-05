import { createTRPCRouter, publicProcedure } from "~/server/trpc";

// Thank you to cal.com for being open source and therefore making my life with timezones not as painful.
// This is a modified version of their code.
// SEE: https://github.com/calcom/cal.com/blob/main/packages/trpc/server/routers/publicViewer/cityTimezones.handler.ts

export const timezonesRouter = createTRPCRouter({
	city: publicProcedure.query(async () => {
		/**
		 * Lazy loads third party dependency to avoid loading 1.5Mb for ALL tRPC procedures.
		 **/
		const allCities = await import("city-timezones").then((mod) => mod.cityMapping);
		/**
		 * Filter out all cities that have the same "city" key and only use the one with the highest population.
		 * This way we return a new array of cities without running the risk of having more than one city
		 * with the same name on the dropdown and prevent users from mistaking the time zone of the desired city.
		 */
		const topPopulatedCities: { [key: string]: { city: string; timezone: string; pop: number } } = {};

		allCities.forEach((city) => {
			const cityPopulationCount = city.pop;

			if (
				(topPopulatedCities[city.city]?.pop === undefined ||
					cityPopulationCount > topPopulatedCities[city.city]!.pop) &&
				city.timezone
			) {
				if (city.timezone.includes(city.city)) {
					return;
				}
				topPopulatedCities[city.city] = { city: city.city, timezone: city.timezone, pop: city.pop };
			}
		});

		const uniqueCities = Object.values(topPopulatedCities);

		/** Add specific overrides in here */
		return uniqueCities.filter((city) => {
			if (city.city === "London" || city.city === "Londonderry") {
				return false;
			}

			return true;
		});
	}),
});
