# 💸 SplitMate

A modern, full-stack expense-splitting application built with Next.js 15, MongoDB, and TypeScript. Split bills effortlessly with friends, roommates, or travel companions.

![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![MongoDB](https://img.shields.io/badge/MongoDB-8-green?logo=mongodb)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38B2AC?logo=tailwind-css)

## ✨ Features

### 💰 Expense Management
- **Multiple Split Types**: Equal, exact amounts, or percentage-based splits
- **Categories**: Organize expenses by food, transport, housing, entertainment, and more
- **Real-time Balances**: Automatically calculate who owes whom
- **Settlement Tracking**: Mark debts as settled with celebratory confetti! 🎉

### 👥 Group Management
- **Create Groups**: Start a group for trips, roommates, events, etc.
- **Unique Join Codes**: 6-character codes for easy group sharing
- **Admin Approval**: Group admins can approve or reject join requests
- **Member Management**: See all group members and their balances

### 📊 Analytics & Insights
- **Monthly Spending Charts**: Visualize your spending trends over time
- **Expense History**: Complete transaction history with filters
- **Export Options**: Download reports as CSV or PDF

### 🎨 Modern UI/UX
- **Dark Mode**: Beautiful dark theme with light mode option
- **Smooth Animations**: Powered by Framer Motion
- **Responsive Design**: Works seamlessly on desktop and mobile
- **Command Palette**: Quick search with `Ctrl+K` / `Cmd+K`

### 🔐 Security
- **JWT Authentication**: Secure token-based auth
- **Password Hashing**: bcrypt encryption for passwords
- **Password Reset**: Email-based password recovery

## 🛠️ Tech Stack

| Category | Technology |
|----------|------------|
| **Framework** | Next.js 15 (App Router) |
| **Language** | TypeScript |
| **Database** | MongoDB with Mongoose |
| **Styling** | Tailwind CSS 4 |
| **Animations** | Framer Motion |
| **Charts** | Recharts |
| **Authentication** | JWT (jose) |
| **Email** | Nodemailer |
| **Icons** | Lucide React |
| **PDF Export** | jsPDF + jspdf-autotable |

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- MongoDB database (local or Atlas)
- Gmail account for email features (optional)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/siddhardh4356/splitmate.git
   cd splitmate
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env.local` file in the root directory:
   ```env
   # MongoDB
   MONGODB_URI=mongodb+srv://your-connection-string
   
   # JWT Secret (generate a random string)
   JWT_SECRET=your-super-secret-jwt-key
   
   # Email (for password reset)
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-app-password
   
   # App URL
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open the app**
   
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
src/
├── app/
│   ├── api/           # API routes
│   │   ├── auth/      # Authentication endpoints
│   │   ├── groups/    # Group management
│   │   ├── settlements/ # Debt settlement
│   │   └── users/     # User data & stats
│   ├── dashboard/     # Main dashboard page
│   ├── login/         # Login page
│   ├── signup/        # Registration page
│   └── reset-password/ # Password reset
├── components/        # Reusable components
├── lib/              # Utilities (DB, email, auth)
└── models/           # Mongoose models
```

## 📱 Screenshots

### Dashboard
- Overview cards showing balances
- Monthly spending chart
- Quick access to groups

### Groups
- Create and join groups
- Add expenses with split options
- View balances and settle up

### Settings
- Theme toggle (dark/light)
- Avatar customization
- Account management

## 🔧 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |

## 🌐 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import project in [Vercel](https://vercel.com)
3. Add environment variables
4. Deploy!

### Other Platforms

The app can be deployed on any platform supporting Next.js:
- Railway
- Render
- DigitalOcean App Platform
- AWS Amplify

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 👨‍💻 Author

Built with ❤️ by Siddhardh Reddy

---

⭐ Star this repo if you found it helpful!
