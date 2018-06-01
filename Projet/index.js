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

//Se deconnecter
app.get('/api/logout', function(req, res){
    req.logout();
    res.redirect('/');
});

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

const Question = db.define('question', {
    title: {type : Sequelize.STRING},
    content: {type : Sequelize.TEXT},
    resolved:{type: Sequelize.ENUM("Resolved", "Unresolved")}
});

const Comment = db.define('comment', {
    content: {type: Sequelize.STRING}
});

function sync() {
    User.sync();
    Question.sync();
    Comment.sync();
}

User.hasMany(Question);
Question.belongsTo(User);

User.hasMany(Comment);
Comment.belongsTo(User);

Question.hasMany(Comment);
Comment.belongsTo(Question);
sync();

//ROUTES---------------------------------------------------------
app.get('/', (req,res) => {
    Question
        .findAll({include: [User]})
        .then((questions) =>{
            for(let y=0; y < questions.length; y++){
                let date = new Date(questions[y].createdAt);
                questions[y]["jolieDate"] = date.getDate() + "/" + parseInt(date.getMonth()+ 1)  + "/" + date.getFullYear();
            }
            res.render("home", {questions, user: req.user})})

});

app.get('/signup', (req,res) => {
    res.render("signup")
});

app.get('/login', (req,res) => {
    res.render("login")
});

app.get('/addquestion', (req,res) => {
    res.render("addquestion", {user: req.user})
});

app.get('/profil', (req,res) => {
    res.render("profil", {user: req.user})
});

app.get('/detail/:questionId', (req,res) => {
    const questionId = req.params.questionId;
    Question
        .findById(questionId,{include: [User, {model: Comment,include:[User]}]})
        .then((question) => {
            res.render("detail", { question, user: req.user })
        })
});

app.get('/users', (req,res) =>{
    User
        .findAll()
        .then((users) => res.render("users", {users, user: req.user})

    )
});

//Envoie vers la page d'édition question
app.get('/editQues/:questionId', (req,res) => {
    const questionId = req.params.questionId;
    Question
        .findById(questionId, {include: [User]})
        .then((question) => {
            res.render("editQuestion", {question, user: req.user})
        })

});

//Editer commentaire
app.get('/editCom/:commentId', (req,res) => {
    const commentId = req.params.commentId;
    Comment
        .findById(commentId, {include: [User]})
        .then((comment) => {
            res.render("editComment", {comment, user: req.user})
        })
});

//Delete questions (et comment lié)
app.get('/api/deleteQues/:questionId', (req,res) => {
    const questionId = req.params.questionId;
    Comment.destroy({where:{questionId: questionId}})
       .then(() => {
           Question
               .destroy({where:{id: questionId}})
       })
       .then(() => {
           res.render("deleteQuestion")
       })
});

//Delete comment
app.get('/api/deleteCom/:commentId/:questionId', (req,res) => {
    const commentId = req.params.commentId;
    const questionId = req.params.questionId;
    Comment
        .destroy({where:{id: commentId}})
        .then(() => {
            res.redirect("/detail/" + questionId)
        })
});

//résoudre un sujet
app.get('/api/resolved/:questionId', (req,res) => {
    const questionId = req.params.questionId;

    Question
        .findById(questionId)
        .then((question) => {
            question
                .updateAttributes({
                    resolved: "Resolved"
                })
        })
        .then(() => {
            res.redirect("/detail/" + questionId)
        })

});
//Changer role d'un user
app.get("/users/:userId", (req,res) => {
    const userId = req.params.userId;
    const selectedRole = req.query.selectedRole;
    User
        .findById(userId)
        .then((user) => {
            console.log(selectedRole);
            user
                .updateAttributes({
                    role: selectedRole
                })
        })
        .then(() => {
            res.redirect("/users")
        })
});

//POST------------------------------------------------------------------
//Modifier la question dans la bdd
app.post('/editQues/:questionId', (req,res) => {
    const questionId = req.params.questionId;
    Question
        .findById(questionId)
        .then((question) => {
            question
                .updateAttributes({
                    title: req.body.title,
                    content: req.body.content
                })
        })
        .then(() => {
            res.redirect("/detail/" + questionId)
        })
});

//Modifier commentaire
app.post('/editCOm/:commentId', (req,res) =>{
    const  commentId = req.params.commentId;
    Comment
        .findById(commentId)
        .then((comment) => {
            comment
                .updateAttributes({
                    content: req.body.content
                })
                .then(() =>{
                    res.redirect("/detail/" + comment.questionId)
                })
        })

})


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
//poster un question
app.post('/addquestion', (req,res) => {
   Question
       .sync()
       .then(() => {
           Question.create({
               title: req.body.title,
               content: req.body.content,
               userId: req.user.id,
               resolved: "Unresolved"
           })
       })
       .then(() => {
           res.redirect('/')
       })

});
app.post('/detail/:questionId', (req,res) =>{
    Comment
        .sync()
        .then(() => {
            Comment.create({
                    content: req.body.comment,
                    questionId: req.params.questionId,
                    userId: req.user.id
                }
            )
        })
        .then(() => res.redirect('/detail/' + req.params.questionId))
});


app.listen(3000);