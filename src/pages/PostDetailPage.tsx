import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { type Post } from '@/components/PostCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, Calendar, Square, Armchair, Table, Users, DollarSign, Clock, CheckCircle, Share2, Store, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { showSuccess } from '@/utils/toast';
import { CommentSection } from '@/components/CommentSection';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from 'react-i18next';

type Tag = { id: number; name: string; };

const PostDetailPage = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const [post, setPost] = useState<Post | null>(null);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ... useEffect and handleShare ...

  if (loading) { /* ... */ }
  if (error || !post || !id) { /* ... */ }

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-4xl">
      <div className="space-y-6">
        {/* Header */}
        <div>
            {/* ... title and share button ... */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground mt-2">
                {post.location && <div className="flex items-center"><MapPin className="mr-1 h-4 w-4" /> {post.location}</div>}
                <div className="flex items-center"><Calendar className="mr-1 h-4 w-4" /> {t('postDetailPage.postedOn', { date: format(new Date(post.created_at), 'dd/MM/yyyy') })}</div>
                <div className="flex items-center"><Eye className="mr-1 h-4 w-4" /> {t('postDetailPage.views', { count: post.view_count })}</div>
            </div>
        </div>

        {/* Image Gallery */}
        {/* ... */}

        {/* Main Content */}
        <div className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-6">
                <Card>
                    <CardHeader><CardTitle>{t('postDetailPage.detailedDescription')}</CardTitle></CardHeader>
                    <CardContent className="prose dark:prose-invert max-w-none whitespace-pre-wrap">
                        <p>{post.description}</p>
                    </CardContent>
                </Card>
            </div>

            <div className="space-y-6">
                {post.category === 'Bán tiệm' && (
                    <>
                        <Card>
                            <CardHeader><CardTitle>{t('postDetailPage.basicInfo')}</CardTitle></CardHeader>
                            <CardContent className="space-y-3 text-sm">
                                <div className="flex items-center"><Square className="mr-2 h-4 w-4 text-muted-foreground" /> {t('postDetailPage.area')} <strong>{post.area || 'N/A'}</strong></div>
                                <div className="flex items-center"><Armchair className="mr-2 h-4 w-4 text-muted-foreground" /> {t('postDetailPage.chairs')} <strong>{post.chairs || 'N/A'}</strong></div>
                                <div className="flex items-center"><Table className="mr-2 h-4 w-4 text-muted-foreground" /> {t('postDetailPage.tables')} <strong>{post.tables || 'N/A'}</strong></div>
                                <div className="flex items-center"><Users className="mr-2 h-4 w-4 text-muted-foreground" /> {t('postDetailPage.staff')} <strong>{post.staff || 'N/A'}</strong></div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader><CardTitle>{t('postDetailPage.scaleInfo')}</CardTitle></CardHeader>
                            <CardContent className="space-y-3 text-sm">
                                <div className="flex items-center"><DollarSign className="mr-2 h-4 w-4 text-muted-foreground" /> {t('postDetailPage.revenue')} <strong>{post.revenue || 'N/A'}</strong></div>
                                <div className="flex items-center"><Clock className="mr-2 h-4 w-4 text-muted-foreground" /> {t('postDetailPage.hours')} <strong>{post.operating_hours || 'N/A'}</strong></div>
                            </CardContent>
                        </Card>
                    </>
                )}

                {post.category === 'Cần thợ' && (
                    <Card>
                        <CardHeader><CardTitle>{t('postDetailPage.jobInfo')}</CardTitle></CardHeader>
                        <CardContent className="space-y-3 text-sm">
                            <div className="flex items-center"><DollarSign className="mr-2 h-4 w-4 text-muted-foreground" /> {t('postDetailPage.salary')} <strong>{post.salary_info || 'N/A'}</strong></div>
                            <div className="flex items-center"><Clock className="mr-2 h-4 w-4 text-muted-foreground" /> {t('postDetailPage.hours')} <strong>{post.operating_hours || 'N/A'}</strong></div>
                            <div className="flex items-center"><Store className="mr-2 h-4 w-4 text-muted-foreground" /> {t('postDetailPage.salonStatus')} <strong>{post.store_status || 'N/A'}</strong></div>
                        </CardContent>
                    </Card>
                )}

                {post.services && post.services.length > 0 && (
                    <Card>
                        <CardHeader><CardTitle>{t('postDetailPage.businessServices')}</CardTitle></CardHeader>
                        <CardContent>
                            <ul className="space-y-2 pl-1 text-sm">
                                {post.services.map(service => <li key={service} className="flex items-center"><CheckCircle className="mr-2 h-4 w-4 text-green-500" /> {service}</li>)}
                            </ul>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
        
        {tags.length > 0 && (
          <Card>
            <CardHeader><CardTitle>{t('postDetailPage.tagsKeywords')}</CardTitle></CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {tags.map(tag => (
                <Badge key={tag.id} variant="secondary">{tag.name}</Badge>
              ))}
            </CardContent>
          </Card>
        )}

        <Card>
            <CardHeader><CardTitle>{t('postDetailPage.location')}</CardTitle></CardHeader>
            <CardContent>
                <p className="text-sm mb-4" dangerouslySetInnerHTML={{ __html: t('postDetailPage.address', { address: post.exact_address || post.location || 'Chưa cung cấp' }) }} />
                <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                    <p className="text-muted-foreground text-center p-4" dangerouslySetInnerHTML={{ __html: t('postDetailPage.mapComingSoon') }} />
                </div>
            </CardContent>
        </Card>

        <CommentSection postId={id} />
      </div>
    </div>
  );
};

export default PostDetailPage;