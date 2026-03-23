import { ArrowLeft, Image, X, AlertCircle } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useCreatePost } from "@/hooks/usePosts";
import { extractApiErrorMessage } from "@/lib/api-error";

const createPostSchema = z.object({
    content: z.string().max(5000, "Nội dung không được vượt quá 5000 ký tự"),
});

type CreatePostFormData = z.infer<typeof createPostSchema>;

const CreatePostPage = () => {
    const navigate = useNavigate();
    const { mutate: createPost, isPending: isCreating } = useCreatePost();

    const [images, setImages] = useState<File[]>([]);
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);
    const [hashtags, setHashtags] = useState<string[]>([]);
    const [hashtagInput, setHashtagInput] = useState("");
    const [showExitDialog, setShowExitDialog] = useState(false);
    const [isDirty, setIsDirty] = useState(false);

    const {
        register,
        handleSubmit,
        watch,
        formState: { errors },
    } = useForm<CreatePostFormData>({
        resolver: zodResolver(createPostSchema),
    });

    const contentValue = watch("content");
    const contentLength = contentValue?.length ?? 0;

    // Handle image selection
    const handleImageSelect = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            if (!e.target.files) return;

            const newFiles = Array.from(e.target.files);
            const totalFiles = images.length + newFiles.length;

            if (totalFiles > 10) {
                toast.error("Tối đa 10 ảnh cho một bài viết");
                return;
            }

            setImages((prev) => [...prev, ...newFiles]);
            setIsDirty(true);

            // Create previews
            const newPreviews: string[] = [];
            newFiles.forEach((file) => {
                const reader = new FileReader();
                reader.onload = (e) => {
                    if (e.target?.result) {
                        newPreviews.push(e.target.result as string);
                        if (newPreviews.length === newFiles.length) {
                            setImagePreviews((prev) => [...prev, ...newPreviews]);
                        }
                    }
                };
                reader.readAsDataURL(file);
            });
        },
        [images.length]
    );

    // Remove image
    const handleRemoveImage = useCallback((index: number) => {
        setImages((prev) => prev.filter((_, i) => i !== index));
        setImagePreviews((prev) => prev.filter((_, i) => i !== index));
        setIsDirty(true);
    }, []);

    // Add hashtag
    const handleAddHashtag = useCallback(() => {
        if (!hashtagInput.trim()) return;

        const hashtag = hashtagInput.trim().replace(/^#/, "").toLowerCase();

        if (hashtag.length > 50) {
            toast.error("Hashtag không được vượt quá 50 ký tự");
            return;
        }

        if (hashtags.includes(hashtag)) {
            toast.error("Hashtag này đã được thêm");
            return;
        }

        if (hashtags.length >= 10) {
            toast.error("Tối đa 10 hashtags cho một bài viết");
            return;
        }

        setHashtags((prev) => [...prev, hashtag]);
        setHashtagInput("");
        setIsDirty(true);
    }, [hashtagInput, hashtags]);

    // Remove hashtag
    const handleRemoveHashtag = useCallback((index: number) => {
        setHashtags((prev) => prev.filter((_, i) => i !== index));
        setIsDirty(true);
    }, []);

    // Handle hashtag input key press
    const handleHashtagKeyPress = useCallback(
        (e: React.KeyboardEvent<HTMLInputElement>) => {
            if (e.key === "Enter") {
                e.preventDefault();
                handleAddHashtag();
            }
        },
        [handleAddHashtag]
    );

    // Check if form has content
    const hasContent = useMemo(() => {
        return (
            (contentValue && contentValue.trim().length > 0) || images.length > 0 || hashtags.length > 0
        );
    }, [contentValue, images.length, hashtags.length]);

    // Handle form submission
    const onSubmit = (data: CreatePostFormData) => {
        if (!hasContent) {
            toast.error("Vui lòng nhập nội dung hoặc chọn ảnh");
            return;
        }

        createPost(
            {
                content: data.content || undefined,
                hashtags: hashtags.length > 0 ? hashtags : undefined,
                postImages: images.length > 0 ? images : undefined,
            },
            {
                onSuccess: () => {
                    toast.success("Bài viết đã được tạo");
                    navigate("/community");
                },
                onError: (error) => {
                    toast.error(extractApiErrorMessage(error));
                },
            }
        );
    };

    // Handle back button
    const handleBack = () => {
        if (isDirty) {
            setShowExitDialog(true);
        } else {
            navigate(-1);
        }
    };

    return (
        <>
            <div className="min-h-screen bg-gray-50 py-8">
                <div className="max-w-2xl mx-auto px-4">
                    {/* Header */}
                    <div className="flex items-center gap-4 mb-6">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleBack}
                            className="h-8 w-8 p-0"
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                        <h1 className="text-3xl font-bold text-slate-900">Tạo bài viết</h1>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-lg shadow p-6">
                        {/* Content */}
                        <div className="mb-6">
                            <Label htmlFor="content">Nội dung</Label>
                            <Textarea
                                id="content"
                                placeholder="Viết một cái gì đó thú vị..."
                                {...register("content")}
                                onChange={(e) => {
                                    register("content").onChange(e);
                                    setIsDirty(true);
                                }}
                                className="mt-2 min-h-32"
                                maxLength={5000}
                            />
                            <div className="flex items-start justify-between mt-2">
                                {errors.content && (
                                    <div className="flex items-center gap-1 text-sm text-red-600">
                                        <AlertCircle className="h-4 w-4" />
                                        {errors.content.message}
                                    </div>
                                )}
                                <span className="text-xs text-slate-500 ml-auto">{contentLength} / 5000</span>
                            </div>
                        </div>

                        {/* Hashtags */}
                        <div className="mb-6">
                            <Label htmlFor="hashtag">Hashtags</Label>
                            <div className="flex gap-2 mt-2">
                                <Input
                                    id="hashtag"
                                    placeholder="Thêm hashtag (VD: #trending)"
                                    value={hashtagInput}
                                    onChange={(e) => setHashtagInput(e.target.value)}
                                    onKeyPress={handleHashtagKeyPress}
                                    className="flex-1"
                                />
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={handleAddHashtag}
                                    disabled={!hashtagInput.trim()}
                                >
                                    Thêm
                                </Button>
                            </div>
                            {hashtags.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-3">
                                    {hashtags.map((tag, index) => (
                                        <div
                                            key={index}
                                            className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                                        >
                                            #{tag}
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveHashtag(index)}
                                                className="hover:text-blue-900"
                                            >
                                                <X className="h-3 w-3" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Image Upload */}
                        <div className="mb-6">
                            <Label>Ảnh</Label>
                            <div className="mt-2 border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-slate-400 transition-colors">
                                <input
                                    type="file"
                                    id="images"
                                    multiple
                                    accept="image/*"
                                    onChange={handleImageSelect}
                                    className="hidden"
                                    disabled={images.length >= 10}
                                />
                                <label htmlFor="images" className="cursor-pointer">
                                    <Image className="h-8 w-8 mx-auto mb-2 text-slate-400" />
                                    <p className="text-sm text-slate-700 font-medium">
                                        Nhấp để chọn ảnh hoặc kéo thả
                                    </p>
                                    <p className="text-xs text-slate-500 mt-1">
                                        Tối đa 10 ảnh ({images.length}/10)
                                    </p>
                                </label>
                            </div>

                            {/* Image Previews */}
                            {imagePreviews.length > 0 && (
                                <div className="grid grid-cols-4 gap-3 mt-4">
                                    {imagePreviews.map((preview, index) => (
                                        <div key={index} className="relative group">
                                            <img
                                                src={preview}
                                                alt={`Preview ${index}`}
                                                className="w-full aspect-square object-cover rounded-lg"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveImage(index)}
                                                className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <X className="h-4 w-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Validation message */}
                        {!hasContent && (
                            <div className="mb-6 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-2">
                                <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                                <p className="text-sm text-yellow-700">Vui lòng nhập nội dung hoặc chọn ảnh</p>
                            </div>
                        )}

                        {/* Buttons */}
                        <div className="flex gap-3">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleBack}
                                disabled={isCreating}
                            >
                                Hủy
                            </Button>
                            <Button type="submit" disabled={isCreating || !hasContent}>
                                {isCreating ? "Đang tạo..." : "Tạo bài viết"}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Exit confirmation dialog */}
            <AlertDialog open={showExitDialog} onOpenChange={setShowExitDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Bỏ chi tiêu?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Bạn có những thay đổi chưa được lưu. Nếu bạn rời đi, những thay đổi này sẽ bị mất.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogAction onClick={() => navigate(-1)}>Rời đi</AlertDialogAction>
                    <AlertDialogCancel>Quay lại</AlertDialogCancel>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
};

export default CreatePostPage;
