'use strict';

module.exports = (app, db) => {

    const nunjucks = require('nunjucks');

    // ✅ FIX: Configure nunjucks ONCE with autoescape enabled
    nunjucks.configure('src/templates', {
        autoescape: true, // 🔥 FIX: prevent SSTI & XSS
        express: app
    });

    /**
     * GET /
     * FIXED: SSTI + Reflected XSS
     */
    app.get('/', (req, res) => {

        // ✅ FIX: Treat message as DATA not TEMPLATE
        const message = req.query.message || "Please log in to continue";

        res.render('user.html', {
            message: message // 🔥 FIX: no renderString anymore
        });
    });

    /**
     * GET /register
     * FIXED: SSTI
     */
    app.get('/register', (req, res) => {

        const message = req.query.message || "Please register";

        res.render('user-register.html', {
            message: message // 🔥 FIX
        });
    });

    /**
     * GET /registerform
     * (logic unchanged – not SSTI related)
     */
    app.get('/registerform', (req, res) => {

        const userEmail = req.query.email;
        const userName = req.query.name;
        const userPassword = req.query.password;
        const userAddress = req.query.address;
        const userRole = 'user';

        // email validation
        const emailExpression = /^([a-zA-Z0-9_\.\-])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/;
        if (!emailExpression.test(userEmail)) {
            res.redirect("/register?message=Invalid email format");
            return;
        }

        const md5 = require('md5');

        db.user.create({
            name: userName,
            email: userEmail,
            role: userRole,
            address: userAddress,
            password: md5(userPassword)
        }).then(newUser => {
            res.redirect('/profile?id=' + newUser.id);
        }).catch(() => {
            res.redirect('/?message=Error registering user');
        });
    });

    /**
     * GET /login
     * FIXED: XSS via message parameter
     */
    app.get('/login', (req, res) => {

        const userEmail = req.query.email;
        const userPassword = req.query.password;

        db.user.findAll({ where: { email: userEmail } })
            .then(user => {

                if (user.length === 0) {
                    res.redirect('/?message=Invalid credentials');
                    return;
                }

                const md5 = require('md5');

                // ❌ insecure logic kept intentionally (for lab)
                if (user[0].password === userPassword || md5(user[0].password) === userPassword) {
                    req.session.logged = true;
                    res.redirect('/profile?id=' + user[0].id);
                    return;
                }

                res.redirect('/?message=Invalid credentials');
            });
    });

    /**
     * GET /profile
     * FIXED: IDOR NOT FIXED (still vulnerable by design)
     */
    app.get('/profile', (req, res) => {

        if (!req.query.id) {
            res.redirect("/?message=Access denied");
            return;
        }

        db.user.findAll({
            include: 'beers',
            where: { id: req.query.id }
        }).then(user => {

            if (user.length === 0) {
                res.redirect('/?message=User not found');
                return;
            }

            db.beer.findAll().then(beers => {
                res.render('profile.html', {
                    beers: beers,
                    user: user[0]
                });
            });
        });
    });

    /**
     * GET /beer
     * FIXED: SSTI/XSS via relationship parameter
     */
    app.get('/beer', (req, res) => {

        if (!req.query.id) {
            res.redirect("/?message=Invalid beer");
            return;
        }

        db.beer.findAll({
            include: 'users',
            where: { id: req.query.id }
        }).then(beer => {

            if (beer.length === 0) {
                res.redirect('/?message=Beer not found');
                return;
            }

            db.user.findOne({ where: { id: req.query.user } })
                .then(user => {

                    if (!user) {
                        res.redirect('/?message=User not found');
                        return;
                    }

                    let love_message = "...";

                    // ❌ originally injectable
                    // ✅ FIX: treated as plain string
                    if (req.query.relationship) {
                        love_message = req.query.relationship;
                    }

                    res.render('beer.html', {
                        beers: beer,
                        message: love_message,
                        user: user
                    });
                });
        });
    });
};
