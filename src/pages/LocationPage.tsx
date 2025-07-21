import { useState, useEffect } from "react";
import ProfileLayout from "@/components/ProfileLayout";
import { Button } from "@/components/ui/button";
import { Loader2, MapPin, AlertTriangle } from "lucide-react";

const LocationPage = () => {
  const [location, setLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  const getLocation = () => {
    if (!navigator.geolocation) {
      setStatus("error");
      setError("Trình duyệt của bạn không hỗ trợ định vị.");
      return;
    }

    setStatus("loading");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setStatus("success");
        setLocation({
          lat: position.coords.latitude,
          lon: position.coords.longitude,
        });
      },
      () => {
        setStatus("error");
        setError("Không thể truy cập vị trí của bạn. Vui lòng kiểm tra lại quyền truy cập trong cài đặt trình duyệt.");
      }
    );
  };

  return (
    <ProfileLayout>
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium">Định vị</h3>
          <p className="text-sm text-muted-foreground">
            Tìm kiếm các tiệm nail gần bạn nhất dựa trên vị trí GPS.
          </p>
        </div>
        <div className="border-2 border-dashed rounded-lg p-8 text-center">
          {status === "idle" && (
            <>
              <MapPin className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                Tìm tiệm nail xung quanh bạn
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Nhấp vào nút bên dưới để cho phép chúng tôi truy cập vị trí của bạn.
              </p>
              <div className="mt-6">
                <Button onClick={getLocation}>
                  Tìm kiếm gần đây
                </Button>
              </div>
            </>
          )}
          {status === "loading" && (
            <div className="flex flex-col items-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="mt-4 text-muted-foreground">Đang lấy vị trí của bạn...</p>
            </div>
          )}
          {status === "success" && location && (
            <div>
                <h3 className="text-lg font-semibold text-green-600">Lấy vị trí thành công!</h3>
                <p className="mt-2">Vĩ độ: <span className="font-mono">{location.lat}</span></p>
                <p>Kinh độ: <span className="font-mono">{location.lon}</span></p>
                <p className="mt-4 text-sm text-muted-foreground">
                    (Tính năng tìm kiếm các tiệm gần đây sẽ sớm được cập nhật sau khi cấu hình API.)
                </p>
            </div>
          )}
          {status === "error" && (
            <div className="text-red-600">
                <AlertTriangle className="mx-auto h-12 w-12" />
                <h3 className="mt-2 text-sm font-medium">Đã xảy ra lỗi</h3>
                <p className="mt-1 text-sm">{error}</p>
            </div>
          )}
        </div>
      </div>
    </ProfileLayout>
  );
};

export default LocationPage;