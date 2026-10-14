
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'customer' CHECK (role IN ('customer','provider')),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile read" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own profile insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (user_id, role)
  VALUES (NEW.id, CASE WHEN NEW.raw_user_meta_data->>'role' = 'provider' THEN 'provider' ELSE 'customer' END)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TABLE public.listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE,
  business_name text NOT NULL,
  category text NOT NULL,
  bio text NOT NULL DEFAULT '',
  phone text,
  email text,
  website_url text,
  social_url text,
  plan_type text NOT NULL DEFAULT 'free' CHECK (plan_type IN ('free','pro')),
  is_featured boolean NOT NULL DEFAULT false,
  rating numeric(2,1) NOT NULL DEFAULT 0,
  review_count integer NOT NULL DEFAULT 0,
  service_area text NOT NULL DEFAULT '',
  hours text NOT NULL DEFAULT 'Mon–Fri 8:00–18:00',
  logo_url text,
  cover_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.listings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.listings TO authenticated;
GRANT ALL ON public.listings TO service_role;
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "listings public read" ON public.listings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "owner insert" ON public.listings FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "owner update" ON public.listings FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "owner delete" ON public.listings FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.protect_listing_plan() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF auth.role() IN ('authenticated','anon') THEN
    IF TG_OP = 'INSERT' THEN
      NEW.plan_type := 'free'; NEW.is_featured := false; NEW.rating := 0; NEW.review_count := 0;
    ELSE
      NEW.plan_type := OLD.plan_type; NEW.is_featured := OLD.is_featured;
      IF pg_trigger_depth() <= 1 THEN NEW.rating := OLD.rating; NEW.review_count := OLD.review_count; END IF;
    END IF;
  END IF;
  IF NEW.plan_type = 'free' THEN NEW.website_url := NULL; NEW.social_url := NULL; END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER listings_protect BEFORE INSERT OR UPDATE ON public.listings FOR EACH ROW EXECUTE FUNCTION public.protect_listing_plan();

CREATE TABLE public.gallery_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.gallery_images TO anon;
GRANT SELECT, INSERT, DELETE ON public.gallery_images TO authenticated;
GRANT ALL ON public.gallery_images TO service_role;
ALTER TABLE public.gallery_images ENABLE ROW LEVEL SECURITY;
CREATE POLICY "gallery public read" ON public.gallery_images FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "gallery owner insert" ON public.gallery_images FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.listings l WHERE l.id = listing_id AND l.user_id = auth.uid()));
CREATE POLICY "gallery owner delete" ON public.gallery_images FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.listings l WHERE l.id = listing_id AND l.user_id = auth.uid()));

CREATE OR REPLACE FUNCTION public.enforce_gallery_limit() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE p text; c int;
BEGIN
  SELECT plan_type INTO p FROM public.listings WHERE id = NEW.listing_id;
  IF p = 'free' THEN
    SELECT count(*) INTO c FROM public.gallery_images WHERE listing_id = NEW.listing_id;
    IF c >= 2 THEN RAISE EXCEPTION 'Free plan allows 2 photos. Upgrade to Pro for unlimited photos.'; END IF;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER gallery_limit BEFORE INSERT ON public.gallery_images FOR EACH ROW EXECUTE FUNCTION public.enforce_gallery_limit();

CREATE TABLE public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  reviewer_id uuid,
  reviewer_name text NOT NULL CHECK (char_length(reviewer_name) BETWEEN 1 AND 80),
  rating integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment text NOT NULL CHECK (char_length(comment) BETWEEN 1 AND 2000),
  provider_reply text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.reviews TO anon;
GRANT SELECT, INSERT, UPDATE ON public.reviews TO authenticated;
GRANT ALL ON public.reviews TO service_role;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reviews public read" ON public.reviews FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "signed in can review" ON public.reviews FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = reviewer_id AND provider_reply IS NULL
    AND NOT EXISTS (SELECT 1 FROM public.listings l WHERE l.id = listing_id AND l.user_id = auth.uid()));
CREATE POLICY "pro owner can reply" ON public.reviews FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.listings l WHERE l.id = listing_id AND l.user_id = auth.uid() AND l.plan_type = 'pro'));

CREATE OR REPLACE FUNCTION public.protect_review_update() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.rating := OLD.rating; NEW.comment := OLD.comment; NEW.reviewer_name := OLD.reviewer_name;
  NEW.reviewer_id := OLD.reviewer_id; NEW.listing_id := OLD.listing_id;
  RETURN NEW;
END $$;
CREATE TRIGGER reviews_protect BEFORE UPDATE ON public.reviews FOR EACH ROW EXECUTE FUNCTION public.protect_review_update();

CREATE OR REPLACE FUNCTION public.refresh_listing_rating() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE lid uuid := COALESCE(NEW.listing_id, OLD.listing_id);
BEGIN
  UPDATE public.listings SET
    rating = COALESCE((SELECT round(avg(rating)::numeric, 1) FROM public.reviews WHERE listing_id = lid), 0),
    review_count = (SELECT count(*) FROM public.reviews WHERE listing_id = lid)
  WHERE id = lid;
  RETURN NULL;
END $$;
CREATE TRIGGER reviews_rating AFTER INSERT OR DELETE ON public.reviews FOR EACH ROW EXECUTE FUNCTION public.refresh_listing_rating();

CREATE TABLE public.inquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  customer_name text NOT NULL CHECK (char_length(customer_name) BETWEEN 1 AND 100),
  customer_email text NOT NULL CHECK (char_length(customer_email) BETWEEN 3 AND 255),
  message text NOT NULL CHECK (char_length(message) BETWEEN 1 AND 2000),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.inquiries TO anon;
GRANT SELECT, INSERT ON public.inquiries TO authenticated;
GRANT ALL ON public.inquiries TO service_role;
ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone can send inquiry" ON public.inquiries FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "owner reads inquiries" ON public.inquiries FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.listings l WHERE l.id = listing_id AND l.user_id = auth.uid()));

CREATE TABLE public.listing_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  event_type text NOT NULL CHECK (event_type IN ('view','phone_click','email_click','website_click')),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.listing_events TO anon;
GRANT SELECT, INSERT ON public.listing_events TO authenticated;
GRANT ALL ON public.listing_events TO service_role;
ALTER TABLE public.listing_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone logs events" ON public.listing_events FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "owner reads events" ON public.listing_events FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.listings l WHERE l.id = listing_id AND l.user_id = auth.uid()));

CREATE POLICY "media read" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'listing-media' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "media own upload" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'listing-media' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "media own delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'listing-media' AND (storage.foldername(name))[1] = auth.uid()::text);

ALTER TABLE public.listings DISABLE TRIGGER listings_protect;
INSERT INTO public.listings (id, business_name, category, bio, phone, email, website_url, plan_type, is_featured, service_area, hours, logo_url, cover_url) VALUES
('11111111-0000-0000-0000-000000000001','Ridgeline Plumbing Co.','Plumbing','Licensed plumbers handling leaks, water heaters, drain clearing and full repipes. Upfront pricing, same-day service most weekdays, and we clean up after ourselves.','(512) 555-0142','hello@ridgelineplumbing.com','https://example.com','pro',true,'Austin, TX 78701','Mon–Sat 7:00–19:00','https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?w=400','https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=1600'),
('11111111-0000-0000-0000-000000000002','BrightWire Electric','Electrical','Residential electricians for panel upgrades, EV charger installs, lighting and troubleshooting. Fully insured, permits handled for you.','(512) 555-0199','book@brightwire.com','https://example.com','pro',true,'Austin, TX 78704','Mon–Fri 8:00–18:00','https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400','https://images.unsplash.com/photo-1558002038-1055907df827?w=1600'),
('11111111-0000-0000-0000-000000000003','Fresh Start Cleaning','Cleaning','Weekly, bi-weekly and move-out cleans. Background-checked staff and eco-friendly products. If you are not happy, we come back free.','(512) 555-0110','team@freshstart.com',NULL,'free',false,'Round Rock, TX 78664','Mon–Sat 8:00–17:00',NULL,'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=1600'),
('11111111-0000-0000-0000-000000000004','Handy Hank Repairs','Handyman','Drywall patches, furniture assembly, TV mounting, door fixes — the small jobs nobody else wants. Hourly or flat-rate quotes.','(512) 555-0177',NULL,NULL,'free',false,'Austin, TX 78745','Tue–Sun 9:00–18:00',NULL,'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=1600'),
('11111111-0000-0000-0000-000000000005','Eastside Auto Care','Auto Repair','ASE-certified mechanics. Brakes, diagnostics, oil service and AC repair. We text photos before doing any extra work.','(512) 555-0133','service@eastsideauto.com','https://example.com','pro',true,'Austin, TX 78702','Mon–Fri 7:30–18:00, Sat 8:00–14:00','https://images.unsplash.com/photo-1487754180451-c456f719a1fc?w=400','https://images.unsplash.com/photo-1625047509248-ec889cbff17f?w=1600'),
('11111111-0000-0000-0000-000000000006','Studio Nine Hair & Beauty','Beauty','Cuts, color, blowouts and bridal styling. Walk-ins welcome on weekdays.','(512) 555-0188',NULL,NULL,'free',false,'Austin, TX 78703','Tue–Sat 10:00–19:00',NULL,'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=1600'),
('11111111-0000-0000-0000-000000000007','Clear Path Tutoring','Tutoring','Math and science tutoring for grades 6–12, plus SAT/ACT prep. In-person or online, first session free.','(512) 555-0121','learn@clearpath.com',NULL,'free',false,'Cedar Park, TX 78613','Mon–Thu 15:00–20:00',NULL,'https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?w=1600'),
('11111111-0000-0000-0000-000000000008','Pipeline Drain & Sewer','Plumbing','Drain cleaning, camera inspections and sewer line repair. 24/7 emergency line.','(512) 555-0165',NULL,NULL,'free',false,'Pflugerville, TX 78660','Open 24 hours',NULL,'https://images.unsplash.com/photo-1606274741559-d3a3a6c6d8e1?w=1600');
ALTER TABLE public.listings ENABLE TRIGGER listings_protect;

INSERT INTO public.reviews (listing_id, reviewer_name, rating, comment, provider_reply) VALUES
('11111111-0000-0000-0000-000000000001','Maria G.',5,'Showed up within two hours for a burst pipe. Fair price and explained everything.','Thanks Maria — glad we could get you sorted fast!'),
('11111111-0000-0000-0000-000000000001','Derek L.',5,'Replaced our water heater same day. Very tidy.',NULL),
('11111111-0000-0000-0000-000000000001','Priya S.',4,'Good work, slightly later than the window they gave.',NULL),
('11111111-0000-0000-0000-000000000002','Tom R.',5,'Installed our EV charger and handled the permit. Painless.',NULL),
('11111111-0000-0000-0000-000000000002','Ana P.',5,'Found a wiring fault two other companies missed.',NULL),
('11111111-0000-0000-0000-000000000003','Jess K.',5,'Move-out clean got us our full deposit back.',NULL),
('11111111-0000-0000-0000-000000000003','Omar H.',4,'Thorough and friendly.',NULL),
('11111111-0000-0000-0000-000000000004','Linda M.',4,'Mounted two TVs and fixed a sticky door in an hour.',NULL),
('11111111-0000-0000-0000-000000000005','Chris B.',5,'Honest diagnosis, sent photos before any extra work.',NULL),
('11111111-0000-0000-0000-000000000005','Sam W.',4,'Quick brake job, fair price.',NULL),
('11111111-0000-0000-0000-000000000006','Rachel T.',5,'Best color I have had in years.',NULL),
('11111111-0000-0000-0000-000000000007','Kevin D.',5,'My son went from a C to an A in algebra.',NULL),
('11111111-0000-0000-0000-000000000008','Gail F.',3,'Fixed the clog, but pricey for a night call.',NULL);
