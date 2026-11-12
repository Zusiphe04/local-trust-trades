# Local Trust Trades

Build a production-ready, highly functional Local Service Provider Directory web application (inspired by platforms like Yelp and Thumbtack, focused strictly on utility and trust).

### VISUAL DESIGN & AESTHETICS (CRITICAL - AVOID GENERIC AI TEMPLATES)
- Clean, crisp, light-mode dominant UI using an off-white background (#F9FAFB), dark slate text (#0F172A), and a primary accent color like deep emerald/navy (#0F766E or #1E3A8A).
- DO NOT use dark mode glassmorphism, floating glowing neon borders, abstract 3D ribbons/spheres, or purple gradient background blobs.
- Use sharp, clean component cards, solid subtle borders (#E2E8F0), clear typography hierarchy, and conversion-focused directory components.

### 1. USER ROLES & AUTHENTICATION
- Auth powered by Supabase (Email/Password + Google OAuth).
- Roles: Customer (Browse & Contact) and Service Provider (Dashboard & Listing Management).

### 2. HOMEPAGE & SEARCH EXPERIENCE
- Hero Section: High-utility search bar with two main inputs: "What service do you need?" (e.g., Plumber, Electrician) and "Location / Area Code".
- Category Quick Links: Pill tags for top categories (Plumbing, Electrical, Cleaning, Handyman, Auto Repair, Beauty, Tutoring).
- Search Results Page:
  - Top section strictly reserved for "Featured Pros" (Paid tier accounts).
  - Main section for standard organic search results.
  - Filter sidebar/modal: Filter by Category, Rating (4+ stars), and Verified Status.

### 3. PROVIDER LISTING CARDS & PROFILE PAGE
- Card view displays: Business Logo/Image, Business Name, Verified Badge (if paid), Rating/Stars, Primary Category, Area Served, Short Bio, and direct contact buttons.
- Full Profile View: Cover photo, complete bio, operating hours, full contact details (Phone, Email, Website link if paid), review section, and an interactive "Send Inquiry" form.

### 4. FREEMIUM PROVIDER ONBOARDING & DASHBOARD
Providers sign up through a dedicated onboarding flow:
- Step 1: Choose Plan Tier:
  - Free (Basic): $0/mo. Includes basic search ranking, phone number only, 2 photos max, standard listing.
  - Pro (Paid): $29/mo. Includes Top Search Priority, "Verified Pro" Badge, full portfolio image gallery (unlimited), website & social media links, ability to reply to reviews, and lead analytics.
- Step 2: Payment Integration for Pro Plan (Stripe Checkout).
- Step 3: Business Profile Builder (Form to fill in name, category, bio, contact details, area served, and photo uploads).
- Provider Dashboard: Simple portal to manage business details, upload portfolio images, view performance stats (Profile Views, Phone Clicks), and manage/upgrade plan.

### 5. DATA STRUCTURE & BACKEND (SUPABASE)
- Tables needed: 
  - `profiles` (id, user_id, role)
  - `listings` (id, user_id, business_name, category, bio, phone, email, website_url, plan_type ['free'|'pro'], is_featured [boolean], rating, service_area)
  - `gallery_images` (id, listing_id, image_url)
  - `reviews` (id, listing_id, reviewer_name, rating, comment, provider_reply)
  - `inquiries` (id, listing_id, customer_name, customer_email, message)

Make the copy direct, human, and conversion-focused (e.g., "Find verified local service pros near you" instead of "Revolutionizing local services").

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://local-trust-trades.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/b62ac759-449b-4a49-b493-3cb93bdbac11).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
