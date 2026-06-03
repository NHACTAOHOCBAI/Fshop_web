import { Link } from "react-router";

import { cn } from "@/lib/utils";

type FShopLogoProps = {
  to?: string;
  className?: string;
  compact?: boolean;
};

const FShopLogo = ({
  to = "/",
  className,
  compact = false,
}: FShopLogoProps) => {
  return (
    <Link
      to={to}
      className={cn("inline-flex items-center gap-2.5", className)}
      aria-label="FShop home"
    >
      <img
        src="/logo.png"
        alt="FShop Logo"
        className={cn(
          "h-8 object-contain scale-200",
          compact ? "w-8" : "w-auto",
        )}
      />
    </Link>
  );
};

export default FShopLogo;
