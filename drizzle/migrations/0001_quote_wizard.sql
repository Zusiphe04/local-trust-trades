ALTER TABLE public.inquiries ADD COLUMN answers jsonb NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE public.inquiries ADD COLUMN customer_phone text;
ALTER TABLE public.inquiries ADD COLUMN photo_path text;
ALTER TABLE public.inquiries ADD CONSTRAINT inquiries_photo_path_chk CHECK (photo_path IS NULL OR photo_path ~ '^inquiries/[0-9a-f-]{36}\.(jpg|jpeg|png|webp|heic|gif)$');
CREATE POLICY "anyone uploads inquiry photo" ON storage.objects FOR INSERT TO anon, authenticated
  WITH CHECK (bucket_id = 'listing-media' AND (storage.foldername(name))[1] = 'inquiries');
CREATE POLICY "owner reads inquiry photo" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'listing-media' AND (storage.foldername(name))[1] = 'inquiries' AND EXISTS (
    SELECT 1 FROM public.inquiries i JOIN public.listings l ON l.id = i.listing_id
    WHERE i.photo_path = storage.objects.name AND l.user_id = auth.uid()));