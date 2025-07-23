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
import { useTranslation } from "react-i18next";

const ProfilePage = () => {
  const { t } = useTranslation();
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);

  return (
    <ProfileLayout>
      <div className="space-y-10">
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-medium">{t('profilePage.accountInfoTitle')}</h3>
                <p className="text-sm text-muted-foreground">
                {t('profilePage.accountInfoSubtitle')}
                </p>
            </div>
            <AccountForm />
        </div>
        
        <Separator />

        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-medium">{t('profilePage.changePasswordTitle')}</h3>
                <p className="text-sm text-muted-foreground">
                {t('profilePage.changePasswordSubtitle')}
                </p>
            </div>
            <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
                <DialogTrigger asChild>
                    <Button variant="outline">{t('profilePage.changePasswordButton')}</Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>{t('profilePage.dialogTitle')}</DialogTitle>
                        <DialogDescription>
                            {t('profilePage.dialogDescription')}
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