CREATE TABLE IF NOT EXISTS travel_library
(
    library_id   BIGINT       NOT NULL AUTO_INCREMENT,
    user_id      BIGINT       NOT NULL,
    title        VARCHAR(100) NOT NULL,
    description  TEXT,
    view_count   INT          NOT NULL DEFAULT 0,
    import_count INT          NOT NULL DEFAULT 0,
    created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (library_id),
    FOREIGN KEY (user_id) REFERENCES users (user_id)
);

CREATE TABLE IF NOT EXISTS library_items
(
    item_id    BIGINT NOT NULL AUTO_INCREMENT,
    library_id BIGINT NOT NULL,
    place_id   BIGINT NOT NULL,
    day_number INT    NOT NULL,
    item_order INT    NOT NULL,
    visit_time TIME,
    cost       INT,
    memo       TEXT,
    PRIMARY KEY (item_id),
    FOREIGN KEY (library_id) REFERENCES travel_library (library_id) ON DELETE CASCADE,
    FOREIGN KEY (place_id) REFERENCES places (place_id)
);

CREATE TABLE IF NOT EXISTS library_routes
(
    route_id     BIGINT      NOT NULL AUTO_INCREMENT,
    library_id   BIGINT      NOT NULL,
    from_item_id BIGINT      NOT NULL,
    to_item_id   BIGINT      NOT NULL,
    transport    VARCHAR(50) DEFAULT NULL,
    move_time    INT,
    cost         INT,
    PRIMARY KEY (route_id),
    UNIQUE KEY uq_library_routes (from_item_id, to_item_id),
    FOREIGN KEY (library_id) REFERENCES travel_library (library_id) ON DELETE CASCADE,
    FOREIGN KEY (from_item_id) REFERENCES library_items (item_id) ON DELETE CASCADE,
    FOREIGN KEY (to_item_id) REFERENCES library_items (item_id) ON DELETE CASCADE
);