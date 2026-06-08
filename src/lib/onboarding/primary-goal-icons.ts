import type { IconType } from "react-icons";
import { FaWhatsapp } from "react-icons/fa6";
import {
  HiOutlineBookOpen,
  HiOutlineCalendarDays,
  HiOutlineClipboardDocumentList,
} from "react-icons/hi2";
import type { PrimaryGoalValue } from "@/lib/onboarding/labels";

export const PRIMARY_GOAL_ICONS: Record<PrimaryGoalValue, IconType> = {
  ORDERS: HiOutlineClipboardDocumentList,
  RESERVATIONS: HiOutlineCalendarDays,
  WHATSAPP: FaWhatsapp,
  MENU: HiOutlineBookOpen,
};
