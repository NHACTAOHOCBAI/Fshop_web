import { Camera, Mail, MapPin, Phone, UserRound } from "lucide-react";

import { Button } from "@/components/ui/button";

const mockProfile = {
    name: "Nguyễn Văn An",
    email: "nguyen.van.an@gmail.com",
    phone: "0901 234 567",
    address: "123 Nguyễn Văn Linh, Quận 7, TP. Hồ Chí Minh",
    gender: "Nam",
    birthday: "15/04/1998",
    joinedAt: "01/01/2024",
};

const ProfilePage = () => {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-xl font-bold text-slate-900">Thông tin cá nhân</h1>
                <p className="mt-1 text-sm text-slate-500">Quản lý thông tin hồ sơ để bảo mật tài khoản</p>
            </div>

            <div className="grid gap-6 lg:grid-cols-[1fr_200px]">
                {/* Form */}
                <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-5">
                    <div className="grid gap-5 sm:grid-cols-2">
                        <fieldset className="space-y-1.5">
                            <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                                Họ và tên
                            </label>
                            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800">
                                <UserRound className="size-4 shrink-0 text-slate-400" />
                                <span>{mockProfile.name}</span>
                            </div>
                        </fieldset>

                        <fieldset className="space-y-1.5">
                            <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                                Email
                            </label>
                            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800">
                                <Mail className="size-4 shrink-0 text-slate-400" />
                                <span>{mockProfile.email}</span>
                            </div>
                        </fieldset>

                        <fieldset className="space-y-1.5">
                            <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                                Số điện thoại
                            </label>
                            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800">
                                <Phone className="size-4 shrink-0 text-slate-400" />
                                <span>{mockProfile.phone}</span>
                            </div>
                        </fieldset>

                        <fieldset className="space-y-1.5">
                            <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                                Ngày sinh
                            </label>
                            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800">
                                <span>{mockProfile.birthday}</span>
                            </div>
                        </fieldset>

                        <fieldset className="space-y-1.5">
                            <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                                Giới tính
                            </label>
                            <div className="flex gap-3">
                                {["Nam", "Nữ", "Khác"].map((g) => (
                                    <label key={g} className="flex items-center gap-1.5 cursor-pointer text-sm text-slate-700">
                                        <input
                                            type="radio"
                                            name="gender"
                                            defaultChecked={g === mockProfile.gender}
                                            className="accent-primary"
                                            readOnly
                                        />
                                        {g}
                                    </label>
                                ))}
                            </div>
                        </fieldset>

                        <fieldset className="space-y-1.5">
                            <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                                Tham gia từ
                            </label>
                            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-400">
                                <span>{mockProfile.joinedAt}</span>
                            </div>
                        </fieldset>
                    </div>

                    <fieldset className="space-y-1.5">
                        <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                            Địa chỉ
                        </label>
                        <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800">
                            <MapPin className="size-4 shrink-0 text-slate-400" />
                            <span>{mockProfile.address}</span>
                        </div>
                    </fieldset>

                    <div className="pt-2 flex gap-3">
                        <Button size="sm">Lưu thay đổi</Button>
                        <Button size="sm" variant="outline">Huỷ</Button>
                    </div>
                </div>

                {/* Avatar */}
                <div className="rounded-2xl border border-slate-200 bg-white p-6 flex flex-col items-center gap-4">
                    <div className="relative">
                        <div className="flex size-24 items-center justify-center rounded-full bg-primary/10 text-primary">
                            <UserRound className="size-12" />
                        </div>
                        <button
                            type="button"
                            className="absolute bottom-0 right-0 flex size-7 items-center justify-center rounded-full bg-primary text-white shadow hover:bg-primary/90 transition-colors"
                        >
                            <Camera className="size-3.5" />
                        </button>
                    </div>
                    <div className="text-center">
                        <p className="text-sm font-semibold text-slate-800">{mockProfile.name}</p>
                        <p className="mt-0.5 text-xs text-slate-500">{mockProfile.email}</p>
                    </div>
                    <p className="text-center text-xs text-slate-400">
                        Dung lượng tối đa 1 MB. Định dạng: JPG, PNG.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;
