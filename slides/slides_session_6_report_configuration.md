# Session 6: Reporting & Configuration
## Debug, Configure, .env & Data Driven Testing

---

## Agenda

1. **Configuration Overview**
2. **Environment Variables (.env)**
3. **Data Driven Testing (JSON Data)**
4. **Running Tests with Tags**
5. **Trace Viewer & Debugging Tools**
6. **CI/CD Advanced Integrations (Overview)**
7. **Hands-on Exercises**

---

## 1. Configuration Overview

### Why Configuration Matters

```
Test runs locally ✅  →  Fails in CI ❌

Kenapa?
┌─────────────────────────────────────┐
│  • Network speed berbeda (Timeout)   │
│  • Perlu retry saat flaky test       │
│  • Headless vs Headed mode           │
└─────────────────────────────────────┘

→ SOLUTION: playwright.config.ts
```

---

### playwright.config.ts (Beyond Browsers)

Kalian sudah paham cara setting `projects` (Target Browser) dan `reporter: 'html'` di sesi sebelumnya. Sekarang mari fokus ke **Run Configuration** & **Debugging Options**:

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,       // Run test bersamaan
  retries: 2,                // Otomatis ulang test yang gagal 2x
  workers: process.env.CI ? 1 : undefined, // Hemat CPU di CI
  timeout: 30000,            // Maksimal waktu per test
  
  reporter: 'html',

  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',     // Alat debug spesifik
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
});
```

---

## 2. Environment Variables (.env)

### Mengamankan & Menyimpan Konfigurasi

**Masalah:** Kita tidak boleh menyimpan *password* atau *API Token* langsung di dalam kode (*Hardcode*). Selain dilarang keras secara keamanan, *URL* juga bisa berubah saat komputer dites di *staging* vs *production*.

**Solusi:** Gunakan file `.env` dan panggil dengan `process.env`.

**Contoh file `.env` (Jangan di-commit ke Git!):**
```env
ENV=staging
BASE_URL=https://www.emra.chat
CI=true
WORKER=1
RETRY=2
HEADLESS=false

```

**Di Playwright config:**
```typescript
import dotenv from 'dotenv';
dotenv.config();

export default defineConfig({
  use: {
    // Dipanggil otomatis dari .env
    baseURL: process.env.BASE_URL, 
  }
});
```

---

## 3. Data Driven Testing (JSON Data)

### Memisahkan Test Data dan Logic

**Masalah:** Mengetik ratusan nama pengguna dan email *user* langsung di dalam banyak *test script* membuat kode menjadi kotor dan sulit di-maintenance jika suatu hari datanya kedaluwarsa.

**Solusi:** Menyimpan data pengujian di sebuah "Bank Data" JSON (`data/staging/user.json`).

**Contoh `user.json`:**
```json
{
  "admin_user": {
    "email": "sdet_admin@yopmail.com",
    "password": "Tester!23",
    "full_name": "Val Miller"
  },
  "regular_user": {
    "email": "sdet_regular@yopmail.com",
    "password": "Tester!23"
  }
}
```

**Di Script Test:**
```typescript
// Import datanya!
import userData from '../data/user.json';

test('login as admin', async ({ page }) => {
  // Pakai variabel tanpa hardcode huruf
  await page.fill('#email', userData.admin_user.email);
  await page.fill('#password', userData.admin_user.password);
});
```

---

## 4. Running Tests with Tags

### What are Test Tags?

**Tags** = Labels attached to test cases to group/select them (e.g., `@smoke`, `@regression`, `@api`).

```typescript
// Add tags to test groups
test.describe('@smoke Login Flow', () => {
  test('valid login', async ({ page }) => {
    // ...
  });
});

// Or individual tests
test('@slow password validation', async ({ page }) => {
  // ...
});
```

---

### Running by Tag

```bash
# Run only smoke tests
npx playwright test --grep "@smoke"

# Run multiple tags (smoke OR regression)
npx playwright test --grep "@smoke|@regression"

# Run multiple tags (smoke AND regression)
npx playwright test --grep "(?=.*@p0)(?=.*@smoketest)"

# Run tests NOT matching tag (invert)
npx playwright test --grep-invert "@slow"
```

---

## 5. Trace Viewer & Debugging

### Trace Viewer (CT Scan untuk Test)

Trace = Rekaman lengkap dari sebuah test execution. HTML Report adalah "pintu gerbang" untuk membuka *Trace Viewer*.

*Bila test gagal di CI, Trace Viewer akan menangkap segalanya:*
1. **DOM Snapshot** sebelum tiap *click/fill*.
2. **Network Logs** (Apakah API respon baliknya 500 error?)
3. **Console Logs** (Apakah ada Javascript error?)

### UI Trace Viewer

```
┌─────────────────────────────────────────────────────────┐
│  TRACE VIEWER                                   [0:45]  │
├─────────────────────────────────────────────────────────┤
│  Timeline:  ▶  |====|====|====|====|                    │
│                                                         │
│  ┌─────────┐  ┌──────────┐  ┌─────────────┐            │
│  │ Actions │  │ Console  │  │  Network    │            │
│  │ goto    │  │ error: x │  │ GET /api    │            │
│  │ click   │  │          │  │ POST /login │            │
│  └─────────┘  └──────────┘  └─────────────┘            │
│                                                         │
│           [ LIVE DOM SNAPSHOT PREVIEW ]                │
└─────────────────────────────────────────────────────────┘
```

**Debug Action Plan:**
1. Ada fail? Buka *Trace Viewer* dari HTML Report.
2. Cek tab *Network* (API error 400/500?).
3. Cek tab *Console* (JavaScript error?).
4. Hover di *Timeline* (Apakah elemen ketutup *loading/popup*?).

---

## 6. CI/CD Advanced Integrations (Overview)

*(Melanjutkan Sesi 5 GitHub Actions...)*

### A. Linting (ESLint)
Mencegah sintaks error (seperti kurang titik koma) sebelum Script dikirim ke server. Cepat tanggap mencegah *pipeline* gagal kelamaan.

### B. Notifikasi ke WhatsApp
Menggunakan step `if: always()` di GitHub Actions untuk "menembakkan" status kelulusan *test* (Gagal/Pass) beserta rekapan log langsung ke Grup Tim Pengembangan.

### C. Test Management (AgentQ / JIRA)
Update status kelulusan *Test Case* langsung tembak dari *Playwright hook (afterEach)* ke **REST API AgentQ**.

```typescript
// Format Penulisan: TC_ID diletakkan di Judul
test('123-Login with weak password', async ({ page }) => {
   // Automation test jalan...
   // Nanti secara ajaib status "123" ini di-patch ke API AgentQ menjadi 'Pass'!
});
```

---

## 7. Hands-on (3 Exercises)

### Exercise 1: Config & Evidence (10 menit)
1. Buka config. Set retries `2`.
2. Set video `retain-on-failure`.
3. Set trace `on-first-retry`.
4. Run Test.

### Exercise 2: Env & Data Driven (10 menit)
1. Buat 1 file `.env` dengan `BASE_URL`. Jangan lupa `dotenv.config()`
2. Buat folder `data/` masukkan `user.json` berisi data rahasia `superadmin`.
3. Ganti proses Login di test kalian dengan membaca dari file JSON.

### Exercise 3: Debug Investigator (10 menit)
1. Salahkan 1 locator test dengan paksa.
2. Tunggu percobaan gagal.
3. Buka Laporan HTML. Buka **TRACE** file dari _test_ yang eror itu.
4. Perhatikan letak jarum detik ketika "Timeout Element Not Found" muncul!

---

## 🏆 Career Insight: Product QA vs SDET

Buat kalian yang merasa sangat tertantang dan menikmati **Sesi 5 (CI/CD)** & **Sesi 6 (Config, Trace & Env)**, selamat! Kalian memiliki potensi besar untuk menjadi seorang **SDET (Software Development Engineer in Test)**.

| Peran | Fokus Utama | Contoh Bagian Pekerjaan |
|-------|-------------|-------------------------|
| **Product QA** | Kualitas Fitur UI | Menulis skenario, mendesain *script* POM. |
| **SDET / Core QA** | Infrastruktur Pengujian | Merancang CI/CD *Pipelines*, mengurus *Environment (.env)*, *Linting*, integrasi AgentQ. |

👉 **Product QA:** *"Saya memastikan fitur keranjang belanja berjalan tanpa bug"*
👉 **SDET:** *"Saya membangun sistem otomatis (Pipeline & Env Variables) supaya seluruh tim QA bisa mengeksekusi test lintas server dengan aman dan report-nya terhubung ke JIRA!"*

---

## Q&A & Wrap Up

```
     ┌─────────────────────────┐
     │   Questions?            │
     │                         │
     │   🙋 Raise your hand!   │
     └─────────────────────────┘
```

---

*Made with ❤️ for QA Engineers*
