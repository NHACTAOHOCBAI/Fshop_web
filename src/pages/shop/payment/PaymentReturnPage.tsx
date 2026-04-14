import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Link, useSearchParams } from 'react-router';
import { Button } from '@/components/ui/button';
import { useVerifyMoMoReturn } from '@/hooks/usePayments';

const PaymentReturnPage = () => {
    const [searchParams] = useSearchParams();
    const params = Object.fromEntries(searchParams.entries());

    const isMoMo = params.partnerCode === 'MOMO';

    const momoQuery = useVerifyMoMoReturn(params, isMoMo);

    const query = momoQuery;
    const isLoading = query?.isLoading ?? false;
    const isError = query?.isError ?? false;
    const result = query?.data?.data;

    if (!isMoMo) {
        return (
            <div className="flex min-h-[400px] flex-col items-center justify-center gap-4 text-center">
                <XCircle className="size-16 text-red-500" />
                <h1 className="text-xl font-bold text-slate-800">Liên kết không hợp lệ</h1>
                <p className="text-sm text-slate-500">Không xác định được cổng thanh toán.</p>
                <Button asChild variant="outline">
                    <Link to="/my-account/orders">Xem đơn hàng</Link>
                </Button>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="flex min-h-[400px] flex-col items-center justify-center gap-4 text-center">
                <Loader2 className="size-12 animate-spin text-primary" />
                <p className="text-sm text-slate-500">Đang xác nhận thanh toán...</p>
            </div>
        );
    }

    if (isError || !result) {
        return (
            <div className="flex min-h-[400px] flex-col items-center justify-center gap-4 text-center">
                <XCircle className="size-16 text-red-500" />
                <h1 className="text-xl font-bold text-slate-800">Xác nhận thất bại</h1>
                <p className="text-sm text-slate-500">
                    Không thể xác nhận giao dịch. Đơn hàng vẫn được tạo — vui lòng kiểm tra trong mục đơn hàng.
                </p>
                <div className="flex gap-3">
                    <Button asChild variant="outline">
                        <Link to="/my-account/orders">Xem đơn hàng</Link>
                    </Button>
                    <Button asChild>
                        <Link to="/">Tiếp tục mua sắm</Link>
                    </Button>
                </div>
            </div>
        );
    }

    if (result.success) {
        return (
            <div className="flex min-h-[400px] flex-col items-center justify-center gap-4 text-center">
                <CheckCircle className="size-16 text-emerald-500" />
                <h1 className="text-xl font-bold text-slate-800">Thanh toán thành công!</h1>
                <p className="text-sm text-slate-500">
                    Đơn hàng #{result.orderId} đã được xác nhận. Cảm ơn bạn đã mua sắm tại FShop.
                </p>
                <div className="flex gap-3">
                    <Button asChild variant="outline">
                        <Link to={`/my-account/orders/${result.orderId}`}>Xem đơn hàng</Link>
                    </Button>
                    <Button asChild>
                        <Link to="/">Tiếp tục mua sắm</Link>
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-[400px] flex-col items-center justify-center gap-4 text-center">
            <XCircle className="size-16 text-red-500" />
            <h1 className="text-xl font-bold text-slate-800">Thanh toán thất bại</h1>
            <p className="text-sm text-slate-500">
                {result.message || 'Giao dịch không thành công. Vui lòng thử lại.'}
            </p>
            <div className="flex gap-3">
                <Button asChild variant="outline">
                    <Link to="/my-account/orders">Xem đơn hàng</Link>
                </Button>
                <Button asChild>
                    <Link to="/">Tiếp tục mua sắm</Link>
                </Button>
            </div>
        </div>
    );
};

export default PaymentReturnPage;
