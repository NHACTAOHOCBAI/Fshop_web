import { useState } from "react";

import { Plus } from "lucide-react";
import { toast } from "sonner";

import CrudTable from "@/components/crud_table/crud-table";
import { Button } from "@/components/ui/button";
import { useDeleteUser, useUsers } from "@/hooks/useUsers";
import type { User } from "@/types/user";

import { CreateUserDialog } from "./create-user/create-user-dialog";
import { UpdateUserDialog } from "./update-user/update-user-dialog";
import { userColumns } from "./user-columns";

const UsersPage = () => {
    const [openCreate, setOpenCreate] = useState(false);
    const [openUpdate, setOpenUpdate] = useState(false);
    const [updatedItem, setUpdatedItem] = useState<User>();
    const { mutate: deleteItem } = useDeleteUser();

    const handleUpdateBtn = (item: User) => {
        setUpdatedItem(item);
        setOpenUpdate(true);
    };

    const handleDeleteItem = (id: number) => {
        deleteItem(
            { id },
            {
                onSuccess: () => toast.success("User has been deleted"),
                onError: (error) => toast.error(`Delete failed: ${error.message}`),
            }
        );
    };

    return (
        <div className="space-y-4 w-full">
            <h1 className="text-2xl font-semibold">Users</h1>

            <CrudTable<User>
                columns={userColumns(handleUpdateBtn, handleDeleteItem)}
                useQuery={useUsers}
                filterPlaceholder="Filter user name or email..."
            >
                <Button
                    variant="outline"
                    size="sm"
                    className="ml-2 h-8"
                    onClick={() => setOpenCreate(true)}
                >
                    <Plus className="size-4" />
                    Add User
                </Button>
            </CrudTable>

            <CreateUserDialog open={openCreate} setOpen={setOpenCreate} />
            <UpdateUserDialog
                open={openUpdate}
                setOpen={setOpenUpdate}
                updatedItem={updatedItem}
                setUpdatedItem={setUpdatedItem}
            />
        </div>
    );
};

export default UsersPage;
