import { useQuery } from "@tanstack/react-query";

import { getDistrictsByProvinceCode, getProvinces, getWardsByDistrictCode } from "@/services/locations";

export const LOCATION_QUERY_KEYS = {
    provinces: ["locations", "provinces"] as const,
    districts: (provinceCode: number | null) => ["locations", "districts", provinceCode] as const,
    wards: (districtCode: number | null) => ["locations", "wards", districtCode] as const,
};

export const useProvinces = () => {
    return useQuery({
        queryKey: LOCATION_QUERY_KEYS.provinces,
        queryFn: getProvinces,
        staleTime: 24 * 60 * 60 * 1000,
    });
};

export const useDistricts = (provinceCode: number | null) => {
    return useQuery({
        queryKey: LOCATION_QUERY_KEYS.districts(provinceCode),
        queryFn: () => getDistrictsByProvinceCode(provinceCode as number),
        enabled: typeof provinceCode === "number" && Number.isFinite(provinceCode),
        staleTime: 24 * 60 * 60 * 1000,
    });
};

export const useWards = (districtCode: number | null) => {
    return useQuery({
        queryKey: LOCATION_QUERY_KEYS.wards(districtCode),
        queryFn: () => getWardsByDistrictCode(districtCode as number),
        enabled: typeof districtCode === "number" && Number.isFinite(districtCode),
        staleTime: 24 * 60 * 60 * 1000,
    });
};
