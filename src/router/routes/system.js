'use strict';

const { execFile } = require('child_process');
const axios = require('axios');
const { URL } = require('url');

module.exports = (app, db) => {

    /**
     * =========================
     * FIXED: RCE (Command Injection)
     * =========================
     * ❌ كان بيستخدم execSync مع user input
     * ✅ استخدمنا execFile + whitelist
     */
    app.get('/v1/status/:brand', (req, res) => {

        // ✅ whitelist للبراندات المسموح بيها فقط
        const allowedBrands = ['bud', 'corona', 'heineken'];

        const brand = req.params.brand;

        if (!allowedBrands.includes(brand)) {
            return res.status(400).json({ error: "Invalid brand" });
        }

        // ✅ execFile يمنع command injection
        execFile(
            'curl',
            [`https://letmegooglethat.com/?q=${brand}`],
            { timeout: 3000 },
            (err, stdout) => {
                if (err) {
                    return res.status(500).json({ error: "Execution failed" });
                }
                res.type('text/plain').send(stdout);
            }
        );
    });

    /**
     * =========================
     * FIXED: Open Redirect
     * =========================
     */
    app.get('/v1/redirect/', (req, res) => {

       // FIX: allowlist redirect domains
    const allowedDomains = ['example.com'];

    try {
    const parsed = new URL(url);
    if (!allowedDomains.includes(parsed.hostname)) {
     return res.status(403).send("Forbidden redirect");
    }
    res.redirect(url);
}   catch {
    res.status(400).send("Invalid URL");
}

       
    });

    /**
     * =========================
     * FIXED: Insecure Object Deserialization
     * =========================
     * ❌ node-serialize يؤدي إلى RCE
     * ✅ استخدام JSON.parse فقط
     */
    app.post('/v1/init', (req, res) => {

        try {
            // ✅ parse JSON safely
            const data = JSON.parse(req.body.object);

            if (typeof data !== 'object') {
                return res.status(400).json({ error: "Invalid data" });
            }

            console.log("Safe data:", data);
            res.json({ status: "Initialized safely" });

        } catch (e) {
            res.status(400).json({ error: "Invalid JSON" });
        }
    });

    /**
     * =========================
     * FIXED: SSRF
     * =========================
     */
    app.get('/v1/test/', async (req, res) => {

        try {
            const target = new URL(req.query.url);

            // ✅ منع internal IPs
            const blockedHosts = ['localhost', '127.0.0.1', '169.254'];

            if (blockedHosts.some(h => target.hostname.includes(h))) {
                return res.status(403).json({ error: "SSRF blocked" });
            }

            const response = await axios.get(target.href, { timeout: 3000 });
            res.json({ status: response.status });

        } catch (e) {
            res.status(400).json({ error: "Invalid URL" });
        }
    });
};
