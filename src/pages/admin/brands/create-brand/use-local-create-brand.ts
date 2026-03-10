import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { useCreateBrand } from "@/hooks/useBrands";

import CreateBrandSchema from "./create-brand-schema";

const useLocalCreateBrand = (closeDialog: () => void) => {
    const { mutate: createItem, isPending } = useCreateBrand();

    const form = useForm<z.infer<typeof CreateBrandSchema>>({
        resolver: zodResolver(CreateBrandSchema),
        defaultValues: {
            name: "",
            description: "",
            image: [],
        },
    });

    const onSubmit = (values: z.infer<typeof CreateBrandSchema>) => {
        createItem(
            {
                name: values.name,
                description: values.description,
                image: values.image[0],
            },
            {
                onSuccess: () => {
                    toast.success("Brand has been created");
                },
                onError: (error) => {
                    toast.error(`Create failed: ${error.message}`);
                },
                onSettled: () => {
                    form.reset({ name: "", description: "", image: [] });
                    closeDialog();
                },
            }
        );
    };

    const handleCancel = () => {
        form.reset({ name: "", description: "", image: [] });
        closeDialog();
    };

    return {
        form,
        isPending,
        onSubmit,
        handleCancel,
    };
};

export default useLocalCreateBrand;
