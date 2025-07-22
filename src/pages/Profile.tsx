import { useState } from "react";
import ProfileLayout from "@/components/ProfileLayout";
import { AccountForm } from "@/components/AccountForm";
import { PasswordForm } from "@/components/PasswordForm";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const ProfilePage = () => {
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);

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
                Nhấp vào nút bên dưới để đổi mật khẩu của bạn.
                </p>
            </div>
            <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
                <DialogTrigger asChild>
                    <Button variant="outline">Đổi mật khẩu</Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Đổi mật khẩu</DialogTitle>
                        <DialogDescription>
                            Để bảo mật, bạn sẽ được đăng xuất sau khi đổi mật khẩu thành công.
                        </DialogDescription>
                    </DialogHeader>
                    <PasswordForm onFinished={() => setIsPasswordDialogOpen(false)} />
                </DialogContent>
            </Dialog>
        </div>
      </div>
    </ProfileLayout>
  );
};

export default ProfilePage;