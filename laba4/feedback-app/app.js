const express = require("express");
const session = require("express-session");
const bcrypt = require("bcrypt");
const db = require("./db");

const app = express();

app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

app.use(session({
    secret: "secret-key",
    resave: false,
    saveUninitialized: false
}));

// Middleware для проверки авторизации
function isAuthenticated(req, res, next) {
    if (req.session.user) return next();
    res.redirect("/login");
}

// Middleware для проверки администратора
function isAdmin(req, res, next) {
    if (req.session.user && req.session.user.is_admin === 1) return next();
    res.status(403).send("Доступ запрещён");
}

// ========== Аутентификация ==========
app.get("/login", (req, res) => {
    res.render("login");
});

app.post("/login", async (req, res) => {
    const { login, password } = req.body;
    
    db.get("SELECT * FROM users WHERE login = ?", [login], async (err, user) => {
        if (err || !user) {
            return res.send("Неверный логин или пароль");
        }
        
        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            return res.send("Неверный логин или пароль");
        }
        
        req.session.user = {
            id: user.id,
            login: user.login,
            is_admin: user.is_admin
        };
        
        if (user.is_admin === 1) {
            res.redirect("/admin/results");
        } else {
            res.redirect("/test");
        }
    });
});

app.get("/register", (req, res) => {
    res.render("register");
});

app.post("/register", async (req, res) => {
    const { login, password } = req.body;
    const hash = await bcrypt.hash(password, 10);
    
    db.run("INSERT INTO users (login, password, is_admin) VALUES (?, ?, 0)", 
        [login, hash], 
        function(err) {
            if (err) {
                return res.send("Пользователь с таким логином уже существует");
            }
            res.redirect("/login");
        });
});

app.get("/logout", (req, res) => {
    req.session.destroy(() => res.redirect("/login"));
});

// ========== Прохождение теста (для обычных пользователей) ==========
app.get("/test", isAuthenticated, async (req, res) => {
    // Проверяем, проходил ли пользователь тест
    db.get(
        "SELECT COUNT(*) as count FROM user_answers WHERE user_id = ?",
        [req.session.user.id],
        (err, result) => {
            if (result.count > 0) {
                return res.send("Вы уже прошли тест!");
            }
            
            db.all("SELECT * FROM questions", [], (err, questions) => {
                res.render("test", { questions });
            });
        }
    );
});

app.post("/test/submit", isAuthenticated, async (req, res) => {
    const userId = req.session.user.id;
    
    // Получаем все вопросы
    db.all("SELECT * FROM questions", [], async (err, questions) => {
        let correctCount = 0;
        
        for (const question of questions) {
            const userAnswer = req.body[`q${question.id}`] || "";
            const isCorrect = userAnswer.toLowerCase().trim() === question.correct_answer.toLowerCase().trim();
            
            if (isCorrect) correctCount++;
            
            await new Promise((resolve) => {
                db.run(
                    "INSERT INTO user_answers (user_id, question_id, user_answer, is_correct) VALUES (?, ?, ?, ?)",
                    [userId, question.id, userAnswer, isCorrect ? 1 : 0],
                    resolve
                );
            });
        }
        
        res.send(`Вы ответили правильно на ${correctCount} из ${questions.length} вопросов. <a href="/logout">Выйти</a>`);
    });
});

// ========== Администратор: управление вопросами ==========
app.get("/admin/questions", isAdmin, async (req, res) => {
    db.all("SELECT * FROM questions", [], (err, questions) => {
        res.render("admin_questions", { questions });
    });
});

app.get("/admin/questions/new", isAdmin, (req, res) => {
    res.render("question_form");
});

app.post("/admin/questions/new", isAdmin, (req, res) => {
    const { text, correct_answer } = req.body;
    db.run("INSERT INTO questions (text, correct_answer) VALUES (?, ?)", 
        [text, correct_answer], 
        () => res.redirect("/admin/questions"));
});

app.get("/admin/questions/edit/:id", isAdmin, async (req, res) => {
    db.get("SELECT * FROM questions WHERE id = ?", [req.params.id], (err, question) => {
        res.render("question_form", { question });
    });
});

app.post("/admin/questions/edit/:id", isAdmin, (req, res) => {
    const { text, correct_answer } = req.body;
    db.run("UPDATE questions SET text = ?, correct_answer = ? WHERE id = ?",
        [text, correct_answer, req.params.id],
        () => res.redirect("/admin/questions"));
});

app.post("/admin/questions/delete/:id", isAdmin, (req, res) => {
    db.run("DELETE FROM questions WHERE id = ?", [req.params.id], () => {
        db.run("DELETE FROM user_answers WHERE question_id = ?", [req.params.id]);
        res.redirect("/admin/questions");
    });
});

// ========== Администратор: результаты всех пользователей ==========
app.get("/admin/results", isAdmin, async (req, res) => {
    // Получаем статистику по каждому пользователю
    db.all(`
        SELECT 
            u.id,
            u.login,
            COUNT(DISTINCT ua.question_id) as total_questions,
            SUM(ua.is_correct) as correct_answers,
            ROUND(100.0 * SUM(ua.is_correct) / COUNT(DISTINCT ua.question_id), 2) as percentage
        FROM users u
        LEFT JOIN user_answers ua ON u.id = ua.user_id
        GROUP BY u.id
        HAVING total_questions > 0
        ORDER BY percentage DESC
    `, [], (err, stats) => {
        
        // Получаем детальные ответы всех пользователей
        db.all(`
            SELECT u.login, q.text as question, ua.user_answer, ua.is_correct, ua.answered_at
            FROM user_answers ua
            JOIN users u ON ua.user_id = u.id
            JOIN questions q ON ua.question_id = q.id
            ORDER BY ua.answered_at DESC
        `, [], (err, details) => {
            res.render("admin_results", { stats, details });
        });
    });
});
app.get("/", (req, res) => {
    if (req.session.user) {
        // Если пользователь авторизован
        if (req.session.user.is_admin === 1) {
            res.redirect("/admin/results");
        } else {
            res.redirect("/test");
        }
    } else {
        // Если не авторизован
        res.redirect("/login");
    }
});

const PORT = 3000;
app.listen(PORT, () => console.log(`Server: http://localhost:${PORT}`));