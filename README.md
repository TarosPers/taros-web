# Taros Personalservice – Web

Next.js 14 · Supabase · next-intl (CS/DE) · Tailwind CSS · Resend

## Rychlý start

### 1. Klonovat a nainstalovat
```bash
git clone <repo>
cd taros-web
npm install
```

### 2. Nastavit prostředí
```bash
cp .env.example .env.local
# Vyplnit hodnoty – viz níže
```

### 3. Supabase – databáze
1. Vytvořit projekt na [supabase.com](https://supabase.com) (zdarma)
2. V SQL editoru spustit `supabase-schema.sql`
3. Zkopírovat URL a klíče do `.env.local`

### 4. Resend – emaily
1. Registrace na [resend.com](https://resend.com) (zdarma do 3000 emailů/měsíc)
2. Přidat a ověřit doménu
3. Zkopírovat API klíč do `.env.local`

### 5. Spustit vývojový server
```bash
npm run dev
# http://localhost:3000 (česky)
# http://localhost:3000/de (německy)
```

## Struktura projektu
```
src/
├── app/
│   ├── [locale]/
│   │   ├── page.tsx              ← Homepage
│   │   ├── jobs/[slug]/page.tsx  ← Detail pozice (OG tagy pro FB)
│   │   ├── admin/
│   │   │   ├── jobs/page.tsx     ← Správa inzerátů
│   │   │   └── applicants/       ← Přehled žadatelů
│   └── api/
│       ├── contact/route.ts      ← Kontaktní formulář
│       └── apply/route.ts        ← Přihláška + upload CV
├── components/
│   ├── ui/Navbar.tsx             ← Navigace s CS/DE přepínačem
│   ├── ui/ContactForm.tsx        ← Kontaktní formulář
│   └── jobs/
│       ├── JobCard.tsx           ← Karta pozice
│       └── ApplicationForm.tsx   ← Formulář přihlášky
├── i18n/
│   ├── cs.json                   ← České texty
│   └── de.json                   ← Německé texty
└── lib/
    └── supabase.ts               ← Supabase klient + typy
```

## Admin panel
URL: `/admin` (chráněno Supabase Auth)

Funkce:
- **Inzeráty** – přidat, upravit, skrýt/zobrazit, nahrát OG obrázek
- **Žadatelé** – přehled, filtrování, změna stavu (nový → probíhá → pozván → přijat/zamítnut), interní poznámky

## Facebook sdílení
Každá pozice má Open Graph meta tagy:
- `og:title` – název pozice + lokalita
- `og:description` – popis pozice
- `og:image` – OG fotografie (uploadovaná adminem, nebo výchozí)

Sdílet: tlačítko přímo na detailní stránce pozice.

## Hosting (doporučeno)
- **Vercel** – [vercel.com](https://vercel.com), zdarma, propojit s GitHub repem
- **Doména** – `.cz` doménu koupit na [wedos.cz](https://wedos.cz) nebo [active24.cz](https://active24.cz)
