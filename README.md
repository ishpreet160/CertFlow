# Project Portal – Full Stack Application

A production-grade full-stack web application built to manage employee project submissions, certificate uploads, and managerial approvals with secure authentication and automated email workflows.

This project simulates a real-world internal corporate system, focusing on backend robustness, clean separation of concerns, and role-based workflows.

---
## 🔗 Live Demo

* **Frontend Application:** [View Live Site](https://tcil-frontend.onrender.com)
* **Backend API:** [API Endpoint](https://tcil-backend.onrender.com)
Note: The backend is hosted on a free tier; please allow up to 60 seconds for the server to "wake up" on the first request.

## 🚀 Features

### 🔐 Authentication & Security
* **JWT-based authentication**
* **Secure login and logout**
* **Forgot password and reset password via email**
* **Protected API routes**

### 👥 Role-Based Access Control
#### **Employee**
* Upload projects and certificates
* Edit and re-submit rejected projects
* Track approval status

#### **Manager**/**Admin**
* Review submitted projects
* Approve or reject with remarks
* Trigger automated email notifications

---

## 📁 Project & Certificate Management
* **Project file uploads with metadata**
* **TCIL certificate uploads and management**
* **Detailed certificate information view**
* **Project lifecycle tracking:** Pending / Approved / Rejected

---

## 📊 Dashboard Capabilities
* **Search projects by name or keyword**
* **Filter projects by status**
* **Sort by date or status**
* **Export data to Excel:**
  * Filtered project data
  * Complete project dataset

---

## 📧 Email Automation
* **Password reset emails**
* **Project approval and rejection notifications**
* **Email by SendGrid API (Port 443)**

---

## 🛠️ Tech Stack

### **Frontend**
* **Library:** React.js
* **Styling:** Bootstrap 5
* **Deployment:** Render (Static Site)

### **Backend**
* **Framework:** Flask (Python)
* **Auth:** Flask-JWT-Extended
* **Deployment:** Render (Web Service)

### **Database**
* **Engine:** PostgreSQL 16
* **Hosting:** Supabase

---

## 🔄 Application Workflow
1. **User logs in** using JWT authentication
2. **Employee uploads** project or certificate
3. **Manager reviews** submission
4. **Manager approves or rejects** the submission
5. **Automated email notification** is sent
6. **Employee views** updated project status

---

## 🔍 Engineering Challenges Addressed
* **Secure JWT-based authentication**
* **Role-based authorization logic**
* **CORS handling with credentialed requests**
* **Email-driven workflows**
* **File uploads and structured storage**
* **Dynamic Excel export based on filters**

---

## 📈 Future Enhancements
* **Pagination and performance optimization**
* **Asynchronous background jobs**
* **Audit logs and activity tracking**
* **Admin-level access control**
* **Cloud-based file storage**

---

## 🎯 Project Objective
The goal of this project was to:
* **Build a realistic full-stack system**
* **Apply secure authentication** and authorization patterns
* **Design scalable backend architecture**
* **Implement real-world approval workflows**

---

## 👤 Author
**Ishpreet Kaur** *B.Tech Computer Science & Engineering*