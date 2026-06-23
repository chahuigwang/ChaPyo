ALTER TABLE trip_plan_items
    CHANGE COLUMN user_id adder_id BIGINT NOT NULL;

ALTER TABLE trip_plan_items
    ADD COLUMN payer_id BIGINT DEFAULT NULL;

ALTER TABLE trip_plan_items
    ADD CONSTRAINT fk_trip_plan_items_payer_id
        FOREIGN KEY (payer_id) REFERENCES users (user_id);