import ProfileLayout from "@/components/ProfileLayout";
import { AccountForm } from "@/components/AccountForm";
import { PasswordForm } from "@/components/PasswordForm";
import { Separator } from "@/components/ui/separator";

const ProfilePage = () => {
  return (
    <ProfileLayout>
      <div className="space-y-10">
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-medium">Thông tin tài khoản</h3>
                <p className="text-sm text-muted-foreground">
                Cập nhật thông tin tài khoản của bạn.
                </p>
            </div>
            <AccountForm />
        </div>
        
        <Separator />

        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-medium">Đổi mật khẩu</h3>
                <p className="text-sm text-muted-foreground">
                Để bảo mật, bạn sẽ được đăng xuất sau khi đổi mật khẩu thành công.
                </p>
            </div>
            <PasswordForm />
        </div>
      </div>
    </ProfileLayout>
  );
};

export default ProfilePage;