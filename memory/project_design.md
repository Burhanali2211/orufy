---
name: Homepage Design — Amazon/Flipkart Style
description: The homepage was redesigned to Amazon/Flipkart style with compact carousel, category chips, and tight sections
type: project
---

Homepage was overhauled from luxury/editorial style to Amazon/Flipkart practical mobile-first design.

**Why:** Most customers are on mobile. Old design was too luxury/editorial. User wants practical app-like design.

**How to apply:** When making further design changes, maintain this mobile-first, tight-spacing, functional design language. Do NOT revert to large decorative sections.

Key design decisions:
- Header: 2-row on mobile (brand+icons row + search bar row), 2-row on desktop (brand+search+icons + nav bar). Height: ~88px mobile, ~93px desktop. All pages get pt-[88px] md:pt-[93px]
- Hero: Compact banner carousel h-[180px] sm:h-[240px] md:h-[320px] lg:h-[400px] — NOT full screen
- CategoryChips: Horizontal scrollable circular chips with emoji fallbacks — sits right below hero
- Section headers: Simple Amazon-style (icon + title + "View all" link on same row)
- No Framer Motion on homepage sections (removed for performance)
- No decorative blur blobs
- Section padding: py-6 sm:py-8 (not py-24/py-32)
- Color: White bg, gray-50 alternating, amber/orange accents
- FlashSale: Uses `originalPrice` (not discountPrice), `images[0]` (not imageUrl)
