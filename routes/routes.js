// routes/routes.js


var mysql = require('mysql2');
var bcrypt = require('bcrypt-nodejs');
var dbconfig = require('../config/database');

var connection = mysql.createConnection(dbconfig.connection);
connection.query('USE ' + dbconfig.database);


function isLoggedIn(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect('/');
}

function isAdmin(req) {
    return req.user && req.user.role === 'admin';
}


module.exports = function(app, passport) {

    // =====================================
    // HOME PAGE (with login links) ========
    // =====================================
    app.get('/', function(req, res) {
        res.render('index.ejs');
    });

    // =====================================
    // LOGIN ===============================
    // =====================================
    app.get('/login', function(req, res) {
        res.render('login.ejs', { message: req.flash('loginMessage') });
    });

    app.post('/login', passport.authenticate('local-login', {
        successRedirect: '/profile',
        failureRedirect: '/login',
        failureFlash: true
    }));

    // =====================================
    // SIGNUP ==============================
    // =====================================
    app.get('/signup', function(req, res) {
        res.render('signup.ejs', { message: req.flash('signupMessage') });
    });

    app.post('/signup', passport.authenticate('local-signup', {
        successRedirect: '/profile',
        failureRedirect: '/signup',
        failureFlash: true
    }));

    // =====================================
    // PROFILE SECTION =====================
    // =====================================
    app.get('/profile', isLoggedIn, function(req, res) {
        if (isAdmin(req)) {
            connection.query('SELECT id, username, active FROM users', 
                function(err, users) {
                    res.render('admin-profile.ejs', {
                        user: req.user,
                        users: users
                    });
                }
            );
        } else {
            res.render('profile.ejs', {
                user: req.user
            });
        }
    });

    // =====================================
    // DELETE USER =========================
    // =====================================
    app.post('/delete-user', isLoggedIn, function(req, res) {
        if (!isAdmin(req)) {
            return res.redirect('/profile');
        }
        
        var userId = req.body.user_id;
        
        connection.query('DELETE FROM users WHERE id = ?', 
            [userId], function(err, result) {
                res.redirect('/profile');
            }
        );
    });

	app.post('/toggle-active', isLoggedIn, function(req, res) {
    if (!isAdmin(req)) {
        return res.redirect('/profile');
    }
    
    var userId = req.body.user_id;
    
    connection.query('UPDATE users SET active = NOT active WHERE id = ?', 
        [userId], function(err, result) {
            res.redirect('/profile');
        }
    );
});

    // =====================================
    // UPDATE USER =========================
    // =====================================
    app.post('/update-user', isLoggedIn, function(req, res) {
        if (!isAdmin(req)) {
            return res.redirect('/profile');
        }
        
        var userId = req.body.user_id;
        var newUsername = req.body.username;
        var newPassword = req.body.password;
        
        if (newPassword) {
            var hashedPassword = bcrypt.hashSync(newPassword, null, null);
            
            connection.query('UPDATE users SET password = ? WHERE id = ?',
                [hashedPassword, userId], function(err, result) {
                    res.redirect('/profile');
                }
            );
        }
        else if (newUsername) {
            connection.query('UPDATE users SET username = ? WHERE id = ?',
                [newUsername, userId], function(err, result) {
                    res.redirect('/profile');
                }
            );
        }
        else {
            res.redirect('/profile');
        }
    });

    // =====================================
    // LOGOUT ==============================
    // =====================================
    app.get('/logout', function(req, res, next) {
        req.logout(function(err) {
            if (err) { 
                return next(err); 
            }
            res.redirect('/');
        });
    });
};