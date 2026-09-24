CREATE DATABASE IF NOT EXISTS swaga
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE swaga;


CREATE TABLE users (
    id INT NOT NULL AUTO_INCREMENT,
    login VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    isAdmin TINYINT(1) NOT NULL DEFAULT 0,

    PRIMARY KEY (id),
    UNIQUE KEY uq_users_login (login),
    UNIQUE KEY uq_users_email (email)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;


CREATE TABLE games (
    id INT NOT NULL AUTO_INCREMENT,

    name VARCHAR(255) NOT NULL,
    img TEXT NULL,
    img_card TEXT NULL,

    about_the_game LONGTEXT NULL,
    supported_languages TEXT NULL,
    min_requirements LONGTEXT NULL,
    rec_requirements LONGTEXT NULL,

    genres LONGTEXT NULL,
    screenshots LONGTEXT NULL,
    countries LONGTEXT NULL,
    prices LONGTEXT NULL,

    steam_appid INT NOT NULL,
    steam_price VARCHAR(100) NULL,

    PRIMARY KEY (id)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;


CREATE TABLE subs (
    id INT NOT NULL AUTO_INCREMENT,

    img TEXT NULL,
    title VARCHAR(255) NOT NULL,
    priceNew DECIMAL(10,2) NOT NULL,
    time VARCHAR(100) NULL,

    need_vpn TINYINT(1) NULL,
    is_official TINYINT(1) NULL,
    instant_delivery TINYINT(1) NULL,
    no_account_transfer TINYINT(1) NULL,

    PRIMARY KEY (id)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;


CREATE TABLE orders (
    id INT NOT NULL AUTO_INCREMENT,

    email VARCHAR(255) NOT NULL,
    login VARCHAR(255) NULL,
    type VARCHAR(50) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    idProduct INT NOT NULL,

    PRIMARY KEY (id),

    INDEX idx_orders_email (email),
    INDEX idx_orders_login (login),
    INDEX idx_orders_product (type, idProduct)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;


CREATE TABLE reviews (
    id INT NOT NULL AUTO_INCREMENT,

    login VARCHAR(255) NOT NULL,
    reviewsText TEXT NOT NULL,
    reviewsPoint TINYINT UNSIGNED NOT NULL,

    PRIMARY KEY (id),
    INDEX idx_reviews_login (login)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

CREATE TABLE poster (
    id INT NOT NULL AUTO_INCREMENT,
    img TEXT NOT NULL,
    PRIMARY KEY (id)
) ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;