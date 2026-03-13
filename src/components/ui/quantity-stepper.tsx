import { cn } from "@/lib/utils";

type QuantityStepperProps = {
    value: number;
    onChange: (nextValue: number) => void;
    min?: number;
    max?: number;
    className?: string;
};

const QuantityStepper = ({ value, onChange, min = 1, max, className }: QuantityStepperProps) => {
    const canDecrease = value > min;
    const canIncrease = max === undefined || value < max;

    return (
        <div className={cn("inline-flex items-center rounded-lg border border-slate-200 bg-white", className)}>
            <button
                type="button"
                onClick={() => onChange(Math.max(min, value - 1))}
                disabled={!canDecrease}
                className="px-3 py-2 text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Giảm số lượng"
            >
                -
            </button>
            <span className="min-w-10 px-3 py-2 text-center text-sm font-semibold">{value}</span>
            <button
                type="button"
                onClick={() => onChange(max === undefined ? value + 1 : Math.min(max, value + 1))}
                disabled={!canIncrease}
                className="px-3 py-2 text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Tăng số lượng"
            >
                +
            </button>
        </div>
    );
};

export default QuantityStepper;