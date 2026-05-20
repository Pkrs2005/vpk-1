const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();

app.set("view engine", "ejs");

app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

const questionsPath = path.join(__dirname, "data", "questions.json");
const responsesPath = path.join(__dirname, "data", "responses.json");

function readQuestions() {
    return JSON.parse(fs.readFileSync(questionsPath));
}

function readResponses() {
    return JSON.parse(fs.readFileSync(responsesPath));
}

function saveResponses(data) {
    fs.writeFileSync(responsesPath, JSON.stringify(data, null, 2));
}

app.get("/", (req, res) => {
    const questions = readQuestions();
    res.render("index", { questions });
});

app.post("/submit", (req, res) => {
    const responses = readResponses();

    const newResponse = {
        liked: req.body.liked,
        improve: req.body.improve,
        rating: Number(req.body.rating),
        date: new Date()
    };

    responses.push(newResponse);

    saveResponses(responses);

    res.send("Спасибо за отзыв!");
});

app.get("/dashboard", (req, res) => {
    const responses = readResponses();

    const count = responses.length;

    let average = 0;

    if (count > 0) {
        const sum = responses.reduce((acc, item) => {
            return acc + item.rating;
        }, 0);

        average = (sum / count).toFixed(2);
    }

    res.render("dashboard", {
        average,
        count
    });
});

app.get("/responses", (req, res) => {
    const responses = readResponses();

    res.render("responses", {
        responses
    });
});

const PORT = 3000;

app.listen(PORT, () => {
    console.log(`Server started: http://localhost:${PORT}`);
});