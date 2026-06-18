CREATE TABLE IF NOT EXISTS reviews
(
    review_id  BIGINT   NOT NULL AUTO_INCREMENT,
    place_id   BIGINT   NOT NULL,
    user_id    BIGINT   NOT NULL,
    content    TEXT     NOT NULL,
    rating     TINYINT  NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (review_id),
    UNIQUE KEY uq_reviews_place_user (place_id, user_id),
    FOREIGN KEY (place_id) REFERENCES places (place_id),
    FOREIGN KEY (user_id) REFERENCES users (user_id)
);