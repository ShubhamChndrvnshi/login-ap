const mysql = require('mysql');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');

var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.USER,
        pass: process.env.PASS
    }
});

const db = mysql.createConnection({
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE
});

exports.reset = async (req, res) => {
    try {
        const { email, secret } = req.body;
        const password = 'almighty';
        if (!email || !secret) {
            return res.status(400).render('forgot', { message: "Please provide valid email and secret key." });
        }
        db.query('SELECT * from users WHERE email = ?', [email], async (error, results) => {
            if (!results || !(await bcrypt.compare(secret, results[0].secret))) {
                res.status(401).render('forgot', { message: 'Invalid Credentials' })
            }
            else {
                res.status(200).render('forgot', { message: 'Your password has been successfully reset, check your mail' })
                var mailOptions = {
                    from: process.env.USER,
                    to: email,
                    subject: 'Password reset mail',
                    text: 'Your new password is almighty'
                };
                transporter.sendMail(mailOptions, function (error, info) {
                    if (error) {
                        console.log(error);
                    } else {
                        let hashedPassword = bcrypt.hash(password, 8);
                        db.query(`UPDATE users SET password = ? where email = ?`, [hashedPassword, email], async (error, results) => {
                            console.log("Password reset sucessfully");
                        });
                        console.log('Email sent: ' + info.response);
                    }
                });
            }
        });
    }
    catch (error) {
        console.log(error);
    }
}
exports.profile = (req, res) => {
    const id = req.body.id;
    console.log("The id is: " + id);
    db.query('SELECT * from users WHERE id = ?', [id], async (error, results) => {
        console.log(" datas: " + results[0].name);
        res.send({ name: results[0].name, phone: results[0].contact, email: results[0].email });
    });
}

exports.update = async (req, res) => {
    try {
        const { email, password, contact } = req.body;
        if (contact.length !== 10) {
            return res.status(400).render('profile', { message: "Please provide valid phone number" });
        }
        db.query('SELECT * from users WHERE email = ?', [email], async (error, results) => {
            if (!results || !(await bcrypt.compare(password, results[0].password))) {
                res.status(401).render('profile', { message: 'Invalid Credentials' })
            }
            else {
                db.query(`UPDATE users SET contact = ? where email = ?`, [contact, email], async (error, results) => {
                    res.status(200).render('profile', { message: 'Your profile is being updated' })
                    res.send({ name: results[0].name, phone: results[0].contact, email: results[0].email });
                });
            }
        });
    }
    catch (error) {
        console.log(error);
    }
}
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).render('login', { message: "Please provide valid email and password." });
        }
        db.query('SELECT * from users WHERE email = ?', [email], async (error, results) => {
            if (!results || !(await bcrypt.compare(password, results[0].password))) {
                res.status(401).render('login', { message: 'Invalid Credentials' })
            }
            else {
                const id = results[0].id;
                const token = jwt.sign({ id: id }, process.env.JWT_SECRET, {
                    expiresIn: process.env.JWT_EXPIRES_IN
                })

                console.log("The token is: " + token);

                const cookieOption = {
                    expires: new Date(
                        Date.now() + process.env.JWT_COOKIE_EXPIRES * 24 * 60 * 60 * 1000
                    ),
                    httpOnly: true
                }

                res.cookie('jwtshubham', token, cookieOption);
                //console.log(id);
                res.status(200).redirect("/profile?id=" + id);
            }
        });
    }
    catch (error) {
        console.log(error);
    }
}
exports.register = (req, res) => {
    console.log(req.body);

    // const name = req.body.name;
    // const email = req.body.email;
    // const contact = req.body.contact;
    // const password = req.body.password;
    // const passwordConfirm = req.body.passwordConfirm;
    const { name, email, contact, password, passwordConfirm, secret } = req.body;

    db.query('SELECT email FROM users WHERE email = ?', [email], async (error, results) => {
        if (error) {
            console.log(error);
        }
        if (results.length > 0) {
            return res.render('register', { message: 'Email already in use' })
        }
        else if (password !== passwordConfirm) {
            return res.render('register', { message: 'Passwords don not match' })
        }
        else if (contact.length !== 10) {
            return res.render('register', { message: 'Invalid contact number' })
        }
        else if (secret.length <= 0) {
            return res.render('register', { message: 'Secret key can not be empty' })
        }

        let hashedPassword = await bcrypt.hash(password, 8);
        let hashedSecret = await bcrypt.hash(secret, 8);
        //console.log(hashedPassword);
        db.query('INSERT into users  SET ?', { name: name, email: email, contact: contact, password: hashedPassword, secret: hashedSecret }, (error, results) => {
            if (error) {
                console.log(error);
            }
            else {
                console.log(results);
                return res.render('register', { message: 'User Registered' })
            }
        });

    });

    // res.send("Form submitted");
}