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

/** Tạo danh sách số trang để hiển thị phân trang (1, ..., currentPage±1, ..., totalPages) */
export const buildPaginationItems = (currentPage: number, totalPages: number): number[] => {
  const pages = new Set<number>();
  pages.add(1);
  pages.add(totalPages);

  for (let page = currentPage - 1; page <= currentPage + 1; page += 1) {
    if (page > 1 && page < totalPages) {
      pages.add(page);
    }
  }

  return Array.from(pages).sort((a, b) => a - b);
};

/** Format ngày giờ đầy đủ theo locale vi-VN */
export const formatDateTime = (iso: string) =>
  new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "short" }).format(new Date(iso));

/** Format số tiền VND */
export const formatCurrency = (price: number) =>
  `${new Intl.NumberFormat("vi-VN").format(price)}đ`;