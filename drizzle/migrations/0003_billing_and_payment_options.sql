ALTER TABLE public.listings
  ADD COLUMN bank_name text,
  ADD COLUMN account_number text,
  ADD COLUMN branch_code text,
  ADD COLUMN payment_reference text,
  ADD COLUMN snapscan_qr_url text,
  ADD COLUMN payfast_link text,
  ADD COLUMN accepts_card boolean NOT NULL DEFAULT false,
  ADD COLUMN accepts_eft boolean NOT NULL DEFAULT false,
  ADD COLUMN accepts_snapscan boolean NOT NULL DEFAULT false,
  ADD COLUMN accepts_cash boolean NOT NULL DEFAULT true,
  ADD COLUMN subscription_status text NOT NULL DEFAULT 'none',
  ADD COLUMN next_billing_date timestamptz,
  ADD COLUMN payment_method_label text;

CREATE OR REPLACE FUNCTION public.protect_listing_plan() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF auth.role() IN ('authenticated','anon') THEN
    IF TG_OP = 'INSERT' THEN
      NEW.plan_type := 'free'; NEW.is_featured := false; NEW.rating := 0; NEW.review_count := 0;
      NEW.subscription_status := 'none'; NEW.next_billing_date := NULL; NEW.payment_method_label := NULL;
    ELSE
      NEW.plan_type := OLD.plan_type; NEW.is_featured := OLD.is_featured;
      NEW.subscription_status := OLD.subscription_status; NEW.next_billing_date := OLD.next_billing_date; NEW.payment_method_label := OLD.payment_method_label;
      IF pg_trigger_depth() <= 1 THEN NEW.rating := OLD.rating; NEW.review_count := OLD.review_count; END IF;
    END IF;
  END IF;
  IF NEW.plan_type = 'free' THEN NEW.website_url := NULL; NEW.social_url := NULL; END IF;
  RETURN NEW;
END $$;