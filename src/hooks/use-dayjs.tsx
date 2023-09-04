import dayjs from "dayjs";
import advancedFormat from "dayjs/plugin/advancedFormat";
import customParseFormat from "dayjs/plugin/customParseFormat";
import duration from "dayjs/plugin/duration";
import isToday from "dayjs/plugin/isToday";
import relativeTime from "dayjs/plugin/relativeTime";
import timezone from "dayjs/plugin/timezone";
import updateLocale from "dayjs/plugin/updateLocale";
import utc from "dayjs/plugin/utc";

import { useTimezone } from "~/app/providers";

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

export const useDayjs = () => {
	const timezone = useTimezone();

	dayjs.tz.setDefault(timezone);

	return { dayjs };
};

export type Dayjs = ReturnType<typeof useDayjs>["dayjs"];
export interface DayjsDate extends dayjs.Dayjs {}
