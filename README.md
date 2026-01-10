# MediMart

MediMart Frontend is a modern React + Vite web application for managing and browsing medicines, placing orders, and handling customer/admin workflows. It connects seamlessly to the Spring Boot backend and provides a clean, responsive, and intuitive user interface.

---

## 🌐 Live Demo

🚀 [MediMart Web App (Live)](https://medimart-frontend-eight.vercel.app)

---

## ⚙️ Project Structure

Your frontend project is organized as follows:

```plaintext
medimart-frontend/
├── public/               # Public assets (images, favicon, etc.)
│   └── vite.svg
├── src/
│   ├── assets/           # Static assets like images and icons
│   ├── components/       # Reusable UI components (buttons, modals, cards…)
│   ├── pages/            # Page components (Login, Signup, Dashboard, Cart…)
│   ├── routes/           # App routing configuration
│   ├── services/         # API calls and backend integration (Axios)
│   ├── styles/           # CSS styles
│   ├── utils/            # Helper functions
│   ├── App.jsx           # Main React component
│   ├── main.jsx          # App entry point
│   ├── index.css         # Global styles
│   └── App.css           # Component-specific styles
├── node_modules/         # Installed npm dependencies
├── package.json          # Project metadata and dependencies
├── package-lock.json     # Exact package versions
├── vite.config.js        # Vite configuration
└── vercel.json           # Deployment configuration for Vercel
```

---

## 🛠️ Tools & Technologies Used

| **Category**        | **Tools / Libraries**                            |
|---------------------|-------------------------------------------------|
| **Language**         | JavaScript (ES6+)                               |
| **Framework**        | React, Vite                                     |
| **UI / Styling**     | CSS, React Icons                                |
| **Charts / Graphs**  | Recharts                                        |
| **API Handling**     | Axios                                           |
| **Deployment**       | Vercel                                          |

---

## 🚀 Features

### Customer Module

- Browse & search medicines
- Add items to cart
- Place orders with payment interface
- View order history
- Update profile

### Admin Module

- Manage medicines (add/edit/delete)
- Update stock & expiry dates
- View all customer orders
- Dashboard analytics

### Common Features

- Responsive UI
- User authentication & session management
- PDF/CSV invoice generation (via backend)

---

## 📥 Installation

### Prerequisites

- Backend **Spring Boot API** running locally or remotely

### Install Dependencies
```bash
npm install
```

### Run Development Server
```bash
npm run dev
```

The app will be served at [http://localhost:5173](http://localhost:5173) (Vite default port)
