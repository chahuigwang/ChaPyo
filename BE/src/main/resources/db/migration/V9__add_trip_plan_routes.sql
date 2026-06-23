CREATE TABLE IF NOT EXISTS trip_plan_routes
(
    route_id     BIGINT   NOT NULL AUTO_INCREMENT,
    from_item_id BIGINT   NOT NULL,
    to_item_id   BIGINT   NOT NULL,
    move_time    INT,
    cost         INT,
    created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (route_id),
    UNIQUE KEY uq_routes (from_item_id, to_item_id),
    FOREIGN KEY (from_item_id) REFERENCES trip_plan_items (item_id) ON DELETE CASCADE,
    FOREIGN KEY (to_item_id) REFERENCES trip_plan_items (item_id) ON DELETE CASCADE
);