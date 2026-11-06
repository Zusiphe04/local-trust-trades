# LocalPro Administrator Panel

## What to build
- Add hidden `/admin/login` and `/admin/dashboard` pages; do not expose admin access in customer/provider navigation or sign-in.
- Require normal account sign-in plus a protected administrator role for both page access and every privileged data action.
- Build dashboard sections for provider verification, subscriptions, listing moderation, and platform analytics using LocalPro’s South African visual style and Rand pricing.
- Provide immediate UI updates for approve/reject, Pro/basic changes, and listing moderation, with clear empty states when there are no submitted documents or reports.

## Security and data
- Do not publish test credentials, create default passwords, or include one-click authentication bypasses.
- Add only the schema support required for administrator role and moderation/verification fields; keep access restricted through server-verified administrator checks.
- Do not invent historical revenue: label any plan-based revenue figure as an estimate and explain that billing history is not yet recorded.

## Access setup
- Administrator access will remain unavailable until the user identifies an existing account to authorize. Do not grant elevated access to an unspecified account.

## Technical approach
- Use TanStack file routes and the project’s existing Lovable Cloud auth client.
- Use authenticated server functions for privileged reads and writes; verify the caller’s protected role before loading any privileged client.
- Keep existing public/customer/provider routes and login behavior unchanged.
