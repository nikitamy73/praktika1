// script/create_database.js
var mysql = require('mysql2');
var bcrypt = require('bcrypt-nodejs');
var dbconfig = require('../config/database');

var connection = mysql.createConnection(dbconfig.connection);

connection.connect(function(err) {
    if (err) {
        console.log('Ошибка подключения:', err.message);
        return;
    }
    
    console.log('Подключено к MySQL');
    
    connection.query('CREATE DATABASE IF NOT EXISTS ' + dbconfig.database, function(err) {
        if (err) {
            console.log('Ошибка создания базы:', err.message);
            connection.end();
            return;
        }
        
        console.log('База данных создана');
        
        connection.query('USE ' + dbconfig.database, function(err) {
            if (err) {
                console.log('Ошибка выбора базы:', err.message);
                connection.end();
                return;
            }
            
            console.log('Используем базу: ' + dbconfig.database);
            
            var createTableSQL = `
                CREATE TABLE IF NOT EXISTS users (
                    id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
                    username VARCHAR(20) NOT NULL UNIQUE,
                    password CHAR(60) NOT NULL,
                    role ENUM('user', 'admin') DEFAULT 'user',
                    active TINYINT DEFAULT 1,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `;
            
            connection.query(createTableSQL, function(err) {
                if (err) {
                    console.log('Ошибка создания таблицы:', err.message);
                    connection.end();
                    return;
                }
                
                console.log('Таблица users создана');
                
                var adminPassword = 'admin123';
                var hashedPassword = bcrypt.hashSync(adminPassword, null, null);
                
                var insertAdminSQL = `
                    INSERT INTO users (username, password, role) 
                    VALUES (?, ?, 'admin')
                    ON DUPLICATE KEY UPDATE 
                    password = VALUES(password), 
                    role = VALUES(role)
                `;
                
                connection.query(insertAdminSQL, ['admin', hashedPassword], function(err, result) {
                    if (err) {
                        console.log('Ошибка создания администратора:', err.message);
                    } else {
                        if (result.affectedRows > 0) {
                            console.log('Администратор создан!');
                            console.log('Логин: admin');
                            console.log('Пароль: admin123');
                        } else {
                            console.log('Администратор уже существует');
                        }
                    }
                    connection.end();
                    console.log('Готово!');
                });
            });
        });
    });
});