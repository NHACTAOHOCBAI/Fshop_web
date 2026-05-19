import { useDistricts, useProvinces, useWards } from "@/hooks/useLocations";

export type AddressLike = {
    detailAddress?: string;
    commune?: string;
    district?: string;
    province?: string;
};

const isNumeric = (val?: string) => {
    if (!val) return false;
    return /^\d+$/.test(val);
};

export const useFormattedAddress = (address?: AddressLike | null) => {
    const detail = address?.detailAddress ?? "";
    const commune = address?.commune ?? "";
    const district = address?.district ?? "";
    const province = address?.province ?? "";

    const hasCodes = isNumeric(province) || isNumeric(district) || isNumeric(commune);

    // React hooks must be called unconditionally, so we fetch anyway but control status
    const provinceCode = isNumeric(province) ? Number(province) : null;
    const { data: provinces = [], isLoading: isLoadingProvinces } = useProvinces();
    const provinceName = provinces.find((p) => p.code === provinceCode)?.name ?? province;

    const districtCode = isNumeric(district) ? Number(district) : null;
    const { data: districts = [], isLoading: isLoadingDistricts } = useDistricts(provinceCode);
    const districtName = districts.find((d) => d.code === districtCode)?.name ?? district;

    const { data: wards = [], isLoading: isLoadingWards } = useWards(districtCode);
    const communeName = wards.find((w) => w.code === Number(commune))?.name ?? commune;

    const isLoading = hasCodes && (isLoadingProvinces || isLoadingDistricts || isLoadingWards);

    const formattedText = [detail, communeName, districtName, provinceName]
        .filter(Boolean)
        .join(", ");

    return {
        formattedText,
        isLoading,
    };
};

export const AddressDisplay = ({
    address,
    className,
    fallback = "Đang tải địa chỉ...",
}: {
    address?: AddressLike | null;
    className?: string;
    fallback?: string;
}) => {
    const { formattedText, isLoading } = useFormattedAddress(address);

    if (isLoading) {
        return <span className={className}>{fallback}</span>;
    }

    return <span className={className}>{formattedText}</span>;
};
