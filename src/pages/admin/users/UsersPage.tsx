import { useState } from "react";

import { Plus } from "lucide-react";
import { toast } from "sonner";

import CrudTable from "@/components/crud_table/crud-table";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useDeleteUser, useUsers } from "@/hooks/useUsers";
import type { QueryParams } from "@/types/query";
import type { RoleType, User } from "@/types/user";

import { CreateUserDialog } from "./create-user/create-user-dialog";
import { UpdateUserDialog } from "./update-user/update-user-dialog";
import { userColumns } from "./user-columns";

const UsersPage = () => {
    const [openCreate, setOpenCreate] = useState(false);
    const [openUpdate, setOpenUpdate] = useState(false);
    const [updatedItem, setUpdatedItem] = useState<User>();
    const [roleFilter, setRoleFilter] = useState<RoleType | "all">("all");
    const { mutate: deleteItem } = useDeleteUser();

    const handleUpdateBtn = (item: User) => {
        setUpdatedItem(item);
        setOpenUpdate(true);
    };

    const handleDeleteItem = (id: number) => {
        deleteItem(
            { id },
            {
                onSuccess: () => toast.success("Đã xóa người dùng"),
                onError: (error) => toast.error(`Xóa thất bại: ${error.message}`),
            }
        );
    };

    const useUsersQuery = (params: QueryParams) =>
        useUsers({
            ...params,
            role: roleFilter === "all" ? undefined : roleFilter,
        });

    return (
        <div className="space-y-4 w-full">
            <div>
                <h1 className="text-2xl font-semibold">Người dùng</h1>
                <p className="text-sm text-muted-foreground mt-1">
                    Quản lý danh sách người dùng, vai trò tài khoản và trạng thái hoạt động của thành viên hệ thống.
                </p>
            </div>

            <CrudTable<User>
                columns={userColumns(handleUpdateBtn, handleDeleteItem)}
                useQuery={useUsersQuery}
                filterPlaceholder="Lọc theo tên hoặc email..."
                dependencies={[roleFilter]}
                filterElement={
                    <Select
                        value={roleFilter}
                        onValueChange={(value) => setRoleFilter(value as RoleType | "all")}
                    >
                        <SelectTrigger className="h-9 w-44">
                            <SelectValue placeholder="Chọn vai trò" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Tất cả vai trò</SelectItem>
                            <SelectItem value="admin">Quản trị viên</SelectItem>
                            <SelectItem value="user">Người dùng</SelectItem>
                        </SelectContent>
                    </Select>
                }
            >
                <Button
                    variant="outline"
                    size="sm"
                    className="ml-2 h-9"
                    onClick={() => setOpenCreate(true)}
                >
                    <Plus className="size-4" />
                    Thêm người dùng
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
