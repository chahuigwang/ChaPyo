ALTER TABLE trip_plan_items
    DROP COLUMN visit_date,
    ADD COLUMN day_number INT NOT NULL;