# OPN → RIN Migration & System Upgrade Guide

## What Changed and Why

| Area | Old (OPN) | New (RIN) |
|---|---|---|
| Full name | Operating Permit Number | Rider Registration Number |
| Short code | OPN | RIN |
| Generation | Client-side (race-condition prone) | Cloud Function (atomic transaction) |
| Counter scope | Per district prefix query | Single global counter (`rin_counters/global`) |
| Duplicate check | None | ID number + plate + chassis enforced server-side |
| Role enforcement | None server-side | CF validates role + entity on every write |
| Firestore rules | Partial | Full 3-role matrix |

---

## RIN Format Reference

```
ASH - 0001 - TM 0226
 │     │     │   │
 │     │     │   └── MMYY  (month+year of registration)
 │     │     └─────── 2-letter town code (derived from residential town)
 │     └───────────── 4-digit global sequence (zero-padded, starts at 0001)
 └─────────────────── 3-letter region code
```

**Examples:**
- `ASH-0001-TM0226` — Ashanti, seq 1, Tema, Feb 2026  
- `GAR-0042-AC0326` — Greater Accra, seq 42, Accra, Mar 2026  
- `CEN-0100-CC0126` — Central, seq 100, Cape Coast, Jan 2026

---

## Files Delivered

| File | Purpose |
|---|---|
| `src/lib/rin-constants.ts` | Region codes, district codes, town code generator, RIN compose/parse |
| `functions/src/index.ts` | Cloud Functions: `registerRider`, `updateRiderStatus` |
| `src/lib/rider-service.ts` | Client service — calls CF, handles photo upload |
| `src/lib/firebase.ts` | Updated — adds `functions` export |
| `firestore.rules` | Full 3-role security rules |

---

## Step-by-Step Migration

### Step 1 — New Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Open your new project
3. **Project Settings → Your apps → Web app** → copy the config object
4. Paste into `src/lib/firebase.ts` replacing the `REPLACE_WITH_*` placeholders

### Step 2 — Enable Cloud Functions
```bash
# In your project root
npm install -g firebase-tools
firebase login
firebase use YOUR_NEW_PROJECT_ID

# In the functions folder
cd functions
npm install firebase-admin firebase-functions
npm install -D typescript @types/node

# Deploy
firebase deploy --only functions
```

### Step 3 — Install the Functions client SDK
```bash
# In your Next.js project root
npm install firebase   # already installed
# getFunctions is part of the firebase package — no extra install needed
```

### Step 4 — Replace files
Copy the 5 delivered files into your project at the exact paths shown above.

### Step 5 — Fix any remaining OPN references

Run this search across your entire codebase:

```bash
# Find all remaining OPN references
grep -r "OPN\|opn\|operatingPermit\|permit_number\|permitNumber" src/ --include="*.ts" --include="*.tsx" --include="*.js"
```

**Manual rename checklist:**

| Search for | Replace with | Location |
|---|---|---|
| `OPN` | `RIN` | UI labels, strings, comments |
| `opn` | `rin` | variable names |
| `operatingPermitNumber` | `riderIdentificationNumber` | variable names |
| `generateOPN` | `generateRIN` (now in CF) | function calls |
| `OPN-certificate` | `RIN-certificate` | HTML IDs (already updated in registration page) |
| `calculatePermitDates` | `calculateRegistrationDates` | internal naming |
| `isPermitExpired` | `isRegistrationExpired` | already renamed in rider-service |
| `"Operating Permit Number"` | `"Rider Registration Number"` | UI text |

**In your registration-page.tsx** — these are already correct:
- ✅ `generatedRIN` state variable
- ✅ `#RIN-certificate` div ID  
- ✅ Print styles reference `#RIN-certificate`
- ✅ Certificate header says "Rider Registration Number"

---

### Step 6 — Firestore data migration (existing records)

If you have existing rider documents with the old format, run this **one-time** migration script from your local machine:

```typescript
// scripts/migrate-opn-to-rin.ts
// Run with: npx ts-node scripts/migrate-opn-to-rin.ts

import * as admin from "firebase-admin";
import serviceAccount from "./service-account.json"; // download from Firebase Console

admin.initializeApp({ credential: admin.credential.cert(serviceAccount as any) });
const db = admin.firestore();

async function migrate() {
  const snap = await db.collection("riders").get();
  const batch = db.batch();
  let count = 0;

  for (const doc of snap.docs) {
    const data = doc.data();

    // Only process docs that don't yet have the new RIN fields
    if (!data.regionCode || !data.townCode) {
      batch.update(doc.ref, {
        // Add missing fields — adjust values to match your old data
        regionCode:   data.RINPrefix ?? "",
        districtCode: data.districtCode ?? "",
        townCode:     data.townCode ?? "XX",
        updatedAt:    admin.firestore.FieldValue.serverTimestamp(),
      });
      count++;
    }

    // Commit in batches of 400
    if (count % 400 === 0) await batch.commit();
  }

  await batch.commit();
  console.log(`✅ Migrated ${count} records`);
}

migrate().catch(console.error);
```

### Step 7 — Seed the global counter

After migrating, set the counter to the correct next value:

```typescript
// Run once from Firebase Console → Firestore → Add document
// Collection: rin_counters
// Document ID: global
// Fields:
//   next: <highest existing sequence + 1>
//   updatedAt: <server timestamp>
```

Or via the Admin SDK:
```typescript
const highestSnap = await db.collection("riders")
  .orderBy("sequence", "desc").limit(1).get();
const highestSeq = highestSnap.docs[0]?.data()?.sequence ?? 0;

await db.doc("rin_counters/global").set({
  next: highestSeq + 1,
  updatedAt: admin.firestore.FieldValue.serverTimestamp(),
});
```

---

## Conflict & Duplicate Prevention — How It Works

```
Client submits form
        │
        ▼
[Upload photo to Storage]  ← runs client-side, returns URL
        │
        ▼
[Call registerRider CF]
        │
        ├─► Auth check  (unauthenticated? → reject)
        ├─► Role check  (valid role + active status? → reject if not)
        ├─► Input validation (region exists? codes valid?)
        │
        ├─► DUPLICATE CHECK (3 parallel Firestore reads)
        │       ├─ idNumber already registered?   → 409 already-exists
        │       ├─ plateNumber already used?      → 409 already-exists
        │       └─ chassisNumber already used?    → 409 already-exists
        │
        └─► ATOMIC TRANSACTION
                ├─ Read rin_counters/global → next = N
                ├─ Build RIN: RegionCode-N-TownCodeMMYY
                ├─ Write riders/{newId}
                ├─ Write rin_counters/global → next = N+1
                └─ Write audit_logs/{newId}
```

**Why transactions prevent duplicates:**  
Firestore transactions are serialised on the same document. Two concurrent
registrations both try to read `rin_counters/global` — the second one
automatically retries after the first commits, so it gets `N+1`. No two
riders ever get the same sequence number.

---

## Role Permission Matrix

| Action | Super Admin | District Admin | Operator |
|---|---|---|---|
| Register rider | ✅ Any district | ✅ Own district | ✅ Own entity only |
| View all riders | ✅ | ✅ Own district | ❌ |
| View own registrations | ✅ | ✅ | ✅ |
| Change rider status | ✅ | ✅ Own district | ❌ |
| Edit rider details | ✅ | ✅ Own district | ❌ |
| Delete rider | ✅ | ❌ | ❌ |
| Manage users | ✅ | ❌ | ❌ |
| View audit logs | ✅ All | ✅ Own district | ❌ |
| View RIN counter | ✅ | ❌ | ❌ |

---

## Common Errors & Fixes

| Error message | Cause | Fix |
|---|---|---|
| `ID number already registered` | Same Ghana Card / Voter ID submitted again | Look up existing RIN, show to operator |
| `Plate number already registered` | Vehicle already has a RIN | Show existing RIN to operator |
| `Unknown region` | Region string doesn't match `REGION_CODES` keys exactly | Check spelling in form dropdown vs constants |
| `Invalid districtCode` | District code not 2-4 chars | Add district to `DISTRICT_CODES` in rin-constants.ts |
| `Account is not active` | User's `status` field in `admin_users` is not "Active" | Super Admin activates the user account |
| `You must be signed in` | Token expired or user logged out | Re-authenticate |
| `functions` is undefined | `getFunctions` not exported from firebase.ts | Copy new firebase.ts |