# CertFlow 🏢
**Enterprise Project & Certificate Governance Portal**

CertFlow is a high-integrity, full-stack ecosystem designed to manage the lifecycle of corporate project submissions and employee certifications. This system replaces legacy manual tracking with an automated, role-based workflow, ensuring organizational compliance and data accessibility.


## 🔗 Live Environment
- **Frontend SPA:** [https://tcil-frontend.onrender.com](https://tcil-frontend.onrender.com)
- **Backend API:** [https://tcil-backend.onrender.com](https://tcil-backend.onrender.com)
- **Note:** Backend services on Render's Free Tier may require a ~50s "warm-up" period on the first request.

---

## 🏗 System Architecture & Design Patterns
CertFlow is built on the principle of **Separation of Concerns**:

* **Frontend:** React.js Single Page Application (SPA) utilizing Context API for state management and Axios for asynchronous API communication.
* **Backend:** Flask RESTful API. Employs a Stateless Architecture with JWT (JSON Web Tokens) for secure, scalable authentication.
* **Database:** PostgreSQL hosted via Supabase. Utilizes a **Self-Referencing Foreign Key** pattern to create a dynamic Manager-Employee hierarchy.

---

## 👥 Role-Based Access Control (RBAC)
CertFlow ensures data privacy and organizational structure through strict access levels:

1. **Employee:**
    * Upload project metadata and PDF certificates.
    * Track real-time status (**Pending** ➔ **Approved** / **Rejected**).
    * Edit and re-submit based on Manager feedback.
2. **Manager:**
    * Access to a localized "Team Dashboard."
    * Review, validate, and approve/reject submissions for direct reports only.
    * Automated email dispatch upon status change via SendGrid.
3. **Admin:**
    * Global visibility of all organization-wide certifications.
    * Complete user management and technical configuration rights.

---

## 🛠 Tech Stack
| Component | Technology |
| :--- | :--- |
| **Language** | Python 3.10, JavaScript (ES6+) |
| **Frontend** | React.js, Tailwind CSS / Bootstrap 5 |
| **Backend** | Flask, SQLAlchemy, Gunicorn |
| **Auth** | Flask-JWT-Extended (Stateless) |
| **Database** | PostgreSQL 16 (Supabase) |
| **Email** | SendGrid API (Port 443) |
| **Deployment** | Render (CI/CD Pipeline) |

---

## 🔍 Engineering Challenges Solved
* **Dynamic Hierarchy:** Designed a recursive self-join relationship to manage manager-employee nesting levels.
* **CORS Management:** Configured strict Cross-Origin Resource Sharing policies to allow credentialed requests.
* **File Security:** Mitigated path traversal attacks by using `werkzeug.secure_filename` and unique UUID-prefixed file naming.
* **Asynchronous Notifications:** Leveraged Python threading to send SendGrid notifications without blocking the main API response cycle.

---

## 📊 Future Roadmap
- [ ] **Cloud Storage:** Migration from local server storage to AWS S3/Azure Blob for persistent file storage.
- [ ] **Data Visualization:** Integration of Chart.js to track technology trends and certification expiry alerts.
- [ ] **Audit Logs:** Full traceability for every approval and rejection action.

---

## 👤 Author
**Ishpreet Kaur** *B.Tech in Computer Science & Engineering* *Specializing in Full-Stack Development & Enterprise Systems*