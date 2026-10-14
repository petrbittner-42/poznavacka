# Poznávačka rostlin — pokyny pro Claude

- React + Vite (JSX, bez TypeScriptu), žádný router ani UI knihovna, jedno `src/styles.css`. Stejný stack jako `smeny-kliniky`.
- Dev server: port **5174** (`npm run dev`), testy `npm test` (vitest, čisté funkce v `matching.js`, `scheduler.js`).
- Sady obrázků jsou **statické soubory** v `public/sets/` (viz README „Jak přidat sadu“), nikdy v DB. Nová sada = nová složka, nemíchat.
- Pokrok: `src/progressStore.js` – stejné rozhraní pro localStorage (nepřihlášený) i Supabase (přihlášený). Při prvním přihlášení se lokální pokrok přenese na server.
- Přihlášení bez e-mailu: syntetický mail `<jmeno>@users.poznavacka.local` (`src/supabase.js`). V Supabase musí být vypnuté Confirm email.
- DB schéma v `supabase/migrations/`; změny schématu vždy zapsat sem jako novou migraci.
- `.env` (Supabase URL + anon key) je v `.gitignore`; vzor `.env.example`.
- Nasazení: push na GitHub `main` → Vercel automaticky. Env proměnné jsou i ve Vercelu.
- Petr není programátor: změny vysvětlovat lidsky, po každém celku shrnout a nabídnout commit.
