import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { useUpdateBrand } from "@/hooks/useBrands";
import type { Brand } from "@/types/brand";

import UpdateBrandSchema from "./update-brand-schema";

type PreviewFile = File & { preview?: string };

const useLocalUpdateBrand = (
    updatedItem: Brand | undefined,
    closeDialog: () => void
) => {
    const { mutate: updateItem, isPending } = useUpdateBrand();
    const [isImageLoading, setIsImageLoading] = useState(false);

    const form = useForm<z.infer<typeof UpdateBrandSchema>>({
        resolver: zodResolver(UpdateBrandSchema),
        defaultValues: {
            name: "",
            description: "",
            image: [],
        },
    });

    const onSubmit = (values: z.infer<typeof UpdateBrandSchema>) => {
        if (!updatedItem) {
            return;
        }

        updateItem(
            {
                id: updatedItem.id,
                data: {
                    name: values.name,
                    description: values.description,
                    image: values.image[0],
                },
            },
            {
                onSuccess: () => {
                    toast.success("Brand has been updated");
                },
                onError: (error) => {
                    toast.error(`Update failed: ${error.message}`);
                },
                onSettled: () => {
                    handleCancel();
                },
            }
        );
    };

    const handleCancel = () => {
        form.reset({ name: "", description: "", image: [] });
        closeDialog();
    };

    const initializeImage = async (item: Brand) => {
        if (!item.imageUrl) {
            return [] as File[];
        }

        setIsImageLoading(true);
        const response = await fetch(item.imageUrl);
        const blob = await response.blob();
        const file = new File([blob], "image", { type: blob.type }) as PreviewFile;
        file.preview = item.imageUrl;
        setIsImageLoading(false);

        return [file] as File[];
    };

    const resetForm = useCallback(async () => {
        if (!updatedItem) {
            return;
        }

        const image = await initializeImage(updatedItem);
        form.reset({
            name: updatedItem.name,
            description: updatedItem.description ?? "",
            image,
        });
    }, [form, updatedItem]);

    useEffect(() => {
        resetForm();
    }, [resetForm]);

    return {
        form,
        isPending,
        isImageLoading,
        onSubmit,
        handleCancel,
    };
};

export default useLocalUpdateBrand;
