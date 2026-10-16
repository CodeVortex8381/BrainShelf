# BrainShelf — Student Notes Sharing Platform
> **Tagline:** Learn together. Grow together.

BrainShelf is a responsive web platform where students discover, upload, organize, share, and download academic notes. Student PDF uploads stay pending until an administrator reviews them. Only approved notes are public.

---

## 🛠️ Tech Stack

- **Frontend:** Plain HTML5, CSS3 (Vanilla), Vanilla JavaScript (No React, Vue, Angular, or TypeScript).
- **Backend:** Node.js, Express.js.
- **Database:** MongoDB Atlas with Mongoose.
- **File Storage:** Cloudinary (with local fallback adapter for offline testing).
- **Authentication:** JWT in HttpOnly cookies, password hashing with `bcryptjs`.
- **Uploads:** Multer with server-side PDF validation (extension, MIME, magic numbers, size).
- **Security:** Helmet headers, CORS configuration, rate limiting, and centralized error handling.

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js LTS (v18+ or v20+ or v24+)
- npm

### 2. Local Installation
All packages are installed locally in the project:
```bash
npm install
```

### 3. Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Configure your variables in `.env`:
```env
PORT=3000
NODE_ENV=development
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/brainshelf?retryWrites=true&w=majority
JWT_SECRET=super_secret_jwt_key_at_least_32_characters_long
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
CLIENT_ORIGIN=http://localhost:3000
MAX_PDF_SIZE_MB=10
```

> **Note on Missing Credentials:** If MongoDB or Cloudinary credentials are not provided during local testing, the application gracefully reports status without crashing and uses local storage fallback for PDFs.

### 4. Running the Application
Development server (auto-reloads on file changes):
```bash
npm run dev
```

Production server:
```bash
npm start
```
Visit the application at: `http://localhost:3000`

---

## 🧪 Testing

BrainShelf includes automated unit and integration tests using Node.js's built-in test runner (`node:test` and `node:assert`) and Supertest:
```bash
npm test
```

---

## 🔑 Admin Bootstrap

To bootstrap the initial administrator account securely without public registration:
```bash
npm run create-admin
```
or
```bash
node src/scripts/bootstrapAdmin.js
```
Follow the prompts or set `ADMIN_EMAIL` and `ADMIN_PASSWORD` in `.env`.

---

## 📂 Project Structure

```
BrainShelf/
├── public/                 # Static web assets
│   ├── css/style.css       # Preserved design system & responsive styling
│   ├── js/                 # Client scripts (app.js, auth.js, etc.)
│   ├── index.html          # Public catalogue & search
│   ├── login.html          # Login page
│   ├── register.html       # Student registration
│   ├── upload.html         # Student PDF upload
│   ├── my-uploads.html     # Student uploads & moderation status
│   └── admin.html          # Administrator moderation dashboard
├── src/
│   ├── config/             # DB & Cloudinary configuration
│   ├── controllers/        # Request handlers (auth, notes, admin)
│   ├── middleware/         # Auth, upload, validation, error handler
│   ├── models/             # Mongoose schemas (User, Note)
│   ├── routes/             # Express route definitions
│   ├── scripts/            # Admin bootstrap & migration utilities
│   └── utils/              # Helpers (JWT, PDF validator)
├── tests/                  # Unit and integration test suite
├── .env.example            # Template for environment variables
├── .gitignore              # Ignored files (secrets, uploads, dependencies)
├── package.json
└── server.js               # Application entry point
```

---

## 📄 License
ISC License · © 2026 BrainShelf
