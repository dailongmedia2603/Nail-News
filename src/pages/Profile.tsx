import ProfileLayout from "@/components/ProfileLayout";
import { AccountForm } from "@/components/AccountForm";

const ProfilePage = () => {
  return (
    <ProfileLayout>
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-medium">Thông tin tài khoản</h3>
                <p className="text-sm text-muted-foreground">
                Cập nhật thông tin tài khoản của bạn.
                </p>
            </div>
            <AccountForm />
        </div>
    </ProfileLayout>
  );
};

export default ProfilePage;