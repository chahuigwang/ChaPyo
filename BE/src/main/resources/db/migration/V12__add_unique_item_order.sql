ALTER TABLE trip_plan_items
    ADD UNIQUE KEY uq_item_order (plan_id, day_number, item_order);