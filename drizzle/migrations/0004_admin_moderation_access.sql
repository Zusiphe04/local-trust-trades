ALTER TABLE public.user_roles DROP CONSTRAINT user_roles_role_check;
ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_role_check CHECK (role IN ('customer','provider','admin'));
ALTER TABLE public.listings
  ADD COLUMN is_verified boolean NOT NULL DEFAULT false,
  ADD COLUMN verification_status text NOT NULL DEFAULT 'incomplete' CHECK (verification_status IN ('incomplete','pending','approved','rejected')),
  ADD COLUMN verification_identity_path text CHECK (verification_identity_path IS NULL OR verification_identity_path ~ '^[0-9a-f-]{36}/verification/identity/[0-9a-f-]{36}\.(pdf|png|jpg|jpeg)$'),
  ADD COLUMN verification_business_path text CHECK (verification_business_path IS NULL OR verification_business_path ~ '^[0-9a-f-]{36}/verification/business/[0-9a-f-]{36}\.(pdf|png|jpg|jpeg)$'),
  ADD COLUMN moderation_status text NOT NULL DEFAULT 'active' CHECK (moderation_status IN ('active','pending','suspended','removed')),
  ADD COLUMN is_flagged boolean NOT NULL DEFAULT false;
CREATE OR REPLACE FUNCTION public.protect_listing_plan() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF auth.role() IN ('authenticated','anon') THEN
    IF TG_OP = 'INSERT' THEN
      NEW.plan_type := 'free'; NEW.is_featured := false; NEW.rating := 0; NEW.review_count := 0;
      NEW.subscription_status := 'none'; NEW.next_billing_date := NULL; NEW.payment_method_label := NULL;
      NEW.is_verified := false; NEW.moderation_status := 'active'; NEW.is_flagged := false;
      NEW.verification_status := CASE WHEN NEW.verification_identity_path IS NOT NULL AND NEW.verification_business_path IS NOT NULL THEN 'pending' ELSE 'incomplete' END;
    ELSE
      NEW.plan_type := OLD.plan_type; NEW.is_featured := OLD.is_featured;
      NEW.subscription_status := OLD.subscription_status; NEW.next_billing_date := OLD.next_billing_date; NEW.payment_method_label := OLD.payment_method_label;
      NEW.is_verified := OLD.is_verified; NEW.moderation_status := OLD.moderation_status; NEW.is_flagged := OLD.is_flagged;
      NEW.verification_status := OLD.verification_status;
      IF NEW.verification_identity_path IS DISTINCT FROM OLD.verification_identity_path OR NEW.verification_business_path IS DISTINCT FROM OLD.verification_business_path THEN
        NEW.is_verified := false;
        NEW.verification_status := CASE WHEN NEW.verification_identity_path IS NOT NULL AND NEW.verification_business_path IS NOT NULL THEN 'pending' ELSE 'incomplete' END;
      END IF;
      IF pg_trigger_depth() <= 1 THEN NEW.rating := OLD.rating; NEW.review_count := OLD.review_count; END IF;
    END IF;
  END IF;
  IF NEW.plan_type = 'free' THEN NEW.website_url := NULL; NEW.social_url := NULL; END IF;
  RETURN NEW;
END $$;