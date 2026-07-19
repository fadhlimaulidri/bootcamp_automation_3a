# Session 8: MCP + Playwright
## AI-Assisted Automation: Model Context Protocol dalam QA Engineering

---

## Agenda

1. **Apa itu MCP (Model Context Protocol)?**
2. **Arsitektur MCP: Host, Client, Server**
3. **MCP di Dunia QA: Mengapa Ini Penting?**
4. **Setup MCP Playwright**
5. **Contoh Nyata: AI Menulis Test dari Context Repo**
6. **MCP + `bootcamp_automation_1`: Generate API Helper Otomatis**
7. **MCP + `bootcamp_automation_1`: Analisa & Perbaiki Test UI**
8. **MCP Tools: Playwright Browser Control**
9. **Prompt Engineering untuk QA**
10. **Integrasi MCP-AgentQ (Test Case Management)**
11. **Keamanan & Best Practices**
12. **Hands-on Exercises**

---

## 1. Apa itu MCP?

**MCP (Model Context Protocol)** adalah standar terbuka dari Anthropic yang memungkinkan **AI (LLM)** untuk mengakses *tools*, *data*, dan *sumber daya eksternal* secara terstruktur.

```
Tanpa MCP:
  AI ─────────────── ❌ Tidak bisa baca file repo
  AI ─────────────── ❌ Tidak bisa akses browser
  AI ─────────────── ❌ Tidak bisa panggil API

Dengan MCP:
  AI ── MCP Server ── ✅ Baca file TypeScript
  AI ── MCP Server ── ✅ Kontrol browser Playwright
  AI ── MCP Server ── ✅ Jalankan test & baca hasilnya
```

**Analogi Sederhana:** MCP adalah "colokan universal" yang memungkinkan AI disambiguation untuk berinteraksi dengan sistem nyata, bukan hanya menjawab dari memori.

---

## 2. Arsitektur MCP

```
┌──────────────────────────────────────────────────────┐
│                    MCP HOST                          │
│  (Claude CLI / VS Code / Cursor)                     │
│                                                      │
│  ┌─────────────┐     ┌─────────────────────────┐     │
│  │  MCP Client │────▶│     AI/LLM Engine       │     │
│  │  (Protocol) │◀────│  (Claude, GLM, GPT)     │     │
│  └──────┬──────┘     └─────────────────────────┘     │
│         │                                            │
└─────────┼────────────────────────────────────────────┘
          │ JSON-RPC 2.0
          │
   ┌──────┴──────────────────────────┐
   │         MCP SERVERS             │
   │                                 │
   │  ┌─────────────────────────┐    │
   │  │  mcp-playwright         │    │
   │  │  • navigate_to          │    │
   │  │  • click_element        │    │
   │  │  • screenshot           │    │
   │  │  • type_text            │    │
   │  └─────────────────────────┘    │
   │                                 │
   │  ┌─────────────────────────┐    │
   │  │  filesystem             │    │
   │  │  • read_file            │    │
   │  │  • write_file           │    │
   │  │  • list_directory       │    │
   │  └─────────────────────────┘    │
   └─────────────────────────────────┘
```

**3 Komponen Inti:**
- **Host** → Aplikasi yang menjalankan AI (e.g., Claude CLI / Claude Code)
- **Client** → Jembatan protokol antara AI dan server
- **Server** → Menyediakan *tools*, *resources*, dan *prompts*

---

## 3. MCP di Dunia QA: Mengapa Penting?

### Sebelum MCP (Manual)

| Task QA | Waktu Manual |
|---------|-------------|
| Analisa bug dari browser log | 30-60 menit |
| Tulis test script dari 0 | 45-90 menit |
| Debug test yang flaky | 20-60 menit |
| Update test saat UI berubah | 30-45 menit |

### Sesudah MCP (AI-Assisted)

| Task QA | Waktu dengan MCP |
|---------|-----------------|
| Analisa bug dari browser log | **2-3 menit** |
| Tulis test script dari repo existing | **5-10 menit** |
| Debug test yang flaky | **3-5 menit** |
| Update test saat UI berubah | **5-10 menit** |

> **MCP mengubah QA Engineer dari "script writer" menjadi "AI director"** — Anda mengarahkan AI, AI yang mengeksekusi.

---

## 4. Setup MCP Playwright (Claude CLI + z.ai)

### 1. Install Claude CLI (Claude Code)
```bash
npm install -g @anthropic-ai/claude-code
```

### 2. Konfigurasi Provider (z.ai / GLM)
Set environment variables agar Claude CLI mengarah ke z.ai:
```powershell
# Windows PowerShell
$env:ANTHROPIC_BASE_URL = "https://api.z.ai/v1"
$env:ANTHROPIC_API_KEY  = "your-zai-api-key"
```

### 3. Instalasi Dependencies MCP Repo
Pastikan Anda sudah menginstall dependencies dan men-download versi browser yang tepat di custom repo mcp-playwright Anda:
```bash
cd C:\Users\USER\workspace\mcp-playwright
npm install
npx playwright install
```

### 4. Registrasi MCP Server ke Claude
Buka terminal dari *project repo* tempat Anda bekerja (misal: `bootcamp_automation_1`), lalu gunakan perintah built-in Claude untuk menambahkan tools secara otomatis:

```bash
claude mcp add playwright node C:/Users/USER/workspace/mcp-playwright/server.js
```

Untuk memverifikasi apakah server MCP berhasil berjalan dan tersambung, jalankan perintah:
```bash
claude mcp list
```
*(Statusnya harus terlihat **connected**. Jika belum, berarti AI Claude Code masih gagal membaca konfigurasi MCP lokal Anda).*

---

## 5. MCP Tools: Playwright Browser Control

Tools yang tersedia dari `mcp-playwright`:

| Tool | Fungsi |
|------|--------|
| `launch_browser` | Launch browser instance (Chromium/Firefox/WebKit) |
| `navigate_to` | Navigasi ke URL website |
| `click_element` | Klik elemen berdasarkan CSS selector |
| `type_text` | Input teks pada input field |
| `screenshot` | Ambil screenshot halaman |
| `wait_for_selector`| Tunggu elemen muncul menggunakan timeout spesifik |
| `get_text` | Ambil teks dari elemen untuk divalidasi |
| `close_browser`| Tutup instance browser yang berjalan |

**Cara Kerja:** Setiap tool call dari AI → action nyata di browser yang terbuka!

---

## 6. Contoh Nyata: AI Analisa & Jalankan UI Test

Skenario: AI diminta untuk menavigasi ke halaman form penambahan kontak di `emra.chat`, memverifikasi form input, dan menyusun kerangka objek lamannya (POM).

### Prompt ke AI:

```
Login dulu menggunakan valid user,
lalu gunakan navigate_to ke https://emra.chat/contacts/add,
lalu ambil screenshot halaman tersebut dan verifikasi apakah
kemudian tambahkan contact dengan nama dummy "Test", email dummy "[EMAIL_ADDRESS]" dan nomor telepon dummy "08123456789",
setelah itu klik tombol create contact.
Setelah selesai memverifikasi, buatkan snippet kode Playwright (POM) untuk halaman Add Contact tersebut dan buatkan juga spec test nya.
```

### Yang AI Lakukan (via MCP):

```typescript
// Step 1: AI calls navigate_to
tool: navigate_to
args: { url: "https://emra.chat/contacts/add" }

// Step 2: AI calls wait_for_selector
tool: wait_for_selector
args: { selector: "input[name='contactName']" }

// Step 3: AI calls screenshot
tool: screenshot
args: { filename: "add-contact-page.png", fullPage: true }

// Step 4: AI generates test code based on findings:
```

```typescript
// Hasil generate dari `bootcamp_automation_1/pages/contact.page.ts`:
export class AddContactPage {
  readonly nameField: Locator;
  readonly phoneField: Locator;
  readonly saveButton: Locator;

  constructor(page: Page) {
    this.nameField = page.locator('input[name="contactName"]');
    this.phoneField = page.locator('input[name="phoneNumber"]');
    this.saveButton = page.getByRole('button', { name: 'Save Contact' });
  }

  async fillContactDetails(name: string, phone: string) {
    await this.nameField.fill(name);
    await this.phoneField.fill(phone);
    await this.saveButton.click();
  }
}
```

*AI ber-referensi pada kode aktual di repo Anda — bukan mengarang!*

---

## 7. MCP + `bootcamp_automation_1`: Generate API Helper & Test Case

### Skenario: AI Meng-generate API Test untuk Alur 'Register User'

AI diminta membuatkan helper function untuk endpoint Register sekaligus menyusun *Test Case* lengkap yang memanfaatkan library `Faker` untuk men-generate data uji yang selalu berbeda (dinamis).

### Prompt ke AI:

```
Baca file helper/api-helpers.ts di repo bootcamp_automation_1.
Berdasarkan pola yang ada, buatkan helper function baru
untuk endpoint POST /api/v1/auth/register.
Request body: 
{
  "user": {
    "email": "user@example.com",
    "password": "securePassword123",
    "password_confirmation": "securePassword123",
    "name": "John Doe",
    "phone": "+628123456789",
    "city": "Jakarta"
  }
}
Response expected: sukses 200.
Kemudian, buatkan test spesifik di dalam tests/api/ yang memanggil helper ini.
Penting: Gunakan library @faker-js/faker untuk mengisi semua field payload register secara dinamis.
```

### Context yang AI Baca dari Repo (via MCP Filesystem):

```typescript
// Dari: bootcamp_automation_1/helper/api-helpers.ts (existing pattern)
export async function login(
  request: APIRequestContext,
  baseURL: string,
  credentials: any
): Promise<any> {
  // AI mempelajari skema POST request dan penanganan error pada repo Anda...
}
```

### Output AI (Helper & Spec Generated):

```typescript
// 1. Tambahan Helper di api-helpers.ts
export async function register(
  request: APIRequestContext,
  baseURL: string,
  payload: any
): Promise<any> {
  const response = await request.post(`${baseURL}/api/v1/auth/register`, {
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    data: payload
  });

  if (response.status() !== 200 && response.status() !== 201) {
    const errorBody = await response.text();
    throw new Error(`Register failed with status ${response.status()}: ${errorBody}`);
  }

  return response.json();
}
```

```typescript
// 2. Hasil Generate file test (tests/api/register.spec.ts)
import { test, expect } from '@playwright/test';
import { faker } from '@faker-js/faker';
import { register } from '../../helper/api-helpers';

test.describe('Register Flow', () => {
  test('User can register securely using valid faker data', async ({ request, baseURL }) => {
    // Step 1: Generate dynamic payload using Faker
    const password = faker.internet.password();
    const registerPayload = {
      user: {
        email: faker.internet.email(),
        password: password,
        password_confirmation: password,
        name: faker.person.fullName(),
        phone: faker.phone.number({ style: 'international' }),
        city: faker.location.city()
      }
    };
    
    // Step 2: Request Register
    console.log(`Registering new user: ${registerPayload.user.email}`);
    const responseBody = await register(request, baseURL as string, registerPayload);
    
    // Step 3: Assert Response
    expect(responseBody).toBeDefined();
    // Pada praktik riil dibutuhkan validasi token atau ID balikan.
  });
});
```

**Kualitas output:** Helper konsisten beserta _error handling_, dan _test block_ secara akurat menggunakan faker.js sesuai tuntutan pembuatan data _User_ baru yang dinamis.

---

## 8. MCP + `bootcamp_automation_1`: Debug Test Gagal

### Skenario: Test Login Gagal di CI, Perlu Diagnosa Cepat

Test dari `bootcamp_automation_1/tests/login.spec.ts`:

```typescript
test('147-User successfully login using valid credential', async ({ page }) => {
  await page.goto('/login');
  await page.getByRole('textbox', { name: 'Email' }).fill(userData['valid_user']['email']);
  await page.getByRole('textbox', { name: 'Password' }).fill(userData['valid_user']['password']);
  await page.getByRole('button', { name: 'Sign In' }).click();
  // ❌ TEST GAGAL DI SINI:
  await expect(page.getByRole('button', { name: 'Fadhli test 1 testingemrachat' })).toBeVisible();
});
```

### Prompt ke AI (via MCP):

```
Test login.spec.ts gagal di assertion terakhir.
Buka browser ke https://emra.chat/login, login dengan 
email testingemrachat@gmail.com, lalu screenshot hasilnya
dan beri tahu selector yang tepat untuk tombol profil user.
```

### AI Workflow:

```
1. navigate_to          → https://emra.chat/login
2. type_text            → email field
3. type_text            → password field  
4. click_element        → Sign In button
5. wait_for_selector    → tunggu selector profil muncul  
6. screenshot           → "after-login.png" (capture hasil)
7. get_text             → Cek teks tombol profil aktual
8. AI Report:
    "Tombol yang muncul adalah 'Fadhli M' bukan 
     'Fadhli test 1 testingemrachat'. 
     Update selector menjadi:
     page.getByRole('button', { name: 'Fadhli M' })"
```

---

## 9. MCP + `bootcamp_automation_1`: Validasi Flow Web + API End-to-End

### Skenario: AI Verifikasi Alur Register → Login → GET Token

Dengan MCP, AI bisa langsung mengeksekusi API calls **dan** UI test dalam 1 sesi.

```
Prompt: "Verifikasi bahwa user baru yang diregistrasi via API 
bisa login ke UI emra.chat dan melihat dashboard."
```

### AI mengeksekusi:

**Step 1 – API: Register user baru**
```typescript
// AI calls bootcamp_automation_1/helper/api-helpers.ts: registerUser()
const newUser = await registerUser(request, baseURL);
// Response: { email: "test1234@xxx.com", password: "password123", token: "eyJ..." }
```

**Step 2 – API: Verifikasi token**
```typescript
// AI calls login() untuk verify token valid
const token = await login(request, baseURL, newUser.email, newUser.password);
console.log('✅ Token received:', token.substring(0, 20) + '...');
```

**Step 3 – UI: Login via browser (MCP Playwright)**
```
navigate_to       → https://emra.chat/login
type_text         → email: newUser.email
type_text         → password: newUser.password
click_element     → Sign In button
screenshot        → "dashboard-verification.png"
```

**Step 4 – AI Report:**
```
"✅ User baru berhasil register via API dan login via UI.
 Dashboard tampil normal. Screenshot tersimpan."
```

---

## 10. Integrasi MCP-AgentQ (Test Case Management)

Selain bisa mengendalikan browser lokal dengan Playwright, AI Anda (Claude) juga bisa menata test case secara langsung ke sistem manajemen **AgentQ** melalui **agentq-mcp**.

### Konfigurasi AgentQ MCP (Koneksi Remote)

Berbeda dengan `playwright` yang berjalan lokal (mengeksekusi `node`), `agentq-mcp` adalah server **remote**.

**Cara 1: Melalui UI IDE (Cursor / VS Code / Claude Desktop)**
1. Buka pengaturan MCP (Fitur MCP di IDE Anda).
2. Tambahkan server baru dengan tipe **SSE** atau **URL**.
3. Masukkan Endpoint: `https://mcp.agentq.id/mcp`

**Cara 2: Melalui Konfigurasi JSON (Claude CLI)**
Tambahkan ke file konfigurasi global atau lokal (biasanya di `~/.claude.json`, `~/.claude/settings.json`, atau config spesifik AI Anda):
```json
{
  "mcpServers": {
    "agentq-mcp": {
      "url": "https://mcp.agentq.id/mcp", 
      "type": "http" /* atau 'sse' bergantung pada client AI */
    }
  }
}
```

*Begitu AI mendeteksi penambahan ini dan mencoba memanggilnya, browser akan terbuka untuk meminta Otorisasi OAuth.*

### Operasi Endpoint yang Bisa Dilakukan AI:

- `list_projects`, `get_project`
- `list_test_cases`, `get_test_case`, `create_test_case`
- `list_test_runs`, `get_test_run`, `update_test_result`

### Skenario Prompts Praktikal dengan AgentQ:

```
"Tolong panggil get_test_case dari AgentQ untuk membaca isi Test Case dengan ID TC-10. 
Pahami langkah-langkah pengujian (steps) dan expected result-nya, kemudian jalankan test nya menggunakan playwright mcp dengan
buatkan automation test Playwright (.spec.ts) yang utuh beserta POM lamannya."
```

*(Kekuatan MCP: AI tidak lagi butuh Anda copy-paste dokumen Word/Excel. AI akan "membaca" dari database management tools secara mandiri, lalu menyulapnya menjadi test script).*

---

## 11. Prompt Engineering untuk QA

Kualitas output AI sangat bergantung pada kualitas prompt. Berikut pola yang proven:

### ❌ Prompt Buruk:
```
"Buatkan test untuk login"
```

### ✅ Prompt Baik:
```
"Baca file tests/login.spec.ts dan pages/login.page.ts 
di repo bootcamp_automation_1. Berdasarkan pola yang ada,
buatkan test case baru untuk skenario:
- User login dengan email yang belum terverifikasi
- Expected: muncul pesan error 'Email belum diverifikasi'
- Gunakan userData dari data/user.json
- Ikuti pola afterEach agentq-helper yang sudah ada"
```

### Template Prompt untuk QA Engineering:

```markdown
## Konteks
[Jelaskan repo dan file relevan yang harus dibaca AI]

## Task
[Satu kalimat jelas tentang apa yang harus dilakukan]

## Constraint
- Ikuti pola dari file: [nama file]
- Gunakan library: [library yang sudah ada]
- Output format: [TypeScript / JSON / markdown]

## Acceptance Criteria
- [ ] Test bisa dijalankan dengan `npx playwright test`
- [ ] Menggunakan helper dari api-helpers.ts
- [ ] Error handling sesuai pola yang ada
```

---

## 12. Keamanan & Best Practices

### ⚠️ Jangan Berikan AI Akses ke:

```json
// config.json — JANGAN expose ke MCP filesystem
{
  "mcpServers": {
    "filesystem": {
      "args": [
        "C:/Users/USER/workspace/bootcamp_automation_1" // ✅ Repo test saja
        // ❌ JANGAN: "C:/Users/USER/workspace/back-end" (kode produksi)
        // ❌ JANGAN: "C:/Users/USER/.ssh" (kunci SSH)
        // ❌ JANGAN: "C:/Users/USER/secrets" (API keys)
      ]
    }
  }
}
```

### Best Practices MCP untuk QA:

| Do ✅ | Don't ❌ |
|-------|---------|
| Beri akses hanya ke repo test | Beri akses ke codebase produksi |
| Review semua kode AI sebelum commit | Langsung push code AI tanpa review |
| Simpan credential di `.env`, bukan di prompt | Tulis password/token dalam prompt |
| Jalankan test di environment staging dulu | Langsung jalankan test ke production |
| Batasi akses MCP filesystem per project | Buka seluruh drive ke AI |

### `.gitignore` Wajib:
```bash
# bootcamp_automation_1/.gitignore
.env
.env-local
.env-production
cookies.txt
*.json.bak
```

---

## 13. Hands-on (2 Exercises)

### Exercise 1: MCP Browser Exploration with Claude CLI (20 Menit)

**Tujuan:** Gunakan AI + MCP Playwright untuk eksplorasi live website via terminal.

1. **Buka Terminal:** Pastikan Anda berada di folder mana saja.
2. **Jalankan Claude:**
   ```bash
   claude
   ```
3. **Kirimkan Prompt:**
   ```
   "Buka https://emra.chat/login menggunakan playwright. 
   Ambil screenshot halaman dan simpan sebagai 'login-check.png'.
   Beri tahu saya apa saja ID atau name dari field email dan password."
   ```
4. **Verifikasi:**
   - Cek apakah browser (Chromium) terbuka otomatis.
   - Cek file `login-check.png` yang dihasilkan.
   - Apakah AI berhasil menyebutkan ID `#email` dan `#password`?

---

### Exercise 2: AI Code Generation from Repo Context (25 Menit)

**Tujuan:** Generate test baru dengan AI menggunakan context dari repo `bootcamp_automation_1`.

1. **Masuk ke Folder Repo:**
   ```bash
   cd C:\Users\USER\workspace\bootcamp_automation_1
   ```
2. **Jalankan Claude dengan Context:**
   ```bash
   claude
   ```
3. **Kirimkan Prompt Detail:**
   ```
   "Baca helper/api-helpers.ts untuk memahami cara delete. 
   Lalu baca tests/api/authentication.spec.ts untuk melihat struktur test.
   Buatkan file test baru 'tests/api/broadcasts.spec.ts' yang:
   - Login pakai owner_user (dari data/user.json)
   - POST create broadcast template
   - DELETE template tersebut di akhir test (cleanup)
   - Ikuti style coding dan error handling yang ada di repo ini."
   ```
4. **Review & Jalankan:**
   - Review file yang dibuat AI. Apakah helper yang dipanggil sudah benar?
   - Jalankan testnya: `npx playwright test tests/api/broadcasts.spec.ts`

---

## 🏆 Career Insight: AI-Augmented QA Engineer

MCP bukan menggantikan QA Engineer — **MCP membuat QA Engineer 10x lebih produktif**.

### Level Karir dengan MCP:

```
Manual Tester          →  Bot menggantikan Anda
QA Automation          →  Butuh beberapa jam/hari
AI-Augmented QA (MCP)  →  Selesai dalam menit, dengan kualitas lebih baik
```

**Yang harus dikuasai SDET 2026:**
1. **Prompt Engineering** 🧠 — Komunikasi efektif dengan AI
2. **Code Review AI Output** 👀 — Validasi & perbaiki hasil AI
3. **MCP Architecture** 🏗️ — Pahami cara kerja protokol
4. **AI Tool Orchestration** 🎯 — Combine multiple MCP servers

> *"The best QA Engineers won't be replaced by AI. They will be the ones who know how to direct AI."*

---

## Q&A & Wrap Up

```
     ┌──────────────────────────────────┐
     │   Session 8 Complete! 🎉         │
     │                                  │
     │   MCP + Playwright =             │
     │   AI yang bisa benar-benar       │
     │   menyentuh browser Anda         │
     │                                  │
     │   🙋 Questions?                  │
     └──────────────────────────────────┘
```

### Resource Lanjutan:
- 📖 [MCP Official Docs](https://modelcontextprotocol.io)
- 🛠️ [Playwright MCP Server Repo](C:/Users/USER/workspace/mcp-playwright)
- 🤖 [Claude CLI (Claude Code)](https://www.npmjs.com/package/@anthropic-ai/claude-code)

---

*Made with ❤️ for QA Engineers — Session 8/8*
