-- areas
CREATE TABLE IF NOT EXISTS areas (
    area_code  VARCHAR(10)  NOT NULL,
    name       VARCHAR(20)  NOT NULL,
    PRIMARY KEY (area_code)
);

-- districts
CREATE TABLE IF NOT EXISTS districts (
    area_code     VARCHAR(10)  NOT NULL,
    district_code VARCHAR(10)  NOT NULL,
    name          VARCHAR(20)  NOT NULL,
    PRIMARY KEY (area_code, district_code),
    FOREIGN KEY (area_code) REFERENCES areas(area_code)
);

-- categories
CREATE TABLE IF NOT EXISTS categories (
    code        VARCHAR(10)  NOT NULL,
    name        VARCHAR(20)  NOT NULL,
    parent_code VARCHAR(10)  DEFAULT NULL,
    PRIMARY KEY (code),
    FOREIGN KEY (parent_code) REFERENCES categories(code)
);

-- users
CREATE TABLE IF NOT EXISTS users (
    user_id    BIGINT                NOT NULL AUTO_INCREMENT,
    nickname   VARCHAR(50)           NOT NULL,
    email      VARCHAR(100)          NOT NULL,
    password   VARCHAR(255)          NOT NULL,
    role       ENUM('USER', 'ADMIN') NOT NULL DEFAULT 'USER',
    created_at DATETIME              NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME              NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at DATETIME              DEFAULT NULL,
    PRIMARY KEY (user_id),
    UNIQUE KEY uq_users_email (email)
);

-- places
CREATE TABLE IF NOT EXISTS places (
    place_id       BIGINT          NOT NULL AUTO_INCREMENT,
    content_id     VARCHAR(20)     NOT NULL,
    title          VARCHAR(100)    NOT NULL,
    addr1          VARCHAR(255),
    addr2          TEXT,
    latitude       DECIMAL(13, 10),
    longitude      DECIMAL(13, 10),
    first_image1   VARCHAR(255),
    first_image2   VARCHAR(255),
    area_code      VARCHAR(10),
    district_code  VARCHAR(10),
    category_code1 VARCHAR(10),
    category_code2 VARCHAR(10),
    zipcode        VARCHAR(10),
    tel            VARCHAR(50),
    overview       TEXT,
    PRIMARY KEY (place_id),
    UNIQUE KEY uq_places_content_id (content_id),
    FOREIGN KEY (area_code) REFERENCES areas(area_code),
    FOREIGN KEY (area_code, district_code) REFERENCES districts(area_code, district_code),
    FOREIGN KEY (category_code1) REFERENCES categories(code),
    FOREIGN KEY (category_code2) REFERENCES categories(code)
);

-- place_likes
CREATE TABLE IF NOT EXISTS place_likes (
    place_id   BIGINT    NOT NULL,
    user_id    BIGINT    NOT NULL,
    created_at DATETIME  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (place_id, user_id),
    FOREIGN KEY (place_id) REFERENCES places(place_id),
    FOREIGN KEY (user_id)  REFERENCES users(user_id)
);

-- trip_plans
CREATE TABLE IF NOT EXISTS trip_plans (
    plan_id    BIGINT        NOT NULL AUTO_INCREMENT,
    title      VARCHAR(100)  NOT NULL,
    start_date DATE,
    end_date   DATE,
    created_at DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (plan_id)
);

-- trip_plan_members
CREATE TABLE IF NOT EXISTS trip_plan_members (
    plan_id  BIGINT  NOT NULL,
    user_id  BIGINT  NOT NULL,
    PRIMARY KEY (plan_id, user_id),
    FOREIGN KEY (plan_id) REFERENCES trip_plans(plan_id),
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

-- trip_plan_items
CREATE TABLE IF NOT EXISTS trip_plan_items (
    item_id    BIGINT    NOT NULL AUTO_INCREMENT,
    plan_id    BIGINT    NOT NULL,
    place_id   BIGINT    NOT NULL,
    user_id    BIGINT    NOT NULL,
    visit_date DATE      NOT NULL,
    item_order INT       NOT NULL,
    visit_time TIME,
    cost       INT,
    memo       TEXT,
    created_at DATETIME  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME  NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (item_id),
    FOREIGN KEY (plan_id)  REFERENCES trip_plans(plan_id),
    FOREIGN KEY (place_id) REFERENCES places(place_id),
    FOREIGN KEY (user_id)  REFERENCES users(user_id)
);
