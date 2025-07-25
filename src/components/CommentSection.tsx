import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { showError, showSuccess, showLoading, dismissToast } from '@/utils/toast';
import { Loader2, Trash2, Pencil } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import type { User } from '@supabase/supabase-js';
import { type Review as Comment } from './ReviewSection'; // Re-use the type, alias as Comment

interface CommentSectionProps {
  postId: string;
  reviews: Comment[]; // Prop name kept for compatibility
  onReviewSubmit: () => void; // Prop name kept for compatibility
}

export function CommentSection({ postId, reviews: comments, onReviewSubmit: onCommentSubmit }: CommentSectionProps) {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
      if (user) {
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
        setIsAdmin(profile?.role === 'admin');
      }
    };
    getUser();
  }, []);

  const userComment = useMemo(() => {
    return comments.find(comment => comment.author_id === currentUser?.id);
  }, [comments, currentUser]);

  const otherComments = useMemo(() => {
    return comments.filter(comment => comment.author_id !== currentUser?.id);
  }, [comments, currentUser]);

  const handleEditClick = () => {
    if (userComment) {
      setIsEditing(true);
      setContent(userComment.content);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setContent('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (content.trim() === '') {
      showError('Vui lòng viết bình luận của bạn.');
      return;
    }

    setIsSubmitting(true);
    const toastId = showLoading(isEditing ? "Đang cập nhật..." : "Đang gửi...");

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      dismissToast(toastId);
      showError('Bạn cần đăng nhập để bình luận.');
      setIsSubmitting(false);
      return;
    }

    const { data: profile } = await supabase.from('profiles').select('first_name, last_name').eq('id', user.id).single();
    const authorName = `${profile?.first_name || 'Người dùng'} ${profile?.last_name || ''}`.trim();

    const commentData = {
      post_id: postId,
      author_id: user.id,
      content: content,
      author_name: authorName,
      rating: null, // No rating for comments
    };

    let error;
    if (isEditing && userComment) {
      ({ error } = await supabase.from('comments').update(commentData).eq('id', userComment.id));
    } else {
      ({ error } = await supabase.from('comments').insert(commentData));
    }

    dismissToast(toastId);
    if (error) {
      showError(error.code === '23505' ? 'Bạn đã bình luận bài này rồi.' : 'Đã xảy ra lỗi.');
    } else {
      showSuccess(isEditing ? 'Cập nhật thành công!' : 'Gửi bình luận thành công!');
      setContent('');
      setIsEditing(false);
      onCommentSubmit();
    }
    setIsSubmitting(false);
  };

  const handleDelete = async (commentId: number) => {
    const { error } = await supabase.from('comments').delete().eq('id', commentId);
    if (error) {
      showError("Xóa bình luận thất bại.");
    } else {
      showSuccess("Đã xóa bình luận.");
      onCommentSubmit();
    }
  };

  const getInitials = (name: string | null) => {
    if (!name) return 'ND';
    const parts = name.split(' ');
    const first = parts[0]?.charAt(0) || '';
    const last = parts.length > 1 ? parts[parts.length - 1]?.charAt(0) : '';
    return `${first}${last}`.toUpperCase();
  };

  const renderComment = (comment: Comment) => (
    <div key={comment.id} className="flex items-start space-x-4 group">
      <Avatar>
        <AvatarImage />
        <AvatarFallback>{getInitials(comment.author_name)}</AvatarFallback>
      </Avatar>
      <div className="flex-1">
        <div className="flex items-center justify-between">
          <p className="font-semibold">{comment.author_name || 'Người dùng'}</p>
          <div className="flex items-center gap-2">
            <p className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(comment.created_at), { addSuffix: true, locale: vi })}</p>
            {(isAdmin || currentUser?.id === comment.author_id) && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100">
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Bạn có chắc chắn muốn xóa?</AlertDialogTitle>
                    <AlertDialogDescription>Hành động này không thể hoàn tác. Bình luận này sẽ bị xóa vĩnh viễn.</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Hủy</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handleDelete(comment.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Xóa</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>
        <p className="text-sm whitespace-pre-wrap mt-2">{comment.content}</p>
      </div>
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bình luận ({comments.length})</CardTitle>
      </CardHeader>
      <CardContent>
        {currentUser && (userComment && !isEditing ? (
          <div className="p-4 border rounded-md bg-muted/50">
            <div className="flex justify-between items-center">
              <p className="font-semibold">Bình luận của bạn</p>
              <div className="flex gap-2">
                <Button variant="ghost" size="icon" onClick={handleEditClick}><Pencil className="h-4 w-4" /></Button>
              </div>
            </div>
            {renderComment(userComment)}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <Textarea placeholder="Viết bình luận của bạn..." value={content} onChange={(e) => setContent(e.target.value)} rows={3} />
            <div className="flex gap-2">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditing ? 'Cập nhật' : 'Gửi bình luận'}
              </Button>
              {isEditing && <Button type="button" variant="outline" onClick={handleCancelEdit}>Hủy</Button>}
            </div>
          </form>
        ))}
        <Separator className="my-6" />
        <div className="space-y-6">
          {otherComments.length > 0 ? (
            otherComments.map(renderComment)
          ) : (
            !userComment && <p className="text-sm text-muted-foreground text-center">Chưa có bình luận nào. Hãy là người đầu tiên!</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}