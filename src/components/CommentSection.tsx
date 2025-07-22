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
import { Loader2 } from 'lucide-react';

type CommentWithAuthor = {
  id: number;
  created_at: string;
  content: string;
  author_id: string;
  profiles: {
    first_name: string | null;
    last_name: string | null;
  } | null;
};

interface CommentSectionProps {
  postId: string;
}

export function CommentSection({ postId }: CommentSectionProps) {
  const [comments, setComments] = useState<CommentWithAuthor[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchComments = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('comments')
      .select('*, profiles(first_name, last_name)')
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

    const { error } = await supabase
      .from('comments')
      .insert({
        post_id: postId,
        author_id: user.id,
        content: newComment,
      });

    if (error) {
      showError('Gửi bình luận thất bại.');
    } else {
      setNewComment('');
      fetchComments(); // Refresh comments list
    }
    setIsSubmitting(false);
  };

  const getInitials = (firstName: string | null, lastName: string | null) => {
    const first = firstName?.charAt(0) || '';
    const last = lastName?.charAt(0) || '';
    return `${first}${last}`.toUpperCase();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bình luận</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmitComment} className="space-y-4">
          <Textarea
            placeholder="Viết bình luận của bạn..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            rows={3}
          />
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Gửi bình luận
          </Button>
        </form>
        <Separator className="my-6" />
        <div className="space-y-6">
          {loading ? (
            <p>Đang tải bình luận...</p>
          ) : comments.length > 0 ? (
            comments.map((comment) => (
              <div key={comment.id} className="flex items-start space-x-4">
                <Avatar>
                  <AvatarImage />
                  <AvatarFallback>
                    {getInitials(comment.profiles?.first_name, comment.profiles?.last_name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold">
                      {comment.profiles?.first_name || 'Người dùng'} {comment.profiles?.last_name || ''}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true, locale: vi })}
                    </p>
                  </div>
                  <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
                </div>
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