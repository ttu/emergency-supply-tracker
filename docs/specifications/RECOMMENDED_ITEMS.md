# Recommended Items - Emergency Supply Tracker

## Overview
This document lists all recommended items for the Emergency Supply Tracker, organized by category. These items are based on Finnish emergency preparedness guidelines (72tuntia.fi) and civil defense recommendations.

## Legend
- **Base Quantity**: Amount recommended for 1 person for 3 days (unless noted as "per household")
- **Scales with People**: Yes = quantity increases with household size
- **Scales with Days**: Yes = quantity increases with supply duration
- **Expiration**: Default expiration period in months (null = never expires)

---

## 1. Water & Beverages

### Bottled Water
- **ID**: `bottled-water`
- **Base Quantity**: 9 liters
- **Unit**: liters
- **Scales with People**: Yes
- **Scales with Days**: Yes
- **Expiration**: 12 months
- **Notes**: 3 liters per person per day

### Long-life Milk
- **ID**: `long-life-milk`
- **Base Quantity**: 2 liters
- **Unit**: liters
- **Scales with People**: Yes
- **Scales with Days**: No
- **Expiration**: 12 months

### Long-life Juice
- **ID**: `long-life-juice`
- **Base Quantity**: 2 liters
- **Unit**: liters
- **Scales with People**: Yes
- **Scales with Days**: No
- **Expiration**: 12 months

---

## 2. Food

### Canned Soup
- **ID**: `canned-soup`
- **Base Quantity**: 3 cans
- **Unit**: cans
- **Scales with People**: Yes
- **Scales with Days**: Yes
- **Expiration**: 24 months

### Canned Vegetables
- **ID**: `canned-vegetables`
- **Base Quantity**: 3 cans
- **Unit**: cans
- **Scales with People**: Yes
- **Scales with Days**: Yes
- **Expiration**: 24 months

### Canned Fish
- **ID**: `canned-fish`
- **Base Quantity**: 2 cans
- **Unit**: cans
- **Scales with People**: Yes
- **Scales with Days**: Yes
- **Expiration**: 36 months

### Canned Meat
- **ID**: `canned-meat`
- **Base Quantity**: 2 cans
- **Unit**: cans
- **Scales with People**: Yes
- **Scales with Days**: Yes
- **Expiration**: 36 months

### Pasta/Noodles
- **ID**: `pasta`
- **Base Quantity**: 0.5 kg
- **Unit**: kg
- **Scales with People**: Yes
- **Scales with Days**: Yes
- **Expiration**: 24 months

### Rice
- **ID**: `rice`
- **Base Quantity**: 0.5 kg
- **Unit**: kg
- **Scales with People**: Yes
- **Scales with Days**: Yes
- **Expiration**: 24 months

### Oats
- **ID**: `oats`
- **Base Quantity**: 0.5 kg
- **Unit**: kg
- **Scales with People**: Yes
- **Scales with Days**: Yes
- **Expiration**: 12 months

### Crackers/Knäckebröd
- **ID**: `crackers`
- **Base Quantity**: 2 packages
- **Unit**: packages
- **Scales with People**: Yes
- **Scales with Days**: Yes
- **Expiration**: 12 months

### Energy Bars
- **ID**: `energy-bars`
- **Base Quantity**: 6 pieces
- **Unit**: pieces
- **Scales with People**: Yes
- **Scales with Days**: Yes
- **Expiration**: 12 months

### Canned/Jarred Spreads
- **ID**: `spreads`
- **Base Quantity**: 1 jar
- **Unit**: jars
- **Scales with People**: Yes
- **Scales with Days**: No
- **Expiration**: 18 months
- **Notes**: Peanut butter, jam, honey, etc.

### Dried Fruits
- **ID**: `dried-fruits`
- **Base Quantity**: 0.3 kg
- **Unit**: kg
- **Scales with People**: Yes
- **Scales with Days**: Yes
- **Expiration**: 12 months

### Nuts
- **ID**: `nuts`
- **Base Quantity**: 0.3 kg
- **Unit**: kg
- **Scales with People**: Yes
- **Scales with Days**: Yes
- **Expiration**: 12 months

### Salt & Sugar
- **ID**: `salt-sugar`
- **Base Quantity**: 0.2 kg
- **Unit**: kg
- **Scales with People**: No
- **Scales with Days**: No
- **Expiration**: null
- **Notes**: Per household

### Coffee/Tea
- **ID**: `coffee-tea`
- **Base Quantity**: 0.2 kg
- **Unit**: kg
- **Scales with People**: Yes
- **Scales with Days**: No
- **Expiration**: 18 months

### Frozen Vegetables (if freezer available)
- **ID**: `frozen-vegetables`
- **Base Quantity**: 1 kg
- **Unit**: kg
- **Scales with People**: Yes
- **Scales with Days**: Yes
- **Expiration**: 12 months
- **Requires**: hasFreezer = true
- **Notes**: Usable for ~48h after power outage (keep freezer door closed)

### Frozen Meat (if freezer available)
- **ID**: `frozen-meat`
- **Base Quantity**: 0.5 kg
- **Unit**: kg
- **Scales with People**: Yes
- **Scales with Days**: Yes
- **Expiration**: 6 months
- **Requires**: hasFreezer = true
- **Notes**: Usable for ~48h after power outage (keep freezer door closed)

### Frozen Ready Meals (if freezer available)
- **ID**: `frozen-meals`
- **Base Quantity**: 3 pieces
- **Unit**: pieces
- **Scales with People**: Yes
- **Scales with Days**: Yes
- **Expiration**: 12 months
- **Requires**: hasFreezer = true
- **Notes**: Usable for ~48h after power outage (keep freezer door closed)

---

## 3. Cooking & Heat

### Camping Stove
- **ID**: `camping-stove`
- **Base Quantity**: 1
- **Unit**: pieces
- **Scales with People**: No
- **Scales with Days**: No
- **Expiration**: null
- **Notes**: Per household

### Camping Stove Fuel
- **ID**: `stove-fuel`
- **Base Quantity**: 3
- **Unit**: canisters
- **Scales with People**: No
- **Scales with Days**: Yes
- **Expiration**: 60 months
- **Notes**: Gas canisters or liquid fuel

### Matches
- **ID**: `matches`
- **Base Quantity**: 2
- **Unit**: boxes
- **Scales with People**: No
- **Scales with Days**: No
- **Expiration**: 60 months

### Lighter
- **ID**: `lighter`
- **Base Quantity**: 2
- **Unit**: pieces
- **Scales with People**: No
- **Scales with Days**: No
- **Expiration**: null

### Candles
- **ID**: `candles`
- **Base Quantity**: 10
- **Unit**: pieces
- **Scales with People**: No
- **Scales with Days**: No
- **Expiration**: null

### Fire Starter
- **ID**: `fire-starter`
- **Base Quantity**: 1
- **Unit**: pieces
- **Scales with People**: No
- **Scales with Days**: No
- **Expiration**: null
- **Notes**: Flint and steel or similar

---

## 4. Light & Power

### Flashlight
- **ID**: `flashlight`
- **Base Quantity**: 2
- **Unit**: pieces
- **Scales with People**: No
- **Scales with Days**: No
- **Expiration**: null
- **Notes**: Per household

### Headlamp
- **ID**: `headlamp`
- **Base Quantity**: 1
- **Unit**: pieces
- **Scales with People**: Yes
- **Scales with Days**: No
- **Expiration**: null
- **Notes**: One per person

### Batteries AA
- **ID**: `batteries-aa`
- **Base Quantity**: 20
- **Unit**: pieces
- **Scales with People**: No
- **Scales with Days**: No
- **Expiration**: 60 months

### Batteries AAA
- **ID**: `batteries-aaa`
- **Base Quantity**: 12
- **Unit**: pieces
- **Scales with People**: No
- **Scales with Days**: No
- **Expiration**: 60 months

### Batteries D
- **ID**: `batteries-d`
- **Base Quantity**: 8
- **Unit**: pieces
- **Scales with People**: No
- **Scales with Days**: No
- **Expiration**: 60 months

### Power Bank
- **ID**: `power-bank`
- **Base Quantity**: 1
- **Unit**: pieces
- **Scales with People**: No
- **Scales with Days**: No
- **Expiration**: null
- **Notes**: 10000mAh minimum recommended

### USB Charging Cables
- **ID**: `charging-cables`
- **Base Quantity**: 2
- **Unit**: pieces
- **Scales with People**: No
- **Scales with Days**: No
- **Expiration**: null

### Solar Charger
- **ID**: `solar-charger`
- **Base Quantity**: 1
- **Unit**: pieces
- **Scales with People**: No
- **Scales with Days**: No
- **Expiration**: null
- **Notes**: Optional but recommended

---

## 5. Communication

### Battery Radio
- **ID**: `battery-radio`
- **Base Quantity**: 1
- **Unit**: pieces
- **Scales with People**: No
- **Scales with Days**: No
- **Expiration**: null
- **Notes**: For emergency broadcasts

### Hand Crank Radio
- **ID**: `hand-crank-radio`
- **Base Quantity**: 1
- **Unit**: pieces
- **Scales with People**: No
- **Scales with Days**: No
- **Expiration**: null
- **Notes**: No batteries needed

---

## 6. Medical & First Aid

### First Aid Kit
- **ID**: `first-aid-kit`
- **Base Quantity**: 1
- **Unit**: pieces
- **Scales with People**: No
- **Scales with Days**: No
- **Expiration**: 36 months
- **Notes**: Check contents regularly

### Prescription Medications
- **ID**: `prescription-meds`
- **Base Quantity**: 3
- **Unit**: days
- **Scales with People**: Yes
- **Scales with Days**: Yes
- **Expiration**: null
- **Notes**: User must track specific expiration dates

### Pain Relievers
- **ID**: `pain-relievers`
- **Base Quantity**: 1
- **Unit**: packages
- **Scales with People**: No
- **Scales with Days**: No
- **Expiration**: 36 months
- **Notes**: Ibuprofen, paracetamol, etc.

### Fever Reducers
- **ID**: `fever-reducers`
- **Base Quantity**: 1
- **Unit**: packages
- **Scales with People**: No
- **Scales with Days**: No
- **Expiration**: 36 months

### Bandages
- **ID**: `bandages`
- **Base Quantity**: 20
- **Unit**: pieces
- **Scales with People**: No
- **Scales with Days**: No
- **Expiration**: 60 months

### Disinfectant
- **ID**: `disinfectant`
- **Base Quantity**: 1
- **Unit**: bottles
- **Scales with People**: No
- **Scales with Days**: No
- **Expiration**: 36 months

### Thermometer
- **ID**: `thermometer`
- **Base Quantity**: 1
- **Unit**: pieces
- **Scales with People**: No
- **Scales with Days**: No
- **Expiration**: null

### Antihistamines
- **ID**: `antihistamines`
- **Base Quantity**: 1
- **Unit**: packages
- **Scales with People**: No
- **Scales with Days**: No
- **Expiration**: 36 months

### Diarrhea Medication
- **ID**: `diarrhea-meds`
- **Base Quantity**: 1
- **Unit**: packages
- **Scales with People**: No
- **Scales with Days**: No
- **Expiration**: 36 months

---

## 7. Hygiene & Sanitation

### Toilet Paper
- **ID**: `toilet-paper`
- **Base Quantity**: 3
- **Unit**: rolls
- **Scales with People**: Yes
- **Scales with Days**: Yes
- **Expiration**: null
- **Notes**: About 1 roll per person per 3 days

### Wet Wipes
- **ID**: `wet-wipes`
- **Base Quantity**: 1
- **Unit**: packages
- **Scales with People**: Yes
- **Scales with Days**: No
- **Expiration**: 24 months

### Hand Sanitizer
- **ID**: `hand-sanitizer`
- **Base Quantity**: 1
- **Unit**: bottles
- **Scales with People**: No
- **Scales with Days**: No
- **Expiration**: 24 months

### Soap
- **ID**: `soap`
- **Base Quantity**: 2
- **Unit**: pieces
- **Scales with People**: No
- **Scales with Days**: No
- **Expiration**: null

### Toothbrush
- **ID**: `toothbrush`
- **Base Quantity**: 1
- **Unit**: pieces
- **Scales with People**: Yes
- **Scales with Days**: No
- **Expiration**: null

### Toothpaste
- **ID**: `toothpaste`
- **Base Quantity**: 1
- **Unit**: tubes
- **Scales with People**: No
- **Scales with Days**: No
- **Expiration**: 24 months

### Feminine Hygiene Products
- **ID**: `feminine-hygiene`
- **Base Quantity**: 1
- **Unit**: packages
- **Scales with People**: Yes
- **Scales with Days**: Yes
- **Expiration**: null
- **Notes**: If applicable

### Diapers
- **ID**: `diapers`
- **Base Quantity**: 30
- **Unit**: pieces
- **Scales with People**: Yes
- **Scales with Days**: Yes
- **Expiration**: null
- **Notes**: If applicable, about 10 per day

### Garbage Bags
- **ID**: `garbage-bags`
- **Base Quantity**: 20
- **Unit**: pieces
- **Scales with People**: No
- **Scales with Days**: No
- **Expiration**: null

### Paper Towels
- **ID**: `paper-towels`
- **Base Quantity**: 2
- **Unit**: rolls
- **Scales with People**: No
- **Scales with Days**: No
- **Expiration**: null

---

## 8. Tools & Supplies

### Bucket with Lid
- **ID**: `bucket`
- **Base Quantity**: 1
- **Unit**: pieces
- **Scales with People**: No
- **Scales with Days**: No
- **Expiration**: null
- **Notes**: 10-15L recommended

### Water Storage Container
- **ID**: `water-container`
- **Base Quantity**: 1
- **Unit**: pieces
- **Scales with People**: No
- **Scales with Days**: No
- **Expiration**: null
- **Notes**: 20L capacity recommended

### Duct Tape
- **ID**: `duct-tape`
- **Base Quantity**: 1
- **Unit**: rolls
- **Scales with People**: No
- **Scales with Days**: No
- **Expiration**: null

### Multi-tool
- **ID**: `multi-tool`
- **Base Quantity**: 1
- **Unit**: pieces
- **Scales with People**: No
- **Scales with Days**: No
- **Expiration**: null
- **Notes**: Swiss Army knife or similar

### Manual Can Opener
- **ID**: `can-opener`
- **Base Quantity**: 1
- **Unit**: pieces
- **Scales with People**: No
- **Scales with Days**: No
- **Expiration**: null

### Plastic Bags
- **ID**: `plastic-bags`
- **Base Quantity**: 20
- **Unit**: pieces
- **Scales with People**: No
- **Scales with Days**: No
- **Expiration**: null
- **Notes**: Various sizes, Ziploc-style

### Aluminum Foil
- **ID**: `aluminum-foil`
- **Base Quantity**: 1
- **Unit**: rolls
- **Scales with People**: No
- **Scales with Days**: No
- **Expiration**: null

### Plastic Wrap
- **ID**: `plastic-wrap`
- **Base Quantity**: 1
- **Unit**: rolls
- **Scales with People**: No
- **Scales with Days**: No
- **Expiration**: null

### Rope/Cord
- **ID**: `rope`
- **Base Quantity**: 10
- **Unit**: meters
- **Scales with People**: No
- **Scales with Days**: No
- **Expiration**: null

### Work Gloves
- **ID**: `work-gloves`
- **Base Quantity**: 2
- **Unit**: pairs
- **Scales with People**: No
- **Scales with Days**: No
- **Expiration**: null

### Whistle
- **ID**: `whistle`
- **Base Quantity**: 1
- **Unit**: pieces
- **Scales with People**: Yes
- **Scales with Days**: No
- **Expiration**: null
- **Notes**: For signaling in emergencies

---

## 9. Cash & Documents

### Cash
- **ID**: `cash`
- **Base Quantity**: 300
- **Unit**: euros
- **Scales with People**: No
- **Scales with Days**: No
- **Expiration**: null
- **Notes**: €200-500 recommended per household

### Document Copies
- **ID**: `document-copies`
- **Base Quantity**: 1
- **Unit**: sets
- **Scales with People**: No
- **Scales with Days**: No
- **Expiration**: null
- **Notes**: Passport, insurance, medical info, etc.

### Contact List
- **ID**: `contact-list`
- **Base Quantity**: 1
- **Unit**: pieces
- **Scales with People**: No
- **Scales with Days**: No
- **Expiration**: null
- **Notes**: Physical copy of important phone numbers

---

## Summary Statistics

### Total Recommended Items by Category
1. **Water & Beverages**: 3 items
2. **Food**: 17 items (14 base + 3 frozen items if hasFreezer=true)
3. **Cooking & Heat**: 6 items
4. **Light & Power**: 8 items
5. **Communication**: 2 items
6. **Medical & First Aid**: 10 items
7. **Hygiene & Sanitation**: 10 items
8. **Tools & Supplies**: 11 items
9. **Cash & Documents**: 3 items

**Total**: 70 recommended items (67 base + 3 conditional frozen items)

### Scaling Behavior
- **Scales with People**: 31 items (44%)
- **Scales with Days**: 24 items (34%)
- **Per Household (no scaling)**: 39 items (56%)

### Expiration Tracking
- **Never Expires**: 35 items (50%)
- **Has Expiration Date**: 35 items (50%)

### Conditional Items
- **Frozen Food**: 3 items (only shown if hasFreezer=true)

---

## Notes

### Future Additions
Items to consider adding in future versions:
- Pet food and supplies (when pet support is added)
- Baby formula (in addition to baby food)
- Portable toilet/sanitation system
- Emergency blankets (space blankets)
- Fire extinguisher
- Weather-appropriate clothing
- Sleeping bags
- Tarps/plastic sheeting
- Notebook and pen
- Entertainment items (books, cards, etc.)
- Portable water filter
- Chemical light sticks

### Regional Variations
For future international versions, consider:
- Different water recommendations based on climate
- Region-specific food items
- Currency changes for cash recommendations
- Local emergency communication systems

---

**Document Version**: 1.1
**Last Updated**: 2025-12-22
**Based on**: 72tuntia.fi recommendations
**Changes**: Added 3 frozen food items (conditional on hasFreezer)
