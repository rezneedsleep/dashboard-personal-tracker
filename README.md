# 🌌 Personal Tracker Dashboard

A sleek, minimalist, and premium personal dashboard for tracking expenses, daily habits, and health weight metrics in one place. Designed with a high-contrast monochrome grayscale color palette, smooth spring animations, and an ultra-responsive UI optimized for both desktop and mobile viewports.

---

## 🌟 Key Features

### 💳 1. Financial & Expense Tracker
- **Income & Expense Logging**: Track your inflows and outflows with source/note categorization and date inputs.
- **Dynamic Balance Calculator**: Real-time remaining balance calculations (`Total Income - Total Expenses`).
- **Category Budget Alarms**: Set Rp budgets per category (Food, Shopping, Transport, etc.). Displays warning labels when reaching 80% and flashes red indicators when exceeded.
- **Monthly Archival Filter**: Easily navigate and view historical financial records for past months.
- **Export to CSV**: Download complete monthly financial summaries and transaction logs with a single click.

### 🔥 2. Habit Tracker & Streak System
- **Streak Gamification**: Dynamic consecutive streak calculations displaying a flame (`🔥 X days streak`) to keep you motivated.
- **Flexible Scheduling**: Customize habit frequencies (e.g., Everyday, Weekdays only, or 3x a Week). rest days automatically adjust your status.
- **Weekly Average Gauge**: A beautiful 7-day timeline visualization displaying your average completion rate.

### ⚖️ 3. Weight & BMI Monitor
- **Interactive Trend Charts**: Visual line charts representing your weight progress over time.
- **Automatic BMI Classification**: Input your height once in Settings to instantly get your BMI status (`Underweight`, `Normal`, `Overweight`, `Obese`) with color-coded warning badges.
- **Customizable Insights & Tips**: Manage and display personal health recommendations or customizable insights.

### 📱 4. Responsive Mobile Overhaul
- **Breakpoint Stacking**: Clean vertical card stacking for all mobile viewports and portrait tablets (under `1024px`) to prevent squeezing.
- **Auto-Wrapping Forms**: Dynamic wrapping inputs that adapt smoothly to any card size, preventing text clipping.

---

## 🛠️ Tech Stack

- **Frontend Framework**: React 19 + Vite 8
- **Database / Backend**: Supabase (PostgreSQL client integration)
- **Styling**: Vanilla CSS3 (Sleek Monochrome Edition)
- **Data Visualizations**: ChartJS + React-Chartjs-2
- **Utility Libraries**: Day.js (Date formatting & weekly periods)

---

## 🚀 Getting Started

### 1. Prerequisites
Ensure you have [Node.js](https://nodejs.org/) installed on your machine.

### 2. Environment Configuration
Clone the repository and create a `.env` file in the root directory. You can copy the template from `.env.example`:
```bash
cp .env.example .env
```
Fill in your Supabase connection parameters:
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_KEY=your_supabase_anon_key
```

### 3. Installation
Install the project dependencies:
```bash
npm install
```

### 4. Run Locally
Launch the development server:
```bash
npm run dev
```
Open your browser and navigate to `http://localhost:5173`.

### 5. Build for Production
To compile and optimize the production bundle:
```bash
npm run build
```

---

## 🔒 Security
All database credentials and keys are secured inside environment variables (`.env`) which are automatically ignored by Git configurations (`.gitignore`) to prevent accidental leaks.
