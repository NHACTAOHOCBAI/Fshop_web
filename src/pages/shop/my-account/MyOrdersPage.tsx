/* eslint-disable react-hooks/set-state-in-effect */
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  MessageCircle,
  Package,
  Search,
  Star,
  Store,
  Truck,
  XCircle,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import { toast } from "sonner";

import { ImageUpload } from "@/components/image-upload/image-upload";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  useCancelOrder,
  useConfirmDelivery,
  useMyOrders,
} from "@/hooks/useOrders";
import { useCreateReview, useMyReviews } from "@/hooks/useReviews";
import { buildPaginationItems, cn, formatCurrency } from "@/lib/utils";
import { AddressDisplay } from "@/components/address/AddressDisplay";
import type { Order, OrderStatus } from "@/types/order";

const STATUS_CONFIG: Record<OrderStatus, { label: string; className: string }> =
  {
    pending: {
      label: "Chờ xác nhận",
      className: "bg-amber-50 text-amber-600 border-amber-200",
    },
    confirmed: {
      label: "Đã xác nhận",
      className: "bg-blue-50 text-blue-600 border-blue-200",
    },
    awaiting_pickup: {
      label: "Chờ lấy hàng",
      className: "bg-sky-50 text-sky-700 border-sky-200",
    },
    in_transit: {
      label: "Đang vận chuyển",
      className: "bg-indigo-50 text-indigo-600 border-indigo-200",
    },
    out_for_delivery: {
      label: "Đang giao",
      className: "bg-violet-50 text-violet-600 border-violet-200",
    },
    delivered: {
      label: "Đã giao",
      className: "bg-emerald-50 text-emerald-600 border-emerald-200",
    },
    delivery_failed: {
      label: "Giao thất bại",
      className: "bg-orange-50 text-orange-700 border-orange-200",
    },
    canceled: {
      label: "Đã huỷ",
      className: "bg-red-50 text-red-600 border-red-200",
    },
  };

const ORDER_TABS: { label: string; status?: OrderStatus }[] = [
  { label: "Tất cả" },
  { label: "Chờ xác nhận", status: "pending" },
  { label: "Đang giao", status: "out_for_delivery" },
  { label: "Đã giao", status: "delivered" },
  { label: "Đã huỷ", status: "canceled" },
];

const SHIPPING_LABELS = {
  standard: "Vận chuyển tiêu chuẩn",
  express: "Vận chuyển hỏa tốc",
} as const;

const formatDate = (date: string) =>
  new Date(date).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

const getStatusHeadline = (status: OrderStatus) => {
  switch (status) {
    case "pending":
      return "Shop đang chờ xác nhận đơn hàng của bạn";
    case "confirmed":
      return "Đơn hàng đã được xác nhận";
    case "awaiting_pickup":
      return "Đơn hàng đang chờ hãng vận chuyển lấy";
    case "in_transit":
      return "Đơn hàng đang vận chuyển tới khu vực giao";
    case "out_for_delivery":
      return "Đơn hàng đang được giao";
    case "delivered":
      return "Đơn hàng đã giao thành công";
    case "delivery_failed":
      return "Đơn hàng giao thất bại, shop sẽ xử lý tiếp";
    case "canceled":
      return "Đơn hàng đã được hủy";
    default:
      return "Trạng thái đơn hàng";
  }
};

const MyOrdersPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<string>("all");
  const [searchValue, setSearchValue] = useState("");
  const [debouncedSearchValue, setDebouncedSearchValue] = useState("");
  const [page, setPage] = useState(1);
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewImages, setReviewImages] = useState<File[]>([]);
  const [reviewTarget, setReviewTarget] = useState<{
    orderId: number;
    variantId: number;
    productName: string;
  } | null>(null);
  const pageSize = 5;

  const activeStatus = useMemo(
    () => ORDER_TABS.find((tab) => (tab.status ?? "all") === activeTab)?.status,
    [activeTab],
  );

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearchValue(searchValue.trim());
    }, 400);

    return () => window.clearTimeout(timer);
  }, [searchValue]);

  useEffect(() => {
    setPage(1);
  }, [activeStatus, debouncedSearchValue]);

  const { data, isLoading, isFetching, isError, error } = useMyOrders({
    page,
    limit: pageSize,
    search: debouncedSearchValue || undefined,
    sortBy: "id",
    sortOrder: "DESC",
    status: activeStatus,
  });
  const { mutate: cancelOrder, isPending: isCanceling } = useCancelOrder();
  const { mutate: confirmDelivery, isPending: isConfirming } =
    useConfirmDelivery();
  const { mutate: createReview, isPending: isCreatingReview } =
    useCreateReview();
  const myReviewsQuery = useMyReviews({
    page: 1,
    limit: 500,
    sortBy: "id",
    sortOrder: "DESC",
  });
  const orders: Order[] = data?.data ?? [];
  const myReviews = myReviewsQuery.data?.data ?? [];
  const totalOrders = data?.meta?.pagination?.total ?? orders.length;
  const totalPages = Math.max(1, Math.ceil(totalOrders / pageSize));
  const paginationItems = useMemo(
    () => buildPaginationItems(page, totalPages),
    [page, totalPages],
  );
  const reviewedVariantKeys = useMemo(() => {
    return new Set(
      myReviews.map((review) => `${review.orderId}-${review.variantId}`),
    );
  }, [myReviews]);

  const handleCancelOrder = (orderId: number) => {
    cancelOrder(
      { id: orderId },
      {
        onSuccess: () => {
          toast.success(`Đã huỷ đơn #${orderId} thành công.`);
        },
        onError: (cancelError: Error) => {
          toast.error(cancelError.message || "Không thể huỷ đơn hàng.");
        },
      },
    );
  };

  const handleConfirmDelivery = (orderId: number) => {
    confirmDelivery(orderId, {
      onSuccess: () => {
        toast.success(`Đã xác nhận nhận hàng cho đơn #${orderId}.`);
      },
      onError: (confirmError: Error) => {
        toast.error(confirmError.message || "Không thể xác nhận giao hàng.");
      },
    });
  };

  const handleChatWithShop = (order: Order) => {
    const firstItem = order.items?.[0];
    const imageUrl = firstItem?.variant?.imageUrl || firstItem?.variant?.product?.images?.[0]?.imageUrl || null;

    navigate("/my-account/support", {
      state: {
        prefillOrder: {
          id: order.id,
          totalAmount: Number(order.totalAmount),
          status: order.status,
          createdAt: order.createdAt,
          itemsCount: order.items?.reduce((sum, item) => sum + item.quantity, 0) || 0,
          imageUrl,
        },
      },
    });
  };

  const resetReviewForm = () => {
    setReviewRating(5);
    setHoverRating(0);
    setReviewComment("");
    setReviewImages([]);
    setReviewTarget(null);
    setIsReviewDialogOpen(false);
  };

  const handleOpenReviewDialog = ({
    orderId,
    variantId,
    productName,
  }: {
    orderId: number;
    variantId: number;
    productName: string;
  }) => {
    setReviewTarget({ orderId, variantId, productName });
    setIsReviewDialogOpen(true);
  };

  const handleSubmitReview = () => {
    if (!reviewTarget) {
      return;
    }

    const normalizedRating = reviewRating;

    if (
      !Number.isFinite(normalizedRating) ||
      normalizedRating < 1 ||
      normalizedRating > 5
    ) {
      toast.error("Điểm đánh giá phải trong khoảng từ 1 đến 5 sao.");
      return;
    }

    createReview(
      {
        orderId: reviewTarget.orderId,
        variantId: reviewTarget.variantId,
        rating: normalizedRating,
        comment: reviewComment.trim() || undefined,
        reviewImages: reviewImages.length > 0 ? reviewImages : undefined,
      },
      {
        onSuccess: () => {
          toast.success(`Đã gửi đánh giá cho ${reviewTarget.productName}.`);
          resetReviewForm();
        },
        onError: (reviewError: Error) => {
          toast.error(reviewError.message || "Không thể gửi đánh giá.");
        },
      },
    );
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Đơn hàng của tôi</h1>
        <p className="mt-1 text-sm text-slate-500">
          Theo dõi trạng thái và thao tác nhanh với {totalOrders} đơn hàng.
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="flex overflow-x-auto border-b border-slate-200 text-sm">
          {ORDER_TABS.map((tab) => {
            const tabId = tab.status ?? "all";
            const isActive = activeTab === tabId;

            return (
              <button
                key={tab.label}
                type="button"
                onClick={() => setActiveTab(tabId)}
                className={cn(
                  "relative shrink-0 px-2 py-2 text-xs font-medium transition-colors sm:px-5 sm:py-3 sm:text-sm",
                  isActive
                    ? "text-primary"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-800",
                )}
              >
                {tab.label}
                {isActive ? (
                  <span className="absolute inset-x-0 bottom-0 h-0.5 bg-primary" />
                ) : null}
              </button>
            );
          })}
        </div>

        <div className="bg-slate-50/80 p-3 sm:p-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
              placeholder="Bạn có thể tìm theo mã đơn hàng (VD: 123) hoặc tên sản phẩm..."
              className="h-10 border-slate-200 bg-white pl-10 text-sm sm:h-11 sm:placeholder:block"
            />
          </div>
          <p className="mt-2 text-xs text-slate-400">
            Gợi ý: Nhập ID đơn hàng hoặc một phần tên sản phẩm để tra cứu nhanh. Hệ thống sẽ tự động tìm kiếm khi bạn dừng gõ phím.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
          <Loader2 className="mx-auto mb-2 size-5 animate-spin text-slate-400" />
          Đang tải danh sách đơn hàng...
        </div>
      ) : isError ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
          Không thể tải đơn hàng: {error?.message || "Đã xảy ra lỗi"}
        </div>
      ) : orders.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
          Không tìm thấy đơn hàng phù hợp.
        </div>
      ) : null}

      {isFetching && !isLoading ? (
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Loader2 className="size-4 animate-spin" />
          Đang cập nhật danh sách đơn hàng...
        </div>
      ) : null}

      <div className="space-y-4">
        {orders.map((order) => {
          const statusCfg = STATUS_CONFIG[order.status];
          const productCount = order.items.reduce(
            (sum, item) => sum + item.quantity,
            0,
          );
          const shippingLabel = SHIPPING_LABELS[order.shippingMethod];

          return (
            <article
              key={`order-${order.id}`}
              className="overflow-hidden rounded-2xl border border-slate-200 bg-white"
            >
              <div className="border-b border-slate-100 px-4 py-4 sm:px-5">
                <div className="space-y-3">
                  <div className="flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-start">
                    <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2 text-sm">
                      <span className="inline-flex shrink-0 items-center gap-2 font-semibold text-slate-900">
                        <Store className="size-4 text-primary" />
                        FShop Official
                      </span>
                      <span className="shrink-0 rounded-md border border-slate-200 px-2 py-0.5 text-xs text-slate-500">
                        Đơn #{order.id}
                      </span>
                      <span className="shrink-0 text-xs text-slate-400">
                        {formatDate(order.createdAt)}
                      </span>
                    </div>
                    <span
                      className={cn(
                        "shrink-0 rounded-full border px-2.5 py-1 text-xs font-semibold",
                        statusCfg.className,
                      )}
                    >
                      {statusCfg.label}
                    </span>
                  </div>

                  <p className="text-sm font-medium text-slate-800">
                    {getStatusHeadline(order.status)}
                  </p>

                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1">
                      <Truck className="size-3.5" />
                      {shippingLabel}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1">
                      <Package className="size-3.5" />
                      {productCount} sản phẩm
                    </span>
                  </div>

                  <div className="flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm text-slate-500">
                      Thành tiền:{" "}
                      <span className="font-bold text-primary">
                        {formatCurrency(Number(order.totalAmount))}
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3 px-5 py-4">
                {order.items.map((item) => {
                  const imageUrl = item.variant?.imageUrl;
                  const productName = item.variant?.product?.name || "Sản phẩm";
                  const reviewKey = `${order.id}-${item.variant.id}`;
                  const isReviewed = reviewedVariantKeys.has(reviewKey);

                  return (
                    <div
                      key={`order-item-${item.id}`}
                      className="flex flex-col gap-3 rounded-xl border border-slate-100 bg-slate-50/70 p-3 sm:flex-row sm:items-center sm:gap-4"
                    >
                      <div className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-slate-100 text-xs text-slate-400 sm:size-16">
                        {imageUrl ? (
                          <img
                            src={imageUrl}
                            alt={productName}
                            className="h-full w-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          "No img"
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-slate-800 line-clamp-1">
                          {productName}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-500">
                          Số lượng:{" "}
                          <span className="font-medium">x{item.quantity}</span>
                        </p>
                        {order.note ? (
                          <p className="mt-0.5 line-clamp-1 text-xs text-slate-400">
                            Ghi chú: {order.note}
                          </p>
                        ) : null}
                      </div>
                      <div className="flex flex-col items-end gap-1 sm:shrink-0">
                        <p className="whitespace-nowrap text-sm font-semibold text-slate-700">
                          {formatCurrency(Number(item.price) * item.quantity)}
                        </p>
                        {order.status === "delivered" ? (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs"
                            disabled={isReviewed}
                            onClick={() =>
                              handleOpenReviewDialog({
                                orderId: order.id,
                                variantId: item.variant.id,
                                productName,
                              })
                            }
                          >
                            {isReviewed ? "Đã đánh giá" : "Đánh giá"}
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="border-t border-slate-100 bg-slate-50/60 px-4 py-4 sm:px-5">
                <div className="space-y-3 sm:space-y-4">
                  <div className="space-y-1 text-sm text-slate-500">
                    <p>
                      Giao đến:{" "}
                      <span className="font-medium text-slate-700">
                        {order.recipientName}
                      </span>
                    </p>
                    <p className="line-clamp-2">
                      <AddressDisplay address={order} />
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2 sm:justify-end">
                    <Button
                      type="button"
                      asChild
                      variant="outline"
                      size="sm"
                      className="h-8 flex-1 sm:flex-none sm:h-9"
                    >
                      <Link to={`/my-account/orders/${order.id}`}>
                        Chi tiết
                      </Link>
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 flex-1 gap-1.5 border-primary/20 text-primary hover:bg-primary/5 sm:flex-none sm:h-9"
                      onClick={() => handleChatWithShop(order)}
                    >
                      <MessageCircle className="size-3.5 sm:size-4" />
                      <span className="hidden sm:inline">
                        Nhắn tin với shop
                      </span>
                      <span className="sm:hidden">Chat</span>
                    </Button>

                    {(order.status === "pending" ||
                      order.status === "confirmed") && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-8 flex-1 gap-1 sm:flex-none sm:h-9"
                        disabled={isCanceling}
                        onClick={() => handleCancelOrder(order.id)}
                      >
                        <XCircle className="size-3.5 sm:size-4" />
                        <span className="hidden sm:inline">Huỷ đơn</span>
                        <span className="sm:hidden">Huỷ</span>
                      </Button>
                    )}

                    {(order.status === "out_for_delivery" ||
                      order.status === "in_transit") && (
                      <Button
                        type="button"
                        size="sm"
                        className="h-8 flex-1 gap-1 sm:flex-none sm:h-9"
                        disabled={isConfirming}
                        onClick={() => handleConfirmDelivery(order.id)}
                      >
                        <CheckCircle2 className="size-3.5 sm:size-4" />
                        <span className="hidden sm:inline">Đã nhận hàng</span>
                        <span className="sm:hidden">Nhận</span>
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {totalOrders > 0 ? (
        <div className="space-y-3 rounded-2xl border border-slate-200 bg-white px-4 py-3">
          <p className="text-sm text-slate-500">
            Trang <span className="font-semibold text-slate-900">{page}</span> /{" "}
            {totalPages} - {totalOrders} đơn hàng
          </p>

          <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              disabled={page <= 1 || isFetching}
            >
              <ChevronLeft className="size-4" />
            </Button>

            {paginationItems.map((item, index) => {
              const previous = paginationItems[index - 1];
              const shouldRenderEllipsis =
                previous !== undefined && item - previous > 1;

              return (
                <div key={item} className="flex items-center gap-2">
                  {shouldRenderEllipsis ? (
                    <span className="px-1 text-slate-400">...</span>
                  ) : null}
                  <Button
                    type="button"
                    variant={item === page ? "default" : "outline"}
                    size="sm"
                    onClick={() => setPage(item)}
                    disabled={isFetching}
                    className={item === page ? "bg-primary text-white" : ""}
                  >
                    {item}
                  </Button>
                </div>
              );
            })}

            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              onClick={() =>
                setPage((current) => Math.min(totalPages, current + 1))
              }
              disabled={page >= totalPages || isFetching}
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      ) : null}

      <Dialog
        open={isReviewDialogOpen}
        onOpenChange={(open) =>
          !open ? resetReviewForm() : setIsReviewDialogOpen(open)
        }
      >
        <DialogContent className="sm:max-w-md max-h-[96vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Đánh giá sản phẩm</DialogTitle>
            <DialogDescription>
              {reviewTarget
                ? `Chia sẻ trải nghiệm của bạn với ${reviewTarget.productName}.`
                : "Chia sẻ trải nghiệm mua sắm của bạn."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Điểm đánh giá</Label>
              <div className="flex items-center gap-2">
                {Array.from({ length: 5 }, (_, index) => {
                  const starValue = index + 1;
                  const activeValue = hoverRating || reviewRating;
                  const isActive = starValue <= activeValue;

                  return (
                    <button
                      key={starValue}
                      type="button"
                      onMouseEnter={() => setHoverRating(starValue)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setReviewRating(starValue)}
                      className="rounded-md p-1 transition-transform hover:scale-110"
                      aria-label={`Chọn ${starValue} sao`}
                    >
                      <Star
                        className={cn(
                          "size-6 transition-colors",
                          isActive
                            ? "fill-amber-400 text-amber-400"
                            : "text-slate-300",
                        )}
                      />
                    </button>
                  );
                })}
                <span className="text-sm font-medium text-slate-600">
                  {reviewRating}.0/5
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="review-comment">Nhận xét</Label>
              <Textarea
                id="review-comment"
                value={reviewComment}
                onChange={(event) => setReviewComment(event.target.value)}
                placeholder="Sản phẩm có đúng mô tả không, chất lượng và đóng gói như thế nào?"
                className="min-h-24"
              />
            </div>

            <ImageUpload
              value={reviewImages}
              onChange={setReviewImages}
              numOfImage={5}
              label="Ảnh đánh giá (tuỳ chọn)"
              disabled={isCreatingReview}
            />
          </div>

          <div className="flex flex-col gap-3">
            <Button
              type="button"
              onClick={handleSubmitReview}
              disabled={isCreatingReview || !reviewTarget}
              className="w-full"
            >
              {isCreatingReview ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Đang gửi...
                </>
              ) : (
                "Gửi đánh giá"
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={resetReviewForm}
              disabled={isCreatingReview}
              className="w-full"
            >
              Đóng
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MyOrdersPage;
