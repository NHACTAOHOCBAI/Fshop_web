import { z } from "zod";

const CreateBrandSchema = z.object({
    name: z.string().min(1, "Brand name is required"),
    description: z.string().optional(),
    image: z.array(z.instanceof(File)).min(1, "You must choose an image"),
});

export default CreateBrandSchema;
