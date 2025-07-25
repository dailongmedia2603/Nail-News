ALTER TABLE public.comments
ADD CONSTRAINT comments_post_id_author_id_key UNIQUE (post_id, author_id);