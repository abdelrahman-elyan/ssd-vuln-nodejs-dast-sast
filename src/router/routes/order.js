'use strict';

var fs = require('fs');
const path = require('path');

module.exports = (app, db) => {

    /**
     * GET /v1/order
     * @summary List all beers (Excessive Data Exposure)
     */
    app.get('/v1/order', (req, res) => {
        db.beer.findAll({ include: "users" })
            .then(beer => {
                res.json(beer);
            });
    });

    /**
     * GET /v1/beer-pic/
     * @summary Get a picture of a beer (Path Traversal)
     * ❌ Vulnerable (لسه متصلحتش)
     */
    // ✅ الحل: تنظيف المسار ومنع التراجع للخلف (../)
    app.get('/v1/beer-pic/', (req, res) => {
    const filename = path.basename(req.query.picture); // يأخذ اسم الملف فقط (مثلاً image.png)
    const safePath = path.join(__dirname, '../../../uploads/', filename);

    fs.readFile(safePath, (err, data) => {
        if (err) return res.send("File not found");
        res.send(data);
    });
    });

    /**
     * GET /v1/search/{filter}/{query}
     * @summary Search for a specific beer (FIXED SQL Injection)
     */
    app.get('/v1/search/:filter/:query', async (req, res) => {

        const filter = req.params.filter;
        const query = req.params.query;

        /**
         * ✅ FIX 1:
         * Whitelist للـ columns
         * نمنع المستخدم يحقن column أو SQL keywords
         */
        const allowedFilters = ['id', 'name', 'price', 'category'];

        if (!allowedFilters.includes(filter)) {
            return res.status(400).send("Invalid filter column");
        }

        /**
         * ✅ FIX 2:
         * Parameterized Query
         * مفيش string concatenation
         */
        const sql = `SELECT * FROM beers WHERE ${filter} = :value`;

        try {
            const beers = await db.sequelize.query(sql, {
                replacements: { value: query }, // ✅ Safe binding
                type: db.Sequelize.QueryTypes.SELECT
            });

            res.status(200).send(beers);

        } catch (err) {
            res.status(500).send("error, query failed: " + err);
        }
    });
};
