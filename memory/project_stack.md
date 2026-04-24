---
name: Project Tech Stack & Setup
description: Ecommerce project tech stack, Tailwind CSS setup, and key architecture decisions
type: project
---

Himalayan Spices Exports — React 19 + TypeScript + Tailwind CSS v4 + Vite 8 + Supabase ecommerce site.

**Why:** Important for knowing how to set up the project and what versions are being used.

**How to apply:** Use these details when configuring new packages, fixing build issues, or suggesting architecture changes.

Key facts:
- Tailwind CSS v4.2.2 installed; uses `@tailwindcss/postcss` plugin (NOT the old tailwindcss plugin); postcss.config.js uses `@tailwindcss/postcss`
- index.css uses `@import "tailwindcss"` and `@config "../tailwind.config.js"` (v4 syntax with compat JS config)
- Custom colors in tailwind.config.js: primary (amber/saddlebrown), secondary (cinnamon), accent (chocolate), state, background, text namespaces
- Product type: `price` = current price, `originalPrice` = original higher price, `images: string[]` array
- Package manager: npm (bun.lock exists but npm was used for installs)
- Build: Vite 8 with manual chunk splitting (vendor-react, vendor-ui, vendor-supabase, vendor-charts)
- Auth: Supabase + custom AuthContext
- State: React Context API (ProductContext, AuthContext, CartContext, WishlistContext, etc.)
- Routing: React Router v7 with lazy-loaded pages
