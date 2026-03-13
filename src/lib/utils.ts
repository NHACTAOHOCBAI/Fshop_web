import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Tạo chữ viết tắt từ tên (tối đa 2 chữ cái đầu) */
export const toAlias = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

/** Format ngày tháng theo locale vi-VN (chỉ ngày, không giờ) */
export const formatDate = (iso: string) =>
  new Intl.DateTimeFormat("vi-VN").format(new Date(iso));

/** Format ngày giờ đầy đủ theo locale vi-VN */
export const formatDateTime = (iso: string) =>
  new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "short" }).format(new Date(iso));

/** Format số tiền VND */
export const formatCurrency = (price: number) =>
  `${new Intl.NumberFormat("vi-VN").format(price)}đ`;