const express = require('express');
const bodyParser = require('body-parser');
const Sequelize = require('sequelize');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;

//configuarations---------------
const COOKIE_SECRET = 'cookie secret';
const app = express();
app.use(bodyParser.urlencoded({extended: true}));
app.set('view engine', 'pug');
app.use(express.static("public"));
app.use(cookieParser(COOKIE_SECRET));
app.use(session({
    secret: COOKIE_SECRET,
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());

//Strategie d'authentification via email + password-------------------
passport.use(new LocalStrategy((email, password, done) =>{
    User
        .findOne({where:{
                email
            }})
        .then(function (user) {
            if (!user || user.password !== password){
                return done(null, false, {
                    message: 'Email inconnue ou mdp invalide'
                });
            }
            return done(null,user)
        })
        .catch(done);
}));

//Strategie d'authentification via email + password-------------------
passport.use(new LocalStrategy((email, password, done) =>{
    User
        .findOne({where:{
                email
            }})
        .then(function (user) {
            if (!user || user.password !== password){
                return done(null, false, {
                    message: 'Email inconnue ou mdp invalide'
                });
            }
            return done(null,user)
        })
        .catch(done);
}));

passport.serializeUser((user, cb) => {
    cb(null, user.email);
});
passport.deserializeUser((email, cb) => {
    User.findOne({where:{email}})
        .then((user)=>{
            cb(null,user)
        })
});

//Que faire si les données sont justes/fausses
app.post('/login', passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/login'
}));


//Initialisation des BDD--------------------------
const db = new Sequelize('forum', 'root', '', {
    host: 'localhost',
    dialect: 'mysql'
});

const User = db.define('user', {
    firstname: { type: Sequelize.STRING },
    lastname: { type: Sequelize.STRING },
    email: { type: Sequelize.STRING },
    password: { type: Sequelize.STRING },
    role: {type: Sequelize.ENUM("admin","user")}
});

function sync() {
    User.sync();

}

sync()

app.get('/', (req,res) => {
    res.render("home")
});

app.get('/signup', (req,res) => {
    res.render("signup")
});

app.get('/login', (req,res) => {
    res.render("login")
});

//Inscription, mise en BDD d'un user
app.post('/signup', (req,res) => {
    User
        .sync()
        .then(() => {
            return User.count()
        })
        .then((count) => {
            if(count == 0){
                User.create({
                    firstname: req.body.firstname,
                    lastname: req.body.lastname,
                    email: req.body.email,
                    password: req.body.password,
                    role: "admin"
                });
            }
            else{
                User.create({
                    firstname: req.body.firstname,
                    lastname: req.body.lastname,
                    email: req.body.email,
                    password: req.body.password,
                    role: "user"
                });
            }
        })
        .then(()=>{
            res.redirect('/')
        })
});

app.listen(3000);