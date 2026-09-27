-- ═══════════════════════════════════════════════════════════════════════
--  CommuniServe — DEVELOPMENT SEED DATA
--
--  ⚠ DEVELOPMENT ONLY. Do NOT run this against the pilot or production
--  database. Every row it creates is tagged with the email domain
--  @seed.communiserve.test so it can be removed cleanly — see the
--  CLEANUP block at the bottom of this file.
--
--  Creates four approved providers (with skills, verified PINs, reviews)
--  and one seed customer, so the search, profile and requests screens have
--  something to render.
--
--  Seeded users have auth_id = NULL: they exist for display only and cannot
--  log in. To test the provider portal as a real account, register through
--  /register/provider and approve yourself in the admin dashboard.
--
--  Run AFTER both migrations. Idempotent — safe to re-run.
-- ═══════════════════════════════════════════════════════════════════════

DO $$
DECLARE
    v_user_id     bigint;
    v_provider_id bigint;
    v_customer_id bigint;
    v_cust_user   bigint;
    v_job_id      bigint;
BEGIN

    -- Bail out if the seed has already been applied.
    IF EXISTS (SELECT 1 FROM public.users WHERE email LIKE '%@seed.communiserve.test') THEN
        RAISE NOTICE 'Seed data already present — nothing to do.';
        RETURN;
    END IF;

    -- ═══════════════════════════════════════════════════════════════
    --  PROVIDER 1 — Rico Salvador, Electrician, Poblacion
    -- ═══════════════════════════════════════════════════════════════
    INSERT INTO public.users (full_name, email, password_hash, role, contact_number, barangay)
    VALUES ('Rico Salvador', 'rico@seed.communiserve.test', 'SEED_NO_LOGIN', 'Provider', '09171234001', 'Poblacion')
    RETURNING user_id INTO v_user_id;

    INSERT INTO public.providers (user_id, trade_category, admin_status, average_rating, bio)
    VALUES (v_user_id, 'Electrician', 'Approved', 0.00,
            'Licensed electrician with over a decade of experience wiring homes and small businesses across Anini-y. Specializes in troubleshooting outages and safe rewiring.')
    RETURNING provider_id INTO v_provider_id;

    INSERT INTO public.provider_identity (provider_id, national_id_pin, id_verified_at)
    VALUES (v_provider_id, '1234567890120001', now());

    INSERT INTO public.skills (provider_id, skill_name, description, years_experience) VALUES
        (v_provider_id, 'Household Rewiring',    'Full or partial rewiring of residential electrical systems.', 11),
        (v_provider_id, 'Circuit Breaker Repair','Diagnosing and fixing breaker trips and panel issues.',        9);

    -- ═══════════════════════════════════════════════════════════════
    --  SEED CUSTOMER — needed so reviews have an author
    -- ═══════════════════════════════════════════════════════════════
    INSERT INTO public.users (full_name, email, password_hash, role, contact_number, barangay)
    VALUES ('Ana Reyes', 'ana@seed.communiserve.test', 'SEED_NO_LOGIN', 'Customer', '09179876543', 'Poblacion')
    RETURNING user_id INTO v_cust_user;

    INSERT INTO public.customers (user_id, preferred_barangay)
    VALUES (v_cust_user, 'Poblacion')
    RETURNING customer_id INTO v_customer_id;

    -- A completed job, then its review. ratings.job_id is NOT NULL, so the
    -- job must exist first. The update_avg_rating trigger recalculates
    -- providers.average_rating automatically on insert.
    INSERT INTO public.job_requests
        (customer_id, provider_id, service_description, service_street, service_barangay, job_status, completed_at)
    VALUES
        (v_customer_id, v_provider_id, 'Breaker kept tripping in the kitchen.', 'Purok 2', 'Poblacion', 'Completed', now())
    RETURNING job_id INTO v_job_id;

    INSERT INTO public.ratings (job_id, customer_id, provider_id, stars, review_text)
    VALUES (v_job_id, v_customer_id, v_provider_id, 5,
            'Fixed our breaker panel quickly and explained everything clearly. Very professional.');

    -- ═══════════════════════════════════════════════════════════════
    --  PROVIDER 2 — Bien Amoranto, Electrician, San Roque
    -- ═══════════════════════════════════════════════════════════════
    INSERT INTO public.users (full_name, email, password_hash, role, contact_number, barangay)
    VALUES ('Bien Amoranto', 'bien@seed.communiserve.test', 'SEED_NO_LOGIN', 'Provider', '09171234002', 'San Roque')
    RETURNING user_id INTO v_user_id;

    INSERT INTO public.providers (user_id, trade_category, admin_status, average_rating, bio)
    VALUES (v_user_id, 'Electrician', 'Approved', 0.00,
            'Community electrician handling household repairs, appliance installation, and minor renovations. Available for barangay-wide service calls.')
    RETURNING provider_id INTO v_provider_id;

    INSERT INTO public.provider_identity (provider_id, national_id_pin, id_verified_at)
    VALUES (v_provider_id, '1234567890120002', now());

    INSERT INTO public.skills (provider_id, skill_name, description, years_experience) VALUES
        (v_provider_id, 'Appliance Installation', 'Safe installation of major home appliances.', 6),
        (v_provider_id, 'Outlet & Switch Repair', 'Replacing faulty outlets, switches, and fixtures.', 6);

    INSERT INTO public.job_requests
        (customer_id, provider_id, service_description, service_barangay, job_status, completed_at)
    VALUES
        (v_customer_id, v_provider_id, 'Installed a new ceiling fan.', 'San Roque', 'Completed', now())
    RETURNING job_id INTO v_job_id;

    INSERT INTO public.ratings (job_id, customer_id, provider_id, stars, review_text)
    VALUES (v_job_id, v_customer_id, v_provider_id, 4,
            'Good work overall, arrived a little later than scheduled.');

    -- ═══════════════════════════════════════════════════════════════
    --  PROVIDER 3 — Danilo Cortez, Carpenter, Tagaytay
    -- ═══════════════════════════════════════════════════════════════
    INSERT INTO public.users (full_name, email, password_hash, role, contact_number, barangay)
    VALUES ('Danilo Cortez', 'danilo@seed.communiserve.test', 'SEED_NO_LOGIN', 'Provider', '09171234003', 'Tagaytay')
    RETURNING user_id INTO v_user_id;

    INSERT INTO public.providers (user_id, trade_category, admin_status, average_rating, bio)
    VALUES (v_user_id, 'Carpenter', 'Approved', 0.00,
            'Carpenter specializing in furniture repair, home fixtures, and light construction work. Known for careful, tidy craftsmanship.')
    RETURNING provider_id INTO v_provider_id;

    INSERT INTO public.provider_identity (provider_id, national_id_pin, id_verified_at)
    VALUES (v_provider_id, '1234567890120003', now());

    INSERT INTO public.skills (provider_id, skill_name, description, years_experience) VALUES
        (v_provider_id, 'Furniture Repair',     'Restoring and repairing wooden furniture.', 15),
        (v_provider_id, 'Cabinet Installation', 'Custom cabinet building and fitting.',      12);

    INSERT INTO public.job_requests
        (customer_id, provider_id, service_description, service_barangay, job_status, completed_at)
    VALUES
        (v_customer_id, v_provider_id, 'Repaired an old dining table.', 'Tagaytay', 'Completed', now())
    RETURNING job_id INTO v_job_id;

    INSERT INTO public.ratings (job_id, customer_id, provider_id, stars, review_text)
    VALUES (v_job_id, v_customer_id, v_provider_id, 5,
            'Beautiful cabinet work, very careful with measurements.');

    -- ═══════════════════════════════════════════════════════════════
    --  PROVIDER 4 — Julieta Fernandez, Kasambahay, Poblacion
    -- ═══════════════════════════════════════════════════════════════
    INSERT INTO public.users (full_name, email, password_hash, role, contact_number, barangay)
    VALUES ('Julieta Fernandez', 'julieta@seed.communiserve.test', 'SEED_NO_LOGIN', 'Provider', '09171234004', 'Poblacion')
    RETURNING user_id INTO v_user_id;

    INSERT INTO public.providers (user_id, trade_category, admin_status, average_rating, bio)
    VALUES (v_user_id, 'Kasambahay', 'Approved', 0.00,
            'Experienced household helper offering cleaning, cooking, and childcare support. LGU-verified and community trusted.')
    RETURNING provider_id INTO v_provider_id;

    INSERT INTO public.provider_identity (provider_id, national_id_pin, id_verified_at)
    VALUES (v_provider_id, '1234567890120004', now());

    INSERT INTO public.skills (provider_id, skill_name, description, years_experience) VALUES
        (v_provider_id, 'Housekeeping', 'General home cleaning and organization.',  9),
        (v_provider_id, 'Childcare',    'Supervised childcare for working families.', 7);

    INSERT INTO public.job_requests
        (customer_id, provider_id, service_description, service_barangay, job_status, completed_at)
    VALUES
        (v_customer_id, v_provider_id, 'Weekly house cleaning assistance.', 'Poblacion', 'Completed', now())
    RETURNING job_id INTO v_job_id;

    INSERT INTO public.ratings (job_id, customer_id, provider_id, stars, review_text)
    VALUES (v_job_id, v_customer_id, v_provider_id, 5,
            'Julieta is wonderful with our kids and very trustworthy.');

    RAISE NOTICE 'Seed complete: 4 approved providers, 1 seed customer, 4 reviews.';
END
$$;


-- ═══════════════════════════════════════════════════════════════════════
--  OPTIONAL — give YOUR OWN customer account some live requests
--
--  The seeded requests above belong to the seed customer, who cannot log
--  in, so /customer/requests will still look empty for you. Run this block
--  to copy a few requests onto your real account.
--
--  Replace the email on the first line with the address you registered with.
-- ═══════════════════════════════════════════════════════════════════════

-- DO $$
-- DECLARE
--     v_my_email    text := 'REPLACE_WITH_YOUR_EMAIL@example.com';
--     v_customer_id bigint;
-- BEGIN
--     SELECT c.customer_id INTO v_customer_id
--     FROM public.customers c
--     JOIN public.users u ON u.user_id = c.user_id
--     WHERE lower(u.email) = lower(v_my_email);
--
--     IF v_customer_id IS NULL THEN
--         RAISE EXCEPTION 'No customer found for %. Register at /register/customer first.', v_my_email;
--     END IF;
--
--     INSERT INTO public.job_requests
--         (customer_id, provider_id, service_description, service_barangay, job_status)
--     SELECT v_customer_id, p.provider_id, s.descr, 'Poblacion', s.status
--     FROM (VALUES
--             ('Outlet not working in the living room.', 'Pending'),
--             ('Repair a broken cabinet door.',          'Accepted'),
--             ('Weekly house cleaning assistance.',      'Ongoing')
--          ) AS s(descr, status)
--     JOIN LATERAL (
--         SELECT provider_id FROM public.providers
--         WHERE admin_status = 'Approved' ORDER BY provider_id LIMIT 1
--     ) p ON true;
--
--     RAISE NOTICE 'Added 3 requests to %', v_my_email;
-- END
-- $$;


-- ═══════════════════════════════════════════════════════════════════════
--  CLEANUP — removes everything this file created.
--  provider_identity, skills, provider_files, job_requests and ratings all
--  cascade from providers/users, so deleting the seed users is enough.
-- ═══════════════════════════════════════════════════════════════════════

-- DELETE FROM public.users WHERE email LIKE '%@seed.communiserve.test';
