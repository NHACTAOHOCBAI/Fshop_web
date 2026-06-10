import axiosInstance from "@/lib/axios";
import type { Backup, DeleteBackupPayload, RestoreBackupPayload } from "@/types/backup";
import type { ApiResponse } from "@/types/response";

const BACKUP_OPERATION_TIMEOUT_MS = 5 * 60 * 1000;
const RESTORE_OPERATION_TIMEOUT_MS = 10 * 60 * 1000;

export const getBackups = async () => {
    const { data } = await axiosInstance.get<ApiResponse<Backup[]>>("/backup");
    return data;
};

export const createBackup = async () => {
    const { data } = await axiosInstance.post<ApiResponse<Backup>>("/backup", undefined, {
        timeout: BACKUP_OPERATION_TIMEOUT_MS,
    });
    return data;
};

export const getBackupInfo = async (filename: string) => {
    const { data } = await axiosInstance.get<ApiResponse<Backup>>(`/backup/${filename}`);
    return data;
};

export const restoreBackup = async (payload: RestoreBackupPayload) => {
    const { data } = await axiosInstance.post<ApiResponse<null>>(
        `/backup/${payload.filename}/restore`,
        undefined,
        { timeout: RESTORE_OPERATION_TIMEOUT_MS },
    );
    return data;
};

export const deleteBackup = async (payload: DeleteBackupPayload) => {
    const { data } = await axiosInstance.delete<ApiResponse<null>>(`/backup/${payload.filename}`);
    return data;
};
