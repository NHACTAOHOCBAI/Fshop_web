import { useState } from "react";
import { Camera, Loader2, UploadCloud, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { activateBlogProfile } from "@/services/auth";
import { authStorage } from "@/lib/auth";
import type { User } from "@/types/user";

interface ActivateBlogModalProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: (updatedUser: User) => void;
}

const ActivateBlogModal = ({ isOpen, onOpenChange, onSuccess }: ActivateBlogModalProps) => {
    const [bio, setBio] = useState("");
    const [coverImage, setCoverImage] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (!file.type.startsWith("image/")) {
                toast.error("Vui lòng chọn tệp hình ảnh hợp lệ.");
                return;
            }
            if (file.size > 5 * 1024 * 1024) {
                toast.error("Kích thước ảnh tối đa là 5MB.");
                return;
            }
            setCoverImage(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewUrl(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleRemoveImage = () => {
        setCoverImage(null);
        setPreviewUrl(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!bio.trim()) {
            toast.error("Vui lòng điền tiểu sử của bạn.");
            return;
        }
        if (!coverImage) {
            toast.error("Vui lòng chọn ảnh bìa cho blog.");
            return;
        }

        setIsLoading(true);
        try {
            const updatedUser = await activateBlogProfile({
                bio: bio.trim(),
                coverImage,
            });

            // Update user in local storage
            const currentUser = authStorage.getUser<User>();
            if (currentUser) {
                authStorage.setUser({
                    ...currentUser,
                    ...updatedUser,
                });
            }

            toast.success("Kích hoạt tài khoản Blog thành công! Bây giờ bạn đã có thể viết bài đăng.");
            onSuccess(updatedUser);
            onOpenChange(false);
            // Reset states
            setBio("");
            setCoverImage(null);
            setPreviewUrl(null);
        } catch (error: any) {
            console.error("Error activating blog:", error);
            const errMsg = error.response?.data?.message || "Đã xảy ra lỗi khi kích hoạt blog.";
            toast.error(errMsg);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-xl">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold text-slate-800">Kích hoạt tài khoản Blog</DialogTitle>
                    <DialogDescription className="text-sm text-slate-500">
                        Để bắt đầu đăng bài viết trên Community, vui lòng hoàn tất thông tin hồ sơ dưới đây. Thông tin này sẽ hiển thị công khai trên trang cá nhân của bạn.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="mt-4 space-y-6">
                    {/* Cover Image Upload */}
                    <div className="space-y-2">
                        <Label className="text-sm font-semibold text-slate-700">Ảnh bìa Blog (Bắt buộc)</Label>
                        
                        {previewUrl ? (
                            <div className="group relative h-40 w-full overflow-hidden rounded-2xl border border-slate-100 bg-slate-50">
                                <img
                                    src={previewUrl}
                                    alt="Cover preview"
                                    className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                                />
                                <div className="absolute inset-0 bg-black/30 opacity-0 transition group-hover:opacity-100 flex items-center justify-center gap-2">
                                    <label
                                        htmlFor="cover-image-upload-edit"
                                        className="inline-flex cursor-pointer items-center justify-center rounded-full bg-white p-2.5 text-slate-700 shadow-md transition hover:bg-slate-50"
                                    >
                                        <Camera className="h-4 w-4" />
                                    </label>
                                    <button
                                        type="button"
                                        onClick={handleRemoveImage}
                                        className="inline-flex items-center justify-center rounded-full bg-red-500 p-2.5 text-white shadow-md transition hover:bg-red-600"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                </div>
                                <input
                                    id="cover-image-upload-edit"
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleFileChange}
                                    disabled={isLoading}
                                />
                            </div>
                        ) : (
                            <label
                                htmlFor="cover-image-upload"
                                className="flex h-40 w-full cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition hover:border-primary/40 group"
                            >
                                <div className="flex flex-col items-center justify-center pb-6 pt-5">
                                    <div className="mb-3 rounded-full bg-white p-2.5 text-slate-400 shadow-xs group-hover:text-primary transition">
                                        <UploadCloud className="h-6 w-6" />
                                    </div>
                                    <p className="text-sm font-medium text-slate-600 group-hover:text-slate-800">
                                        Nhấp để tải lên ảnh bìa
                                    </p>
                                    <p className="mt-1 text-xs text-slate-400">PNG, JPG hoặc JPEG (Tối đa 5MB)</p>
                                </div>
                                <input
                                    id="cover-image-upload"
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleFileChange}
                                    disabled={isLoading}
                                />
                            </label>
                        )}
                    </div>

                    {/* Bio Input */}
                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <Label htmlFor="bio" className="text-sm font-semibold text-slate-700">
                                Tiểu sử / Bio (Bắt buộc)
                            </Label>
                            <span className="text-xs text-slate-400">
                                {bio.length}/150 ký tự
                            </span>
                        </div>
                        <Textarea
                            id="bio"
                            value={bio}
                            onChange={(e) => setBio(e.target.value.slice(0, 150))}
                            placeholder="Viết một vài câu giới thiệu bản thân, sở thích mặc đồ hoặc chủ đề blog của bạn..."
                            className="min-h-24 rounded-xl border-slate-200 resize-none focus-visible:ring-primary"
                            disabled={isLoading}
                        />
                    </div>

                    {/* Footer Buttons */}
                    <div className="flex items-center justify-end gap-3 pt-2">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => onOpenChange(false)}
                            className="rounded-xl border border-slate-200 text-slate-600 hover:text-slate-900"
                            disabled={isLoading}
                        >
                            Hủy bỏ
                        </Button>
                        <Button
                            type="submit"
                            className="rounded-xl px-5 bg-primary hover:bg-primary/95 text-white"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Đang kích hoạt...
                                </>
                            ) : (
                                "Kích hoạt ngay"
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default ActivateBlogModal;
