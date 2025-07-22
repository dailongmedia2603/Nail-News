import { useParams } from 'react-router-dom';
import { EditPostForm } from '@/components/EditPostForm';

const EditPostPage = () => {
  const { id } = useParams<{ id: string }>();

  if (!id) {
    return <div>Không tìm thấy ID tin đăng.</div>;
  }

  return (
    <div className="container mx-auto max-w-4xl p-4 md:p-6">
      <div className="space-y-4">
        <div>
          <h1 className="text-3xl font-bold">Chỉnh sửa tin đăng</h1>
          <p className="text-muted-foreground">
            Cập nhật thông tin cho tin đăng của bạn.
          </p>
        </div>
        <EditPostForm postId={id} />
      </div>
    </div>
  );
};

export default EditPostPage;