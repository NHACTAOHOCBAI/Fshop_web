export type BackupStatus = "success" | "error";

export type Backup = {
    filename: string;
    size: number;
    createdAt: string;
    status: BackupStatus;
    downloadUrl?: string;
};

export type RestoreBackupPayload = {
    filename: string;
};

export type DeleteBackupPayload = {
    filename: string;
};
