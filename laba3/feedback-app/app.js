const express = require("express");
const fs = require("fs").promises;
const path = require("path");
const session = require("express-session");

const app = express();

app.set("view engine", "ejs");

app.use(express.urlencoded({ extended: true }));

app.use(
    session({
        secret: "secret-key",
        resave: false,
        saveUninitialized: false
    })
);

const questionsPath = path.join(__dirname, "data", "questions.json");
const responsesPath = path.join(__dirname, "data", "responses.json");
const usersPath = path.join(__dirname, "data", "users.json");

async function readQuestions() {
    const data = await fs.readFile(questionsPath, "utf8");
    return JSON.parse(data);
}

async function readResponses() {
    const data = await fs.readFile(responsesPath, "utf8");
    return JSON.parse(data);
}

async function saveResponses(data) {
    await fs.writeFile(
        responsesPath,
        JSON.stringify(data, null, 2)
    );
}

async function readUsers() {
    const data = await fs.readFile(usersPath, "utf8");
    return JSON.parse(data);
}

function isStudent(req, res, next) {
    if (
        req.session.user &&
        req.session.user.role === "student"
    ) {
        return next();
    }

    res.redirect("/login");
}

function isTeacher(req, res, next) {
    if (
        req.session.user &&
        req.session.user.role === "teacher"
    ) {
        return next();
    }

    res.redirect("/login");
}

app.get("/login", (req, res) => {
    res.render("login");
});

app.post("/login", async (req, res) => {
    const users = await readUsers();

    const user = users.find(
        u =>
            u.login === req.body.login &&
            u.password === req.body.password
    );

    if (!user) {
        return res.send("Неверный логин или пароль");
    }

    req.session.user = user;

    if (user.role === "teacher") {
        return res.redirect("/dashboard");
    }

    res.redirect("/");
});

app.get("/logout", (req, res) => {
    req.session.destroy(() => {
        res.redirect("/login");
    });
});

app.get("/", isStudent, async (req, res) => {
    const questions = await readQuestions();

    res.render("index", { questions });
});

app.post("/submit", isStudent, async (req, res) => {
    const responses = await readResponses();

    responses.push({
        liked: req.body.liked,
        improve: req.body.improve,
        rating: Number(req.body.rating),
        author: req.session.user.login,
        date: new Date()
    });

    await saveResponses(responses);

    res.send("Спасибо за отзыв!");
});

app.get("/dashboard", isTeacher, async (req, res) => {
    const responses = await readResponses();

    const count = responses.length;

    let average = 0;

    if (count > 0) {
        const sum = responses.reduce(
            (acc, item) => acc + item.rating,
            0
        );

        average = (sum / count).toFixed(2);
    }

    res.render("dashboard", {
    count,
    average,
    responses
    });
});

const PORT = 3000;

app.listen(PORT, () => {
    console.log(
        `Server started: http://localhost:${PORT}`
    );
});