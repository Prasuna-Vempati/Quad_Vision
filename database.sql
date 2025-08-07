create database Quad_Vision;

use Quad_Vision;

CREATE TABLE transactions (
id INT PRIMARY KEY AUTO_INCREMENT,
stock_symbol VARCHAR(10) NOT NULL,
quantity INT NOT NULL,
price_per_share DECIMAL(10, 2) NOT NULL,
transaction_type ENUM('BUY', 'SELL') NOT NULL,
transaction_date DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE portfolio (
id INT PRIMARY KEY AUTO_INCREMENT,
stock_symbol VARCHAR(10) NOT NULL UNIQUE,
quantity INT NOT NULL,
avg_buy_price DECIMAL(10, 2) NOT NULL
company_name VARCHAR(50)
);

 CREATE TABLE realized_profit_loss (
  id INT PRIMARY KEY AUTO_INCREMENT,
  stock_symbol VARCHAR(10) NOT NULL,
  realized_pl DECIMAL(10, 2) NOT NULL,
 transaction_date DATETIME DEFAULT CURRENT_TIMESTAMP
 );
 CREATE TABLE profit_loss_history (
id INT AUTO_INCREMENT PRIMARY KEY,
 date DATE NOT NULL,
 realized_pl DECIMAL(15,2) NOT NULL,
 total_value DECIMAL(15,2) NOT NULL
);

INSERT INTO profit_loss_history (date, realized_pl, total_value)
VALUES
('2025-07-28', 100, 1500),
('2025-07-29', 200, 1600),
('2025-07-30', -50, 1400),
('2025-07-31', 300, 1800),
('2025-08-01', 250, 1700),
('2025-08-02', 400, 1900);

CREATE TABLE account_balance (
    id INT PRIMARY KEY,
    balance DECIMAL(15, 2) NOT NULL
);


INSERT INTO account_balance (id, balance) VALUES (1, 100000.00);

CREATE DATABASE IF NOT EXISTS mockdb;

USE mockdb;

CREATE TABLE IF NOT EXISTS portfolio (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT,
  asset VARCHAR(255),
  quantity INT,
  purchasePrice FLOAT
);

use Quad_Vision;

INSERT INTO transactions (stock_symbol, quantity, price_per_share, transaction_type)
VALUES
('INFY', 10, 1450.00, 'BUY'),
('TCS', 5, 3650.00, 'BUY'),
('INFY', 5, 1500.00, 'SELL'),
('RELIANCE', 20, 2700.00, 'BUY'),
('TCS', 2, 3700.00, 'SELL');

INSERT INTO portfolio (stock_symbol, quantity, avg_buy_price)
VALUES
('INFY', 5, 1450.00,'Infosys Limited'),
('TCS', 3, 3650.00, 'Tata Consultancy Services'),
('RELIANCE', 20, 2700.00, 'Reliance Industries Limited');
('RELIANCE', 20, 2700.00, 'Reliance Industries Limited');,
('TCS', 3, 3650.00, 'Tata Consultancy Services');

INSERT INTO realized_profit_loss (stock_symbol, realized_pl)
VALUES
('INFY', 250.00),
('TCS', 100.00);

USE Quad_Vision;

SELECT * FROM transactions;
SELECT * FROM portfolio;
SELECT * FROM realized_profit_loss;
SELECT * FROM profit_loss_history;
SELECT * FROM account_balance;
