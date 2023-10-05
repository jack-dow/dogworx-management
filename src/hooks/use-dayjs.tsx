import dayjs from "dayjs";
import advancedFormat from "dayjs/plugin/advancedFormat";
import customParseFormat from "dayjs/plugin/customParseFormat";
import duration from "dayjs/plugin/duration";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import isToday from "dayjs/plugin/isToday";
import relativeTime from "dayjs/plugin/relativeTime";
import timezone from "dayjs/plugin/timezone";
import updateLocale from "dayjs/plugin/updateLocale";
import utc from "dayjs/plugin/utc";

import { useUser } from "~/app/providers";

dayjs.extend(advancedFormat);
dayjs.extend(customParseFormat);
dayjs.extend(duration);
dayjs.extend(isToday);
dayjs.extend(relativeTime);
dayjs.extend(timezone);
dayjs.extend(updateLocale);
dayjs.extend(utc);
dayjs.updateLocale("en", {
	weekStart: 1,
});
dayjs.extend(isSameOrBefore);

export const useDayjs = () => {
	const user = useUser();

	dayjs.tz.setDefault(user.timezone);

	return { dayjs };
};

export type Dayjs = ReturnType<typeof useDayjs>["dayjs"];
export interface DayjsDate extends dayjs.Dayjs {}
