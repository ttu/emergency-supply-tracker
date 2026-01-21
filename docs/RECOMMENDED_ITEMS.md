# Recommended Items Catalog

> **Version:** 1.1.0
> **Last Updated:** 2026-01-15
> **Source of Truth:** `src/features/templates/data.ts`

This document lists all 81 recommended emergency supply items based on Finnish emergency preparedness guidelines (72tuntia.fi).

---

## Scaling Rules

Items can scale based on household configuration:

| Rule                    | Description                            |
| ----------------------- | -------------------------------------- |
| `scaleWithPeople: true` | Quantity multiplied by household size  |
| `scaleWithDays: true`   | Quantity multiplied by supply duration |
| `scaleWithPets: true`   | Quantity multiplied by pet count       |
| `requiresFreezer: true` | Only shown if household uses freezer   |

**Base quantities** are calculated for 1 person for 3 days.

---

## 1. Water & Beverages

| ID                | Name            | Base Qty | Unit   | Scales With  | Expiration |
| ----------------- | --------------- | -------- | ------ | ------------ | ---------- |
| `bottled-water`   | Bottled Water   | 3        | liters | People, Days | 12 months  |
| `long-life-milk`  | Long-life Milk  | 2        | liters | People       | 12 months  |
| `long-life-juice` | Long-life Juice | 2        | liters | People       | 12 months  |

**Water Recommendation:** 3 liters per person per day (drinking + basic hygiene). The `baseQuantity` of 3 liters represents the daily requirement, which is then multiplied by household size and supply duration.

---

## 2. Food

### Non-Perishable Items

| ID                  | Name                    | Base Qty | Unit      | Scales With  | Expiration | Calories/Unit |
| ------------------- | ----------------------- | -------- | --------- | ------------ | ---------- | ------------- |
| `canned-soup`       | Canned Soup             | 1        | cans      | People, Days | 24 months  | 200           |
| `canned-vegetables` | Canned Vegetables       | 1        | cans      | People, Days | 24 months  | 100           |
| `canned-fish`       | Canned Fish             | 0.67     | cans      | People, Days | 36 months  | 200           |
| `canned-meat`       | Canned Meat             | 0.67     | cans      | People, Days | 36 months  | 300           |
| `pasta`             | Pasta                   | 0.17     | kilograms | People, Days | 24 months  | 3500          |
| `rice`              | Rice                    | 0.17     | kilograms | People, Days | 24 months  | 3600          |
| `oats`              | Oats                    | 0.17     | kilograms | People, Days | 12 months  | 3800          |
| `crackers`          | Crackers                | 0.67     | packages  | People, Days | 12 months  | 500           |
| `energy-bars`       | Energy Bars             | 2        | pieces    | People, Days | 12 months  | 250           |
| `spreads`           | Spreads (Peanut Butter) | 1        | jars      | People       | 18 months  | 1600          |
| `dried-fruits`      | Dried Fruits            | 0.1      | kilograms | People, Days | 12 months  | 3000          |
| `nuts`              | Nuts                    | 0.1      | kilograms | People, Days | 12 months  | 6000          |
| `salt-sugar`        | Salt & Sugar            | 0.2      | kilograms | -            | -          | -             |
| `coffee-tea`        | Coffee & Tea            | 0.2      | kilograms | People       | 18 months  | -             |

### Frozen Items (requires freezer)

| ID                  | Name              | Base Qty | Unit      | Scales With  | Expiration | Calories/Unit |
| ------------------- | ----------------- | -------- | --------- | ------------ | ---------- | ------------- |
| `frozen-vegetables` | Frozen Vegetables | 0.34     | kilograms | People, Days | 12 months  | 400           |
| `frozen-meat`       | Frozen Meat       | 0.17     | kilograms | People, Days | 6 months   | 2500          |
| `frozen-meals`      | Frozen Meals      | 1        | pieces    | People, Days | 12 months  | 450           |

---

## 3. Cooking & Heat

| ID              | Name          | Base Qty | Unit      | Scales With | Expiration |
| --------------- | ------------- | -------- | --------- | ----------- | ---------- |
| `camping-stove` | Camping Stove | 1        | pieces    | -           | -          |
| `stove-fuel`    | Stove Fuel    | 1        | canisters | Days        | 60 months  |
| `matches`       | Matches       | 2        | boxes     | -           | 60 months  |
| `lighter`       | Lighter       | 2        | pieces    | -           | -          |
| `candles`       | Candles       | 10       | pieces    | -           | -          |
| `fire-starter`  | Fire Starter  | 1        | pieces    | -           | -          |

---

## 4. Light & Power

| ID                | Name            | Base Qty | Unit   | Scales With | Expiration |
| ----------------- | --------------- | -------- | ------ | ----------- | ---------- |
| `flashlight`      | Flashlight      | 2        | pieces | -           | -          |
| `headlamp`        | Headlamp        | 1        | pieces | People      | -          |
| `batteries-aa`    | Batteries AA    | 20       | pieces | -           | 60 months  |
| `batteries-aaa`   | Batteries AAA   | 12       | pieces | -           | 60 months  |
| `batteries-d`     | Batteries D     | 8        | pieces | -           | 60 months  |
| `power-bank`      | Power Bank      | 1        | pieces | -           | -          |
| `charging-cables` | Charging Cables | 2        | pieces | -           | -          |
| `solar-charger`   | Solar Charger   | 1        | pieces | -           | -          |
| `power-generator` | Power Generator | 1        | pieces | -           | -          |
| `generator-fuel`  | Generator Fuel  | 10       | liters | Days        | 12 months  |

---

## 5. Communication & Info

| ID                 | Name             | Base Qty | Unit   | Scales With | Expiration |
| ------------------ | ---------------- | -------- | ------ | ----------- | ---------- |
| `battery-radio`    | Battery Radio    | 1        | pieces | -           | -          |
| `hand-crank-radio` | Hand-Crank Radio | 1        | pieces | -           | -          |

---

## 6. Medical & Health

| ID                  | Name                     | Base Qty | Unit     | Scales With  | Expiration |
| ------------------- | ------------------------ | -------- | -------- | ------------ | ---------- |
| `first-aid-kit`     | First Aid Kit            | 1        | pieces   | -            | 36 months  |
| `prescription-meds` | Prescription Medications | 1        | days     | People, Days | -          |
| `pain-relievers`    | Pain Relievers           | 1        | packages | -            | 36 months  |
| `fever-reducers`    | Fever Reducers           | 1        | packages | -            | 36 months  |
| `bandages`          | Bandages                 | 20       | pieces   | -            | 60 months  |
| `disinfectant`      | Disinfectant             | 1        | bottles  | -            | 36 months  |
| `thermometer`       | Thermometer              | 1        | pieces   | -            | -          |
| `antihistamines`    | Antihistamines           | 1        | packages | -            | 36 months  |
| `diarrhea-meds`     | Diarrhea Medication      | 1        | packages | -            | 36 months  |

---

## 7. Hygiene & Sanitation

| ID                 | Name                      | Base Qty | Unit     | Scales With  | Expiration |
| ------------------ | ------------------------- | -------- | -------- | ------------ | ---------- |
| `toilet-paper`     | Toilet Paper              | 1        | rolls    | People, Days | -          |
| `wet-wipes`        | Wet Wipes                 | 1        | packages | People       | 24 months  |
| `hand-sanitizer`   | Hand Sanitizer            | 1        | bottles  | -            | 24 months  |
| `soap`             | Soap                      | 2        | pieces   | -            | -          |
| `toothbrush`       | Toothbrush                | 1        | pieces   | People       | -          |
| `toothpaste`       | Toothpaste                | 1        | tubes    | -            | 24 months  |
| `feminine-hygiene` | Feminine Hygiene Products | 0.34     | packages | People, Days | -          |
| `diapers`          | Diapers                   | 10       | pieces   | People, Days | -          |
| `garbage-bags`     | Garbage Bags              | 20       | pieces   | -            | -          |
| `paper-towels`     | Paper Towels              | 2        | rolls    | -            | -          |

---

## 8. Tools & Supplies

| ID                | Name            | Base Qty | Unit   | Scales With | Expiration |
| ----------------- | --------------- | -------- | ------ | ----------- | ---------- |
| `bucket`          | Bucket          | 1        | pieces | -           | -          |
| `water-container` | Water Container | 1        | pieces | -           | -          |
| `duct-tape`       | Duct Tape       | 1        | rolls  | -           | -          |
| `multi-tool`      | Multi-Tool      | 1        | pieces | -           | -          |
| `can-opener`      | Can Opener      | 1        | pieces | -           | -          |
| `plastic-bags`    | Plastic Bags    | 20       | pieces | -           | -          |
| `aluminum-foil`   | Aluminum Foil   | 1        | rolls  | -           | -          |
| `plastic-wrap`    | Plastic Wrap    | 1        | rolls  | -           | -          |
| `rope`            | Rope            | 10       | meters | -           | -          |
| `work-gloves`     | Work Gloves     | 2        | pairs  | -           | -          |
| `whistle`         | Whistle         | 1        | pieces | People      | -          |

---

## 9. Cash & Documents

| ID                | Name            | Base Qty | Unit   | Scales With | Expiration |
| ----------------- | --------------- | -------- | ------ | ----------- | ---------- |
| `cash`            | Cash            | 300      | euros  | -           | -          |
| `document-copies` | Document Copies | 1        | sets   | -           | -          |
| `contact-list`    | Contact List    | 1        | pieces | -           | -          |

---

## 10. Pets

Pet supplies for emergency preparedness. These items only appear when household has pets configured (pets > 0).

| ID                        | Name                    | Base Qty | Unit      | Scales With | Expiration |
| ------------------------- | ----------------------- | -------- | --------- | ----------- | ---------- |
| `pet-food-dry`            | Dry Pet Food            | 0.2      | kilograms | Pets, Days  | 12 months  |
| `pet-food-wet`            | Wet Pet Food            | 1        | cans      | Pets, Days  | 24 months  |
| `pet-water-bowl`          | Pet Water Bowl          | 1        | pieces    | Pets        | -          |
| `pet-food-bowl`           | Pet Food Bowl           | 1        | pieces    | Pets        | -          |
| `pet-carrier`             | Pet Carrier             | 1        | pieces    | Pets        | -          |
| `pet-leash-collar`        | Pet Leash & Collar      | 1        | sets      | Pets        | -          |
| `pet-waste-bags`          | Pet Waste Bags          | 5        | pieces    | Pets, Days  | -          |
| `pet-medications`         | Pet Medications         | 1        | days      | Pets, Days  | -          |
| `pet-comfort-items`       | Pet Comfort Items       | 1        | pieces    | Pets        | -          |
| `pet-vaccination-records` | Pet Vaccination Records | 1        | sets      | Pets        | -          |

**Note:** Pet items scale with pet count (`scaleWithPets: true`). Some items like food and medications also scale with supply duration.

---

## Summary

| Category             | Item Count |
| -------------------- | ---------- |
| Water & Beverages    | 3          |
| Food                 | 17         |
| Cooking & Heat       | 6          |
| Light & Power        | 10         |
| Communication & Info | 2          |
| Medical & Health     | 9          |
| Hygiene & Sanitation | 10         |
| Tools & Supplies     | 11         |
| Cash & Documents     | 3          |
| Pets                 | 10         |
| **Total**            | **81**     |

---

## Calorie Information

Food items include calorie data for optional calorie tracking:

- `weightGramsPerUnit`: Weight per unit in grams
- `caloriesPer100g`: Calories per 100g of weight
- `caloriesPerUnit`: Total calories per unit

**Daily calorie targets:**

- Adults: 2,200 kcal/day
- Children: 1,600 kcal/day

---

## References

- [72tuntia.fi](https://72tuntia.fi/) - Finnish emergency preparedness guidelines
