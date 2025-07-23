import { CreatePostForm } from "@/components/CreatePostForm";
import { useTranslation } from "react-i18next";

const CreatePostPage = () => {
  const { t } = useTranslation();
  return (
    <div className="container mx-auto max-w-4xl p-4 md:p-6">
      <div className="space-y-4">
        <div>
          <h1 className="text-3xl font-bold">{t('createPostPage.title')}</h1>
          <p className="text-muted-foreground">
            {t('createPostPage.subtitle')}
          </p>
        </div>
        <CreatePostForm />
      </div>
    </div>
  );
};

export default CreatePostPage;