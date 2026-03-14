import axios from "axios";

import type { District, Province, Ward } from "@/types/location";

const LOCATION_API_BASE = "https://provinces.open-api.vn/api";

type ProvinceWithDistricts = {
    districts?: District[];
};

type DistrictWithWards = {
    wards?: Ward[];
};

export const getProvinces = async () => {
    const { data } = await axios.get<Province[]>(`${LOCATION_API_BASE}/p/`);
    return data;
};

export const getDistrictsByProvinceCode = async (provinceCode: number) => {
    const { data } = await axios.get<ProvinceWithDistricts>(`${LOCATION_API_BASE}/p/${provinceCode}`, {
        params: { depth: 2 },
    });

    return data.districts ?? [];
};

export const getWardsByDistrictCode = async (districtCode: number) => {
    const { data } = await axios.get<DistrictWithWards>(`${LOCATION_API_BASE}/d/${districtCode}`, {
        params: { depth: 2 },
    });

    return data.wards ?? [];
};
