import { Link } from "react-router";

import { cn } from "@/lib/utils";

type FShopLogoProps = {
    to?: string;
    className?: string;
    compact?: boolean;
};

const FShopLogo = ({ to = "/", className, compact = false }: FShopLogoProps) => {
    return (
        <Link to={to} className={cn("inline-flex items-center gap-2.5", className)} aria-label="FShop home">
            <span className="relative inline-flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary text-sm font-black text-primary-foreground shadow-sm shadow-primary/35">
                <span className="absolute inset-0.5 rounded-full border border-white/25" />
                <span className="relative">F</span>
            </span>
            {!compact ? (
                <span className="text-base font-bold tracking-wide text-slate-900">
                    F<span className="text-primary">Shop</span>
                </span>
            ) : null}
        </Link>
    );
};

export default FShopLogo;
