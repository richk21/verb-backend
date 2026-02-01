# Verb — Modern Blogging Web App - Web Service

**Verb** is a full-stack blogging platform where users can log in, write blogs in markdown, insert media in the blogs, save drafts, and publish posts with cover images and hashtags.

It’s built to feel like a minimal, distraction-free writing space with a clean reading experience.

---

## Features

* 🔐 User authentication
* ✍️ Create, edit, and delete blogs
* 💾 Save blogs as drafts
* 🌍 Publish blogs for others to read
* 🖼️ Cover image selection (Unsplash integration)
* 🏷️ Hashtag support
* 👤 Author profiles with avatar
* 👀 Blog preview before publishing
* 📱 Responsive UI

---

## 🧠 Tech Stack - Backend

### Backend

* **Node.js**
* **Express**
* **MongoDB**
* **JWT Authentication**
* **Swagger API Docs**

---

## ⚙️ Installation

### 1️⃣ Clone the repo

```bash
git clone https://github.com/richk21/verb-backend
cd verb-backend
```

---

### 3️⃣ Backend Setup

navigate to backend repository: https://github.com/richk21/verb-backend repository

Runs on: **[http://localhost:5000](http://localhost:5000)**

---

## 🔑 Environment Variables

### Backend `.env`

```
PORT = 5000
MONGO_URI = your_uri
FRONTEND_URL = http://localhost:3000
JWT_SECRET = your_jwt_token
CLOUDINARY_CLOUD_NAME = your_cloud_name
CLOUDINARY_API_KEY = your_cloud_api_key
CLOUDINARY_API_SECRET = your_api_secret
```

---

## 🧩 How It Works

1. Users log in
2. They can write blogs using markdown
3. Images can be pasted directly into the editor
4. Blogs can be saved as drafts or published
5. Published blogs are available for reading

---

## 🎯 Upcoming Features

* Comments system
* Likes / claps
* Rich text editor
* Blog search & filters
* Single Sign On Integrations
Stay tuned!

---

## 🤝 Contributing

Pull requests are welcome!
If you’d like to improve Verb, feel free to fork and submit changes.

---
