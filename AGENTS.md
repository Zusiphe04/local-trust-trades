<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Keep market constants and validation in `src/lib/localization.ts` so every pricing and account surface shares the same rules.
- Authorize customer/provider access from protected `public.user_roles`; account type is selected once through the registration RPC, never mutable profile metadata.
- Render secondary-page Back navigation in the root shell so all secondary screens receive it consistently.
- Keep administrator routes hidden from public navigation; every admin server function must verify `public.user_roles.role = 'admin'` before loading the privileged client, because route guards alone do not protect server calls.
