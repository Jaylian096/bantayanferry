# ⛴️ Bantayan Ferry App

A full-stack mobile ferry booking system built with **Apache Cordova**, **Node.js + Express**, and **MySQL**.

---

## 📁 Project Structure

```
bantayan-ferry/
├── backend/                  ← Node.js + Express REST API
│   ├── config/
│   │   ├── db.js             ← MySQL connection pool
│   │   └── database.sql      ← Full schema + seed data
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── bookingController.js
│   │   ├── scheduleController.js
│   │   └── adminController.js
│   ├── middleware/
│   │   └── auth.js           ← JWT verification
│   ├── routes/
│   │   ├── auth.js
│   │   ├── bookings.js
│   │   ├── schedules.js
│   │   └── admin.js
│   ├── .env.example
│   ├── package.json
│   └── server.js
├── frontend/                 ← Cordova HTML/CSS/JS app
│   ├── css/
│   │   ├── style.css         ← Main styles (ocean theme)
│   │   └── admin.css
│   ├── js/
│   │   ├── api.js            ← API helper
│   │   ├── app.js            ← User app logic
│   │   └── admin.js          ← Admin panel logic
│   ├── index.html            ← User app
│   └── admin.html            ← Admin panel
├── config.xml                ← Cordova configuration
└── README.md
```

---

## 🛠️ SETUP INSTRUCTIONS

### STEP 1: Install Node.js & MySQL

#### Windows
1. Download **Node.js** (v18+) from https://nodejs.org
2. Download **XAMPP** (includes MySQL) from https://apachefriends.org
3. Start XAMPP → Start **Apache** and **MySQL**

#### macOS
```bash
brew install node mysql
brew services start mysql
```

#### Ubuntu/Debian
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs mysql-server
sudo service mysql start
```

---

### STEP 2: Set Up the Database

1. Open your MySQL client (phpMyAdmin via XAMPP, or MySQL Workbench)
2. Import the schema file:

```bash
mysql -u root -p < backend/config/database.sql
```

Or open `backend/config/database.sql` in phpMyAdmin and click **Import**.

This creates all tables and inserts sample data including:
- 3 shipping lines (Island Shipping, Super Shuttle Ferry, Aznar Shipping)
- 2 routes (Hagnaya ↔ Santa Fe)
- 6 ships, 9 schedules, full fare matrix, cargo rates
- Default superadmin account

---

### STEP 3: Configure the Backend

```bash
cd backend
cp .env.example .env
```

Edit `.env`:
```env
PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=yourpassword
DB_NAME=bantayan_ferry
JWT_SECRET=bantayan_super_secret_2024
JWT_EXPIRES_IN=7d
```

---

### STEP 4: Start the Backend

```bash
cd backend
npm install
npm run dev       # Development (auto-restart)
# or
npm start         # Production
```

You should see:
```
🚢 Bantayan Ferry API running on port 3000
```

Test the API: http://localhost:3000/api/health

---

### STEP 5: Configure Frontend API URL

Open `frontend/js/api.js` and update the base URL:

```javascript
const API_BASE = 'http://YOUR_LOCAL_IP:3000/api';
// Example: 'http://192.168.1.100:3000/api'
```

> 💡 Find your local IP:
> - Windows: `ipconfig` → IPv4 Address
> - Mac/Linux: `ifconfig` or `ip addr`

---

### STEP 6: Test in Browser First

Open `frontend/index.html` in your browser to test the user app.
Open `frontend/admin.html` for the admin panel.

---

### STEP 7: Build Cordova APK

#### Install Cordova
```bash
npm install -g cordova
```

#### Set up Cordova project
```bash
cordova create bantayan-apk com.bantayanferry.app "Bantayan Ferry"
cd bantayan-apk

# Copy frontend files into www/
cp -r ../frontend/* www/

# Add Android platform
cordova platform add android

# Install plugins
cordova plugin add cordova-plugin-whitelist
cordova plugin add cordova-plugin-network-information
cordova plugin add cordova-plugin-device
cordova plugin add phonegap-plugin-barcodescanner

# Build debug APK
cordova build android
```

APK will be at: `platforms/android/app/build/outputs/apk/debug/app-debug.apk`

#### Install on Android device
```bash
cordova run android
# or manually transfer APK via USB
```

---

## 🔑 Default Admin Credentials

| Field    | Value                          |
|----------|-------------------------------|
| Email    | admin@bantayanferry.com        |
| Password | admin123                       |
| Role     | superadmin                     |

> ⚠️ Change these immediately in production!

---

## 📱 User App Features

| Feature | Description |
|---------|-------------|
| 🔐 Register/Login | JWT-authenticated user accounts |
| 🗓️ View Schedules | Filter by shipping line |
| 🎫 Book Ticket | Select schedule, passenger type, get auto-fare |
| 📱 QR Code | Auto-generated per booking |
| 📋 My Bookings | View all reservations with status |
| 💵 Payment | Cash on Port |

## 🛠️ Admin Panel Features

| Feature | Description |
|---------|-------------|
| 📊 Dashboard | Stats overview |
| 📋 Bookings | View/filter/verify/cancel all bookings |
| 📷 QR Verify | Verify booking by code |
| 👥 Users | Full user management |
| 🕒 Schedules | CRUD for all schedules |
| 🚢 Ships | Assign ships to shipping lines |
| 🗺️ Routes | Manage Hagnaya ↔ Santa Fe routes |
| 💰 Fares | Per-line, per-type fare matrix |
| 📦 Cargo | Motorcycle/car/truck rates per line |
| 🏢 Shipping Lines | Manage companies |
| 👨‍💼 Admins | Create/manage admin accounts |

---

## 🎨 Fare Structure (Default)

| Passenger Type | Island Shipping | Super Shuttle | Aznar Shipping |
|----------------|----------------|---------------|----------------|
| Regular        | ₱185.00        | ₱200.00       | ₱175.00        |
| Student        | ₱140.00        | ₱155.00       | ₱135.00        |
| Senior Citizen | ₱130.00        | ₱145.00       | ₱125.00        |
| PWD            | ₱130.00        | ₱145.00       | ₱125.00        |
| Child          | ₱95.00         | ₱105.00       | ₱90.00         |

---

## 🔌 API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /api/auth/register | None | Register user |
| POST | /api/auth/login | None | User login |
| POST | /api/auth/admin/login | None | Admin login |
| GET | /api/schedules | None | All schedules |
| POST | /api/bookings | User | Create booking |
| GET | /api/bookings/my | User | My bookings |
| GET | /api/bookings | Admin | All bookings |
| POST | /api/bookings/verify | Admin | Verify QR |
| GET | /api/admin/dashboard | Admin | Stats |
| CRUD | /api/admin/ships | Admin | Ships CRUD |
| CRUD | /api/admin/routes | Admin | Routes CRUD |
| CRUD | /api/admin/fares | Admin | Fares CRUD |
| CRUD | /api/admin/cargo-rates | Admin | Cargo CRUD |

---

## 🐛 Troubleshooting

**"Cannot connect to database"**
- Ensure MySQL is running (check XAMPP control panel)
- Verify `.env` credentials match your MySQL setup

**"API not reachable from phone"**
- Use your PC's local IP (not localhost) in `api.js`
- Ensure phone and PC are on the same WiFi network
- Check Windows Firewall allows port 3000

**Cordova build fails**
- Install Android Studio + Android SDK
- Set `ANDROID_HOME` environment variable
- Run `cordova requirements android` to check prerequisites
