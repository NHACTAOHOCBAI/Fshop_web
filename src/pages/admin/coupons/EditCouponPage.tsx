import { Navigate, useParams } from "react-router";

import CouponFormPage from "./CouponFormPage";

export default function EditCouponPage() {
    const { couponId } = useParams();
    const parsedCouponId = Number(couponId);

    if (!Number.isFinite(parsedCouponId) || parsedCouponId <= 0) {
        return <Navigate to="/admin/coupons" replace />;
    }

    return <CouponFormPage mode="edit" couponId={parsedCouponId} />;
}
