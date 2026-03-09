alter table "public"."profiles"
add column if not exists "tour_current_step" integer default 0;
