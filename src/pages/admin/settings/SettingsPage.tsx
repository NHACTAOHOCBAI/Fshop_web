import { useState, useEffect } from "react";
import { toast } from "sonner";
import { AlertCircle, Save, Loader2, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getSystemSettings, updateSystemSettings } from "@/services/settings";

const SettingsPage = () => {
  const [highThreshold, setHighThreshold] = useState<string>("180");
  const [mediumThreshold, setMediumThreshold] = useState<string>("60");
  const [stockThreshold, setStockThreshold] = useState<string>("10");
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);

  const fetchSettings = async (showSuccessToast = false) => {
    try {
      const response = await getSystemSettings();
      const settings = response.data;

      const high = settings.find(s => s.key === "DASHBOARD_URGENT_HIGH_THRESHOLD");
      const medium = settings.find(s => s.key === "DASHBOARD_URGENT_MEDIUM_THRESHOLD");
      const stock = settings.find(s => s.key === "STOCK_LOW_THRESHOLD");

      if (high) setHighThreshold(high.value);
      if (medium) setMediumThreshold(medium.value);
      if (stock) setStockThreshold(stock.value);

      if (showSuccessToast) {
        toast.info("Đã khôi phục cấu hình ban đầu");
      }
    } catch (error) {
      console.error("Failed to load settings:", error);
      toast.error("Không thể tải cấu hình hệ thống");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleCancel = () => {
    fetchSettings(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    const highVal = parseInt(highThreshold, 10);
    const mediumVal = parseInt(mediumThreshold, 10);
    const stockVal = parseInt(stockThreshold, 10);

    if (isNaN(highVal) || highVal <= 0) {
      toast.error("Ngưỡng khẩn cấp (High) phải là số phút lớn hơn 0");
      return;
    }
    if (isNaN(mediumVal) || mediumVal <= 0) {
      toast.error("Ngưỡng ưu tiên (Medium) phải là số phút lớn hơn 0");
      return;
    }
    if (highVal <= mediumVal) {
      toast.error("Ngưỡng khẩn cấp phải lớn hơn ngưỡng cần ưu tiên");
      return;
    }
    if (isNaN(stockVal) || stockVal < 0) {
      toast.error("Ngưỡng cảnh báo tồn kho thấp phải là số lớn hơn hoặc bằng 0");
      return;
    }

    setSaving(true);
    try {
      await updateSystemSettings([
        { key: "DASHBOARD_URGENT_HIGH_THRESHOLD", value: String(highVal) },
        { key: "DASHBOARD_URGENT_MEDIUM_THRESHOLD", value: String(mediumVal) },
        { key: "STOCK_LOW_THRESHOLD", value: String(stockVal) },
      ]);
      toast.success("Đã lưu cấu hình hệ thống thành công");
    } catch (error) {
      console.error("Failed to save settings:", error);
      toast.error("Không thể lưu cấu hình hệ thống");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[400px] w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#40BFFF]" />
      </div>
    );
  }

  return (
    <div className="space-y-4 w-full">
      <div>
        <h1 className="text-2xl font-semibold">Cấu hình hệ thống</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Thiết lập các tham số vận hành, thời gian cảnh báo xử lý đơn hàng và cấu hình chung toàn hệ thống.
        </p>
      </div>

      <form onSubmit={handleSave} className="w-full">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 space-y-6 w-full">
          <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
            <section className="rounded-xl border border-slate-200/60 bg-slate-50/10 p-5 flex flex-col justify-between">
              <div>
                <h2 className="text-base font-semibold text-slate-900  pb-2 flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-[#40BFFF]" />
                  Ngưỡng thời gian xử lý đơn hàng
                </h2>

                <div className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700 block">
                      Ngưỡng Khẩn cấp - High priority (màu đỏ)
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="number"
                        min="1"
                        value={highThreshold}
                        onChange={(e) => setHighThreshold(e.target.value)}
                        className="flex h-10 w-full max-w-[200px] rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#40BFFF] focus-visible:ring-offset-2"
                        placeholder="Ví dụ: 180"
                      />
                      <span className="text-sm text-slate-500">phút chờ</span>
                    </div>
                    <p className="text-xs text-slate-400">
                      Các đơn hàng chưa xử lý vượt quá số phút này sẽ hiển thị viền đỏ và ghi chú "Quá hạn xử lý".
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700 block">
                      Ngưỡng Cần ưu tiên - Medium priority (màu cam)
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="number"
                        min="1"
                        value={mediumThreshold}
                        onChange={(e) => setMediumThreshold(e.target.value)}
                        className="flex h-10 w-full max-w-[200px] rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#40BFFF] focus-visible:ring-offset-2"
                        placeholder="Ví dụ: 60"
                      />
                      <span className="text-sm text-slate-500">phút chờ</span>
                    </div>
                    <p className="text-xs text-slate-400">
                      Các đơn hàng chưa xử lý nằm trong khoảng từ ngưỡng Medium đến High sẽ hiển thị viền cam và ghi chú "Cần ưu tiên".
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-xl border border-slate-200/60 bg-slate-50/10 p-5 flex flex-col justify-between">
              <div>
                <h2 className="text-base font-semibold text-slate-900  pb-2 flex items-center gap-2">
                  <Package className="h-5 w-5 text-[#40BFFF]" />
                  Cấu hình tồn kho
                </h2>

                <div className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700 block">
                      Ngưỡng cảnh báo tồn kho thấp (Low stock threshold)
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="number"
                        min="0"
                        value={stockThreshold}
                        onChange={(e) => setStockThreshold(e.target.value)}
                        className="flex h-10 w-full max-w-[200px] rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#40BFFF] focus-visible:ring-offset-2"
                        placeholder="Ví dụ: 10"
                      />
                      <span className="text-sm text-slate-500">sản phẩm</span>
                    </div>
                    <p className="text-xs text-slate-400">
                      Các mặt hàng có số lượng tồn kho bằng hoặc nhỏ hơn số này sẽ hiển thị trong phần Cảnh báo nhập kho.
                    </p>
                  </div>
                </div>
              </div>
            </section>
          </div>

          <div className="flex justify-end items-center gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={saving}
              className="border-slate-200 text-slate-700 hover:bg-slate-50"
            >
              Hủy
            </Button>
            <Button type="submit" disabled={saving} className="bg-[#40BFFF] hover:bg-[#40BFFF]/90 text-white">
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang lưu...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Lưu cấu hình
                </>
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default SettingsPage;
