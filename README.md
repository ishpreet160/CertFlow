# CertFlow 
**Enterprise Project & Certificate Governance Portal**

CertFlow is a high-integrity, full-stack ecosystem designed to manage the lifecycle of corporate project submissions and employee certifications. This system replaces legacy manual tracking with an automated, role-based workflow, ensuring organizational compliance and data accessibility.

## 🔗 Live Environment
- **Frontend SPA:** [https://tcil-frontend.onrender.com](https://tcil-frontend.onrender.com)
- **Backend API:** [https://tcil-backend.onrender.com](https://tcil-backend.onrender.com)
- **Note:** Backend services on Render's Free Tier may require a ~50s "warm-up" period on the first request.

---

## 🏗 System Architecture & Design Patterns
CertFlow is built on the principle of **Separation of Concerns**:

* **Frontend:** React.js Single Page Application (SPA) utilizing Axios for asynchronous API communication and `localStorage` for session persistence.
* **Backend:** Flask RESTful API. Employs a Stateless Architecture with JWT (JSON Web Tokens) for secure, scalable authentication.
* **Database:** PostgreSQL. Utilizes a **Self-Referencing Foreign Key** pattern to create a dynamic Manager-Employee hierarchy.

---

## 👥 Role-Based Access Control (RBAC)
CertFlow ensures data privacy and organizational structure through strict access levels:

1. **Employee:**
    * Upload project metadata and PDF certificates.
    * Track real-time status (**Pending** ➔ **Approved** / **Rejected**).
2. **Manager:**
    * Access to a localized "Team Dashboard."
    * Review, validate, and approve/reject submissions for direct reports only.
3. **Admin:**
    * Global visibility of organization-wide certifications and the TCIL Official Repository.

---

## 🛠 Tech Stack
| Component | Technology |
| :--- | :--- |
| **Language** | Python 3.10, JavaScript (ES6+) |
| **Frontend** | React.js, Bootstrap 5 |
| **Backend** | Flask, SQLAlchemy, Gunicorn |
| **Auth** | Flask-JWT-Extended (Stateless) |
| **Database** | PostgreSQL (Supabase) |
| **Email** | Flask-Mail / Gmail SMTP (Port 465 SSL) |
| **Deployment** | Render (CI/CD Pipeline) |

---

## 🔍 Engineering Challenges Solved
* **Asynchronous SMTP Notifications:** Leveraged **Python Multi-threading** to offload SMTP handshakes to background threads. This prevents Gunicorn worker timeouts and ensures the API returns a response to the user in <200ms regardless of mail server latency.
* **Infrastructure Egress Optimization:** Overcame cloud-provider network blocks (Errno 101) by pivoting between Port 587 (TLS) and Port 465 (Implicit SSL) to ensure secure delivery of password recovery emails.
* **Type-Safe Authorization:** Resolved complex RBAC permission errors by implementing uniform string-casting for JWT identities and database foreign keys, ensuring reliable ownership checks in the TCIL repository.
* **Secure File Governance:** Mitigated path traversal vulnerabilities using `werkzeug.secure_filename` combined with UUID-prefixed storage paths.

---

## 📊 Future Roadmap
- [ ] **Cloud Storage:** Migration from local server storage to AWS S3/Azure Blob for persistent file storage.
- [ ] **Data Visualization:** Integration of Chart.js to track technology trends and certification expiry alerts.


---

## 👤 Author
**Ishpreet Kaur** *B.Tech in Computer Science & Engineering*