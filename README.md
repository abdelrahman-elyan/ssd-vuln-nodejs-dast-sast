# Secure Software Development Project
## DAST + SAST on Vulnerable Node.js Express Application

This repository contains a full Secure Software Development (SSD) project that demonstrates:
- **Dynamic Application Security Testing (DAST)** using OWASP ZAP & Postman.
- **Static Application Security Testing (SAST)** using Semgrep (Standard & Custom Rules).
- **Secure Code Remediation** (Patching vulnerabilities).
- **Re-testing and Validation** to ensure fixes work.

The target application is a deliberately vulnerable Node.js + Express app used **only for educational and lab purposes**.

---

## 📌 Project Scope
- **Course:** Secure Software Development
- **Program:** Cybersecurity
- **Semester:** Fall 2025
- **Student:** Abdelrahman Elyan
- **Tools:** OWASP ZAP, Postman, Semgrep, VS Code
- **Environment:** Localhost (No real systems were tested)

---

## 🛠 Technologies Used
- **Backend:** Node.js / Express
- **Database:** MySQL / Sequelize (SQLite for lab)
- **DAST Tools:** OWASP ZAP, Postman
- **SAST Tools:** Semgrep (CLI)
- **Version Control:** Git & GitHub

---

## 🚀 Installation & Run

### 1. Clone the repository
~~~bash
git clone https://github.com/abdelrahman-elyan/ssd-vuln-nodejs-dast-sast.git
cd vuln-node.js-express.js-app
~~~

### 2. Install dependencies
~~~bash
npm install
~~~

### 3. Environment variables
Create a `.env` file in the root directory based on `.env.example`:
~~~ini
JWT_SECRET=SuperSecretKey123
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=root
DB_NAME=vulnapp
PORT=5000
~~~

### 4. Run the application
~~~bash
npm start
~~~
The application will be available at:  
👉 **http://localhost:5000**

---

## 🧪 Phase A – DAST (Dynamic Testing)

In this phase, we performed black-box testing to identify runtime vulnerabilities.

### Tools Used
- **OWASP ZAP:** Automated scanning and spidering.
- **Postman:** Manual exploitation and Proof of Concept (PoC) creation.

### Vulnerabilities Discovered
| ID | Vulnerability | OWASP Category | Impact |
|----|--------------|----------------|--------|
| **V1** | Privilege Escalation | A01: Broken Access Control | Admin takeover |
| **V2** | IDOR | A01: Broken Access Control | Unauthorized data access |
| **V3** | SQL Injection | A03: Injection | Data leakage (Credentials) |
| **V4** | Command Injection (RCE) | A03: Injection | Remote Code Execution |
| **V5** | SSTI | A03: Injection | Server-side code execution |
| **V6** | Reflected XSS | A03: Injection | Client-side attacks |
| **V7** | SSRF | A10: Server-Side Request Forgery | Internal network scanning |
| **V8** | Path Traversal | A05: Security Misconfiguration | Sensitive file disclosure |
| **V9** | Open Redirect | A05: Security Misconfiguration | Phishing attacks |
| **V10** | Insecure JWT | A02: Cryptographic Failures | Authentication bypass |

> *Full PoCs and screenshots are documented in `Security_Project_Report.pdf`.*

---

## 🔍 Phase B – SAST (Semgrep)

In this phase, we analyzed the source code to find the root causes of the vulnerabilities found in Phase A.

### 1. Built-in Rules Scan
We used Semgrep's official rulesets for an initial assessment:
~~~bash
semgrep --config "p/javascript" --config "p/nodejs" --error
~~~

### 2. Custom Rules (The Core Work)
To detect specific vulnerable patterns in this application, we wrote custom YAML rules stored in the `semgrep-rules/` folder.

**Command:**
~~~bash
semgrep --config semgrep-rules/ .
~~~

**Custom Rules Coverage:**
- ✅ **SQL Injection:** Detects string concatenation in `sequelize.query`.
- ✅ **SSTI:** Detects unsafe `nunjucks.renderString`.
- ✅ **Command Injection:** Detects user input passed to `execSync`.
- ✅ **Insecure JWT:** Detects `jwt.decode` usage without verification.

---

## 🔧 Phase C – Fix & Harden

We implemented secure coding practices to mitigate the identified risks.

### Remediation Strategies
1. **SQL Injection:**
   - **Fix:** Replaced string concatenation with **Sequelize Parameterized Queries** (Replacements).
   - *Status:* ✅ Fixed.

2. **Command Injection (RCE):**
   - **Fix:** Removed `execSync` entirely and replaced functionality with safe APIs or strict validation.
   - *Status:* ✅ Fixed.

3. **Open Redirect:**
   - **Fix:** Implemented an **Allowlist** (White-list) for trusted domains only.
   - *Status:* ✅ Fixed.

4. **SSTI:**
   - **Fix:** Validated input before passing it to the template engine.
   - *Status:* ✅ Fixed.

5. **Path Traversal:**
   - **Fix:** Used `path.basename()` to strip directory traversal characters (`../`).
   - *Status:* ✅ Fixed.

### Validation
- **Re-testing:** Rerunning Postman payloads resulted in `403 Forbidden` or sanitized output.
- **Semgrep Check:** Custom rules no longer flag the fixed code segments.

