CREATE TABLE public.user_roles (
 user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
 role text NOT NULL DEFAULT 'customer' CHECK (role IN ('customer','provider')),
 registration_complete boolean NOT NULL DEFAULT false,
 created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read own account role" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());
INSERT INTO public.user_roles(user_id,role,registration_complete)
SELECT p.user_id, CASE WHEN EXISTS(SELECT 1 FROM public.listings l WHERE l.user_id=p.user_id) OR p.role='provider' THEN 'provider' ELSE 'customer' END,true FROM public.profiles p;
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
 INSERT INTO public.profiles(user_id,role) VALUES(NEW.id,'customer') ON CONFLICT(user_id) DO NOTHING;
 INSERT INTO public.user_roles(user_id) VALUES(NEW.id) ON CONFLICT(user_id) DO NOTHING;
 RETURN NEW;
END $$;
CREATE OR REPLACE FUNCTION public.complete_account_registration(account_role text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
 IF auth.uid() IS NULL OR account_role NOT IN ('customer','provider') THEN RAISE EXCEPTION 'Invalid account registration'; END IF;
 UPDATE public.user_roles SET role=account_role,registration_complete=true WHERE user_id=auth.uid() AND registration_complete=false;
END $$;
REVOKE ALL ON FUNCTION public.complete_account_registration(text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.complete_account_registration(text) TO authenticated;
COMMENT ON COLUMN public.profiles.role IS 'DEPRECATED: authorization uses protected public.user_roles';
ALTER POLICY "owner insert" ON public.listings WITH CHECK(auth.uid()=user_id AND EXISTS(SELECT 1 FROM public.user_roles r WHERE r.user_id=auth.uid() AND r.role='provider' AND r.registration_complete));
ALTER POLICY "owner update" ON public.listings USING(auth.uid()=user_id AND EXISTS(SELECT 1 FROM public.user_roles r WHERE r.user_id=auth.uid() AND r.role='provider')) WITH CHECK(auth.uid()=user_id AND EXISTS(SELECT 1 FROM public.user_roles r WHERE r.user_id=auth.uid() AND r.role='provider'));
ALTER POLICY "owner delete" ON public.listings USING(auth.uid()=user_id AND EXISTS(SELECT 1 FROM public.user_roles r WHERE r.user_id=auth.uid() AND r.role='provider'));
ALTER POLICY "signed in can review" ON public.reviews WITH CHECK(auth.uid()=reviewer_id AND provider_reply IS NULL AND EXISTS(SELECT 1 FROM public.user_roles r WHERE r.user_id=auth.uid() AND r.role='customer') AND NOT EXISTS(SELECT 1 FROM public.listings l WHERE l.id=listing_id AND l.user_id=auth.uid()));
ALTER TABLE public.reviews ADD CONSTRAINT provider_reply_length CHECK(provider_reply IS NULL OR char_length(provider_reply)<=1000);