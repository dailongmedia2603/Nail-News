DROP POLICY IF EXISTS "Public can view active banners" ON public.banners;

CREATE POLICY "Public can view active banners" ON public.banners
FOR SELECT USING (
  is_active = TRUE AND (expires_at IS NULL OR expires_at > now())
);