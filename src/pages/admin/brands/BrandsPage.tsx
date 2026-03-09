import { useBrands } from "@/hooks/useBrands";

const BrandsPage = () => {
    const { data, isLoading, isError, error } = useBrands({
        page: 1,
        limit: 10,
        sortBy: "createdAt",
        sortOrder: "DESC",
    });

    if (isLoading) {
        return (
            <div className="dashboard">
                <h1>Brands</h1>
                <p>Loading brands...</p>
            </div>
        );
    }

    if (isError) {
        return (
            <div className="dashboard">
                <h1>Brands</h1>
                <p>Failed to load brands: {error.message}</p>
            </div>
        );
    }

    const brands = data?.data.data ?? [];
    const total = data?.data.pagination.total ?? 0;

    return (
        <div className="dashboard">
            <h1>Brands</h1>
            <p>Total brands: {total}</p>

            {brands.length === 0 ? (
                <p>No brands found.</p>
            ) : (
                <ul>
                    {brands.map((brand) => (
                        <li key={brand.id}>
                            {brand.name} ({brand.slug})
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default BrandsPage;