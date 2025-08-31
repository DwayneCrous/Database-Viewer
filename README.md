# 💾 Dwayne's Database Viewer

This project is a full-stack SQLite database viewer and manager. It features a Node.js backend with REST API endpoints and a React frontend for browsing, editing, and managing database tables and files through a user-friendly web interface.

## 🗂️ Project Structure

- `server.js` / `sqlite-demo.js`: 🖥️ Node.js backend server files
- `demo.db`: 🗄️ SQLite database file
- `client/`: ⚛️ React frontend application
- `uploads/`: 📁 Directory for uploaded files
- `public/`: 🌐 Static files for the backend

## 🚀 Getting Started

### 🛠️ Prerequisites
- Node.js (v14 or higher recommended)
- npm (Node Package Manager)

### 🔌 Backend Setup
1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the backend server:
   ```bash
   node server.js
   ```
   or
   ```bash
   node sqlite-demo.js
   ```

### 💻 Frontend Setup
1. Navigate to the `client` directory:
   ```bash
   cd client
   ```
2. Install frontend dependencies:
   ```bash
   npm install
   ```
3. Start the React development server:
   ```bash
   npm start
   ```

The React app will typically run on [http://localhost:3000](http://localhost:3000) and the backend on [http://localhost:5000](http://localhost:5000) (or as configured).

## ✨ Features
- 🗄️ Node.js backend with SQLite database
- 🔗 REST API endpoints for database operations
- ⚛️ React frontend for interacting with the backend
- 📤 File upload support (see `uploads/` directory)
- ➕ Add new table entries
- ➖ Delete table entries
- 🆕 Create new tables
- 🗑️ Delete tables
- ⬇️ Download your updated database

## 📄 License
MIT License
