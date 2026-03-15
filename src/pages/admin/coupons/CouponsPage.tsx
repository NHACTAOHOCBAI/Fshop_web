import { Plus } from "lucide-react";
import { Link } from "react-router";
import { toast } from "sonner";

import CrudTable from "@/components/crud_table/crud-table";
import { Button } from "@/components/ui/button";
import { useCoupons, useDeleteCoupon } from "@/hooks/useCoupons";
import type { Coupon } from "@/types/coupon";

import { couponColumns } from "./coupon-columns";

const CouponsPage = () => {
    const { mutate: deleteItem } = useDeleteCoupon();

    const handleDeleteItem = (id: number) => {
        deleteItem(
            { id },
            {
                onSuccess: () => toast.success("Đã xóa mã giảm giá"),
                onError: (error) => toast.error(`Xóa thất bại: ${error.message}`),
            }
        );
    };

    return (
        <div className="space-y-4 w-full">
            <h1 className="text-2xl font-semibold">Mã giảm giá</h1>

            <CrudTable<Coupon>
                columns={couponColumns(handleDeleteItem)}
                useQuery={useCoupons}
                filterPlaceholder="Lọc theo mã hoặc tên coupon..."
            >
                <Button
                    variant="outline"
                    size="sm"
                    className="ml-2 h-8"
                    asChild
                >
                    <Link to="/admin/coupons/create">
                        <Plus className="size-4" />
                        Thêm coupon
                    </Link>
                </Button>
            </CrudTable>
        </div>
    );
};

export default CouponsPage;
