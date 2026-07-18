# RFC: Technical Requirements - Registrasi & Autentikasi Email & Password

## 1. Arsitektur Sistem

### 1.1 High-Level Architecture

```mermaid
graph TB
    subgraph "Frontend"
        A[Web App]
    end
    subgraph "Backend API"
        B[Rails App]
    end
    subgraph "Database"
        C[PostgreSQL]
    end
    subgraph "Local Storage"
        D[JWT Storage]
    end

    A --> B
    B --> C
    B --> D
```

### 1.2 Component Architecture

#### Frontend Components
- **Authentication UI Components**
  - Login Form Component
  - Registration Form Component
  - Forgot Password Form Component
  - Reset Password Form Component
  - Profile Update Form Component

- **State Management**
  - JWT Token Storage (Local Storage)
  - User Session State
  - Authentication State

#### Backend Components
- **Authentication Controller** (`api/v1/auth_controller.rb`)
- **JWT Service** (`services/jwt_service.rb`)
- **User Model** (`app/models/user.rb`)
- **Subscription Model** (`app/models/subscription.rb`)
- **Package Model** (`app/models/package.rb`)
- **Subscription Service** (`services/subscription_service.rb`)
- **Package Management Service** (`services/package_management_service.rb`)
- **User Management Service** (`services/user_management_service.rb`)

### 1.3 Authentication Flow Architecture

```mermaid
flowchart TD
    User[User]
    LoginRegForm[Login/Reg Form]
    AuthController[Auth Controller]
    UserModel[User Model]
    JWTService[JWT Service]
    TokenCreated[Token Created]
    LocalStorage[Local Storage]

    User --> LoginRegForm
    LoginRegForm --> AuthController
    AuthController --> UserModel
    UserModel --> JWTService
    JWTService --> TokenCreated
    TokenCreated --> LocalStorage
```

## 2. Arsitektur Database

### 2.1 ERD (Entity Relationship Diagram)

```mermaid
erDiagram
    USER {
        bigint id PK
        string email UK
        string password_digest
        string encrypted_password
        string name
        string phone_number
        string country
        string country_code
        boolean whatsapp
        string whatsapp_no
        integer status
        integer role
        decimal balance
        string provider
        string uid
        string image_url
        string reset_password_token UK
        datetime reset_password_sent_at
        string google_id UK
        string google_avatar_url
        boolean email_confirmed
        string email_confirmation_token UK
        boolean phone_number_confirmed
        boolean onboarding_completed
        string company_size
        string city
        jsonb preferences
        uuid uuid UK
        datetime created_at
        datetime updated_at
    }

    SUBSCRIPTION {
        bigint id PK
        bigint user_id FK
        bigint package_id FK
        string status
        string subscription_type
        datetime start_date
        datetime end_date
        datetime trial_end_date
        datetime current_period_start
        datetime current_period_end
        string payment_type
        decimal payment_amount
        boolean activated_by_moderator
        bigint activated_by_id FK
        boolean auto_renewal
        jsonb subscription_metadata
        bigint reference_subscription_id FK
        uuid uuid UK
        datetime created_at
        datetime updated_at
    }

    PACKAGE {
        integer id PK
        string name
        text description
        decimal price
        boolean active
        string config_package_name
        boolean contact_sales
        string billing_cycle
        jsonb features
        integer trial_days
        integer max_users
        uuid uuid UK
        datetime created_at
        datetime updated_at
    }

    ACTIVITY_LOG {
        bigint id PK
        bigint actor_id FK
        bigint target_user_id FK
        string action
        text details
        inet ip_address
        text user_agent
        datetime created_at
        datetime updated_at
    }

    USER ||--o{ SUBSCRIPTION : "has many"
    SUBSCRIPTION }o--|| PACKAGE : "belongs to"
    USER }o--|| ACTIVITY_LOG : "performed by"
    USER }o--|| ACTIVITY_LOG : "target of"
    SUBSCRIPTION }o--o{ SUBSCRIPTION : "reference"
```

### 2.2 Schema Definitions

#### Users Table
```sql
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_digest VARCHAR(255),
    encrypted_password VARCHAR(255) DEFAULT '' NOT NULL,
    name VARCHAR(255),
    phone_number VARCHAR(255),
    country VARCHAR(100),
    country_code VARCHAR(10),
    whatsapp BOOLEAN DEFAULT false,
    whatsapp_no VARCHAR(255),
    status INTEGER DEFAULT 0, -- 0: active, 1: inactive
    role INTEGER DEFAULT 0,    -- 0: owner, 1: admin, 2: developer, 3: moderator
    balance DECIMAL(10,2) DEFAULT 0.0 NOT NULL,
    email_confirmed BOOLEAN DEFAULT false,
    email_confirmation_token VARCHAR(255),
    email_confirmation_sent_at TIMESTAMP,
    phone_number_confirmed BOOLEAN DEFAULT false,
    phone_number_confirmation_code VARCHAR(255),
    phone_number_confirmation_sent_at TIMESTAMP,
    phone_number_confirmed_at TIMESTAMP,
    reset_password_token VARCHAR(255),
    reset_password_sent_at TIMESTAMP,
    remember_created_at TIMESTAMP,
    provider VARCHAR(255),
    uid VARCHAR(255),
    image_url VARCHAR(255),
    onboarding_goal VARCHAR(255),
    onboarding_completed BOOLEAN DEFAULT false,
    onboarding_completed_at TIMESTAMP,
    company_size VARCHAR(255),
    city VARCHAR(255),
    preferences JSONB DEFAULT '{}',
    google_id VARCHAR(255),
    google_avatar_url VARCHAR(255),
    uuid UUID DEFAULT gen_random_uuid() NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_phone_number ON users(phone_number);
CREATE INDEX idx_users_country_code ON users(country_code);
CREATE INDEX idx_users_google_id ON users(google_id);
CREATE INDEX idx_users_reset_password_token ON users(reset_password_token);
CREATE INDEX idx_users_uuid ON users(uuid);
CREATE UNIQUE INDEX idx_users_email_unique ON users(email);
CREATE UNIQUE INDEX idx_users_google_id_unique ON users(google_id);
CREATE UNIQUE INDEX idx_users_uuid_unique ON users(uuid);
```

#### Subscriptions Table
```sql
CREATE TABLE subscriptions (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id),
    package_id BIGINT NOT NULL REFERENCES packages(id),
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    subscription_type VARCHAR(50) NOT NULL DEFAULT 'new',
    start_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    end_date TIMESTAMP,
    trial_end_date TIMESTAMP,
    current_period_start TIMESTAMP,
    current_period_end TIMESTAMP,
    payment_type VARCHAR(50),
    payment_amount DECIMAL(12,2),
    activated_by_moderator BOOLEAN DEFAULT false,
    activated_by_id BIGINT REFERENCES users(id),
    auto_renewal BOOLEAN DEFAULT false,
    reference_subscription_id BIGINT REFERENCES subscriptions(id),
    subscription_metadata JSONB DEFAULT '{}',
    uuid UUID DEFAULT gen_random_uuid() NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_package_id ON subscriptions(package_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_activated_by_id ON subscriptions(activated_by_id);
CREATE INDEX idx_subscriptions_reference_subscription_id ON subscriptions(reference_subscription_id);
CREATE INDEX idx_subscriptions_trial_end_date ON subscriptions(trial_end_date);
CREATE INDEX idx_subscriptions_current_period_end ON subscriptions(current_period_end);
CREATE UNIQUE INDEX idx_subscriptions_uuid ON subscriptions(uuid);
```

#### Packages Table
```sql
CREATE TABLE packages (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    active BOOLEAN DEFAULT true,
    config_package_name VARCHAR(255),
    contact_sales BOOLEAN DEFAULT false,
    billing_cycle VARCHAR(20) DEFAULT 'monthly',
    features JSONB DEFAULT '{}',
    trial_days INTEGER DEFAULT 0,
    max_users INTEGER DEFAULT 1,
    uuid UUID DEFAULT gen_random_uuid() NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_packages_active ON packages(active);
CREATE INDEX idx_packages_config_package_name ON packages(config_package_name);
CREATE INDEX idx_packages_billing_cycle ON packages(billing_cycle);
CREATE UNIQUE INDEX idx_packages_uuid ON packages(uuid);
```

#### Activity Logs Table
```sql
CREATE TABLE activity_logs (
    id BIGSERIAL PRIMARY KEY,
    actor_id BIGINT REFERENCES users(id),
    target_user_id BIGINT REFERENCES users(id),
    action VARCHAR(255) NOT NULL,
    details TEXT,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_activity_logs_actor_id ON activity_logs(actor_id);
CREATE INDEX idx_activity_logs_target_user_id ON activity_logs(target_user_id);
CREATE INDEX idx_activity_logs_action ON activity_logs(action);
CREATE INDEX idx_activity_logs_created_at ON activity_logs(created_at);
```

### 2.3 Migration Files

#### Create Users Migration
```ruby
class CreateUsers < ActiveRecord::Migration[8.0]
  def change
    create_table :users do |t|
      t.string :email, null: false
      t.string :password_digest
      t.string :encrypted_password, null: false, default: ''
      t.string :name
      t.string :phone_number
      t.string :country
      t.string :country_code
      t.boolean :whatsapp, default: false
      t.string :whatsapp_no
      t.integer :status, default: 0
      t.integer :role, default: 0
      t.decimal :balance, precision: 10, scale: 2, default: '0.0', null: false
      t.boolean :email_confirmed, default: false
      t.string :email_confirmation_token
      t.datetime :email_confirmation_sent_at
      t.boolean :phone_number_confirmed, default: false
      t.string :phone_number_confirmation_code
      t.datetime :phone_number_confirmation_sent_at
      t.datetime :phone_number_confirmed_at
      t.string :reset_password_token
      t.datetime :reset_password_sent_at
      t.datetime :remember_created_at
      t.string :provider
      t.string :uid
      t.string :image_url
      t.string :onboarding_goal
      t.boolean :onboarding_completed, default: false
      t.datetime :onboarding_completed_at
      t.string :company_size
      t.string :city
      t.jsonb :preferences, default: {}
      t.string :google_id
      t.string :google_avatar_url
      t.uuid :uuid, default: -> { "gen_random_uuid()" }, null: false

      t.timestamps
    end
    add_index :users, :email, unique: true
    add_index :users, :status
    add_index :users, :role
    add_index :users, :phone_number
    add_index :users, :country_code
    add_index :users, :google_id, unique: true
    add_index :users, :reset_password_token, unique: true
    add_index :users, :uuid, unique: true
    add_index :users, :email_confirmation_token, unique: true
  end
end
```

#### Create Subscriptions Migration
```ruby
class CreateSubscriptions < ActiveRecord::Migration[8.0]
  def change
    create_table :subscriptions do |t|
      t.references :user, null: false, foreign_key: true
      t.references :package, null: false, foreign_key: true
      t.string :status, null: false, default: 'active'
      t.string :subscription_type, null: false, default: 'new'
      t.datetime :start_date, null: false
      t.datetime :end_date
      t.datetime :trial_end_date
      t.datetime :current_period_start
      t.datetime :current_period_end
      t.string :payment_type
      t.decimal :payment_amount, precision: 12, scale: 2
      t.boolean :activated_by_moderator, default: false
      t.references :activated_by, foreign_key: { to_table: :users }
      t.boolean :auto_renewal, default: false
      t.references :reference_subscription, foreign_key: { to_table: :subscriptions }
      t.uuid :uuid, default: -> { "gen_random_uuid()" }, null: false
      t.jsonb :subscription_metadata, default: {}

      t.timestamps
    end
    add_index :subscriptions, [:user_id, :status]
    add_index :subscriptions, :expires_at
    add_index :subscriptions, :uuid, unique: true
  end
end
```

#### Create Packages Migration
```ruby
class CreatePackages < ActiveRecord::Migration[8.0]
  def change
    create_table :packages do |t|
      t.string :name, null: false
      t.text :description
      t.decimal :price, precision: 10, scale: 2, null: false
      t.boolean :active, default: true
      t.string :config_package_name
      t.boolean :contact_sales, default: false
      t.string :billing_cycle, default: 'monthly'
      t.jsonb :features, default: {}
      t.integer :trial_days, default: 0
      t.integer :max_users, default: 1
      t.uuid :uuid, default: -> { "gen_random_uuid()" }, null: false

      t.timestamps
    end
    add_index :packages, :active
    add_index :packages, :config_package_name
    add_index :packages, :billing_cycle
    add_index :packages, :uuid, unique: true
  end
end
```

#### Create Activity Logs Migration
```ruby
class CreateActivityLogs < ActiveRecord::Migration[8.0]
  def change
    create_table :activity_logs do |t|
      t.references :actor, foreign_key: { to_table: :users }
      t.references :target_user, foreign_key: { to_table: :users }
      t.string :action, null: false
      t.text :details
      t.inet :ip_address
      t.text :user_agent

      t.timestamps
    end
    add_index :activity_logs, :actor_id
    add_index :activity_logs, :target_user_id
    add_index :activity_logs, :action
    add_index :activity_logs, :created_at
  end
end
```

## 3. Flowchart

### 3.1 Registration Flow

```mermaid
flowchart TD
    Start[Start]
    DisplayForm[Display Registration Form]
    UserFill[User Fill Form]
    ValidateInput[Validate Input]
    CheckEmail[Check Email Uniqueness]
    EmailExists{Email Exists?}
    ReturnError[Return Error]
    CreateUser[Create User Record]
    CreateTrialSubs[Create Trial Subs]
    GenerateJWT[Generate JWT Tokens]
    ReturnSuccess[Return Success Response]
    End[End]

    Start --> DisplayForm
    DisplayForm --> UserFill
    UserFill --> ValidateInput
    ValidateInput --> CheckEmail
    CheckEmail --> EmailExists
    EmailExists -- Yes --> ReturnError
    EmailExists -- No --> CreateUser
    CreateUser --> CreateTrialSubs
    CreateTrialSubs --> GenerateJWT
    GenerateJWT --> ReturnSuccess
    ReturnSuccess --> End
```

### 3.2 Login Flow

```mermaid
flowchart TD
    Start[Start]
    DisplayForm[Display Login Form]
    UserFill[User Fill Credentials]
    ValidateCreds[Validate Credentials]
    CheckUser{Check User Exists?}
    ReturnGenericError[Return Generic Error]
    VerifyPassword[Verify Password]
    CheckPassword{Password Valid?}
    ReturnInvalidCreds[Return Invalid Credentials Error]
    GenerateJWT[Generate JWT Tokens]
    LogActivity[Log Activity]
    ReturnSuccess[Return Success Response]
    End[End]

    Start --> DisplayForm
    DisplayForm --> UserFill
    UserFill --> ValidateCreds
    ValidateCreds --> CheckUser
    CheckUser -- No --> ReturnGenericError
    CheckUser -- Yes --> VerifyPassword
    VerifyPassword --> CheckPassword
    CheckPassword -- No --> ReturnInvalidCreds
    CheckPassword -- Yes --> GenerateJWT
    GenerateJWT --> LogActivity
    LogActivity --> ReturnSuccess
    ReturnSuccess --> End
```

### 3.3 Password Reset Flow

```mermaid
flowchart TD
    Start[Start]
    UserClicks[User Clicks Forgot Password]
    DisplayForm[Display Email Input Form]
    UserEnter[User Enter Email]
    FindUser[Find User by Email]
    CheckUserExists{User Exists?}
    ReturnGenericSuccess[Return Generic Success Message]
    GenerateResetToken[Generate Reset Token]
    SendEmail[Send Email with Reset Link]
    End[End]

    Start --> UserClicks
    UserClicks --> DisplayForm
    DisplayForm --> UserEnter
    UserEnter --> FindUser
    FindUser --> CheckUserExists
    CheckUserExists -- No --> ReturnGenericSuccess
    CheckUserExists -- Yes --> GenerateResetToken
    GenerateResetToken --> SendEmail
    SendEmail --> ReturnGenericSuccess
    ReturnGenericSuccess --> End
```

## 4. Sequence Diagram

### 4.1 Registration Sequence Diagram

```mermaid
sequenceDiagram
    participant Frontend
    participant Backend
    participant Database
    participant Subscription

    Frontend->>Backend: Register Request
    Backend->>Database: Validate Input
    Database-->>Backend: Validation Results
    Backend->>Database: Check Email Exists
    Database-->>Backend: Email Status
    Backend->>Database: Create User Record
    Database-->>Backend: User Created
    Backend->>Subscription: Create Trial Sub
    Subscription-->>Backend: Subscription Created
    Backend->>Backend: Generate JWT Tokens
    Backend-->>Frontend: Success Response
```

### 4.2 Login Sequence Diagram

```mermaid
sequenceDiagram
    participant Frontend
    participant Backend
    participant Database

    Frontend->>Backend: Login Request
    Backend->>Database: Find User by Email
    Database-->>Backend: User Data
    Backend->>Backend: Verify Password
    Backend->>Backend: Generate JWT Tokens
    Backend->>Database: Log Activity
    Backend-->>Frontend: Success Response
```

### 4.3 Password Reset Sequence Diagram

```mermaid
sequenceDiagram
    participant Frontend
    participant Backend
    participant Database
    participant EmailService

    Frontend->>Backend: Forgot Password
    Backend->>Database: Find User by Email
    Database-->>Backend: User Data
    Backend->>Backend: Generate Reset Token
    Backend->>Database: Save Reset Token
    Database-->>Backend: Saved
    Backend->>EmailService: Send Reset Email
    Backend-->>Frontend: Generic Message
    Frontend->>Backend: Reset Password
    Backend->>EmailService: Validate Reset Token
    EmailService-->>Backend: Token Valid
    Backend->>Database: Update Password
    Database-->>Backend: Password Updated
    Backend-->>Frontend: Success Response
```

## 5. List API Lengkap dengan Response

### 5.1 Ringkasan API Endpoint

| Method | Endpoint | Deskripsi | Auth |
|--------|-----------|-----------|------|
| GET | `/api/v1/health` | Health check endpoint | No |
| GET | `/api/v1/ping` | Simple ping endpoint | No |
| GET | `/api/v1/public` | Get public feature flags | No |
| POST | `/api/v1/auth/login` | Login dengan email & password | No |
| POST | `/api/v1/auth/register` | Registrasi user baru | No |
| POST | `/api/v1/auth/google_oauth` | Login dengan Google OAuth | No |
| POST | `/api/v1/auth/refresh` | Refresh access token | Yes |
| POST | `/api/v1/auth/logout` | Logout user | Yes |
| POST | `/api/v1/auth/forgot_password` | Request reset password | No |
| POST | `/api/v1/auth/reset_password` | Eksekusi reset password | No |
| POST | `/api/v1/auth/change_password` | Ganti password saat logged in | Yes |
| POST | `/api/v1/auth/verify_email` | Verify email address | No |
| POST | `/api/v1/auth/resend_verification` | Resend email verification | No |
| GET | `/api/v1/auth/verify_token` | Verify JWT token validity | Yes |
| GET | `/api/v1/user` | Get current user profile | Yes |
| PUT | `/api/v1/user` | Update user profile | Yes |

---

### 5.2 Base Response Format

All API endpoints follow this standard response format:

**Success Response:**
```json
{
  "success": true,
  "data": { ... },
  "message": "optional message"
}
```

**Error Response:**
```json
{
  "success": false,
  "errors": ["array of error messages"],
  "error_code": "optional error code",
  "data": null
}
```

---

### 5.3 Health & Public Endpoints (Tanpa Autentikasi)

#### GET /api/v1/health
Health check endpoint.

**Request:**
```
GET /api/v1/health
```

**Success Response (200):**
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:00:00Z",
  "version": "1.0.0"
}
```

---

#### GET /api/v1/ping
Simple ping endpoint.

**Request:**
```
GET /api/v1/ping
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "status": "ok",
    "timestamp": "2024-01-15T10:00:00Z"
  }
}
```

---

#### GET /api/v1/public
Get public feature flags.

**Request:**
```
GET /api/v1/public
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "feature_flags": {
      "landing_page_new_design": false,
      "registration_v2_enabled": false,
      "login_with_sso": false,
      "maintenance_mode": false,
      "beta_features_visible": false,
      "show_pricing_page": false,
      "hero_section_video": false,
      "testimonials_enabled": false,
      "pricing_preview": false,
      "waitlist_enabled": false,
      "show_download_links": false,
      "demo_button_visible": false,
      "google_oauth_enabled": false,
      "phone_verification_required": false,
      "email_verification_required": false,
      "show_privacy_policy": false,
      "show_terms_checkbox": false,
      "coming_soon": false
    },
    "maintenance": {},
    "contact_number": "+6285839276422",
    "meta": {
      "context": "public",
      "actor_id": null
    },
    "timestamp": "2024-01-15T10:00:00Z"
  }
}
```

---

### 5.4 Authentication Endpoints

#### POST /api/v1/auth/login
Login dengan email & password.

**Request:**
```json
{
  "auth": {
    "email": "user@example.com",
    "password": "password123"
  }
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": 1,
      "email": "user@example.com",
      "name": "John Doe",
      "role": "owner",
      "status": "active"
    },
    "tokens": {
      "access_token": "eyJhbGciOiJIUzI1NiJ9...",
      "refresh_token": "eyJhbGciOiJIUzI1NiJ9...",
      "expires_at": "2024-01-21T00:00:00Z",
      "refresh_expires_at": "2024-01-28T00:00:00Z"
    },
    "feature_flags": {}
  }
}
```

**Error Response (401):**
```json
{
  "success": false,
  "errors": ["Invalid credentials"],
  "error_code": "AUTH_FAILED"
}
```

---

#### POST /api/v1/auth/register
Register a new user.

**Request:**
```json
{
  "user": {
    "email": "user@example.com",
    "name": "John Doe",
    "password": "password123",
    "password_confirmation": "password123",
    "country_code": "+62",
    "country": "Indonesia",
    "phone_number": "+628123456789"
  }
}
```

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "email": "user@example.com",
      "name": "John Doe",
      "role": "owner",
      "status": "active"
    },
    "tokens": {
      "access_token": "eyJhbGciOiJIUzI1NiJ9...",
      "refresh_token": "eyJhbGciOiJIUzI1NiJ9...",
      "expires_at": "2024-01-21T00:00:00Z",
      "refresh_expires_at": "2024-01-28T00:00:00Z"
    },
    "message": "Please verify your email address to continue."
  },
  "message": "Please verify your email address to continue."
}
```

**Error Response (422):**
```json
{
  "success": false,
  "errors": ["Email can't be blank", "Password can't be blank"],
  "error_code": "REGISTRATION_FAILED"
}
```

---

#### POST /api/v1/auth/google_oauth
Login dengan Google OAuth.

**Request:**
```json
{
  "auth": {
    "token": "google_id_token_here"
  }
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": 1,
      "email": "user@example.com",
      "name": "John Doe",
      "role": "owner",
      "status": "active",
      "google_id": "123456789",
      "google_avatar_url": "https://..."
    },
    "tokens": {
      "access_token": "eyJhbGciOiJIUzI1NiJ9...",
      "refresh_token": "eyJhbGciOiJIUzI1NiJ9...",
      "expires_at": "2024-01-21T00:00:00Z",
      "refresh_expires_at": "2024-01-28T00:00:00Z"
    },
    "feature_flags": {},
    "account_linked": false,
    "login_method": "google_oauth_new",
    "auth_methods": ["google"],
    "can_set_password": true
  }
}
```

**Error Response (401):**
```json
{
  "success": false,
  "errors": ["Authentication failed"],
  "error_code": "GOOGLE_OAUTH_ERROR"
}
```

---

#### POST /api/v1/auth/refresh
Refresh access token.

**Request:**
```json
{
  "refresh_token": "eyJhbGciOiJIUzI1NiJ9..."
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "user": {
      "id": 1,
      "email": "user@example.com",
      "name": "John Doe",
      "role": "owner",
      "status": "active"
    },
    "tokens": {
      "access_token": "eyJhbGciOiJIUzI1NiJ9...",
      "expires_at": "2024-01-21T01:00:00Z"
    }
  }
}
```

**Error Response (401):**
```json
{
  "success": false,
  "errors": ["Token refresh failed"],
  "error_code": "REFRESH_FAILED"
}
```

---

#### POST /api/v1/auth/logout
Logout current user.

**Request Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiJ9...
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Logout successful",
  "data": {
    "message": "Please remove the token from your client storage"
  }
}
```

**Error Response (401):**
```json
{
  "success": false,
  "errors": ["Authentication required - Please login first"],
  "error_code": "AUTH_REQUIRED"
}
```

---

#### POST /api/v1/auth/forgot_password
Request password reset.

**Request:**
```json
{
  "email": "user@example.com"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "If an account with that email exists, password reset instructions have been sent",
  "data": null
}
```

**Error Response (422):**
```json
{
  "success": false,
  "errors": ["Email is required"]
}
```

---

#### POST /api/v1/auth/reset_password
Reset password with token.

**Request:**
```json
{
  "token": "reset_token_here",
  "password": "newPassword123",
  "password_confirmation": "newPassword123"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Password has been reset successfully",
  "data": null
}
```

**Error Response (422):**
```json
{
  "success": false,
  "errors": ["Reset token is invalid or has expired"]
}
```

---

#### POST /api/v1/auth/change_password
Change password when logged in.

**Request Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiJ9...
```

**Request Body:**
```json
{
  "user": {
    "current_password": "oldPassword123",
    "new_password": "newPassword123",
    "password_confirmation": "newPassword123"
  }
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

**Error Response (422):**
```json
{
  "success": false,
  "errors": ["Current password is incorrect"]
}
```

---

#### POST /api/v1/auth/verify_email
Verify email address.

**Request:**
```json
{
  "token": "email_verification_token_here"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Email verified successfully",
  "data": {
    "user": {
      "id": 1,
      "email": "user@example.com",
      "name": "John Doe",
      "role": "owner",
      "status": "active",
      "email_confirmed": true
    },
    "tokens": {
      "access_token": "eyJhbGciOiJIUzI1NiJ9...",
      "refresh_token": "eyJhbGciOiJIUzI1NiJ9...",
      "expires_at": "2024-01-21T00:00:00Z"
    },
    "feature_flags": {}
  }
}
```

**Error Response (422):**
```json
{
  "success": false,
  "errors": ["Invalid or expired verification token"],
  "error_code": "VERIFICATION_FAILED"
}
```

---

#### POST /api/v1/auth/resend_verification
Resend email verification.

**Request:**
```json
{
  "email": "user@example.com"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "If your account exists and is not verified, an email has been sent",
  "data": null
}
```

**Error Response (422):**
```json
{
  "success": false,
  "errors": ["Email is already verified"]
}
```

---

#### GET /api/v1/auth/verify_token
Verify JWT token validity.

**Request Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiJ9...
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "valid": true,
    "user": {
      "id": 1,
      "email": "user@example.com",
      "name": "John Doe",
      "role": "owner",
      "status": "active"
    },
    "expires_at": "2024-01-21T01:00:00Z"
  }
}
```

**Error Response (401):**
```json
{
  "success": false,
  "errors": ["Invalid or expired token - Please login again"],
  "error_code": "TOKEN_INVALID"
}
```

---

### 5.5 User Endpoints (Membutuhkan Autentikasi)

#### GET /api/v1/user
Get current user profile.

**Request Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiJ9...
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "email": "user@example.com",
      "name": "John Doe",
      "role": "owner",
      "status": "active",
      "phone_number": "+628123456789",
      "country": "Indonesia",
      "country_code": "+62"
    },
    "feature_flags": {}
  }
}
```

**Error Response (401):**
```json
{
  "success": false,
  "errors": ["Authentication required - Please login first"],
  "error_code": "AUTH_REQUIRED"
}
```

---

#### PUT /api/v1/user
Update user profile.

**Request Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiJ9...
```

**Request Body:**
```json
{
  "user": {
    "name": "John Updated",
    "phone_number": "+628987654321",
    "country": "Indonesia",
    "country_code": "+62",
    "whatsapp": "+628987654321"
  }
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "email": "user@example.com",
      "name": "John Updated",
      "role": "owner",
      "status": "active",
      "phone_number": "+628987654321",
      "country": "Indonesia",
      "country_code": "+62",
      "whatsapp": "+628987654321"
    },
    "feature_flags": {}
  },
  "message": "Profile updated successfully"
}
```

**Error Response (422):**
```json
{
  "success": false,
  "errors": ["Phone number is invalid"]
}
```

## 6. Task Breakdown Berdasarkan User Story

### 6.1 User Story 1 - Registrasi via Email & Password

#### Backend Tasks (BE)
- BE-01: Validasi field input registrasi sesuai form yang ada
- BE-02: Mapping field `phone` ke `phone_number` pada registrasi
- BE-03: Implementasi validasi email unik
- BE-04: Implementasi validasi kekuatan password
- BE-05: Integrasi pembuatan trial subscription otomatis dengan package default
- BE-06: Generate JWT tokens (access & refresh) setelah registrasi
- BE-07: Implementasi logging aktivitas registrasi
- BE-08: Implementasi validasi package availability untuk trial

#### Frontend Tasks (FE)
- FE-01: Implementasi form registrasi sesuai existing form
- FE-02: Validasi input di sisi client
- FE-03: Integrasi dengan API registrasi
- FE-04: Penanganan error dan pesan validasi
- FE-05: Implementasi informasi package trial yang didapat
- FE-06: Penyimpanan token yang aman setelah registrasi
- FE-07: Redirect ke dashboard/onboarding setelah registrasi berhasil

#### QA Tasks (QA)
- QA-01: Create test cases untuk registrasi via email & password
- QA-02: Test registrasi via email & password feature

### 6.2 User Story 2 - Login via Email & Password

#### Backend Tasks (BE)
- BE-09: Implementasi validasi kredensial login
- BE-10: Generate JWT tokens untuk login berhasil
- BE-11: Implementasi logging aktivitas login
- BE-12: Implementasi rate limiting untuk percobaan login
- BE-13: Implementasi pengecekan status user (active/suspended)
- BE-14: Return data user dan subscription info

#### Frontend Tasks (FE)
- FE-08: Implementasi form login
- FE-09: Integrasi dengan API login
- FE-10: Penanganan error login
- FE-11: Implementasi redirect berdasarkan role/subscription
- FE-12: Implementasi remember me functionality
- FE-13: Penyimpanan token yang aman

#### QA Tasks (QA)
- QA-03: Create test cases untuk login via email & password
- QA-04: Test login via email & password feature

### 6.3 User Story 3 - Refresh Token

#### Backend Tasks (BE)
- BE-15: Implementasi validasi refresh token
- BE-16: Implementasi rotasi refresh token
- BE-17: Implementasi pengecekan expiry token
- BE-18: Implementasi blacklist untuk token yang di-revoke

#### Frontend Tasks (FE)
- FE-14: Implementasi otomatis refresh token sebelum expiry
- FE-15: Implementasi handling token expired
- FE-16: Implementasi logout saat refresh token invalid

#### QA Tasks (QA)
- QA-05: Create test cases untuk refresh token
- QA-06: Test refresh token feature

### 6.4 User Story 4 - Logout

#### Backend Tasks (BE)
- BE-19: Implementasi endpoint logout
- BE-20: Implementasi logging aktivitas logout
- BE-21: Implementasi token revocation (optional)

#### Frontend Tasks (FE)
- FE-17: Implementasi tombol/logout functionality
- FE-18: Implementasi clear token storage
- FE-19: Implementasi redirect ke halaman login

#### QA Tasks (QA)
- QA-07: Create test cases untuk logout
- QA-08: Test logout feature

### 6.5 User Story 5 - Forgot Password (Request Reset)

#### Backend Tasks (BE)
- BE-22: Implementasi endpoint forgot password
- BE-23: Implementasi generate reset password token
- BE-24: Implementasi pengiriman email reset password
- BE-25: Implementasi response generik untuk mencegah user enumeration
- BE-26: Implementasi expiry untuk reset token

#### Frontend Tasks (FE)
- FE-20: Implementasi form forgot password
- FE-21: Integrasi dengan API forgot password
- FE-22: Implementasi pesan sukses generik

#### QA Tasks (QA)
- QA-09: Create test cases untuk forgot password
- QA-10: Test forgot password feature

### 6.6 User Story 6 - Reset Password (Execution)

#### Backend Tasks (BE)
- BE-27: Implementasi endpoint reset password
- BE-28: Implementasi validasi reset token
- BE-29: Implementasi update password baru
- BE-30: Implementasi delete reset token setelah digunakan
- BE-31: Implementasi validasi strength password baru

#### Frontend Tasks (FE)
- FE-23: Implementasi form reset password
- FE-24: Integrasi dengan API reset password
- FE-25: Implementasi validasi password confirmation
- FE-26: Implementasi redirect ke login setelah berhasil

#### QA Tasks (QA)
- QA-11: Create test cases untuk reset password
- QA-12: Test reset password feature

### 6.7 User Story 7 - Change Password (In-App)

#### Backend Tasks (BE)
- BE-32: Implementasi endpoint change password
- BE-33: Implementasi validasi current password
- BE-34: Implementasi update password baru
- BE-35: Implementasi logging aktivitas ganti password

#### Frontend Tasks (FE)
- FE-27: Implementasi form change password
- FE-28: Integrasi dengan API change password
- FE-29: Implementasi validasi current password
- FE-30: Implementasi notifikasi sukses/gagal

#### QA Tasks (QA)
- QA-13: Create test cases untuk change password
- QA-14: Test change password feature

### 6.8 User Story 8 - Update Profile

#### Backend Tasks (BE)
- BE-36: Implementasi endpoint update profile
- BE-37: Implementasi validasi data profil
- BE-38: Implementasi update field yang diizinkan
- BE-39: Implementasi validasi format nomor telepon

#### Frontend Tasks (FE)
- FE-31: Implementasi form update profil
- FE-32: Integrasi dengan API update profile
- FE-33: Implementasi validasi format nomor telepon
- FE-34: Implementasi notifikasi perubahan berhasil

#### QA Tasks (QA)
- QA-15: Create test cases untuk update profile
- QA-16: Test update profile feature

### 6.9 User Story 9 - Manajemen User

#### Backend Tasks (BE)
- BE-40: Implementasi API endpoints untuk user management
- BE-41: Implementasi validasi otorisasi moderator/admin untuk user management
- BE-42: Implementasi user CRUD operations (view, edit, activate, deactivate)
- BE-43: Implementasi bulk user operations
- BE-44: Implementasi logging aktivitas user management

#### Frontend Tasks (FE)
- FE-35: Implementasi halaman manajemen user untuk moderator
- FE-36: Implementasi form edit user
- FE-37: Implementasi tombol activate/deactivate user
- FE-38: Implementasi bulk operations (bulk activate/deactivate)

#### QA Tasks (QA)
- QA-17: Create test cases untuk manajemen user
- QA-18: Test manajemen user feature

### 6.10 User Story 10 - Manajemen Package Subscription

#### Backend Tasks (BE)
- BE-45: Implementasi API endpoints untuk package management
- BE-46: Implementasi validasi package configuration
- BE-47: Implementasi package CRUD operations (view, create, edit, delete)
- BE-48: Implementasi subscription management (assign, upgrade, downgrade, cancel)
- BE-49: Implementasi auto-assignment package saat registrasi
- BE-50: Implementasi subscription analytics dan tracking

#### Frontend Tasks (FE)
- FE-39: Implementasi halaman manajemen package untuk moderator
- FE-40: Implementasi form create/edit package
- FE-41: Implementasi form assign package ke user
- FE-42: Implementasi halaman manage subscription user
- FE-43: Implementasi dashboard subscription analytics

#### QA Tasks (QA)
- QA-19: Create test cases untuk manajemen package subscription
- QA-20: Test manajemen package subscription feature

## 7. Risiko, Asumsi, Pertanyaan Terbuka

### 7.1 Risiko

1. **Risko Keamanan**
   - Password storage yang tidak aman
   - JWT token yang bisa di-decode atau dimanipulasi
   - Brute force attack pada login
   - User enumeration pada forgot password

2. **Risko Teknis**
   - Token management complexity
   - Email delivery failure untuk password reset
   - Rate limiting configuration untuk preventing abuse

3. **Risko Bisnis**
   - User churn karena proses registrasi yang rumit
   - Downtime pada authentication service

4. **Risko Operasional**
   - Log management yang tidak memadai
   - Monitoring yang tidak komprehensif

### 7.2 Asumsi

1. **Asumsi Teknis**
   - Frontend menggunakan Local Storage untuk JWT tokens
   - Email service infrastructure sudah tersedia
   - Database memiliki kapasitas yang cukup

2. **Asumsi Bisnis**
   - User memiliki akses ke email untuk password reset
   - Subscription management system sudah ada
   - Default trial duration adalah 14 hari
   - User registration tidak memerlukan approval manual

3. **Asumsi Operasional**
   - Admin/ moderator available untuk user management
   - Monitoring tools sudah terintegrasi
   - Backup dan recovery process sudah ada

### 7.3 Pertanyaan Terbuka

1. **Pertanyaan Teknis**
   - Apakah kita perlu implementasi token blacklist untuk logout?
   - Bagaimana handling token refresh saat user aktif di multiple device?
   - Apakah perlu ada rate limiting untuk forgot password request?

2. **Pertanyaan Bisnis**
   - Apakah perlu ada email verification setelah registrasi?
   - Berapa lama expiry untuk reset password token?
   - Apakah perlu ada limit untuk concurrent login per user?

3. **Pertanyaan Operasional**
   - Bagaimana handling downtime pada authentication service?
   - Apakah perlu ada SLA untuk authentication uptime?

## 8. Monitoring Feature

### 8.1 Metrics yang Perlu Dimonitor

#### Authentication Metrics
1. **Login Success Rate**: Percentage of successful login attempts
2. **Registration Success Rate**: Percentage of successful registration attempts
3. **Password Reset Request Rate**: Number of password reset requests per hour
4. **Token Refresh Rate**: Number of token refresh requests per hour
5. **Failed Authentication Rate**: Percentage of failed authentication attempts

#### System Metrics
1. **Response Time**: API response time for authentication endpoints
2. **Error Rate**: Percentage of failed requests (4xx, 5xx)
3. **Concurrent Users**: Number of active user sessions
4. **Database Performance**: Query execution time for authentication operations

#### Security Metrics
1. **Brute Force Attempts**: Number of failed login attempts per IP
2. **Suspicious Activities**: Unusual patterns in authentication behavior
3. **Token Anomalies**: Invalid or expired token usage patterns

### 8.2 Alert Configuration

#### Critical Alerts
1. **Authentication Service Down**: All authentication endpoints returning 5xx
2. **High Error Rate**: Error rate > 5% for more than 5 minutes
3. **Database Connection Issues**: Failed database connections
4. **Security Breach**: Multiple failed login attempts from same IP

#### Warning Alerts
1. **High Response Time**: API response time > 2 seconds for more than 5 minutes
2. **Failed Password Reset**: Password reset email delivery failures > 10%
3. **Token Refresh Failures**: Token refresh failure rate > 3%

### 8.3 Dashboard Components

1. **Authentication Overview**
   - Login success/failure chart
   - Registration funnel
   - Active user sessions
   - Geographic distribution

2. **System Health**
   - API response times
   - Error rates
   - Database performance

3. **Security Monitoring**
   - Failed login attempts by IP
   - Geolocation anomalies
   - Token usage patterns
   - Password reset requests

### 8.4 Logging Requirements

#### Event Types to Log
1. **Authentication Events**
   - User registration
   - Successful login
   - Failed login
   - Logout
   - Password change
   - Profile update

2. **Security Events**
   - Brute force attempts
   - Token manipulation
   - Access from suspicious IPs
   - Multiple failed password resets

3. **System Events**
   - Capacity threshold breaches
   - API errors
   - Database connection issues

#### Log Format
```json
{
  "timestamp": "2023-01-20T12:00:00Z",
  "event_type": "auth.login.success",
  "user_id": "12345",
  "ip_address": "192.168.1.1",
  "user_agent": "Mozilla/5.0...",
  "additional_data": {
    "response_time_ms": 150
  }
}
```

### 8.5 Monitoring Tools Integration

#### Application Performance Monitoring (APM)
- New Relic or DataDog for application performance
- Custom metrics for authentication-specific events
- Distributed tracing for authentication flows

#### Log Aggregation
- ELK Stack (Elasticsearch, Logstash, Kibana) or Splunk
- Centralized logging for all authentication events
- Custom dashboards for security monitoring

#### Alerting Systems
- PagerDuty for critical alerts
- Slack integration for team notifications
- Email alerts for non-critical issues

### 8.6 Retention and Compliance

1. **Log Retention**
   - Authentication logs: 1 year
   - Security logs: 2 years
   - System logs: 6 months

2. **Data Privacy**
   - Ensure PII is properly masked in logs
   - Implement log access controls
   - Regular audit of log access

3. **Compliance**
   - GDPR compliance for EU users
   - Data localization requirements
   - Audit trail capabilities
