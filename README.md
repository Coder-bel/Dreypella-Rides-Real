# 🚗 Dreypella Rides

A modern transportation and logistics platform that allows users to book rides for travel and send packages with ease. Built with TypeScript and Supabase, Dreypella Rides delivers a fast, reliable, and scalable experience for the general public.

---

## ✨ Features

- 🚕 **Ride Booking** — Book rides for travel quickly and conveniently
- 📦 **Package Delivery** — Send and track packages with ease
- 🔐 **Secure Authentication** — Powered by Supabase Auth
- ⚡ **Real-time Updates** — Live ride and delivery status tracking
- 📱 **Responsive Design** — Works seamlessly on all devices

---

## 🛠️ Tech Stack

| Technology | Purpose |
|------------|---------|
| TypeScript | Primary programming language |
| Supabase | Backend, database & authentication |

---

## 🚀 Getting Started

### Prerequisites

Make sure you have the following installed:

- [Node.js](https://nodejs.org/) (v18 or higher)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
- A [Supabase](https://supabase.com/) account

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Coder-bel/Dreypella-Rides-Real.git
   cd Dreypella-Rides-Real
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**

   Create a `.env` file in the root directory and add the following:
   ```env
   SUPABASE_URL=your_supabase_project_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   ```
   > ⚠️ Never commit your `.env` file. It is already included in `.gitignore`.

4. **Run the development server:**
   ```bash
   npm run dev
   ```

---

## 📁 Project Structure

```
Dreypella-Rides-Real/
├── src/
│   ├── components/     # Reusable UI components
│   ├── pages/          # Application pages
│   ├── lib/            # Supabase client & utilities
│   └── types/          # TypeScript type definitions
├── public/             # Static assets
├── .env                # Environment variables (not committed)
├── .gitignore
└── README.md
```

---

## 🔑 Environment Variables

| Variable | Description |
|----------|-------------|
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_ANON_KEY` | Your Supabase anonymous/public key |

---

## 🤝 Contributing

Contributions are welcome! Here's how to get started:

1. Fork the repository
2. Create a new branch: `git checkout -b feature/your-feature-name`
3. Make your changes and commit: `git commit -m "add your feature"`
4. Push to your branch: `git push origin feature/your-feature-name`
5. Open a Pull Request

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

---

## 📬 Contact

Made with ❤️ by [Coder-bel](https://github.com/Coder-bel)
