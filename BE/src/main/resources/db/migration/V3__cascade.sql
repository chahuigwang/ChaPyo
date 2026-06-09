ALTER TABLE trip_plan_members
    DROP FOREIGN KEY trip_plan_members_ibfk_1,
    ADD CONSTRAINT fk_trip_plan_members_plan_id
        FOREIGN KEY (plan_id) REFERENCES trip_plans(plan_id) ON DELETE CASCADE;

ALTER TABLE trip_plan_items
    DROP FOREIGN KEY trip_plan_items_ibfk_1,
    ADD CONSTRAINT fk_trip_plan_items_plan_id
        FOREIGN KEY (plan_id) REFERENCES trip_plans(plan_id) ON DELETE CASCADE;