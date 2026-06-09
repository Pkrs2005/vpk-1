const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcrypt');

const dbPath = path.join(__dirname, 'data', 'database.db');
const db = new sqlite3.Database(dbPath);

// Инициализация таблиц
db.serialize(() => {
    // Таблица пользователей (is_admin = 1 - админ, 0 - обычный)
    db.run(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            login TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            is_admin INTEGER DEFAULT 0
        )
    `);

    // Таблица вопросов
    db.run(`
        CREATE TABLE IF NOT EXISTS questions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            text TEXT NOT NULL,
            correct_answer TEXT NOT NULL
        )
    `);

    // Таблица ответов пользователей
    db.run(`
        CREATE TABLE IF NOT EXISTS user_answers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            question_id INTEGER NOT NULL,
            user_answer TEXT NOT NULL,
            is_correct INTEGER NOT NULL,
            answered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id),
            FOREIGN KEY (question_id) REFERENCES questions(id)
        )
    `);

    // Добавление тестового админа (пароль: admin123)
    const hashAdmin = bcrypt.hashSync('admin123', 10);
    db.run(`INSERT OR IGNORE INTO users (login, password, is_admin) VALUES (?, ?, ?)`, 
        ['admin', hashAdmin, 1]);

    // Добавление тестового пользователя (пароль: user123)
    const hashUser = bcrypt.hashSync('user123', 10);
    db.run(`INSERT OR IGNORE INTO users (login, password, is_admin) VALUES (?, ?, ?)`, 
        ['user', hashUser, 0]);

    // Добавление тестовых вопросов
    db.run(`INSERT OR IGNORE INTO questions (id, text, correct_answer) VALUES (1, 'Сколько будет 2 + 2?', '4')`);
    db.run(`INSERT OR IGNORE INTO questions (id, text, correct_answer) VALUES (2, 'Столица Франции?', 'Париж')`);
    db.run(`INSERT OR IGNORE INTO questions (id, text, correct_answer) VALUES (3, 'HTML - это язык программирования? (да/нет)', 'нет')`);
});

module.exports = db;