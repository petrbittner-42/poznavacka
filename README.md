# Poznávačka rostlin

Webová aplikace na procvičování poznávačky: ukáže obrázek, student napíše (nebo vybere) název, appka vyhodnotí
s tolerancí na překlepy a chybné položky vrací častěji. Pokrok se ukládá v prohlížeči, po přihlášení
(jméno + heslo, bez e-mailu) na server (Supabase).

Stack: React + Vite, Supabase (Auth + Postgres), nasazení na Vercel z GitHubu.

## Spuštění lokálně

```bash
npm install
npm run dev        # http://localhost:5174
npm test           # testy párování odpovědí a plánovače
```

Pro přihlašování zkopíruj `.env.example` do `.env` a doplň URL a anon klíč ze Supabase. Bez `.env` appka
funguje, jen bez účtů (pokrok zůstává v prohlížeči).

## Jak přidat novou sadu obrázků

Sady jsou statické soubory v `public/sets/`. Každá sada je samostatná, nic se nemíchá.

1. Vytvoř složku `public/sets/<id-sady>/img/` (id malými písmeny bez diakritiky, např. `rostliny-2`).
2. Nahraj obrázky pojmenované `nazev_rostliny_1.jpg` (podtržítka = mezery, číslo = pořadí fotky
   téže rostliny; více fotek jedné rostliny = `smrk_ztepily_1.jpg`, `smrk_ztepily_2.jpg`).
   Doporučení: JPG, max. ~1200 px na delší straně, ať se rychle načítají na mobilu.
3. Spusť:
   ```bash
   node scripts/build-set.mjs rostliny-2 "Rostliny — sada 2"
   ```
   Vznikne `set.json` a sada se přidá do `public/sets/index.json`.
4. V `set.json` doplň diakritiku do názvů (`"smrk ztepily"` → `"smrk ztepilý"`) a případně:
   - `"aliases": ["smrk obecný"]` – další přijatelné odpovědi,
   - `"label": "pampeliška (smetanka) lékařská"` – plné znění pro rozbalovací menu a zobrazení správné odpovědi
     (vyhodnocuje se `name`, `label` i každý alias),
   - `"description": "..."` – volitelný popis, zobrazí se v záložce Prohlížení.
   Opakované spuštění skriptu ruční úpravy zachová. Hlavní seznam sady můžeš připravit dopředu do
   `names.json` (stejný formát, viz `semenne-rostliny`): skript z něj bere názvy a do `set.json` zapíše
   jen položky, ke kterým existuje obrázek; chybějící vypíše.
5. Commit + push → Vercel nasadí automaticky.

Formát `set.json`:

```json
{
  "id": "rostliny-2",
  "name": "Rostliny — sada 2",
  "items": [
    { "id": "smrk-ztepily-1", "image": "img/smrk_ztepily_1.jpg", "name": "smrk ztepilý", "aliases": ["smrk obecný"] },
    { "id": "pampeliska-lekarska-1", "image": "img/pampeliska_lekarska_1.jpg", "name": "pampeliška lékařská",
      "label": "pampeliška (smetanka) lékařská", "aliases": ["smetanka lékařská"] }
  ]
}
```

## Jak se vyhodnocuje odpověď

- Nerozlišují se velká/malá písmena ani diakritika; interpunkce se ignoruje.
- Tolerance na překlepy po slovech: slovo do 3 znaků 0 chyb, 4–6 znaků 1 chyba, 7+ znaků 2 chyby
  („smrk stepylý“ projde). Nebo celý název s tolerancí `délka / 6` (max 3).
- Pojistka: když je odpověď blíž k názvu jiné rostliny v sadě, počítá se jako chyba
  („javor klen“ místo „javor mléč“ neprojde).

## Jak se vybírá další obrázek

Každý obrázek má váhu (start 1). Správně → váha × 0,3 (min 0,03), špatně → váha min. 3 (max 10).
Výběr je náhodný úměrně váze, stejný obrázek nejde dvakrát po sobě. „Umíš“ = 3× po sobě správně.
Reset v záložce Statistiky vrátí všechny váhy na 1.

## Supabase (účty + pokrok)

1. Nový projekt → SQL editor → spustit `supabase/migrations/0001_init.sql`.
2. Authentication → Providers → Email → vypnout **Confirm email** (studenti nemají e-mail;
   appka používá syntetický `jmeno@users.poznavacka.local`).
3. Project Settings → API → URL a anon key do `.env` (lokálně) a do Vercel → Environment Variables.
