import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { showError, showSuccess, showLoading, dismissToast } from '@/utils/toast';
import { Loader2, Trash2 } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

type Comment = {
  id: number;
  created_at: string;
  content: string;
  author_id: string;
  author_name: string | null;
};

interface CommentSectionProps {
  postId: string;
}

export function CommentSection({ postId }: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAdminStatus = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
        if (profile?.role === 'admin') {
          setIsAdmin(true);
        }
      }
    };
    checkAdminStatus();
  }, []);

  const fetchComments = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('comments')
      .select('*')
      .eq('post_id', postId)
      .order('created_at', { ascending: false });

    if (error) {
      showError('Không thể tải bình luận.');
      console.error(error);
    } else {
      setComments(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchComments();
  }, [postId]);

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newComment.trim() === '') return;

    setIsSubmitting(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      showError('Bạn cần đăng nhập để bình luận.');
      setIsSubmitting(false);
      return;
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('first_name, last_name')
      .eq('id', user.id)
      .single();

    const authorName = `${profile?.first_name || 'Người dùng'} ${profile?.last_name || ''}`.trim();

    const { error } = await supabase
      .from('comments')
      .insert({
        post_id: postId,
        author_id: user.id,
        content: newComment,
        author_name: authorName,
      });

    if (error) {
      showError('Gửi bình luận thất bại.');
    } else {
      setNewComment('');
      fetchComments(); // Refresh comments list
    }
    setIsSubmitting(false);
  };

  const handleDeleteComment = async (commentId: number) => {
    const { error } = await supabase.from('comments').delete().eq('id', commentId);
    if (error) {
      showError("Xóa bình luận thất bại.");
    } else {
      showSuccess("Đã xóa bình luận.");
      setComments(comments.filter(c => c.id !== commentId));
    }
  };

  const getInitials = (name: string | null) => {
    if (!name) return 'ND';
    const parts = name.split(' ');
    const first = parts[0]?.charAt(0) || '';
    const last = parts.length > 1 ? parts[parts.length - 1]?.charAt(0) : '';
    return `${first}${last}`.toUpperCase();
  };

  return (
    <Card>
      <CardHeader><CardTitle>Bình luận</CardTitle></CardHeader>
      <CardContent>
        <form onSubmit={handleSubmitComment} className="space-y-4">
          <Textarea placeholder="Viết bình luận của bạn..." value={newComment} onChange={(e) => setNewComment(e.target.value)} rows={3} />
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Gửi bình luận
          </Button>
        </form>
        <Separator className="my-6" />
        <div className="space-y-6">
          {loading ? ( <p>Đang tải bình luận...</p> ) : comments.length > 0 ? (
            comments.map((comment) => (
              <div key={comment.id} className="flex items-start space-x-4 group">
                <Avatar>
                  <AvatarImage />
                  <AvatarFallback>{getInitials(comment.author_name)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold">{comment.author_name || 'Người dùng'}</p>
                    <p className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(comment.created_at), { addSuffix: true, locale: vi })}</p>
                  </div>
                  <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
                </div>
                {isAdmin && (
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
                        <AlertDialogAction onClick={() => handleDeleteComment(comment.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Xóa</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground text-center">Chưa có bình luận nào. Hãy là người đầu tiên!</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}