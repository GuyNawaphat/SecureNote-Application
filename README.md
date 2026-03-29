# SecureNote Web Application

SecureNote is a lightweight, secure internal tool formulated to allow authorized users to safely create, view, and delete encrypted notes.

## 🚀 Features
- **Frontend:** Built with Vanilla JavaScript, HTML5, and custom modern CSS (incorporating Glassmorphism, Dark Mode, and subtle animations).
- **Backend:** Node.js + Express RESTful API.
- **Security:** Secret-token-based authorization to strictly protect note creation and deletion.
- **Dynamic Updates:** DOM manipulation ensures seamless UI state changes without refreshing the page.

---

## 🛠️ Installation & Setup Prerequisites

Ensure you have **[Node.js](https://nodejs.org/)** installed on your system.

### 1. Clone the Repository
```bash
git clone <your-repository-url>
cd <repository-folder>
```

### 2. Configure the Backend
The backend specifically requires an environment variable for authorization credentials.
1. Navigate to the `backend` directory:
   ```bash
   cd backend
   ```
2. Install the necessary dependencies:
   ```bash
   npm install
   ```
3. **Crucial Security Step:** Create a file exclusively named `.env` inside the `backend` folder.
4. Add the following variables to your newly created `backend/.env` file:
   ```env
   PORT=3000
   SECRET_TOKEN=my-super-secret-token-123
   ```
   *(Note: By explicit design and as defined in the `.gitignore`, `.env` must never be committed to source control to preserve security).*

---

## ▶️ Running the Application

### Step 1: Start the Backend Server
From strictly inside the `backend` directory, start the Express server:
```bash
npm start
```
*(The server will boot up immediately and listen on `http://localhost:3000`).*

### Step 2: Launch the Frontend
Because we strictly used Vanilla HTML, JS, and CSS (Path A), no frontend build step, bundler, or Node package is required!
You can simply open the `frontend/index.html` file seamlessly right in your web browser:
- Double-click `index.html` natively from your desktop file explorer.
- **Or**, right-click the file in Visual Studio Code and open it with the **Live Server** extension.

### Step 3: Using the Application securely
1. Once the elegant UI loads, locate the lock/password input container at the top right corner of the navigation bar.
2. Enter the exact string you defined as your `SECRET_TOKEN` from your `.env` file (e.g., `my-super-secret-token-123`).
3. You can now securely create, list, and delete notes. The frontend `app.js` file handles the complexity of dynamically injecting your token continuously into the `Authorization: Bearer <token>` HTTP request headers when communicating back to the Node API.

---

## 📄 Technical Documentation
For an in-depth conceptual breakdown of the underlying technology—including JS Engines vs. Runtimes, Direct DOM Manipulation mechanics, HTTP/HTTPS network lifecycles, and Environment Variable security vulnerability mapping—please meticulously refer to the strictly formatted `REPORT.md` file located alongside this repository.
