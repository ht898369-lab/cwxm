CREATE DATABASE IF NOT EXISTS cwxm DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE cwxm;

CREATE TABLE IF NOT EXISTS users (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(64) UNIQUE,
  phone VARCHAR(20) UNIQUE,
  password_hash VARCHAR(255),
  status TINYINT DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS roles (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(64) UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS user_roles (
  user_id BIGINT,
  role_id BIGINT,
  PRIMARY KEY(user_id, role_id),
  FOREIGN KEY(user_id) REFERENCES users(id),
  FOREIGN KEY(role_id) REFERENCES roles(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS permissions (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  code VARCHAR(128) UNIQUE,
  name VARCHAR(128)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS role_permissions (
  role_id BIGINT,
  permission_id BIGINT,
  PRIMARY KEY(role_id, permission_id),
  FOREIGN KEY(role_id) REFERENCES roles(id),
  FOREIGN KEY(permission_id) REFERENCES permissions(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS account_books (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(128),
  currency_id BIGINT,
  status TINYINT DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS periods (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  account_book_id BIGINT,
  year INT,
  month INT,
  status TINYINT DEFAULT 0,
  UNIQUE KEY ab_period(account_book_id, year, month),
  FOREIGN KEY(account_book_id) REFERENCES account_books(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS currencies (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  code VARCHAR(8) UNIQUE,
  name VARCHAR(64)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS units (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(64) UNIQUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS accounts (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  code VARCHAR(32) UNIQUE,
  name VARCHAR(128),
  parent_code VARCHAR(32),
  currency_id BIGINT,
  unit_id BIGINT,
  is_aux_customer TINYINT DEFAULT 0,
  is_aux_supplier TINYINT DEFAULT 0,
  is_aux_project TINYINT DEFAULT 0,
  FOREIGN KEY(currency_id) REFERENCES currencies(id),
  FOREIGN KEY(unit_id) REFERENCES units(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS vouchers (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  account_book_id BIGINT,
  period_id BIGINT,
  number VARCHAR(32),
  date DATE,
  type VARCHAR(32),
  status TINYINT DEFAULT 0,
  created_by BIGINT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  FOREIGN KEY(account_book_id) REFERENCES account_books(id),
  FOREIGN KEY(period_id) REFERENCES periods(id),
  FOREIGN KEY(created_by) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS voucher_lines (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  voucher_id BIGINT,
  line_no INT,
  account_code VARCHAR(32),
  description VARCHAR(255),
  debit DECIMAL(18,2) DEFAULT 0,
  credit DECIMAL(18,2) DEFAULT 0,
  aux_customer VARCHAR(128),
  aux_supplier VARCHAR(128),
  aux_project VARCHAR(128),
  FOREIGN KEY(voucher_id) REFERENCES vouchers(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS account_balances (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  account_book_id BIGINT,
  period_id BIGINT,
  account_code VARCHAR(32),
  begin_debit DECIMAL(18,2) DEFAULT 0,
  begin_credit DECIMAL(18,2) DEFAULT 0,
  curr_debit DECIMAL(18,2) DEFAULT 0,
  curr_credit DECIMAL(18,2) DEFAULT 0,
  end_debit DECIMAL(18,2) DEFAULT 0,
  end_credit DECIMAL(18,2) DEFAULT 0,
  UNIQUE KEY ab_acc(account_book_id, period_id, account_code),
  FOREIGN KEY(account_book_id) REFERENCES account_books(id),
  FOREIGN KEY(period_id) REFERENCES periods(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS operation_logs (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT,
  action VARCHAR(128),
  detail TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO currencies(code,name) VALUES('CNY','人民币') ON DUPLICATE KEY UPDATE name=VALUES(name);
INSERT INTO units(name) VALUES('个') ON DUPLICATE KEY UPDATE name=VALUES(name);
INSERT INTO users(username,phone,password_hash) VALUES('admin',NULL,'admin') ON DUPLICATE KEY UPDATE password_hash=VALUES(password_hash);
INSERT INTO roles(name) VALUES('admin') ON DUPLICATE KEY UPDATE name=VALUES(name);
INSERT INTO account_books(name,currency_id,status) VALUES('默认账套',(SELECT id FROM currencies WHERE code='CNY'),1) ON DUPLICATE KEY UPDATE status=VALUES(status);