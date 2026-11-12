DROP POLICY "anyone can send inquiry" ON public.inquiries;
REVOKE INSERT ON public.inquiries FROM anon, authenticated;
DROP POLICY "anyone logs events" ON public.listing_events;
REVOKE INSERT ON public.listing_events FROM anon, authenticated;
DROP POLICY "anyone uploads inquiry photo" ON storage.objects;