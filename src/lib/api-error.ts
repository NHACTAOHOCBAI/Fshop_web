type UnknownRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is UnknownRecord => {
    return typeof value === "object" && value !== null;
};

const toMessage = (value: unknown): string | undefined => {
    if (typeof value === "string") {
        return value;
    }

    if (Array.isArray(value)) {
        for (const item of value) {
            const nested = toMessage(item);
            if (nested) {
                return nested;
            }
        }
    }

    if (isRecord(value)) {
        const directMessage = toMessage(value.message);
        if (directMessage) {
            return directMessage;
        }

        const nestedError = toMessage(value.error);
        if (nestedError) {
            return nestedError;
        }

        const nestedData = toMessage(value.data);
        if (nestedData) {
            return nestedData;
        }
    }

    return undefined;
};

export const extractApiErrorMessage = (payload: unknown, fallback = "Đã có lỗi xảy ra"): string => {
    return toMessage(payload) ?? fallback;
};
