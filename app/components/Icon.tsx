import type { ComponentType, SVGProps } from "react";
import GavelGlyph from "@/app/components/GavelGlyph";
import {
  ArrowLeftIcon,
  ArrowPathIcon,
  ArrowRightIcon,
  ArrowUturnLeftIcon,
  Bars3Icon,
  BellIcon,
  BoltIcon,
  BriefcaseIcon,
  CameraIcon,
  ChatBubbleLeftRightIcon,
  CheckCircleIcon,
  CheckIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronUpIcon,
  ClockIcon,
  CreditCardIcon,
  CubeIcon,
  ComputerDesktopIcon,
  EllipsisHorizontalIcon,
  EllipsisVerticalIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  FlagIcon,
  GiftIcon,
  HandRaisedIcon,
  HeartIcon,
  HomeIcon,
  LockClosedIcon,
  MagnifyingGlassIcon,
  MoonIcon,
  DevicePhoneMobileIcon,
  DeviceTabletIcon,
  PlusIcon,
  QuestionMarkCircleIcon,
  ScaleIcon,
  ShieldCheckIcon,
  ShoppingBagIcon,
  SparklesIcon,
  Squares2X2Icon,
  StarIcon,
  StopIcon,
  SunIcon,
  TagIcon,
  TruckIcon,
  UserGroupIcon,
  UserIcon,
  UserPlusIcon,
  XCircleIcon,
  XMarkIcon,
} from "@heroicons/react/24/solid";

type HeroIcon = ComponentType<SVGProps<SVGSVGElement>>;

const ICON_MAP: Record<string, HeroIcon> = {
  "fa-arrow-left": ArrowLeftIcon,
  "fa-arrow-right": ArrowRightIcon,
  "fa-arrows-rotate": ArrowPathIcon,
  "fa-bag-shopping": ShoppingBagIcon,
  "fa-bars": Bars3Icon,
  "fa-bell": BellIcon,
  "fa-bolt": BoltIcon,
  "fa-box-open": CubeIcon,
  "fa-briefcase": BriefcaseIcon,
  "fa-camera": CameraIcon,
  "fa-camera-retro": CameraIcon,
  "fa-check": CheckIcon,
  "fa-chevron-down": ChevronDownIcon,
  "fa-chevron-left": ChevronLeftIcon,
  "fa-chevron-right": ChevronRightIcon,
  "fa-chevron-up": ChevronUpIcon,
  "fa-circle-check": CheckCircleIcon,
  "fa-circle-xmark": XCircleIcon,
  "fa-clock": ClockIcon,
  "fa-comments": ChatBubbleLeftRightIcon,
  "fa-couch": HomeIcon,
  "fa-credit-card": CreditCardIcon,
  "fa-ellipsis-vertical": EllipsisVerticalIcon,
  "fa-eye": EyeIcon,
  "fa-eye-slash": EyeIcon,
  "fa-flag": FlagIcon,
  "fa-flag-checkered": FlagIcon,
  "fa-gamepad": CubeIcon,
  "fa-gem": SparklesIcon,
  "fa-hand-holding-dollar": HandRaisedIcon,
  "fa-heart": HeartIcon,
  "fa-headset": ChatBubbleLeftRightIcon,
  "fa-hourglass-half": ClockIcon,
  "fa-house": HomeIcon,
  "fa-laptop": ComputerDesktopIcon,
  "fa-layer-group": EllipsisHorizontalIcon,
  "fa-lock": LockClosedIcon,
  "fa-magnifying-glass": MagnifyingGlassIcon,
  "fa-moon": MoonIcon,
  "fa-mobile-screen": DevicePhoneMobileIcon,
  "fa-plus": PlusIcon,
  "fa-rotate-left": ArrowUturnLeftIcon,
  "fa-rotate-right": ArrowPathIcon,
  "fa-scale-balanced": ScaleIcon,
  "fa-shield-halved": ShieldCheckIcon,
  "fa-ring": GiftIcon,
  "fa-shirt": TagIcon,
  "fa-sliders": Squares2X2Icon,
  "fa-star": StarIcon,
  "fa-star-half-stroke": StarIcon,
  "fa-stop": StopIcon,
  "fa-sun": SunIcon,
  "fa-table-cells": Squares2X2Icon,
  "fa-tablet-screen-button": DeviceTabletIcon,
  "fa-tags": TagIcon,
  "fa-triangle-exclamation": ExclamationTriangleIcon,
  "fa-truck": TruckIcon,
  "fa-truck-fast": TruckIcon,
  "fa-undo": ArrowPathIcon,
  "fa-user": UserIcon,
  "fa-user-plus": UserPlusIcon,
  "fa-users": UserGroupIcon,
  "fa-xmark": XMarkIcon,
};

export type IconProps = {
  name: string;
  className?: string;
  "aria-hidden"?: boolean;
};

export default function Icon({ name, className, "aria-hidden": ariaHidden }: IconProps) {
  const normalizedName = name
    .split(" ")
    .map((token) => token.trim())
    .find((token) => token.startsWith("fa-") && token !== "fa-solid" && token !== "fa-regular");
  if (normalizedName === "fa-gavel") {
    return (
      <GavelGlyph
        className={`h-[1.22em] w-[1.22em] ${className ?? ""}`.trim()}
        aria-hidden={ariaHidden}
      />
    );
  }
  const HeroIconComponent = (normalizedName && ICON_MAP[normalizedName]) || QuestionMarkCircleIcon;
  return (
    <HeroIconComponent
      className={`inline-block h-[1.22em] w-[1.22em] shrink-0 align-middle ${className ?? ""}`.trim()}
      aria-hidden={ariaHidden}
    />
  );
}
