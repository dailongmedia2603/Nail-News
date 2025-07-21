import { CreatePostForm } from "@/components/CreatePostForm";

const CreatePostPage = () => {
  return (
    <div className="container mx-auto max-w-4xl p-4 md:p-6">
      <div className="space-y-4">
        <div>
          <h1 className="text-3xl font-bold">Tạo tin đăng mới</h1>
          <p className="text-muted-foreground">
            Điền các thông tin dưới đây để đăng tin của bạn lên hệ thống.
          </p>
        </div>
        <CreatePostForm />
      </div>
    </div>
  );
};

export default CreatePostPage;