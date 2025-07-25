ALTER TABLE public.comments
ADD COLUMN rating INTEGER;

ALTER TABLE public.comments
ADD CONSTRAINT rating_check CHECK (rating IS NULL OR (rating >= 1 AND rating <= 5));