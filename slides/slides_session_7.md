# Session 7: API Automation
## Menguji Backend API menggunakan Playwright

---

## Agenda

1. **Konsep Dasar API Testing**
2. **Kenapa Playwright untuk API?**
3. **Mengenal `request` Fixture**
4. **GET Request & Validasi Response**
5. **POST Request & Mengirim JSON Data**
6. **Authentication & Bearer Token**
7. **Data Driven Testing dengan `user.json`**
8. **Helper Functions: Reusable API Calls**
9. **JSON Schema Validation**
10. **Hybrid Testing: API Setup + UI Test**
11. **Integrasi AgentQ: Auto-Sync Test Result**
12. **Hands-on Exercises**

---

## 1. Konsep Dasar API Testing

### Apa itu API?
**API (Application Programming Interface)** adalah jembatan komunikasi antara *Frontend* (UI) dan *Backend* (Server/Database).

**Metode HTTP yang sering digunakan:**
- **GET**: Mengambil data
- **POST**: Membuat data baru / Mengirim instruksi
- **PUT / PATCH**: Mengubah data
- **DELETE**: Menghapus data

**Status Code Penting:**
- `200 OK` / `201 Created` → Berhasil ✅
- `400 Bad Request` / `401 Unauthorized` / `404 Not Found` → Error dari User ❌
- `500 Internal Server Error` → Error dari Server Backend 💥

---

## 2. Kenapa Playwright untuk API?

Banyak orang menggunakan **Postman** untuk manual API testing. Mengapa kita harus mengotomasikannya dengan Playwright?

1. **Satu Alat untuk Semua** 🛠️: UI Automation dan API Automation berada dalam satu kerangka kerja (*framework*), satu format `expect()`, dan *runner* yang sama.
2. **Lebih Cepat & Stabil** ⚡: API test berjalan sangat cepat karena tidak ada *rendering DOM* browser.
3. **Hybrid Setup** 🔄: Kita bisa menggunakan API untuk langkah *pre-condition* seperti membuat akun sementara sebelum menjalankan UI test

---

## 3. Mengenal `request` Fixture

Di Playwright, kita menggunakan fixture `request` (berasal dari `APIRequestContext`) untuk "menembak" endpoint API langsung.

Contoh paling sederhana — cek apakah endpoint `/api/v1/auth/login` bisa diakses:

```typescript
import { test, expect } from '@playwright/test';

test('API Test Sederhana', async ({ request }) => {
  const baseURL = process.env.API_BASE_URL || 'http://localhost:3000';

  // Gunakan param 'request', jangan 'page'
  const response = await request.post(`${baseURL}/api/v1/auth/login`, {
    data: { auth: { email: 'user@emra.chat', password: 'wrongpass' } },
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }
  });

  // Validasi status code (harusnya 401 Unauthorized jika password salah)
  expect(response.status()).toBe(401);
});
```

---

## 4. GET Request & Validasi Response

Bukan hanya mengecek respon berhasil, tugas QA adalah memastikan *data* yang diberikan *Backend* tepat.

Contoh nyata dari `emra_api_test` — GET daftar accounts milik user:

```typescript
test('GET Accounts - harus mengembalikan daftar akun', async ({ request }) => {
  const baseURL = process.env.API_BASE_URL || 'http://localhost:3000';
  const token = 'YOUR_JWT_TOKEN';

  const response = await request.get(`${baseURL}/api/v1/accounts`, {
    headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
  });

  // Pastikan status 200 OK
  expect(response.status()).toBe(200);

  // Parsing response menjadi JSON object
  const body = await response.json();

  // Validasi bahwa response berisi array 'data'
  expect(body.data).toBeDefined();
  expect(Array.isArray(body.data)).toBeTruthy();
});
```

---

## 5. POST Request & Mengirim Data JSON

Saat API membutuhkan input (registrasi, buat template), gunakan `.post()` dan kirim data via opsi `data`.

Contoh nyata — mendaftarkan user baru ke `emra.chat`:

```typescript
test('POST Register - harus membuat user baru', async ({ request }) => {
  const baseURL = process.env.API_BASE_URL || 'http://localhost:3000';

  const response = await request.post(`${baseURL}/api/v1/auth/register`, {
    data: {
      auth: {
        name: 'QA Tester',
        email: 'qatester@emra.chat',
        password: 'password123',
        password_confirmation: 'password123'
      }
    },
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }
  });

  // 201 menandakan "Data Berhasil Dibuat"
  expect(response.status()).toBe(201);

  const body = await response.json();
  // Pastikan field 'success' bernilai true
  expect(body.success).toBe(true);
});
```

---

## 6. Authentication & Bearer Token

Endpoint private di `emra.chat` mewajibkan pengiriman **JWT token** pada setiap request.

**Alur**: Kita login dulu → dapat token → pakai token untuk request berikutnya.

```typescript
test('Login & gunakan token untuk GET Subscriptions', async ({ request }) => {
  const baseURL = process.env.API_BASE_URL || 'http://localhost:3000';

  // Step 1: Login untuk mendapatkan token
  const loginRes = await request.post(`${baseURL}/api/v1/auth/login`, {
    data: { auth: { email: 'testingemrachat@gmail.com', password: 'tester!3' } },
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }
  });
  expect(loginRes.status()).toBe(200);

  const loginData = await loginRes.json();
  const token = loginData.data.tokens.access_token; // ← JWT dari emra.chat

  // Step 2: Gunakan token di Authorization header
  const subRes = await request.get(`${baseURL}/api/v1/subscriptions`, {
    headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
  });

  expect(subRes.status()).toBe(200);
});
```

---

## 7. Data Driven Testing dengan `data/user.json`

Kita TIDAK PERNAH hardcode email/password langsung di *test script*. Semua kredensial tersimpan di satu file JSON.

**`data/user.json`** (file bank data di `emra_api_test`):
```json
{
  "owner_user": {
    "email": "testingemrachat@gmail.com",
    "password": "tester!3"
  },
  "moderator": {
    "email": "moderator@saspazh.ai",
    "password": "moderator123"
  },
  "regular_user": {
    "email": "user@saspazh.ai",
    "password": "user123"
  },
  "whatsapp_account": {
    "name": "default",
    "phone_number": "6285355011867"
  }
}
```

**Cara pakainya di test:**
```typescript
import userData from '../../data/user.json';

// Cukup panggil propertinya, tidak perlu tulis email manual
const email    = userData.owner_user.email;
const password = userData.owner_user.password;
```

*Saat email/password berubah, cukup update `user.json` → semua test otomatis ikut.*

---

## 8. Helper Functions: `helper/api-helpers.ts`

**Helper** = "gudang fungsi" reusable agar test script tetap bersih dan tidak berulang.

**Fungsi `login()` dari `api-helpers.ts`** (dipakai oleh semua spec):

```typescript
export async function login(
  request: APIRequestContext,
  baseURL: string,
  email: string,
  password: string
): Promise<string> {
  const response = await request.post(`${baseURL}/api/v1/auth/login`, {
    data: { auth: { email, password } },
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }
  });

  if (response.status() !== 200) {
    throw new Error(`Login failed: ${response.status()}`);
  }

  const body = await response.json();
  return body.data.tokens.access_token; // Return JWT string
}
```

**Di dalam test cukup 1 baris:**
```typescript
import { login, getAccounts } from '../../helper/api-helpers';

const token = await login(request, baseURL, email, password);
const accounts = await getAccounts(request, baseURL, token);
```

**Helper tersedia untuk semua flow:**

| Fungsi | Endpoint | Return |
|--------|----------|--------|
| `login()` | `POST /api/v1/auth/login` | JWT token string |
| `registerUser()` | `POST /api/v1/auth/register` | `{ email, password, token }` |
| `getSubscription()` | `GET /api/v1/subscriptions` | object subscription |
| `getAccounts()` | `GET /api/v1/accounts` | array of accounts |
| `deleteAccount()` | `DELETE /api/v1/accounts/:id` | `{ success: true }` |
| `registerCompany()` | `POST /api/v1/company/register` | object company |

---

## 9. JSON Schema Validation

**Kenapa perlu JSON Schema?**

Bayangkan developer backend mengubah nama field `access_token` → `accessToken` tanpa pemberitahuan. Test yang hanya mengecek status `200` akan tetap **pass**, padahal *kontrak data* sudah berubah!

Dengan **JSON Schema**, test akan **otomatis gagal** jika struktur respons menyimpang.

**`json-schema/login-response-schema.json`** (kontrak WAJIB dari backend `emra.chat`):
```json
{
  "type": "object",
  "required": ["success", "data"],
  "properties": {
    "data": {
      "required": ["user", "tokens"],
      "properties": {
        "tokens": {
          "required": ["access_token", "refresh_token"],
          "properties": {
            "access_token":  { "type": "string" },
            "refresh_token": { "type": "string" },
            "expires_at":    { "type": "string", "format": "date-time" }
          }
        }
      }
    }
  }
}
```

**Implementasi di `authentication.spec.ts`:**
```typescript
import loginResponseSchema from '../../json-schema/login-response-schema.json';
const { Validator } = require('jsonschema');

// Setelah dapat response...
const data = await response.json();
const validator = new Validator();
const result = validator.validate(data, loginResponseSchema);

expect(result.errors).toHaveLength(0); // ⬅ Kontrak HARUS terpenuhi 100%
```

---

## 10. Hybrid Testing: API Setup + UI Test (Magic! 🪄)

Ini adalah teknik sakti di `emra_api_test` — bypass Login UI menggunakan token dari API.

**Masalah:** Di `emra_web_test`, setiap UI test harus melalui Login UI → lambat & rentan flaky.

**Solusi dari `emra_api_test`:** Dapatkan JWT token dari API, inject ke browser session, langsung buka halaman yang sudah ter-login.

```typescript
import { login } from '../../helper/api-helpers';
import userData from '../../data/user.json';

test('Bypass Login UI, langsung test halaman Dashboard', async ({ page, request }) => {
  const baseURL = process.env.API_BASE_URL || 'http://localhost:3000';

  // Step 1: Ambil token via API (cepat! < 1 detik)
  const token = await login(
    request, baseURL,
    userData.owner_user.email,
    userData.owner_user.password
  );

  // Step 2: Inject JWT ke localStorage browser
  await page.goto(baseURL);
  await page.evaluate((t) => {
    localStorage.setItem('access_token', t);
  }, token);

  // Step 3: Reload — user langsung ter-autentikasi!
  await page.goto(`${baseURL}/dashboard`);
  await expect(page.locator('[data-testid="dashboard-header"]')).toBeVisible();
});
```

---

## 11. Integrasi AgentQ: Auto-Sync Test Result

Kita tidak perlu mengupdate status Test Case di AgentQ secara manual! `helper/agentq-helper.ts` mengirimkan hasilnya otomatis setiap kali test selesai.

**Caranya? Cukup 2 langkah:**

**Langkah 1** — Beri prefix TC ID di judul test:
```typescript
// Format: "ID-judul test"
test('97-should register new user and validate subscription', async ({ request }) => {
  //       ↑ AgentQ akan update TC #97 berdasarkan angka ini
  // ... isi test ...
});
```

**Langkah 2** — Pasang `afterEach` di setiap spec:
```typescript
import { pushTestResultToAgentQ } from '../../helper/agentq-helper';

test.afterEach(async ({}, testInfo) => {
  const duration = Date.now() - testStartTime;
  const errors   = testInfo.errors.map(e => e.message).join('; ');

  // Otomatis push ke AgentQ: status "passed"/"failed" + durasi + error log
  await pushTestResultToAgentQ(testInfo.title, testInfo.status, duration, errors);
});
```

*Setelah test jalan, buka AgentQ → TC #97 langsung terupdate tanpa klik manual!*

---

## 12. Hands-on (2 Exercises)

### Exercise 1: Login & Validasi JWT (15 Menit)

Buat file `tests/api/login-test.spec.ts` di project `emra_api_test`:
1. Import `userData` dari `../../data/user.json`.
2. Lakukan `request.post` ke `/api/v1/auth/login` menggunakan `userData.owner_user`.
3. Validasi `response.status()` adalah `200`.
4. Parsing JSON, validasi bahwa `data.tokens.access_token` ada dan bertipe `string`.
5. Validasi `data.user.email` sama dengan email yang dikirimkan.

### Exercise 2: Alur Register → Login → GET Accounts (15 Menit)

Buat file `tests/api/accounts-test.spec.ts`:
1. Import `registerUser`, `login`, `getAccounts` dari `../../helper/api-helpers`.
2. Gunakan `registerUser()` untuk mendaftarkan user baru.
3. Gunakan `login()` untuk mendapatkan token user tersebut.
4. Gunakan `getAccounts()` dengan token untuk mengambil daftar akun.
5. Validasi bahwa response mengandung properti `data`.

---

## 🏆 Career Insight: SDET API Mastery

Memahami API Automation menjadikan Anda pemain kelas atas di dunia QA Engineering.

**Keuntungan Ekstra API Test:**
1. **Lebih Dipercaya Developer** 🤝: *API Bug Reports* lebih *to-the-point* menunjuk kode fungsi, bukan sekedar *"Tampilan Blank"*.
2. **Shift Left Testing** 🚀: Test bisa ditulis hanya dari *Swagger/API Docs*, tanpa menunggu UI Frontend rampung.
3. **Stabil & Cepat**: Sangat pas di *CI/CD pipeline*.
4. **Lebih Premium** 💰: Skill ini mendoorong kenaikan *salary* sebagai SDET.

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
