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

/** Format thời gian tương đối theo tiếng Việt (vd: vài giây trước, 5 phút trước) */
export const formatRelativeTime = (iso: string) => {
  const date = new Date(iso);

  if (Number.isNaN(date.getTime())) {
    return "vừa xong";
  }

  const diffInSeconds = Math.floor((Date.now() - date.getTime()) / 1000);

  if (diffInSeconds < 10) return "vài giây trước";
  if (diffInSeconds < 60) return `${diffInSeconds} giây trước`;

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes} phút trước`;

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours} giờ trước`;

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays} ngày trước`;

  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 5) return `${diffInWeeks} tuần trước`;

  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) return `${diffInMonths} tháng trước`;

  const diffInYears = Math.floor(diffInDays / 365);
  return `${diffInYears} năm trước`;
};

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