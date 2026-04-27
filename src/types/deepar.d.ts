declare module "deepar" {
    export type DeepARInstance = {
        shutdown?: () => void | Promise<void>;
        switchEffect?: (slot: string, effect: string) => void | Promise<void>;
        takeScreenshot?: () => string | Promise<string>;
    };

    export function initialize(options: {
        licenseKey: string;
        canvas: HTMLCanvasElement;
        effect?: string;
    }): Promise<DeepARInstance>;
}
