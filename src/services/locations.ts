import axios from "axios";

import type { District, Province, Ward } from "@/types/location";

const LOCATION_API_BASE = "https://sandbox.goship.io/api/v2";

type GoshipResponse<T> = {
    code: number;
    status: string;
    data: T;
};

type GoshipCity = {
    id: string;
    name: string;
};

type GoshipDistrict = {
    id: string;
    name: string;
    city_id: string;
};

type GoshipWard = {
    id: number | string;
    name: string;
    district_id: string;
};

const getHeaders = () => {
    const token = import.meta.env.VITE_GOSHIP_TOKEN;
    return {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
    };
};

export const getProvinces = async (): Promise<Province[]> => {
    const { data } = await axios.get<GoshipResponse<GoshipCity[]>>(`${LOCATION_API_BASE}/cities`, {
        headers: getHeaders(),
    });

    return (data.data ?? []).map((city) => ({
        code: Number(city.id),
        name: city.name,
    }));
};

export const getDistrictsByProvinceCode = async (provinceCode: number): Promise<District[]> => {
    const { data } = await axios.get<GoshipResponse<GoshipDistrict[]>>(
        `${LOCATION_API_BASE}/cities/${provinceCode}/districts`,
        {
            headers: getHeaders(),
        }
    );

    return (data.data ?? []).map((district) => ({
        code: Number(district.id),
        name: district.name,
    }));
};

export const getWardsByDistrictCode = async (districtCode: number): Promise<Ward[]> => {
    const { data } = await axios.get<GoshipResponse<GoshipWard[]>>(
        `${LOCATION_API_BASE}/districts/${districtCode}/wards`,
        {
            headers: getHeaders(),
        }
    );

    return (data.data ?? []).map((ward) => ({
        code: Number(ward.id),
        name: ward.name,
    }));
};
