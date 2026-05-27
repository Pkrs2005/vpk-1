const express = require("express");
const fs = require("fs").promises;
const path = require("path");

const app = express();

app.set("view engine", "ejs");

app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

const questionsPath = path.join(__dirname, "data", "questions.json");
const responsesPath = path.join(__dirname, "data", "responses.json");

async function readQuestions() {
    const data = await fs.readFile(questionsPath, "utf-8");
    return JSON.parse(data);
}

async function readResponses() {
    const data = await fs.readFile(responsesPath, "utf-8");
    return JSON.parse(data);
}

async function saveResponses(data) {
    await fs.writeFile(
        responsesPath,
        JSON.stringify(data, null, 2)
    );
}

app.get("/", async (req, res) => {
    try {
        const questions = await readQuestions();

        res.render("index", { questions });
    } catch (err) {
        console.error(err);
        res.status(500).send("Ошибка сервера");
    }
});

app.post("/submit", async (req, res) => {
    try {
        const responses = await readResponses();

        const newResponse = {
            liked: req.body.liked,
            improve: req.body.improve,
            rating: Number(req.body.rating),
            date: new Date()
        };

        responses.push(newResponse);

        await saveResponses(responses);

        res.send("Спасибо за отзыв!");
    } catch (err) {
        console.error(err);
        res.status(500).send("Ошибка при сохранении");
    }
});

app.get("/dashboard", async (req, res) => {
    try {
        const responses = await readResponses();

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
    } catch (err) {
        console.error(err);
        res.status(500).send("Ошибка сервера");
    }
});

app.get("/responses", async (req, res) => {
    try {
        const responses = await readResponses();

        res.render("responses", {
            responses
        });
    } catch (err) {
        console.error(err);
        res.status(500).send("Ошибка сервера");
    }
});

const PORT = 3000;

app.listen(PORT, () => {
    console.log(`Server started: http://localhost:${PORT}`);
});