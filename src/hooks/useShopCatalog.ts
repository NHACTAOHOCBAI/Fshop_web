import { useEffect, useMemo, useState } from "react";

import { useBrands } from "@/hooks/useBrands";
import { useCategories } from "@/hooks/useCategories";
import { useDebounce } from "@/hooks/useDebounce";
import { useProducts } from "@/hooks/useProducts";
import type { DepartmentType } from "@/types/category";
import type { Product } from "@/types/product";

type SortOption = "newest" | "oldest" | "name-asc" | "name-desc";

const PRODUCT_FETCH_LIMIT = 200;
const PAGE_SIZE = 9;

const sortOptionMap: Record<SortOption, { sortBy: string; sortOrder: "ASC" | "DESC" }> = {
    newest: { sortBy: "createdAt", sortOrder: "DESC" },
    oldest: { sortBy: "createdAt", sortOrder: "ASC" },
    "name-asc": { sortBy: "name", sortOrder: "ASC" },
    "name-desc": { sortBy: "name", sortOrder: "DESC" },
};

export const useShopCatalog = (department: DepartmentType) => {
    const [page, setPage] = useState(1);
    const [searchInput, setSearchInput] = useState("");
    const [sortOption, setSortOption] = useState<SortOption>("newest");
    const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
    const [selectedBrandId, setSelectedBrandId] = useState<number | null>(null);

    const debouncedSearch = useDebounce(searchInput, 400);
    const sortQuery = sortOptionMap[sortOption];

    const productsQuery = useProducts({
        page: 1,
        limit: PRODUCT_FETCH_LIMIT,
        search: debouncedSearch.trim() || undefined,
        sortBy: sortQuery.sortBy,
        sortOrder: sortQuery.sortOrder,
    });

    const categoriesQuery = useCategories({
        page: 1,
        limit: 50,
        sortBy: "name",
        sortOrder: "ASC",
    });

    const brandsQuery = useBrands({
        page: 1,
        limit: 50,
        sortBy: "name",
        sortOrder: "ASC",
    });

    const categoriesByDepartment = useMemo(() => {
        const allCategories = categoriesQuery.data?.data ?? [];
        return allCategories.filter((category) => category.department === department);
    }, [categoriesQuery.data?.data, department]);

    useEffect(() => {
        if (!selectedCategoryId) {
            return;
        }

        const belongsToDepartment = categoriesByDepartment.some((category) => category.id === selectedCategoryId);
        if (!belongsToDepartment) {
            setSelectedCategoryId(null);
            setPage(1);
        }
    }, [categoriesByDepartment, selectedCategoryId]);

    const filteredProducts = useMemo(() => {
        const allProducts = productsQuery.data?.data ?? [];

        return allProducts.filter((product) => {
            if (selectedCategoryId && product.categoryId !== selectedCategoryId) {
                return false;
            }

            if (selectedBrandId && product.brandId !== selectedBrandId) {
                return false;
            }

            return true;
        });
    }, [productsQuery.data?.data, selectedBrandId, selectedCategoryId]);

    const totalItems = filteredProducts.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));

    const paginatedProducts = useMemo(() => {
        const safePage = Math.min(page, totalPages);
        const start = (safePage - 1) * PAGE_SIZE;
        const end = start + PAGE_SIZE;

        return filteredProducts.slice(start, end);
    }, [filteredProducts, page, totalPages]);

    const updatePage = (newPage: number) => {
        if (newPage < 1 || newPage > totalPages) {
            return;
        }

        setPage(newPage);
    };

    const resetPage = () => {
        setPage(1);
    };

    const onSearchChange = (value: string) => {
        setSearchInput(value);
        resetPage();
    };

    const onSortChange = (value: SortOption) => {
        setSortOption(value);
        resetPage();
    };

    const onCategoryChange = (categoryId: number | null) => {
        setSelectedCategoryId(categoryId);
        resetPage();
    };

    const onBrandChange = (brandId: number | null) => {
        setSelectedBrandId(brandId);
        resetPage();
    };

    return {
        page,
        pageSize: PAGE_SIZE,
        totalItems,
        totalPages,
        searchInput,
        sortOption,
        selectedCategoryId,
        selectedBrandId,
        products: paginatedProducts,
        categories: categoriesByDepartment,
        brands: brandsQuery.data?.data ?? [],
        isLoading: productsQuery.isLoading || categoriesQuery.isLoading || brandsQuery.isLoading,
        isFetching: productsQuery.isFetching,
        isError: productsQuery.isError,
        errorMessage: productsQuery.error instanceof Error ? productsQuery.error.message : undefined,
        updatePage,
        onSearchChange,
        onSortChange,
        onCategoryChange,
        onBrandChange,
        clearFilters: () => {
            setSelectedBrandId(null);
            setSelectedCategoryId(null);
            setSearchInput("");
            setPage(1);
        },
    };
};

export type ShopCatalogProduct = Product;
export type ShopSortOption = SortOption;
