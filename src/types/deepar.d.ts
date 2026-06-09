declare module "deepar" {
    export type DeepARInstance = {
        shutdown?: () => void | Promise<void>;
        switchEffect?: (slot: string, effect: string) => void | Promise<void>;
        takeScreenshot?: () => string | Promise<string>;
        startCamera?: (options?: {
            mirror?: boolean;
            mediaStreamConstraints?: MediaStreamConstraints;
            cameraPermissionAsked?: () => void;
            cameraPermissionGranted?: () => void;
        }) => void | Promise<void>;
        stopCamera?: () => void;
        stopVideo?: () => void;
    };

    export function initialize(options: {
        licenseKey: string;
        canvas?: HTMLCanvasElement;
        previewElement?: HTMLElement;
        effect?: string;
        additionalOptions?: {
            cameraConfig?: {
                disableDefaultCamera?: boolean;
                facingMode?: string;
                rotation?: number;
            };
            hint?: string | string[];
        };
    }): Promise<DeepARInstance>;
}
