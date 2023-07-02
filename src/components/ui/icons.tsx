/* eslint-disable no-restricted-imports */
import { UserCircleIcon as UserCircle } from "@heroicons/react/20/solid";
import {
	Calendar,
	CalendarDays,
	Check,
	ChevronDown,
	ChevronLeft,
	ChevronRight,
	ChevronsLeft,
	ChevronsRight,
	ChevronsUpDown,
	Circle,
	ClipboardList,
	Contact,
	Copy,
	Dog,
	Edit3,
	Eye,
	EyeOff,
	Loader2,
	LogOut,
	MoreVertical,
	Plus,
	Receipt,
	Search,
	SlidersHorizontal,
	SortAsc,
	SortDesc,
	Store,
	Trash2,
	User,
	UserPlus,
	X,
	type LucideIcon,
	type LucideProps,
} from "lucide-react";

type Icon = LucideIcon;

const GoogleIcon = (props: LucideProps) => (
	<svg
		aria-hidden="true"
		focusable="false"
		data-prefix="fab"
		data-icon="discord"
		role="img"
		xmlns="http://www.w3.org/2000/svg"
		viewBox="0 0 488 512"
		{...props}
	>
		<path
			fill="currentColor"
			d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"
		></path>
	</svg>
);
const AppleIcon = (props: LucideProps) => (
	<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512" {...props}>
		<path
			fill="currentColor"
			d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"
		/>
	</svg>
);

export {
	AppleIcon,
	Calendar as CalendarIcon,
	CalendarDays as CalendarDaysIcon,
	Check as CheckIcon,
	ChevronDown as ChevronDownIcon,
	ChevronLeft as ChevronLeftIcon,
	ChevronRight as ChevronRightIcon,
	ChevronsLeft as ChevronsLeftIcon,
	ChevronsRight as ChevronsRightIcon,
	ChevronsUpDown as ChevronsUpDownIcon,
	Circle as CircleIcon,
	ClipboardList as ClipboardListIcon,
	Contact as ContactIcon,
	Copy as CopyIcon,
	Dog as DogIcon,
	Edit3 as EditIcon,
	Eye as EyeIcon,
	EyeOff as EyeOffIcon,
	GoogleIcon,
	Loader2 as LoaderIcon,
	LogOut as LogOutIcon,
	MoreVertical as MoreVerticalIcon,
	Plus as PlusIcon,
	Receipt as ReceiptIcon,
	Search as SearchIcon,
	SlidersHorizontal as SlidersHorizontalIcon,
	SortAsc as SortAscIcon,
	SortDesc as SortDescIcon,
	Store as StoreIcon,
	Trash2 as TrashIcon,
	User as UserIcon,
	UserCircle as UserCircleIcon,
	UserPlus as UserPlusIcon,
	X as XIcon,
	type Icon,
};
