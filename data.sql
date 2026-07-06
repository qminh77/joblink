--
-- PostgreSQL database dump
--

\restrict zUtLrnHN6oEZlez8PVv6P1rwn1BVskEGlcuSaPhwD5pILWRaxuxf1eda43MvqrN

-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.6

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

SET SESSION AUTHORIZATION DEFAULT;

ALTER TABLE public.users DISABLE TRIGGER ALL;

COPY public.users (id, auth_id, email, role, status, email_verified_at, phone, phone_verified_at, locale, last_login_at, connection_count, profile_view_count, created_at, updated_at, deleted_at) FROM stdin;
6	119ad3ca-e1bf-4076-a9ca-ca95bc65b2b9	dao.2403700020@st.umt.edu.vn	member	active	2026-06-20 07:06:48.87475+00	\N	\N	vi	\N	0	0	2026-06-20 08:13:45.281878+00	2026-06-22 07:02:10.360457+00	\N
17	d7aae378-bb02-46ac-86c6-192ad666cba0	ypw52761@laoia.com	company	active	2026-07-04 08:07:43.117616+00	\N	\N	vi	\N	0	0	2026-07-04 08:07:43.048089+00	2026-07-04 08:09:17.814135+00	\N
16	df90031a-e917-430d-8f40-7ff9db77c311	jzrwkfmmflqyhwcvff@gonrr.net	company	active	2026-07-04 08:05:07.783792+00	\N	\N	vi	\N	0	0	2026-07-04 08:05:07.678506+00	2026-07-04 08:09:25.311132+00	\N
18	507763ba-1a66-48da-a2ab-7bce81823a52	fge03880@laoia.com	company	active	2026-07-04 08:26:41.258709+00	\N	\N	vi	\N	0	0	2026-07-04 08:26:41.171087+00	2026-07-04 08:28:25.008595+00	\N
7	c0887dcd-2f94-492e-ab6a-5cd0136a4fd5	testuser_abc123@gmail.com	member	active	2026-06-19 09:55:07.080939+00	\N	\N	vi	\N	0	0	2026-06-20 08:13:45.281878+00	2026-06-22 07:02:10.360457+00	\N
8	c1f16bf6-4b73-48ad-897c-538261feb7f4	thubuianh42@gmail.com	member	active	2026-06-19 13:15:11.669286+00	\N	\N	vi	\N	0	0	2026-06-20 08:13:45.281878+00	2026-06-22 07:02:10.360457+00	\N
9	125e4783-ec71-4609-b975-201d71590dd9	trucdao10a1@gmail.com	member	active	2026-06-20 07:03:13.707664+00	\N	\N	vi	\N	0	0	2026-06-20 08:13:45.281878+00	2026-06-22 07:02:10.360457+00	\N
10	0b7f87b0-14d4-4432-9750-e8602a6e88ad	dao.2403700020@st.umt.edu.vnda	member	active	2026-06-20 07:04:48.20826+00	\N	\N	vi	\N	0	0	2026-06-20 08:13:45.281878+00	2026-06-22 07:02:10.360457+00	\N
5	633839d2-dac4-4045-9649-162eb496b236	admin@gmail.com	admin	active	2026-06-19 10:11:13.041523+00	\N	\N	vi	\N	0	0	2026-06-20 08:13:45.281878+00	2026-06-22 07:02:10.360457+00	\N
3	f4d44ec2-74fd-4dc4-bc85-f2dfaa5fb98a	contact@umt.edu.vn	company	active	2026-06-19 13:06:29.086419+00	\N	\N	vi	\N	0	0	2026-06-20 08:13:45.281878+00	2026-06-22 07:02:10.360457+00	\N
1	3d92a544-fd0f-4d40-983b-ce5208ca5f2c	wing.nhuu@gmail.com	admin	active	2026-06-20 06:58:22.279672+00	\N	\N	vi	\N	4	6	2026-06-20 08:13:45.281878+00	2026-06-22 07:02:10.360457+00	\N
4	e6afa43d-7429-4be0-86ed-d6ed0226b52b	minh@gmail.com	member	active	2026-06-19 09:50:43.790565+00	\N	\N	vi	\N	3	3	2026-06-20 08:13:45.281878+00	2026-06-22 07:02:10.360457+00	\N
19	74890aac-fae6-4ab2-9af2-1fbd0ed5a3c1	oxg57491@laoia.com	company	active	2026-07-04 08:36:57.378418+00	\N	\N	vi	\N	0	0	2026-07-04 08:36:57.280946+00	2026-07-04 08:37:37.873928+00	\N
20	59f7114d-bf1f-4420-8fd8-6df3b98409a0	joblink-company-test+1783155368970@example.com	company	active	2026-07-04 08:56:09.772275+00	\N	\N	vi	\N	0	0	2026-07-04 08:56:09.65545+00	2026-07-04 08:56:09.65545+00	\N
21	4ccbff26-88d0-47b7-928b-bf3a67ab59d4	odw06273@laoia.com	company	active	2026-07-04 09:17:11.410974+00	\N	\N	vi	\N	0	0	2026-07-04 09:17:11.284272+00	2026-07-04 09:17:46.015718+00	\N
11	4e73ac50-3231-46a8-9d38-8562ef15e69f	nhu.2403700160@st.umt.edu.vn	company	active	2026-06-20 07:17:23.150195+00	\N	\N	vi	\N	4	0	2026-06-20 08:13:45.281878+00	2026-06-23 01:14:38.001598+00	\N
12	49aaf3cd-50d5-4800-bc82-413123f9cf41	nhu0906401040@gmail.com	member	active	2026-06-20 11:30:55.474392+00	\N	\N	vi	\N	2	0	2026-06-20 11:30:55.400726+00	2026-06-23 02:21:15.176569+00	\N
22	b4013550-76f8-40f0-b8c3-110067c6748f	ytf22653@laoia.com	company	active	2026-07-04 09:25:18.626+00	\N	\N	vi	\N	0	0	2026-07-04 09:25:18.568533+00	2026-07-04 09:25:57.431195+00	\N
23	7956ef6e-5a13-41f2-a5b6-e496b91a723b	rcu42386@laoia.com	company	active	2026-07-04 09:29:19.562853+00	\N	\N	vi	\N	0	0	2026-07-04 09:29:19.509923+00	2026-07-04 09:30:03.00147+00	\N
24	5d76ee10-b320-4b47-ab25-655c4f04797a	dfc74857@laoia.com	company	active	2026-07-04 09:39:38.887165+00	\N	\N	vi	\N	0	0	2026-07-04 09:39:38.719426+00	2026-07-04 09:39:59.522154+00	\N
14	b588b03e-96ad-4ded-8830-00d589dfeae6	phbn303030@gmail.com	member	active	2026-06-23 03:41:15.205507+00	\N	\N	vi	\N	1	0	2026-06-23 03:41:15.074292+00	2026-06-30 02:58:55.359417+00	\N
13	a8571630-883f-4b6c-85ae-70db1b777e1a	mrfuc@yahoo.com	member	active	2026-06-22 02:42:49.902543+00	\N	\N	vi	\N	5	2	2026-06-22 02:42:49.761311+00	2026-07-02 12:43:59.523113+00	\N
25	3c53bca9-fa0d-453b-969f-38a9fe495767	cgj13380@laoia.com	company	active	2026-07-04 09:46:51.691253+00	\N	\N	vi	\N	0	0	2026-07-04 09:46:51.60256+00	2026-07-04 09:47:11.969444+00	\N
2	00c2f6d4-44e5-48d2-80eb-5db3008165d5	minhminh3456minh@gmail.com	member	active	2026-06-19 13:36:51.949228+00	\N	\N	vi	\N	4	7	2026-06-20 08:13:45.281878+00	2026-07-03 08:19:31.918163+00	\N
15	30970992-9b2c-478f-a33f-578e0c1b2449	trvanthanhhmaster@gmail.com	member	active	2026-06-28 13:28:20.581925+00	\N	\N	vi	\N	1	2	2026-06-28 13:28:20.272509+00	2026-07-04 13:03:31.666504+00	\N
26	c5b44a28-c784-432e-8ef8-80d30b48f634	tkclone3rd@gmail.com	member	active	2026-07-04 13:41:03.25541+00	\N	\N	vi	\N	0	3	2026-07-04 13:41:03.098649+00	2026-07-04 14:02:41.411244+00	\N
\.


ALTER TABLE public.users ENABLE TRIGGER ALL;

--
-- Data for Name: audit_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public.audit_logs DISABLE TRIGGER ALL;

COPY public.audit_logs (id, actor_id, action, entity_type, entity_id, old_data, new_data, reason, ip_address, user_agent, created_at) FROM stdin;
1	5	company.approve	company_profiles	3	{"verification_status": "pending"}	{"verification_status": "verified"}	Duyệt	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5 Safari/605.1.15	2026-06-20 08:27:17.893114+00
2	5	company.approve	company_profiles	11	{"verification_status": "pending"}	{"verification_status": "verified"}	Duyệt	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5 Safari/605.1.15	2026-06-20 08:27:24.041558+00
3	\N	soft_delete	posts	7	{"status": "active", "author_id": 11}	\N	\N	\N	\N	2026-06-20 08:31:53.086512+00
4	1	post.hide	posts	5	{"status": "active", "content": "lien minh tri thuc"}	{"status": "hidden"}	vi phạm bản quyền	113.22.113.75	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36 Edg/149.0.0.0	2026-06-20 09:27:16.409036+00
5	1	post.restore	posts	5	{"status": "hidden", "content": "lien minh tri thuc"}	{"status": "active"}	thích	113.22.113.75	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36 Edg/149.0.0.0	2026-06-20 09:27:37.795094+00
6	1	report.in_review	reports	2	{"status": "pending"}	{"status": "in_review"}	\N	113.22.113.75	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36 Edg/149.0.0.0	2026-06-20 09:28:30.481165+00
7	1	report.in_review	reports	1	{"status": "pending"}	{"status": "in_review"}	\N	113.22.113.75	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36 Edg/149.0.0.0	2026-06-20 09:28:41.133558+00
8	5	lookup.job_types.delete	job_types	6	\N	\N	\N	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5 Safari/605.1.15	2026-06-20 09:36:45.306361+00
9	5	lookup.job_types.delete	job_types	7	\N	\N	\N	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5 Safari/605.1.15	2026-06-20 09:36:50.841954+00
10	5	settings.update	system_settings	\N	\N	{"site_name": "Joblink", "smtp_host": null, "smtp_port": 587, "contact_email": null, "contact_phone": null, "site_logo_url": null, "smtp_password": null, "smtp_username": null, "upload_max_mb": 10, "default_locale": "vi", "smtp_from_name": "Joblink", "contact_address": null, "contact_content": null, "contact_map_url": null, "passkey_enabled": true, "smtp_encryption": "tls", "smtp_from_email": null, "default_currency": "VND", "default_timezone": "Asia/Ho_Chi_Minh", "login_rate_limit": 10, "maintenance_mode": false, "recaptcha_secret": null, "site_description": "Mạng xã hội việc làm và tuyển dụng chuyên nghiệp", "site_favicon_url": null, "available_locales": ["vi", "en"], "recaptcha_enabled": false, "require_2fa_admin": true, "recaptcha_site_key": null, "google_auth_enabled": true, "maintenance_message": "Hệ thống đang được bảo trì. Vui lòng quay lại sau ít phút.", "require_email_verification": false}	\N	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5 Safari/605.1.15	2026-06-20 09:48:49.476121+00
11	5	report.dismissed	reports	2	{"status": "in_review"}	{"status": "dismissed"}	\N	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5 Safari/605.1.15	2026-06-20 09:56:37.350538+00
12	5	report.dismissed	reports	1	{"status": "in_review"}	{"status": "dismissed"}	\N	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5 Safari/605.1.15	2026-06-20 09:56:39.677336+00
13	5	settings.update	system_settings	\N	\N	{"site_name": "Joblink", "smtp_host": "mail.umters.club", "smtp_port": 587, "contact_email": null, "contact_phone": null, "site_logo_url": null, "smtp_password": "y*8OD&A$WLZF7?tD", "smtp_username": "noreply@umters.club", "upload_max_mb": 10, "default_locale": "vi", "smtp_from_name": "Joblink", "contact_address": null, "contact_content": null, "contact_map_url": null, "passkey_enabled": true, "smtp_encryption": "tls", "smtp_from_email": "noreply@umters.club", "default_currency": "VND", "default_timezone": "Asia/Ho_Chi_Minh", "login_rate_limit": 10, "maintenance_mode": false, "recaptcha_secret": null, "site_description": "Mạng xã hội việc làm và tuyển dụng chuyên nghiệp", "site_favicon_url": null, "available_locales": ["vi", "en"], "recaptcha_enabled": false, "require_2fa_admin": true, "recaptcha_site_key": null, "google_auth_enabled": true, "maintenance_message": "Hệ thống đang được bảo trì. Vui lòng quay lại sau ít phút.", "require_email_verification": false}	\N	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5 Safari/605.1.15	2026-06-20 14:05:10.073301+00
14	5	settings.smtp_test	system_settings	\N	\N	{"to": "minhminh3456minh@gmail.com"}	\N	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5 Safari/605.1.15	2026-06-20 14:05:23.687941+00
15	5	lookup.work_modes.delete	work_modes	4	\N	\N	\N	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5 Safari/605.1.15	2026-06-20 14:40:55.441945+00
16	2	post.poll_vote	poll_votes	11	\N	{"optionId": 7}	\N	172.226.46.113	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5 Safari/605.1.15	2026-06-21 14:18:29.177753+00
17	2	post.comment_add	post_comments	11	\N	{"content": "@[Công Ty TNHH MTV Mua Bán Vũ Khí Vũ Trang](11) gê zzz"}	\N	172.226.46.113	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5 Safari/605.1.15	2026-06-21 14:18:48.645458+00
18	5	user.rbac_role.update	users	2	{"role_id": 5}	{"role_id": 2, "role_name": "member"}	\N	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5 Safari/605.1.15	2026-06-22 00:25:23.839937+00
19	5	user.rbac_role.update	users	2	{"role_id": 2}	{"role_id": 5, "role_name": "user_manager"}	\N	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5 Safari/605.1.15	2026-06-22 00:25:30.596752+00
20	5	user.rbac_role.update	users	2	{"role_id": 5}	{"role_id": 2, "role_name": "member"}	\N	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5 Safari/605.1.15	2026-06-22 00:29:53.637062+00
21	5	user.rbac_role.update	users	2	{"role_id": 2}	{"role_id": 5, "role_name": "user_manager"}	\N	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5 Safari/605.1.15	2026-06-22 00:30:02.026865+00
22	5	user.rbac_role.update	users	2	{"role_id": 2}	{"role_id": 2, "role_name": "member"}	\N	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5 Safari/605.1.15	2026-06-22 00:36:01.57111+00
23	5	user.rbac_role.update	users	2	{"role_id": 2}	{"role_id": 5, "role_name": "user_manager"}	\N	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5 Safari/605.1.15	2026-06-22 00:36:11.169037+00
24	1	messaging.send	messages	1	\N	{"recipientId": 2}	\N	14.241.228.11	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36 Edg/149.0.0.0	2026-06-22 02:39:39.965666+00
25	13	network.connection_send	connections	6	\N	\N	\N	103.199.32.214	Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5 Mobile/15E148 Safari/604.1	2026-06-22 02:43:29.37833+00
26	13	network.connection_send	connections	9	\N	\N	\N	103.199.32.214	Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5 Mobile/15E148 Safari/604.1	2026-06-22 02:43:32.958671+00
27	13	network.connection_send	connections	4	\N	\N	\N	103.199.32.214	Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5 Mobile/15E148 Safari/604.1	2026-06-22 02:43:33.507547+00
28	13	network.connection_send	connections	7	\N	\N	\N	103.199.32.214	Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5 Mobile/15E148 Safari/604.1	2026-06-22 02:43:33.708749+00
29	13	cv.register	member_cvs	9	\N	{"fileName": "Tao2022"}	\N	103.199.32.214	Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5 Mobile/15E148 Safari/604.1	2026-06-22 02:44:29.051916+00
30	13	job.apply	job_applications	2	\N	{"jobId": 2}	\N	103.199.32.214	Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5 Mobile/15E148 Safari/604.1	2026-06-22 02:44:39.325454+00
31	1	post.reaction_add	post_reactions	15	\N	\N	\N	14.241.228.11	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36 Edg/149.0.0.0	2026-06-22 02:44:59.37787+00
32	1	post.reaction_remove	post_reactions	15	\N	\N	\N	14.241.228.11	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36 Edg/149.0.0.0	2026-06-22 02:45:02.846722+00
33	1	post.reaction_add	post_reactions	15	\N	\N	\N	14.241.228.11	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36 Edg/149.0.0.0	2026-06-22 02:45:07.264093+00
34	1	post.reaction_remove	post_reactions	15	\N	\N	\N	14.241.228.11	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36 Edg/149.0.0.0	2026-06-22 02:45:10.392088+00
35	1	post.reaction_add	post_reactions	15	\N	\N	\N	14.241.228.11	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36 Edg/149.0.0.0	2026-06-22 02:45:14.756322+00
36	13	profile.media_update	member_profiles	13	\N	{"avatarUrl": "https://awetfafplorxlmdifkqd.supabase.co/storage/v1/object/public/uploads/member-avatar/2026/06/13/0a033f7f-8c5c-4fff-ab10-459a4a46a60b.jpg"}	\N	103.199.32.214	Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5 Mobile/15E148 Safari/604.1	2026-06-22 02:45:15.430183+00
37	1	post.reaction_remove	post_reactions	15	\N	\N	\N	14.241.228.11	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36 Edg/149.0.0.0	2026-06-22 02:45:19.005153+00
38	1	post.comment_add	post_comments	15	\N	{"content": "hih"}	\N	14.241.228.11	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36 Edg/149.0.0.0	2026-06-22 02:45:31.801447+00
39	13	profile.update	member_profiles	13	\N	{"fullName": "Nguyễn Fuck Dui", "headline": ""}	\N	103.199.32.214	Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5 Mobile/15E148 Safari/604.1	2026-06-22 02:45:41.980804+00
40	13	network.connection_send	connections	12	\N	\N	\N	103.199.32.214	Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5 Mobile/15E148 Safari/604.1	2026-06-22 02:46:02.022486+00
41	13	network.connection_send	connections	2	\N	\N	\N	103.199.32.214	Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5 Mobile/15E148 Safari/604.1	2026-06-22 02:46:06.216762+00
42	13	network.connection_send	connections	10	\N	\N	\N	103.199.32.214	Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5 Mobile/15E148 Safari/604.1	2026-06-22 02:46:15.136827+00
43	2	post.comment_add	post_comments	15	\N	{"content": "@[wing nhu](1) Cc"}	\N	104.28.71.161	Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5 Mobile/15E148 Safari/604.1	2026-06-22 02:46:15.452056+00
44	13	network.connection_send	connections	11	\N	\N	\N	103.199.32.214	Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5 Mobile/15E148 Safari/604.1	2026-06-22 02:46:24.138061+00
45	1	post.comment_add	post_comments	15	\N	{"content": "@[Nguyễn Quốc Minh](2) ddu me may chui tao har"}	\N	14.241.228.11	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36 Edg/149.0.0.0	2026-06-22 02:46:39.390977+00
46	2	post.comment_add	post_comments	15	\N	{"content": "@[wing nhu](1) Kemetao"}	\N	104.28.71.161	Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5 Mobile/15E148 Safari/604.1	2026-06-22 02:46:50.641039+00
47	1	network.connection_send	connections	13	\N	\N	\N	14.241.228.11	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36 Edg/149.0.0.0	2026-06-22 02:47:14.909713+00
48	13	network.connection_accept	connections	14	\N	\N	\N	103.199.32.214	Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5 Mobile/15E148 Safari/604.1	2026-06-22 02:47:22.592616+00
49	13	post.comment_add	post_comments	11	\N	{"content": "Đi coi ám ảnh"}	\N	103.199.32.214	Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5 Mobile/15E148 Safari/604.1	2026-06-22 02:48:05.006687+00
50	13	profile.media_update	member_profiles	13	\N	{"coverUrl": "https://awetfafplorxlmdifkqd.supabase.co/storage/v1/object/public/uploads/member-cover/2026/06/13/d06a999a-67cf-484f-bf73-c9202d58ee4a.jpg"}	\N	103.199.32.214	Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5 Mobile/15E148 Safari/604.1	2026-06-22 02:50:04.893004+00
51	1	messaging.send	messages	4	\N	{"recipientId": 13}	\N	14.241.228.11	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36 Edg/149.0.0.0	2026-06-22 02:50:40.021629+00
52	13	messaging.send	messages	4	\N	{"recipientId": 1}	\N	103.199.32.214	Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5 Mobile/15E148 Safari/604.1	2026-06-22 02:51:00.276083+00
53	13	post.create	posts	16	\N	{"visibility": "public"}	\N	103.199.32.214	Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5 Mobile/15E148 Safari/604.1	2026-06-22 02:52:01.212189+00
54	13	post.create	posts	17	\N	{"visibility": "public"}	\N	103.199.32.214	Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5 Mobile/15E148 Safari/604.1	2026-06-22 02:52:20.955801+00
55	11	post.reaction_add	post_reactions	10	\N	\N	\N	14.241.228.11	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36 Edg/149.0.0.0	2026-06-22 02:52:48.137006+00
56	11	post.reaction_remove	post_reactions	10	\N	\N	\N	14.241.228.11	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36 Edg/149.0.0.0	2026-06-22 02:52:53.833894+00
57	13	post.reaction_add	post_reactions	10	\N	\N	\N	103.199.32.214	Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5 Mobile/15E148 Safari/604.1	2026-06-22 02:52:59.023714+00
58	11	post.reaction_add	post_reactions	10	\N	\N	\N	14.241.228.11	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36 Edg/149.0.0.0	2026-06-22 02:53:00.430046+00
59	13	post.reaction_remove	post_reactions	10	\N	\N	\N	103.199.32.214	Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5 Mobile/15E148 Safari/604.1	2026-06-22 02:53:02.145037+00
60	13	post.reaction_add	post_reactions	10	\N	\N	\N	103.199.32.214	Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5 Mobile/15E148 Safari/604.1	2026-06-22 02:53:06.206916+00
61	11	post.reaction_add	post_reactions	9	\N	\N	\N	14.241.228.11	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36 Edg/149.0.0.0	2026-06-22 02:53:06.783603+00
62	13	post.reaction_remove	post_reactions	10	\N	\N	\N	103.199.32.214	Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5 Mobile/15E148 Safari/604.1	2026-06-22 02:53:09.24759+00
63	13	post.reaction_add	post_reactions	10	\N	\N	\N	103.199.32.214	Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5 Mobile/15E148 Safari/604.1	2026-06-22 02:53:13.14135+00
64	11	post.reaction_remove	post_reactions	9	\N	\N	\N	14.241.228.11	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36 Edg/149.0.0.0	2026-06-22 02:53:16.014745+00
65	13	post.comment_add	post_comments	10	\N	{"content": "Hey hay om em"}	\N	103.199.32.214	Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5 Mobile/15E148 Safari/604.1	2026-06-22 02:53:21.615055+00
66	11	post.reaction_add	post_reactions	9	\N	\N	\N	14.241.228.11	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36 Edg/149.0.0.0	2026-06-22 02:53:22.468128+00
67	11	company.application_status_update	job_applications	8	\N	{"newStatus": "reviewed", "oldStatus": "applied"}	\N	14.241.228.11	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36 Edg/149.0.0.0	2026-06-22 02:54:33.876598+00
68	11	company.interview_schedule	interview_schedules	2	\N	{"scheduledAt": "2026-07-07T02:55:00+00:00", "applicationId": 8}	\N	14.241.228.11	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36 Edg/149.0.0.0	2026-06-22 02:55:23.988162+00
69	13	messaging.send	messages	4	\N	{"recipientId": 1}	\N	103.199.32.214	Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5 Mobile/15E148 Safari/604.1	2026-06-22 02:55:46.385093+00
70	11	network.connection_accept	connections	13	\N	\N	\N	14.241.228.11	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36 Edg/149.0.0.0	2026-06-22 02:57:35.620022+00
71	11	network.connection_accept	connections	5	\N	\N	\N	14.241.228.11	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36 Edg/149.0.0.0	2026-06-22 02:57:39.11443+00
72	2	post.reaction_add	post_reactions	15	\N	\N	\N	104.28.68.170	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5 Safari/605.1.15	2026-06-22 03:06:11.883313+00
73	2	post.reaction_add	post_reactions	11	\N	\N	\N	104.28.71.167	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5 Safari/605.1.15	2026-06-22 03:22:44.033843+00
74	2	post.reaction_add	post_reactions	10	\N	\N	\N	104.28.71.167	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5 Safari/605.1.15	2026-06-22 03:22:58.339937+00
75	2	post.reaction_add	post_reactions	9	\N	\N	\N	104.28.71.167	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5 Safari/605.1.15	2026-06-22 03:23:02.809187+00
76	2	post.reaction_remove	post_reactions	9	\N	\N	\N	104.28.71.167	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5 Safari/605.1.15	2026-06-22 03:23:08.16481+00
77	4	post.reaction_add	post_reactions	14	\N	\N	\N	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5 Safari/605.1.15	2026-06-22 03:24:21.110805+00
78	4	post.reaction_remove	post_reactions	14	\N	\N	\N	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5 Safari/605.1.15	2026-06-22 03:25:07.123157+00
79	4	post.reaction_add	post_reactions	14	\N	\N	\N	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5 Safari/605.1.15	2026-06-22 03:25:16.124848+00
80	4	post.comment_add	post_comments	11	\N	{"content": "hmmmm"}	\N	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5 Safari/605.1.15	2026-06-22 03:26:21.343914+00
81	4	post.reaction_add	post_reactions	8	\N	\N	\N	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5 Safari/605.1.15	2026-06-22 03:29:31.297772+00
82	4	post.reaction_remove	post_reactions	8	\N	\N	\N	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5 Safari/605.1.15	2026-06-22 03:29:35.523982+00
83	4	post.reaction_add	post_reactions	8	\N	\N	\N	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5 Safari/605.1.15	2026-06-22 03:29:36.932536+00
84	4	post.reaction_add	post_reactions	6	\N	\N	\N	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5 Safari/605.1.15	2026-06-22 03:29:39.01365+00
85	4	network.connection_accept	connections	8	\N	\N	\N	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5 Safari/605.1.15	2026-06-22 03:38:24.545041+00
86	4	post.reaction_add	post_reactions	17	\N	\N	\N	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5 Safari/605.1.15	2026-06-22 03:44:07.502931+00
87	4	post.comment_add	post_comments	17	\N	{"content": "dì z"}	\N	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5 Safari/605.1.15	2026-06-22 03:44:14.950514+00
88	4	post.create	posts	18	\N	{"visibility": "public"}	\N	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5 Safari/605.1.15	2026-06-22 03:49:06.743589+00
89	2	network.connection_accept	connections	11	\N	\N	\N	172.225.56.82	Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5 Mobile/15E148 Safari/604.1	2026-06-22 04:05:20.410155+00
90	2	messaging.send	messages	6	\N	{"recipientId": 13}	\N	172.225.56.82	Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5 Mobile/15E148 Safari/604.1	2026-06-22 04:05:50.192118+00
91	13	messaging.send	messages	6	\N	{"recipientId": 2}	\N	103.199.32.214	Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5 Mobile/15E148 Safari/604.1	2026-06-22 04:06:02.420726+00
92	4	network.connection_send	connections	2	\N	\N	\N	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5 Safari/605.1.15	2026-06-22 04:07:54.531566+00
93	2	network.connection_accept	connections	15	\N	\N	\N	104.28.68.172	Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5 Mobile/15E148 Safari/604.1	2026-06-22 04:08:13.929297+00
94	2	messaging.send	messages	7	\N	{"recipientId": 4}	\N	104.28.68.172	Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5 Mobile/15E148 Safari/604.1	2026-06-22 04:08:44.378971+00
95	4	messaging.send	messages	7	\N	{"recipientId": 2}	\N	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5 Safari/605.1.15	2026-06-22 04:09:11.607755+00
96	2	messaging.send	messages	7	\N	{"recipientId": 4}	\N	104.28.68.164	Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5 Mobile/15E148 Safari/604.1	2026-06-22 04:14:51.520519+00
97	2	messaging.send	messages	7	\N	{"recipientId": 4}	\N	104.28.68.164	Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5 Mobile/15E148 Safari/604.1	2026-06-22 04:15:42.351945+00
98	4	messaging.send	messages	7	\N	{"recipientId": 2}	\N	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5 Safari/605.1.15	2026-06-22 04:15:49.206094+00
99	2	messaging.send	messages	7	\N	{"recipientId": 4}	\N	104.28.68.164	Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5 Mobile/15E148 Safari/604.1	2026-06-22 04:17:14.434499+00
100	4	messaging.send	messages	7	\N	{"recipientId": 2}	\N	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5 Safari/605.1.15	2026-06-22 04:17:20.273073+00
101	2	messaging.send	messages	6	\N	{"recipientId": 13}	\N	104.28.68.164	Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5 Mobile/15E148 Safari/604.1	2026-06-22 04:18:33.104982+00
102	13	messaging.send	messages	6	\N	{"recipientId": 2}	\N	103.199.32.214	Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5 Mobile/15E148 Safari/604.1	2026-06-22 04:18:55.043858+00
103	2	messaging.send	messages	6	\N	{"recipientId": 13}	\N	104.28.68.164	Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5 Mobile/15E148 Safari/604.1	2026-06-22 04:19:14.683238+00
104	2	network.connection_accept	connections	2	\N	\N	\N	104.28.68.164	Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5 Mobile/15E148 Safari/604.1	2026-06-22 04:20:23.399437+00
105	2	post.reaction_add	post_reactions	18	\N	\N	\N	104.28.71.159	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5 Safari/605.1.15	2026-06-22 05:54:28.946706+00
106	5	role.update	roles	5	{"name": "user_manager"}	{"name": "user_manager", "permissions": ["dashboard.view", "users.view", "users.create", "users.edit", "users.delete", "users.export", "users.suspend", "users.ban", "users.restore", "companies.view", "companies.edit", "companies.suspend", "companies.restore", "companies.moderate", "reports.moderate", "reports.status", "reports.view", "appeals.moderate", "appeals.view"]}	\N	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5 Safari/605.1.15	2026-06-22 05:57:57.502385+00
107	5	role.update	roles	2	{"name": "member"}	{"name": "member", "permissions": ["companies.view", "jobs.view", "posts.view", "posts.delete", "appeals.view", "settings.view", "settings.edit", "feed.view", "search.view", "network.view", "network.follow", "network.connect", "network.block", "notifications.view", "notifications.edit", "profile.view", "profile.edit", "cvs.view", "cvs.create", "cvs.edit", "cvs.delete", "companies.follow", "jobs.apply", "jobs.save", "posts.create", "posts.edit", "posts.comment", "posts.react", "posts.share", "posts.vote", "reports.create", "appeals.create", "contacts.create"]}	\N	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-06-22 07:08:20.738195+00
108	5	user.rbac_role.update	users	2	{"role_id": 5}	{"role_id": 2, "role_name": "member"}	\N	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-06-22 07:08:48.31838+00
109	5	user.rbac_role.update	users	2	{"role_id": 2}	{"role_id": 5, "role_name": "user_manager"}	\N	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-06-22 07:09:25.954032+00
110	5	role.update	roles	2	{"name": "member"}	{"name": "member", "permissions": ["companies.view", "jobs.view", "posts.view", "posts.delete", "appeals.view", "settings.view", "settings.edit", "feed.view", "search.view", "network.view", "network.follow", "network.connect", "network.block", "notifications.view", "notifications.edit", "profile.view", "profile.edit", "cvs.view", "cvs.create", "cvs.edit", "cvs.delete", "companies.follow", "jobs.apply", "jobs.save", "posts.create", "posts.edit", "posts.comment", "posts.react", "posts.share", "posts.vote", "reports.create", "appeals.create", "contacts.create", "messages.send", "messages.view"]}	\N	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-06-22 07:09:57.187203+00
111	11	post.create	posts	19	\N	{"visibility": "public"}	\N	14.241.228.11	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36 Edg/149.0.0.0	2026-06-23 01:09:20.347501+00
112	11	post.reaction_add	post_reactions	19	\N	\N	\N	14.241.228.11	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36 Edg/149.0.0.0	2026-06-23 01:10:06.520334+00
113	11	post.reaction_remove	post_reactions	19	\N	\N	\N	14.241.228.11	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36 Edg/149.0.0.0	2026-06-23 01:10:11.111345+00
114	11	post.reaction_add	post_reactions	19	\N	\N	\N	14.241.228.11	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36 Edg/149.0.0.0	2026-06-23 01:10:21.741912+00
115	11	post.share	post_shares	19	\N	\N	\N	14.241.228.11	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36 Edg/149.0.0.0	2026-06-23 01:29:47.587226+00
116	11	messaging.send	messages	2	\N	{"recipientId": 1}	\N	14.241.228.11	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36 Edg/149.0.0.0	2026-06-23 01:30:36.105749+00
117	11	messaging.send	messages	8	\N	{"recipientId": 13}	\N	14.241.228.11	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36 Edg/149.0.0.0	2026-06-23 01:30:53.5713+00
118	11	messaging.send	messages	9	\N	{"recipientId": 12}	\N	14.241.228.11	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36 Edg/149.0.0.0	2026-06-23 01:31:09.901502+00
119	11	job.create	jobs	3	\N	{"title": "hủy diệt umt"}	\N	14.241.228.11	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36 Edg/149.0.0.0	2026-06-23 01:46:51.358009+00
120	12	job.save	saved_jobs	3	\N	\N	\N	14.241.228.13	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36 Edg/149.0.0.0	2026-06-23 02:03:41.267131+00
121	12	job.unsave	saved_jobs	3	\N	\N	\N	14.241.228.13	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36 Edg/149.0.0.0	2026-06-23 02:03:46.180004+00
122	12	job.save	saved_jobs	3	\N	\N	\N	14.241.228.13	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36 Edg/149.0.0.0	2026-06-23 02:11:05.026933+00
123	12	job.unsave	saved_jobs	3	\N	\N	\N	14.241.228.13	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36 Edg/149.0.0.0	2026-06-23 02:11:09.001607+00
124	12	cv.register	member_cvs	10	\N	{"fileName": "cv xin việc"}	\N	14.241.228.13	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36 Edg/149.0.0.0	2026-06-23 02:15:43.982116+00
125	12	job.apply	job_applications	3	\N	{"jobId": 3}	\N	14.241.228.13	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36 Edg/149.0.0.0	2026-06-23 02:16:23.329066+00
126	12	post.poll_vote	poll_votes	13	\N	{"optionId": 10}	\N	14.241.228.13	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36 Edg/149.0.0.0	2026-06-23 02:18:47.929124+00
127	12	network.connection_accept	connections	10	\N	\N	\N	14.241.228.13	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36 Edg/149.0.0.0	2026-06-23 02:21:15.966299+00
128	12	post.comment_add	post_comments	12	\N	{"content": "yeuanh"}	\N	14.241.228.13	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36 Edg/149.0.0.0	2026-06-23 02:21:52.714573+00
129	12	post.comment_delete	post_comments	19	\N	\N	\N	14.241.228.13	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36 Edg/149.0.0.0	2026-06-23 02:22:00.837611+00
130	12	post.comment_add	post_comments	12	\N	{"content": "hii"}	\N	14.241.228.13	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36 Edg/149.0.0.0	2026-06-23 02:22:16.102536+00
131	12	post.reaction_add	post_reactions	12	\N	\N	\N	14.241.228.13	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36 Edg/149.0.0.0	2026-06-23 02:22:36.741485+00
132	12	post.reaction_remove	post_reactions	12	\N	\N	\N	14.241.228.13	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36 Edg/149.0.0.0	2026-06-23 02:22:40.45859+00
133	12	post.reaction_add	post_reactions	12	\N	\N	\N	14.241.228.13	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36 Edg/149.0.0.0	2026-06-23 02:22:41.463953+00
134	12	messaging.send	messages	10	\N	{"recipientId": 13}	\N	14.241.228.13	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36 Edg/149.0.0.0	2026-06-23 02:23:37.799954+00
135	12	post.create	posts	21	\N	{"visibility": "public"}	\N	14.241.228.13	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36 Edg/149.0.0.0	2026-06-23 02:27:46.965123+00
136	13	messaging.send	messages	10	\N	{"recipientId": 12}	\N	14.241.228.11	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-06-23 03:16:40.882966+00
137	13	messaging.send	messages	8	\N	{"recipientId": 11}	\N	14.241.228.11	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-06-23 03:16:56.718794+00
138	12	messaging.send	messages	10	\N	{"recipientId": 13}	\N	14.241.228.13	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36 Edg/149.0.0.0	2026-06-23 03:17:13.595847+00
139	11	messaging.send	messages	8	\N	{"recipientId": 13}	\N	14.241.228.13	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36 Edg/149.0.0.0	2026-06-23 03:18:26.481175+00
140	13	post.create	posts	22	\N	{"visibility": "public"}	\N	14.241.228.11	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-06-23 03:25:27.57807+00
141	13	messaging.send	messages	8	\N	{"recipientId": 11}	\N	14.241.228.11	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-06-23 03:26:38.775281+00
142	4	post.create	posts	23	\N	{"visibility": "public"}	\N	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5 Safari/605.1.15	2026-06-23 03:42:58.022227+00
143	13	post.reaction_add	post_reactions	23	\N	\N	\N	14.241.228.11	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-06-23 03:43:47.223117+00
144	13	post.reaction_add	post_reactions	22	\N	\N	\N	14.241.228.11	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-06-23 03:43:51.639799+00
145	14	job.save	saved_jobs	2	\N	\N	\N	14.241.228.11	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-06-23 03:45:21.025233+00
146	11	post.reaction_remove	post_reactions	10	\N	\N	\N	14.241.228.11	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36 Edg/149.0.0.0	2026-06-23 03:47:24.280094+00
147	4	post.share	post_shares	23	\N	\N	\N	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5 Safari/605.1.15	2026-06-23 03:47:27.733886+00
148	11	post.reaction_add	post_reactions	10	\N	\N	\N	14.241.228.11	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36 Edg/149.0.0.0	2026-06-23 03:47:28.15666+00
149	11	post.reaction_remove	post_reactions	10	\N	\N	\N	14.241.228.11	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36 Edg/149.0.0.0	2026-06-23 03:47:31.267668+00
150	11	post.reaction_add	post_reactions	10	\N	\N	\N	14.241.228.11	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36 Edg/149.0.0.0	2026-06-23 03:47:35.188742+00
151	13	post.reaction_add	post_reactions	15	\N	\N	\N	14.241.228.11	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-06-23 03:47:38.447797+00
152	13	post.reaction_remove	post_reactions	10	\N	\N	\N	14.241.228.11	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-06-23 03:47:50.270531+00
153	11	post.reaction_remove	post_reactions	10	\N	\N	\N	14.241.228.11	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36 Edg/149.0.0.0	2026-06-23 03:47:51.974818+00
154	13	post.reaction_add	post_reactions	10	\N	\N	\N	14.241.228.11	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-06-23 03:47:55.103476+00
155	11	post.reaction_add	post_reactions	10	\N	\N	\N	14.241.228.11	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36 Edg/149.0.0.0	2026-06-23 03:47:55.912437+00
156	13	post.comment_add	post_comments	10	\N	{"content": "anh oi dep trai quaaaaaaaaaaaaaaaaaaaaaaaaaa iuuuuuu"}	\N	14.241.228.11	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-06-23 03:47:59.454974+00
157	11	post.reaction_add	post_reactions	22	\N	\N	\N	14.241.228.11	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36 Edg/149.0.0.0	2026-06-23 03:48:13.741762+00
158	13	post.share	post_shares	10	\N	\N	\N	14.241.228.11	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-06-23 03:49:29.582341+00
159	\N	soft_delete	posts	24	{"status": "active", "author_id": 4}	\N	\N	\N	\N	2026-06-23 03:50:45.019692+00
160	4	post.delete	posts	24	\N	\N	\N	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5 Safari/605.1.15	2026-06-23 03:50:45.174714+00
161	15	network.connection_send	connections	9	\N	\N	\N	1.55.254.235	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-06-28 13:29:12.683557+00
162	15	network.connection_send	connections	6	\N	\N	\N	1.55.254.235	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-06-28 13:29:19.197354+00
163	15	network.connection_send	connections	7	\N	\N	\N	1.55.254.235	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-06-28 13:29:24.140312+00
164	15	network.connection_send	connections	4	\N	\N	\N	1.55.254.235	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-06-28 13:29:29.526599+00
165	15	post.create	posts	26	\N	{"visibility": "public"}	\N	1.55.254.235	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-06-28 13:29:43.114525+00
166	5	job.remove	jobs	3	{"title": "hủy diệt umt", "status": "active"}	{"status": "removed"}	ban	104.28.119.133	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5 Safari/605.1.15	2026-06-28 13:30:59.198307+00
167	5	job.remove	jobs	2	{"title": "Mua bán tất cả vũ khí trong Free Fire", "status": "active"}	{"status": "removed"}	ban	104.28.119.133	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5 Safari/605.1.15	2026-06-28 13:31:09.167157+00
168	5	job.remove	jobs	1	{"title": "Tuyển nhân viên SALE AK47", "status": "active"}	{"status": "removed"}	ban	104.28.119.133	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5 Safari/605.1.15	2026-06-28 13:31:20.206221+00
169	15	post.reaction_add	post_reactions	20	\N	\N	\N	1.55.254.235	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-06-28 13:32:40.84823+00
170	15	post.reaction_remove	post_reactions	20	\N	\N	\N	1.55.254.235	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-06-28 13:32:44.422232+00
171	15	post.reaction_add	post_reactions	20	\N	\N	\N	1.55.254.235	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-06-28 13:32:48.860529+00
172	15	post.create	posts	27	\N	{"visibility": "public"}	\N	1.55.254.235	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-06-28 13:33:44.815172+00
173	15	network.connection_send	connections	11	\N	\N	\N	1.55.254.235	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-06-28 13:36:19.828705+00
174	15	network.connection_send	connections	2	\N	\N	\N	1.55.254.235	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-06-28 13:36:24.332639+00
175	15	network.connection_send	connections	8	\N	\N	\N	1.55.254.235	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-06-28 13:36:27.417228+00
176	15	network.connection_send	connections	12	\N	\N	\N	1.55.254.235	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-06-28 13:36:29.339449+00
177	15	network.connection_send	connections	14	\N	\N	\N	1.55.254.235	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-06-28 13:36:29.387199+00
178	15	network.connection_send	connections	10	\N	\N	\N	1.55.254.235	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-06-28 13:36:30.118019+00
179	15	network.connection_send	connections	3	\N	\N	\N	1.55.254.235	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-06-28 13:36:33.490059+00
180	15	network.connection_send	connections	13	\N	\N	\N	1.55.254.235	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-06-28 13:36:34.960562+00
181	15	post.create	posts	28	\N	{"visibility": "public"}	\N	1.55.254.235	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-06-28 13:37:07.282824+00
182	13	profile.update	member_profiles	13	\N	{"fullName": "Nguyễn Phúc Dui", "headline": ""}	\N	14.241.228.13	Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.6 Mobile/15E148 Safari/604.1	2026-06-30 01:21:49.462226+00
183	14	network.connection_accept	connections	24	\N	\N	\N	14.241.228.13	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-06-30 02:58:56.715869+00
184	2	messaging.send	messages	6	\N	{"recipientId": 13}	\N	104.28.68.161	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5 Safari/605.1.15	2026-07-02 04:21:33.804046+00
185	2	messaging.send	messages	6	\N	{"recipientId": 13}	\N	104.28.68.161	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5 Safari/605.1.15	2026-07-02 04:21:49.25011+00
186	2	messaging.send	messages	6	\N	{"recipientId": 13}	\N	104.28.68.161	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5 Safari/605.1.15	2026-07-02 04:22:00.977803+00
187	2	post.reaction_add	post_reactions	13	\N	\N	\N	172.225.56.73	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5 Safari/605.1.15	2026-07-02 10:16:23.262822+00
188	2	post.reaction_remove	post_reactions	13	\N	\N	\N	172.225.56.73	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5 Safari/605.1.15	2026-07-02 10:16:26.672116+00
189	2	post.reaction_add	post_reactions	13	\N	\N	\N	172.225.56.73	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5 Safari/605.1.15	2026-07-02 10:16:30.007139+00
190	5	network.follow	follows	2	\N	\N	\N	104.28.71.171	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5 Safari/605.1.15	2026-07-03 08:19:06.531379+00
191	5	network.unfollow	follows	2	\N	\N	\N	104.28.71.171	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5 Safari/605.1.15	2026-07-03 08:19:10.062219+00
192	5	network.follow	follows	2	\N	\N	\N	104.28.71.171	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5 Safari/605.1.15	2026-07-03 08:19:13.84573+00
193	2	post.share	post_shares	15	\N	\N	\N	172.224.240.109	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5 Safari/605.1.15	2026-07-04 07:37:08.722918+00
194	2	messaging.send	messages	1	\N	{"recipientId": 1}	\N	172.224.240.109	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5 Safari/605.1.15	2026-07-04 07:39:41.36253+00
195	13	messaging.send	messages	6	\N	{"recipientId": 2}	\N	115.78.229.197	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36 OPR/132.0.0.0	2026-07-04 08:01:07.456189+00
196	2	messaging.send	messages	6	\N	{"recipientId": 13}	\N	172.224.240.104	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5 Safari/605.1.15	2026-07-04 08:06:48.789275+00
197	5	company.approve	company_profiles	17	{"verification_status": "pending"}	{"verification_status": "verified"}	123	115.78.229.197	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36 OPR/132.0.0.0	2026-07-04 08:09:18.094065+00
198	5	company.approve	company_profiles	16	{"verification_status": "pending"}	{"verification_status": "verified"}	2	115.78.229.197	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36 OPR/132.0.0.0	2026-07-04 08:09:25.59099+00
199	17	company.media_update	company_profiles	17	\N	{"logoUrl": "https://awetfafplorxlmdifkqd.supabase.co/storage/v1/object/public/uploads/company-logo/2026/07/17/12dceb5a-a6e1-4e48-bc53-ebc5f16f46e2.jpg"}	\N	115.78.229.197	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36 OPR/132.0.0.0	2026-07-04 08:11:34.260167+00
200	17	job.create	jobs	4	\N	{"title": "Nhân Viên Nhập Liệu Tiếng Nhật - Nghỉ T7&CN [Quận 12]"}	\N	115.78.229.197	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36 OPR/132.0.0.0	2026-07-04 08:15:25.142921+00
201	16	company.media_update	company_profiles	16	\N	{"logoUrl": "https://awetfafplorxlmdifkqd.supabase.co/storage/v1/object/public/uploads/company-logo/2026/07/16/907027d2-e248-4808-a3df-fb7cfe20ba68.jpg"}	\N	115.78.229.197	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36 OPR/132.0.0.0	2026-07-04 08:17:01.780947+00
202	16	job.create	jobs	5	\N	{"title": "Nhân Viên Kinh Doanh Dự Án B2B (IT/Telecom)"}	\N	115.78.229.197	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36 OPR/132.0.0.0	2026-07-04 08:22:29.080122+00
203	2	post.create	posts	30	\N	{"visibility": "public"}	\N	172.226.46.126	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5 Safari/605.1.15	2026-07-04 08:23:40.887697+00
204	5	company.approve	company_profiles	18	{"verification_status": "pending"}	{"verification_status": "verified"}	1	115.78.229.197	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36 OPR/132.0.0.0	2026-07-04 08:28:25.278701+00
205	18	company.media_update	company_profiles	18	\N	{"logoUrl": "https://awetfafplorxlmdifkqd.supabase.co/storage/v1/object/public/uploads/company-logo/2026/07/18/7069be03-55d4-4269-aa1b-18fc283b8f77.jpg"}	\N	115.78.229.197	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36 OPR/132.0.0.0	2026-07-04 08:29:12.259932+00
206	18	company.profile_update	company_profiles	18	\N	{"name": "CÔNG TY TNHH TECHTRONIC PRODUCTS (VIỆT NAM)", "industry": "Sản xuất"}	\N	115.78.229.197	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36 OPR/132.0.0.0	2026-07-04 08:29:20.797178+00
207	18	company.media_update	company_profiles	18	\N	{"logoUrl": "https://awetfafplorxlmdifkqd.supabase.co/storage/v1/object/public/uploads/company-logo/2026/07/18/b5eee8a5-1743-404f-82c8-9f87aae5a033.jpg"}	\N	115.78.229.197	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36 OPR/132.0.0.0	2026-07-04 08:29:46.927342+00
208	18	company.profile_update	company_profiles	18	\N	{"name": "CÔNG TY TNHH TECHTRONIC PRODUCTS (VIỆT NAM)", "industry": "Sản xuất"}	\N	115.78.229.197	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36 OPR/132.0.0.0	2026-07-04 08:29:55.123348+00
209	18	company.media_update	company_profiles	18	\N	{"logoUrl": "https://awetfafplorxlmdifkqd.supabase.co/storage/v1/object/public/uploads/company-logo/2026/07/18/4b926007-b526-4804-8050-6b38cbcb6d22.jpg"}	\N	115.78.229.197	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36 OPR/132.0.0.0	2026-07-04 08:30:30.834012+00
210	18	company.profile_update	company_profiles	18	\N	{"name": "CÔNG TY TNHH TECHTRONIC PRODUCTS (VIỆT NAM)", "industry": "Sản xuất"}	\N	115.78.229.197	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36 OPR/132.0.0.0	2026-07-04 08:30:43.732954+00
211	18	company.media_update	company_profiles	18	\N	{"logoUrl": "https://awetfafplorxlmdifkqd.supabase.co/storage/v1/object/public/uploads/company-logo/2026/07/18/8c57e852-d0c2-4d05-a61f-6a095575aaec.jpg"}	\N	115.78.229.197	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36 OPR/132.0.0.0	2026-07-04 08:31:00.069447+00
212	18	job.create	jobs	6	\N	{"title": "Shipping Specialist / OPD (Đồng Nai Or Củ Chi | Work In Shift)"}	\N	115.78.229.197	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36 OPR/132.0.0.0	2026-07-04 08:33:39.63377+00
213	5	company.approve	company_profiles	19	{"verification_status": "pending"}	{"verification_status": "verified"}	2	115.78.229.197	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36 OPR/132.0.0.0	2026-07-04 08:37:38.13123+00
214	19	company.media_update	company_profiles	19	\N	{"logoUrl": "https://awetfafplorxlmdifkqd.supabase.co/storage/v1/object/public/uploads/company-logo/2026/07/19/9cedec92-c6e8-4a5f-b6f1-051a0aa68ea0.jpg"}	\N	115.78.229.197	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36 OPR/132.0.0.0	2026-07-04 08:38:27.4215+00
215	19	job.create	jobs	7	\N	{"title": "Chuyên Viên Phát Triển Mặt Bằng - Miền Nam"}	\N	115.78.229.197	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36 OPR/132.0.0.0	2026-07-04 08:41:26.092194+00
216	4	job.apply	job_applications	6	\N	{"jobId": 6}	\N	172.224.240.104	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5 Safari/605.1.15	2026-07-04 09:02:07.645426+00
217	5	company.approve	company_profiles	21	{"verification_status": "pending"}	{"verification_status": "verified"}	3	115.78.229.197	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36 OPR/132.0.0.0	2026-07-04 09:17:46.775211+00
218	21	company.media_update	company_profiles	21	\N	{"logoUrl": "https://awetfafplorxlmdifkqd.supabase.co/storage/v1/object/public/uploads/company-logo/2026/07/21/b125335d-5465-43d2-962c-caf66ffe7a54.jpg"}	\N	115.78.229.197	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36 OPR/132.0.0.0	2026-07-04 09:19:25.398947+00
219	21	job.create	jobs	8	\N	{"title": "Chuyên Viên Quan Hệ Khách Hàng Doanh Nghiệp"}	\N	115.78.229.197	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36 OPR/132.0.0.0	2026-07-04 09:24:12.43001+00
220	5	company.approve	company_profiles	22	{"verification_status": "pending"}	{"verification_status": "verified"}	3	115.78.229.197	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36 OPR/132.0.0.0	2026-07-04 09:25:58.223726+00
221	22	company.media_update	company_profiles	22	\N	{"logoUrl": "https://awetfafplorxlmdifkqd.supabase.co/storage/v1/object/public/uploads/company-logo/2026/07/22/62fc2456-830a-4096-a55f-673366cc9c69.jpg"}	\N	115.78.229.197	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36 OPR/132.0.0.0	2026-07-04 09:26:23.623473+00
222	22	job.create	jobs	9	\N	{"title": "Chuyên Viên Thu Hút Nhân Tài (NoVa Land)"}	\N	115.78.229.197	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36 OPR/132.0.0.0	2026-07-04 09:28:39.429744+00
223	5	company.approve	company_profiles	23	{"verification_status": "pending"}	{"verification_status": "verified"}	3	115.78.229.197	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36 OPR/132.0.0.0	2026-07-04 09:30:03.758923+00
224	23	company.media_update	company_profiles	23	\N	{"logoUrl": "https://awetfafplorxlmdifkqd.supabase.co/storage/v1/object/public/uploads/company-logo/2026/07/23/8cee23c6-901e-498a-a063-044b74cdfdce.jpg"}	\N	115.78.229.197	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36 OPR/132.0.0.0	2026-07-04 09:30:49.428195+00
225	23	job.create	jobs	10	\N	{"title": "Nhân Viên Y Tế - Lễ Tân Tại Long An"}	\N	115.78.229.197	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36 OPR/132.0.0.0	2026-07-04 09:33:29.949996+00
226	5	company.approve	company_profiles	24	{"verification_status": "pending"}	{"verification_status": "verified"}	5	115.78.229.197	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36 OPR/132.0.0.0	2026-07-04 09:40:00.256984+00
227	24	company.media_update	company_profiles	24	\N	{"logoUrl": "https://awetfafplorxlmdifkqd.supabase.co/storage/v1/object/public/uploads/company-logo/2026/07/24/dd04f877-b1f0-4818-80bc-5c07d6bf1802.jpg"}	\N	115.78.229.197	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36 OPR/132.0.0.0	2026-07-04 09:41:10.537749+00
228	24	job.create	jobs	11	\N	{"title": "Nhân Viên Kinh Doanh"}	\N	115.78.229.197	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36 OPR/132.0.0.0	2026-07-04 09:44:18.862255+00
229	5	company.approve	company_profiles	25	{"verification_status": "pending"}	{"verification_status": "verified"}	4	115.78.229.197	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36 OPR/132.0.0.0	2026-07-04 09:47:12.238287+00
230	25	company.media_update	company_profiles	25	\N	{"logoUrl": "https://awetfafplorxlmdifkqd.supabase.co/storage/v1/object/public/uploads/company-logo/2026/07/25/ac0c392c-c669-42f3-b24f-4cf63a45b290.jpg"}	\N	115.78.229.197	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36 OPR/132.0.0.0	2026-07-04 09:47:40.783919+00
231	25	job.create	jobs	12	\N	{"title": "Nhân Viên Kinh Doanh (Cửa Nhôm LifeWindow)"}	\N	115.78.229.197	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36 OPR/132.0.0.0	2026-07-04 09:50:59.970686+00
232	25	job.create	jobs	13	\N	{"title": "Kỹ Sư Giám Sát MEP Tại Hà Nội"}	\N	115.78.229.197	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36 OPR/132.0.0.0	2026-07-04 10:01:25.525092+00
233	25	job.create	jobs	14	\N	{"title": "Nhân Viên Kinh Doanh Nội Thất Nhà Tắm"}	\N	115.78.229.197	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36 OPR/132.0.0.0	2026-07-04 10:02:48.401097+00
234	4	profile.media_update	member_profiles	4	\N	{"avatarUrl": "https://awetfafplorxlmdifkqd.supabase.co/storage/v1/object/public/uploads/member-avatar/2026/07/4/772006ae-11b0-4c89-a729-c24db39fc06d.jpg"}	\N	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5 Safari/605.1.15	2026-07-04 10:07:27.78097+00
235	4	profile.media_update	member_profiles	4	\N	{"coverUrl": "https://awetfafplorxlmdifkqd.supabase.co/storage/v1/object/public/uploads/member-cover/2026/07/4/d54ac404-ba62-4cd5-aa4c-c1e0f3f8ccfa.jpg"}	\N	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5 Safari/605.1.15	2026-07-04 10:08:01.568537+00
236	4	post.create	posts	31	\N	{"visibility": "public"}	\N	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5 Safari/605.1.15	2026-07-04 13:52:08.109565+00
237	2	network.connection_send	connections	26	\N	\N	\N	172.224.240.96	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5 Safari/605.1.15	2026-07-04 13:59:15.063626+00
238	4	network.connection_send	connections	8	\N	\N	\N	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5 Safari/605.1.15	2026-07-04 14:10:53.903393+00
239	4	network.connection_send	connections	10	\N	\N	\N	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5 Safari/605.1.15	2026-07-04 14:11:47.003777+00
240	4	network.connection_cancel	connections	29	\N	\N	\N	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5 Safari/605.1.15	2026-07-04 14:11:52.353096+00
241	4	network.connection_cancel	connections	30	\N	\N	\N	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5 Safari/605.1.15	2026-07-04 14:11:54.100255+00
242	4	network.connection_send	connections	9	\N	\N	\N	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5 Safari/605.1.15	2026-07-04 14:12:24.362422+00
243	4	network.connection_send	connections	12	\N	\N	\N	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5 Safari/605.1.15	2026-07-04 14:15:11.644567+00
244	4	network.connection_send	connections	8	\N	\N	\N	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5 Safari/605.1.15	2026-07-04 14:17:24.729604+00
245	4	profile.skill_add	member_skills	\N	\N	{"name": "PHP"}	\N	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5 Safari/605.1.15	2026-07-04 14:18:14.560913+00
246	4	user.privacy_update	member_profiles	4	\N	{"openToWork": true, "profileVisibility": "public"}	\N	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5 Safari/605.1.15	2026-07-04 14:21:11.913646+00
247	4	notification.preference_update	notification_preferences	\N	\N	{"email": true, "inApp": true, "category": "like"}	\N	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5 Safari/605.1.15	2026-07-04 14:21:21.323582+00
248	4	notification.preference_update	notification_preferences	\N	\N	{"email": true, "inApp": true, "category": "comment"}	\N	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5 Safari/605.1.15	2026-07-04 14:21:24.019633+00
249	4	notification.preference_update	notification_preferences	\N	\N	{"email": true, "inApp": true, "category": "newConnection"}	\N	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5 Safari/605.1.15	2026-07-04 14:21:27.373387+00
250	4	messaging.send	messages	7	\N	{"recipientId": 2}	\N	104.28.119.149	Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5 Mobile/15E148 Safari/604.1	2026-07-04 14:22:43.359108+00
251	2	messaging.send	messages	7	\N	{"recipientId": 4}	\N	172.224.240.121	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5 Safari/605.1.15	2026-07-04 14:23:12.691737+00
252	4	messaging.send	messages	7	\N	{"recipientId": 2}	\N	104.28.119.149	Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5 Mobile/15E148 Safari/604.1	2026-07-04 14:23:39.532275+00
253	2	messaging.send	messages	7	\N	{"recipientId": 4}	\N	172.224.240.121	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5 Safari/605.1.15	2026-07-04 14:34:07.119327+00
254	4	messaging.send	messages	7	\N	{"recipientId": 2}	\N	104.28.122.150	Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5 Mobile/15E148 Safari/604.1	2026-07-04 14:34:30.740891+00
255	2	messaging.send	messages	7	\N	{"recipientId": 4}	\N	172.224.240.121	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5 Safari/605.1.15	2026-07-04 14:38:00.9446+00
256	4	messaging.send	messages	7	\N	{"recipientId": 2}	\N	104.28.119.149	Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5 Mobile/15E148 Safari/604.1	2026-07-04 14:39:14.627845+00
257	4	messaging.send	messages	7	\N	{"recipientId": 2}	\N	104.28.119.150	Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5 Mobile/15E148 Safari/604.1	2026-07-04 14:50:17.675719+00
258	2	messaging.send	messages	7	\N	{"recipientId": 4}	\N	104.28.122.149	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5 Safari/605.1.15	2026-07-04 14:50:35.631947+00
259	4	messaging.send	messages	7	\N	{"recipientId": 2}	\N	104.28.119.150	Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5 Mobile/15E148 Safari/604.1	2026-07-04 14:50:47.235955+00
260	2	messaging.send	messages	7	\N	{"recipientId": 4}	\N	104.28.122.149	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5 Safari/605.1.15	2026-07-04 14:50:59.397413+00
261	2	messaging.send	messages	7	\N	{"recipientId": 4}	\N	104.28.122.149	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5 Safari/605.1.15	2026-07-04 14:51:23.214054+00
262	2	messaging.send	messages	7	\N	{"recipientId": 4}	\N	104.28.122.149	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5 Safari/605.1.15	2026-07-04 14:54:41.975884+00
263	4	messaging.send	messages	7	\N	{"recipientId": 2}	\N	146.75.187.58	Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5 Mobile/15E148 Safari/604.1	2026-07-04 14:57:53.824258+00
264	2	messaging.send	messages	7	\N	{"recipientId": 4}	\N	104.28.122.149	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5 Safari/605.1.15	2026-07-04 14:57:58.027473+00
265	4	messaging.send	messages	7	\N	{"recipientId": 2}	\N	146.75.187.58	Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5 Mobile/15E148 Safari/604.1	2026-07-04 14:58:22.232101+00
266	4	messaging.send	messages	7	\N	{"recipientId": 2}	\N	146.75.187.58	Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5 Mobile/15E148 Safari/604.1	2026-07-04 14:59:59.102085+00
267	2	messaging.send	messages	7	\N	{"recipientId": 4}	\N	104.28.122.149	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5 Safari/605.1.15	2026-07-04 15:00:55.191198+00
268	4	messaging.send	messages	7	\N	{"recipientId": 2}	\N	146.75.187.59	Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5 Mobile/15E148 Safari/604.1	2026-07-04 15:01:03.863807+00
269	2	messaging.send	messages	7	\N	{"recipientId": 4}	\N	104.28.122.150	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5 Safari/605.1.15	2026-07-04 15:07:13.61438+00
270	2	messaging.send	messages	7	\N	{"recipientId": 4}	\N	104.28.122.150	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5 Safari/605.1.15	2026-07-04 15:11:10.113649+00
271	2	messaging.send	messages	7	\N	{"recipientId": 4}	\N	104.28.122.150	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5 Safari/605.1.15	2026-07-04 15:11:12.044963+00
272	2	messaging.send	messages	7	\N	{"recipientId": 4}	\N	104.28.122.150	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5 Safari/605.1.15	2026-07-04 15:11:14.1381+00
273	4	messaging.send	messages	7	\N	{"recipientId": 2}	\N	146.75.187.59	Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5 Mobile/15E148 Safari/604.1	2026-07-04 15:13:28.732748+00
\.


ALTER TABLE public.audit_logs ENABLE TRIGGER ALL;

--
-- Data for Name: provinces; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public.provinces DISABLE TRIGGER ALL;

COPY public.provinces (id, code, name, name_en, sort_order, is_active, created_at, updated_at, deleted_at) FROM stdin;
1	01	Hà Nội	\N	10	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
2	02	Hưng Yên	\N	20	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
3	03	Quảng Trị	\N	30	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
4	04	Huế	\N	40	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
5	05	Hải Phòng	\N	50	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
6	06	Phú Thọ	\N	60	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
7	07	Thanh Hoá	\N	70	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
8	08	Quảng Ninh	\N	80	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
9	09	Lào Cai	\N	90	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
10	10	Bắc Ninh	\N	100	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
11	11	Nghệ An	\N	110	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
12	12	Đà Nẵng	\N	120	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
13	13	Ninh Bình	\N	130	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
14	14	Khánh Hòa	\N	140	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
15	15	Tây Ninh	\N	150	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
16	16	Đồng Tháp	\N	160	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
17	17	Hà Tĩnh	\N	170	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
18	18	An Giang	\N	180	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
19	19	Thái Nguyên	\N	190	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
20	20	Lạng Sơn	\N	200	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
21	21	Điện Biên	\N	210	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
22	22	Đồng Nai	\N	220	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
23	23	Quảng Ngãi	\N	230	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
24	24	Vĩnh Long	\N	240	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
25	25	Cao Bằng	\N	250	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
26	26	Lai Châu	\N	260	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
27	27	Đắk Lắk	\N	270	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
28	28	Gia Lai	\N	280	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
29	29	Lâm Đồng	\N	290	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
30	30	Hồ Chí Minh	\N	300	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
31	31	Sơn La	\N	310	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
32	32	Cần Thơ	\N	320	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
33	33	Cà Mau	\N	330	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
34	34	Tuyên Quang	\N	340	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
\.


ALTER TABLE public.provinces ENABLE TRIGGER ALL;

--
-- Data for Name: wards; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public.wards DISABLE TRIGGER ALL;

COPY public.wards (id, province_id, code, name, name_en, sort_order, is_active, created_at, updated_at, deleted_at) FROM stdin;
1	18	00001	Phường Rạch Giá	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
2	30	00002	Phường Dĩ An	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
3	30	00003	Phường Hiệp Bình	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
4	30	00004	Phường Tăng Nhơn Phú	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
5	30	00005	Xã Bà Điểm	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
6	12	00006	Phường Thanh Khê	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
7	7	00007	Phường Hạc Thành	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
8	22	00008	Phường Trấn Biên	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
9	30	00009	Phường Chánh Hưng	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
10	30	00010	Xã Đông Thạnh	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
11	13	00011	Phường Nam Định	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
12	30	00012	Phường Bình Hưng Hòa	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
13	1	00013	Phường Hà Đông	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
14	30	00014	Xã Bình Hưng	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
15	30	00015	Phường Đông Hưng Thuận	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
16	30	00016	Phường An Phú Đông	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
17	30	00017	Phường An Lạc	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
18	27	00018	Phường Buôn Ma Thuột	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
19	22	00019	Phường Long Bình	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
20	30	00020	Phường Tân Thới Hiệp	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
21	30	00021	Xã Vĩnh Lộc	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
22	30	00022	Phường Bình Trị Đông	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
23	30	00023	Xã Tân Vĩnh Lộc	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
24	30	00024	Phường An Phú	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
25	30	00025	Phường Bình Tân	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
26	5	00026	Phường Lê Chân	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
27	30	00027	Phường Linh Xuân	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
28	18	00028	Đặc khu Phú Quốc	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
29	30	00029	Phường Bình Đông	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
30	18	00030	Phường Long Xuyên	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
31	30	00031	Phường Tân Hưng	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
32	30	00032	Phường Tam Bình	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
33	30	00033	Phường Thạnh Mỹ Tây	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
34	30	00034	Phường Thuận Giao	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
35	30	00035	Phường Phú Định	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
36	13	00036	Phường Hoa Lư	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
37	30	00037	Phường Tân Thuận	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
38	30	00038	Phường Tân Hiệp	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
39	11	00039	Phường Trường Vinh	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
40	30	00040	Phường Phú Thọ Hòa	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
41	22	00041	Phường Tam Hiệp	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
42	16	00042	Phường Cao Lãnh	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
43	30	00043	Phường Phước Long	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
44	1	00044	Phường Tương Mai	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
45	14	00045	Phường Nha Trang	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
46	30	00046	Phường Bảy Hiền	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
47	30	00047	Phường Đông Hòa	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
48	12	00048	Phường Hải Châu	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
49	4	00049	Phường Phú Xuân	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
50	14	00050	Phường Nam Nha Trang	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
51	1	00051	Phường Bạch Mai	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
52	28	00052	Phường Quy Nhơn	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
53	30	00053	Phường Hạnh Thông	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
54	30	00054	Xã Củ Chi	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
55	14	00055	Phường Bắc Nha Trang	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
56	30	00056	Phường Trung Mỹ Tây	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
57	30	00057	Phường Tân Khánh	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
58	30	00058	Phường Bình Thạnh	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
59	27	00059	Phường Tuy Hòa	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
60	30	00060	Phường Gia Định	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
61	30	00061	Xã Nhà Bè	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
62	30	00062	Phường Thới An	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
63	1	00063	Phường Nghĩa Đô	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
64	30	00064	Phường An Hội Đông	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
65	11	00065	Phường Thành Vinh	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
66	1	00066	Phường Hồng Hà	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
67	10	00067	Phường Bắc Giang	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
68	30	00068	Phường Bình Trưng	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
69	30	00069	Phường Thông Tây Hội	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
70	30	00070	Phường An Hội Tây	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
71	30	00071	Phường Bình Hòa	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
72	1	00072	Phường Bồ Đề	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
73	1	00073	Phường Từ Liêm	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
74	30	00074	Phường Long Bình	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
75	32	00075	Phường Ninh Kiều	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
76	12	00076	Phường Hòa Cường	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
77	30	00077	Phường Thủ Đức	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
78	30	00078	Phường Lái Thiêu	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
79	1	00079	Xã Đông Anh	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
80	1	00080	Xã Sóc Sơn	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
81	30	00081	Phường Vũng Tàu	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
82	30	00082	Phường Tân Sơn Nhì	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
83	30	00083	Phường Bình Lợi Trung	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
84	5	00084	Phường An Biên	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
85	12	00085	Phường Ngũ Hành Sơn	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
86	30	00086	Xã Tân Nhựt	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
87	30	00087	Phường An Nhơn	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
88	30	00088	Phường Tân Tạo	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
89	5	00089	Phường Hồng Bàng	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
90	12	00090	Phường Hòa Khánh	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
91	1	00091	Xã Phù Đổng	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
92	19	00092	Phường Phan Đình Phùng	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
93	22	00093	Phường Bình Phước	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
94	30	00094	Phường Gò Vấp	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
95	30	00095	Xã Long Hải	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
96	1	00096	Phường Kim Liên	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
97	14	00097	Phường Tây Nha Trang	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
98	30	00098	Phường Phú Lợi	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
99	30	00099	Phường Bình Dương	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
100	15	00100	Phường Long An	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
101	1	00101	Phường Thanh Xuân	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
102	15	00102	Phường Long Hoa	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
103	1	00103	Phường Văn Miếu - Quốc Tử Giám	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
104	1	00104	Phường Hoàn Kiếm	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
105	22	00105	Phường Trảng Dài	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
106	1	00106	Phường Xuân Phương	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
107	16	00107	Phường Sa Đéc	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
108	22	00108	Xã Xuân Lộc	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
109	30	00109	Phường Vườn Lài	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
110	30	00110	Phường Phú Thạnh	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
111	30	00111	Xã Xuân Thới Sơn	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
112	29	00112	Phường Xuân Hương - Đà Lạt	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
113	5	00113	Phường Hải An	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
114	1	00114	Xã Thư Lâm	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
115	5	00115	Phường Gia Viên	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
116	1	00116	Xã An Khánh	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
117	22	00117	Phường Tân Triều	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
118	30	00118	Phường Tân Đông Hiệp	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
119	1	00119	Phường Tây Hồ	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
120	1	00120	Xã Tây Phương	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
121	7	00121	Phường Sầm Sơn	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
122	30	00122	Xã Bình Mỹ	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
123	4	00123	Phường Thuận Hóa	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
124	1	00124	Phường Hoàng Mai	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
125	30	00125	Phường Bến Cát	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
126	30	00126	Xã Phú Hòa Đông	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
127	1	00127	Xã Ô Diên	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
128	18	00128	Phường Châu Đốc	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
129	1	00129	Phường Giảng Võ	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
130	1	00130	Xã Phú Xuyên	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
131	30	00131	Phường Hòa Hưng	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
132	1	00132	Xã Phúc Thịnh	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
133	32	00133	Phường Phú Lợi	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
134	30	00134	Phường Khánh Hội	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
135	12	00135	Phường An Khê	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
136	1	00136	Phường Ngọc Hà	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
137	30	00137	Phường Tân Hòa	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
138	30	00138	Xã Hóc Môn	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
139	30	00139	Phường Tân Phú	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
140	22	00140	Xã Long Thành	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
141	22	00141	Xã Trảng Bom	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
142	1	00142	Xã Đại Thanh	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
143	2	00143	Phường Trần Lãm	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
144	30	00144	Phường Bình Tiên	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
145	17	00145	Phường Thành Sen	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
146	30	00146	Phường Minh Phụng	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
147	1	00147	Phường Vĩnh Tuy	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
148	1	00148	Xã Gia Lâm	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
149	10	00149	Xã Hiệp Hoà	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
150	30	00150	Phường Tân Bình	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
151	15	00151	Phường Tân Ninh	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
152	23	00152	Xã Bình Sơn	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
153	18	00153	Xã Nhơn Mỹ	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
154	5	00154	Phường Ngô Quyền	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
155	30	00155	Phường Thủ Dầu Một	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
156	30	00156	Phường Nhiêu Lộc	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
157	27	00157	Xã Ea Kar	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
158	1	00158	Phường Chương Mỹ	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
159	1	00159	Phường Hai Bà Trưng	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
160	30	00160	Phường Phú Lâm	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
161	12	00161	Phường Sơn Trà	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
162	29	00162	Xã Phan Rí Cửa	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
163	14	00163	Xã Cam Lâm	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
164	30	00164	Phường Tam Thắng	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
165	1	00165	Phường Khương Đình	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
166	32	00166	Phường Tân An	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
167	12	00167	Phường Hòa Xuân	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
168	22	00168	Xã Định Quán	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
169	1	00169	Phường Định Công	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
170	29	00170	Phường Phan Thiết	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
171	29	00171	Xã Đức Trọng	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
172	30	00172	Phường Chợ Lớn	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
173	30	00173	Phường Tân Sơn Nhất	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
174	30	00174	Xã Tân An Hội	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
175	10	00175	Phường Kinh Bắc	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
176	10	00176	Xã Đại Đồng	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
177	3	00177	Phường Đồng Hới	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
178	30	00178	Phường Phú Thuận	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
179	33	00179	Phường Tân Thành	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
180	1	00180	Xã Đa Phúc	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
181	1	00181	Phường Đông Ngạc	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
182	22	00182	Xã Bình Minh	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
183	1	00183	Phường Việt Hưng	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
184	12	00184	Phường An Hải	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
185	1	00185	Phường Phương Liệt	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
186	5	00186	Phường Lê Thanh Nghị	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
187	1	00187	Phường Đống Đa	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
188	33	00188	Phường An Xuyên	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
189	30	00189	Phường An Đông	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
190	18	00190	Xã Chợ Mới	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
191	16	00191	Xã Lai Vung	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
192	1	00192	Phường Đại Mỗ	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
193	1	00193	Xã Bình Minh	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
194	30	00194	Phường Hòa Lợi	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
195	30	00195	Phường Thới Hòa	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
196	28	00196	Phường Pleiku	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
197	22	00197	Xã Gia Kiệm	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
198	22	00198	Phường Hố Nai	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
199	12	00199	Phường Cẩm Lệ	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
200	30	00200	Phường Cầu Ông Lãnh	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
201	30	00201	Phường Phú Mỹ	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
202	6	00202	Phường Hoà Bình	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
203	22	00203	Xã Nhơn Trạch	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
204	22	00204	Xã Xuân Hòa	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
205	6	00205	Phường Vĩnh Phúc	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
206	15	00206	Xã Cần Giuộc	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
207	2	00207	Xã Như Quỳnh	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
208	7	00208	Phường Quảng Phú	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
209	23	00209	Phường Kon Tum	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
210	28	00210	Xã Tuy Phước	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
211	30	00211	Phường Tân Sơn	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
212	5	00212	Phường An Hải	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
213	22	00213	Phường Long Khánh	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
214	1	00214	Phường Yên Hòa	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
215	9	00215	Phường Lào Cai	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
216	30	00216	Phường An Khánh	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
217	5	00217	Phường An Dương	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
218	22	00218	Xã Tân Phú	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
219	16	00219	Xã Tân Long	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
220	30	00220	Phường Bình Thới	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
221	30	00221	Phường Rạch Dừa	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
222	1	00222	Phường Thanh Liệt	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
223	30	00223	Xã Bình Chánh	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
224	16	00224	Xã Tân Phước 3	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
225	30	00225	Phường Bình Phú	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
226	2	00226	Xã Yên Mỹ	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
227	30	00227	Phường Diên Hồng	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
228	1	00228	Xã Phúc Thọ	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
229	22	00229	Phường Biên Hòa	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
230	1	00230	Xã Đại Xuyên	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
231	1	00231	Phường Phú Diễn	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
232	1	00232	Xã Thiên Lộc	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
233	1	00233	Phường Cầu Giấy	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
234	11	00234	Phường Vinh Phú	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
235	22	00235	Phường Long Hưng	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
236	18	00236	Xã Hội An	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
237	16	00237	Xã Lấp Vò	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
238	10	00238	Xã Xuân Cẩm	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
239	30	00239	Phường Long Trường	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
240	11	00240	Xã Quỳnh Lưu	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
241	23	00241	Phường Nghĩa Lộ	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
242	32	00242	Phường Ô Môn	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
243	16	00243	Phường Đạo Thạnh	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
244	27	00244	Phường Tân Lập	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
245	28	00245	Phường Quy Nhơn Nam	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
246	30	00246	Phường Tân Uyên	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
247	6	00247	Phường Việt Trì	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
248	18	00248	Phường Bình Đức	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
249	30	00249	Phường Tây Thạnh	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
250	12	00250	Phường Điện Bàn Đông	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
251	14	00251	Phường Phan Rang	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
252	1	00252	Xã Hát Môn	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
253	11	00253	Xã Quỳnh Phú	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
254	8	00254	Phường Mạo Khê	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
255	34	00255	Phường Minh Xuân	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
256	22	00256	Xã Dầu Giây	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
257	30	00257	Phường Bến Thành	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
258	5	00258	Phường Thuỷ Nguyên	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
259	10	00259	Xã Hợp Thịnh	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
260	22	00260	Xã Thống Nhất	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
261	13	00261	Xã Xuân Trường	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
262	16	00262	Xã Phong Hòa	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
263	30	00263	Xã Hưng Long	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
264	30	00264	Phường Đức Nhuận	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
265	23	00265	Xã An Phú	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
266	29	00266	Phường Lâm Viên - Đà Lạt	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
267	1	00267	Xã Yên Lãng	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
268	1	00268	Phường Sơn Tây	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
269	1	00269	Phường Ô Chợ Dừa	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
270	18	00270	Xã Phú Tân	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
271	5	00271	Đặc khu Cát Hải	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
272	32	00272	Phường Cái Răng	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
273	1	00273	Xã Phú Nghĩa	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
274	1	00274	Phường Kiến Hưng	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
275	1	00275	Xã Thường Tín	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
276	29	00276	Xã Liên Hương	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
277	1	00277	Xã Cổ Đô	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
278	12	00278	Phường Liên Chiểu	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
279	7	00279	Xã Vạn Lộc	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
280	16	00280	Phường Trung An	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
281	1	00281	Xã Nội Bài	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
282	9	00282	Phường Yên Bái	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
283	18	00283	Xã Giồng Riềng	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
284	18	00284	Xã Cù Lao Giêng	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
285	14	00285	Xã Ninh Phước	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
286	18	00286	Xã Châu Thành	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
287	13	00287	Phường Trường Thi	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
288	1	00288	Xã Quang Minh	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
289	1	00289	Xã Hòa Xá	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
290	12	00290	Xã Núi Thành	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
291	30	00291	Phường Hoà Bình	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
292	1	00292	Xã Hoài Đức	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
293	2	00293	Phường Phố Hiến	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
294	28	00294	Xã Chư Sê	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
295	16	00295	Xã Hòa Long	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
296	27	00296	Xã Krông Pắc	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
297	30	00297	Phường Cát Lái	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
298	18	00298	Xã Bình Mỹ	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
299	16	00299	Xã Phú Hựu	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
300	32	00300	Phường Vĩnh Châu	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
301	30	00301	Phường Phú Nhuận	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
302	1	00302	Xã Thuận An	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
303	30	00303	Phường Tân Mỹ	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
304	11	00304	Phường Vinh Lộc	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
305	2	00305	Phường Thái Bình	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
383	1	00383	Xã Kiều Phú	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
306	9	00306	Phường Cam Đường	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
307	30	00307	Xã Hiệp Phước	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
308	30	00308	Phường Bàn Cờ	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
309	1	00309	Phường Vĩnh Hưng	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
310	1	00310	Xã Xuân Mai	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
311	10	00311	Phường Võ Cường	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
312	5	00312	Phường Kiến An	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
313	16	00313	Xã Tân Hương	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
314	1	00314	Phường Phúc Lợi	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
315	16	00315	Phường Mỹ Tho	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
316	18	00316	Xã Tân Hiệp	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
317	8	00317	Phường Cửa Ông	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
318	15	00318	Phường Gò Dầu	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
319	33	00319	Xã Lương Thế Trân	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
320	10	00320	Phường Từ Sơn	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
321	18	00321	Xã An Châu	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
322	18	00322	Xã Long Điền	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
323	30	00323	Phường Phú Thọ	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
324	1	00324	Phường Ba Đình	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
325	13	00325	Xã Hải Hưng	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
326	18	00326	Xã Thạnh Mỹ Tây	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
327	5	00327	Phường Hồng An	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
328	11	00328	Phường Cửa Lò	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
329	1	00329	Xã Vĩnh Thanh	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
330	30	00330	Phường Thuận An	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
331	18	00331	Xã Vĩnh Thạnh Trung	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
332	30	00332	Phường Bình Cơ	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
333	1	00333	Xã Tiến Thắng	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
334	22	00334	Phường Phước Tân	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
335	29	00335	Xã Di Linh	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
336	30	00336	Phường Tân Sơn Hòa	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
337	27	00337	Phường Tân An	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
338	6	00338	Phường Phúc Yên	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
339	1	00339	Xã Ứng Hòa	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
340	30	00340	Phường Chợ Quán	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
341	10	00341	Xã Yên Phong	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
342	10	00342	Xã Lạng Giang	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
343	28	00343	Phường Diên Hồng	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
344	1	00344	Xã Quốc Oai	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
345	11	00345	Xã Diễn Châu	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
346	30	00346	Phường Bình Tây	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
347	1	00347	Xã Sơn Đồng	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
348	32	00348	Xã Thạnh Hòa	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
349	7	00349	Phường Hàm Rồng	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
350	11	00350	Xã Đại Đồng	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
351	1	00351	Xã Hồng Sơn	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
352	30	00352	Phường Vĩnh Hội	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
353	1	00353	Xã Quảng Bị	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
354	13	00354	Phường Phủ Lý	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
355	1	00355	Phường Long Biên	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
356	16	00356	Xã Tân Phú Trung	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
357	27	00357	Phường Buôn Hồ	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
358	1	00358	Xã Dân Hòa	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
359	30	00359	Phường Cầu Kiệu	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
360	32	00360	Phường Bình Thủy	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
361	22	00361	Xã Phú Lâm	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
362	1	00362	Xã Mê Linh	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
363	24	00363	Xã Phú Túc	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
364	11	00364	Xã Đô Lương	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
365	30	00365	Phường Vĩnh Tân	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
366	27	00366	Phường Phú Yên	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
367	19	00367	Phường Vạn Xuân	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
368	18	00368	Xã Hòn Đất	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
369	18	00369	Xã Bình Sơn	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
370	8	00370	Phường Cẩm Phả	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
371	1	00371	Xã Phúc Lộc	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
372	32	00372	Phường Thốt Nốt	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
373	1	00373	Xã Trung Giã	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
374	32	00374	Phường Sóc Trăng	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
375	12	00375	Xã Đại Lộc	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
376	7	00376	Phường Đông Quang	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
377	15	00377	Phường An Tịnh	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
378	3	00378	Phường Nam Đông Hà.	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
379	1	00379	Phường Láng	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
380	16	00380	Xã Long Phú Thuận	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
381	27	00381	Xã Quảng Phú	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
382	23	00382	Phường Cẩm Thành	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
384	1	00384	Xã Vân Đình	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
385	18	00385	Xã Mỹ Thuận	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
386	5	00386	Phường Phù Liễn	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
387	23	00387	Xã Vạn Tường	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
388	29	00388	Phường La Gi	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
389	18	00389	Xã Mỹ Đức	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
390	18	00390	Phường Mỹ Thới	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
391	18	00391	Xã Vĩnh Hậu	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
392	11	00392	Xã Quỳnh Anh	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
393	1	00393	Xã Phượng Dực	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
394	11	00394	Phường Vinh Hưng	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
395	18	00395	Xã Châu Phú	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
396	1	00396	Xã Chương Dương	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
397	8	00397	Phường Uông Bí	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
398	16	00398	Xã Thường Phước	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
399	22	00399	Xã An Phước	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
400	16	00400	Xã Cái Bè	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
401	16	00401	Xã Tân Nhuận Đông	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
402	18	00402	Xã Thạnh Lộc	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
403	18	00403	Xã Bình An	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
404	10	00404	Phường Việt Yên	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
405	33	00405	Xã Trần Văn Thời	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
406	10	00406	Xã Tiên Lục	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
407	23	00407	Xã Tư Nghĩa	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
408	10	00408	Xã Bảo Đài	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
409	1	00409	Xã Quảng Oai	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
410	7	00410	Phường Đông Sơn	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
411	1	00411	Xã Dương Hòa	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
412	14	00412	Phường Ninh Hòa	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
413	1	00413	Xã Hồng Vân	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
414	32	00414	Phường Ngã Năm	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
415	7	00415	Phường Tĩnh Gia	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
416	1	00416	Xã Vật Lại	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
417	6	00417	Phường Thanh Miếu	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
418	32	00418	Phường Hưng Phú	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
419	28	00419	Xã Tuy Phước Đông	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
420	10	00420	Phường Chũ	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
421	18	00421	Xã Kiên Lương	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
422	10	00422	Phường Vân Hà	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
423	10	00423	Xã Lục Nam	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
424	11	00424	Phường Quỳnh Mai	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
425	30	00425	Phường Xóm Chiếu	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
426	7	00426	Phường Đông Tiến	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
427	22	00427	Xã Hưng Thịnh	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
428	6	00428	Phường Nông Trang	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
429	32	00429	Phường Cái Khế	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
430	2	00430	Phường Mỹ Hào	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
431	1	00431	Xã Thạch Thất	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
432	18	00432	Xã Nhơn Hội	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
433	18	00433	Xã Long Kiến	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
434	30	00434	Phường Chánh Hiệp	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
435	27	00435	Phường Ea Kao	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
436	16	00436	Xã Châu Thành	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
437	15	00437	Xã Bến Lức	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
438	32	00438	Phường Thuận Hưng	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
439	15	00439	Xã Mỹ Hạnh	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
440	30	00440	Phường Tây Nam	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
441	10	00441	Xã Ngọc Thiện	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
442	18	00442	Xã Định Hòa	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
443	18	00443	Xã Bình Hòa	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
444	6	00444	Phường Vĩnh Yên	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
445	23	00445	Xã Đông Sơn	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
446	18	00446	Xã Châu Phong	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
447	5	00447	Phường Chu Văn An	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
448	32	00448	Xã An Lạc Thôn	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
449	1	00449	Phường Dương Nội	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
450	23	00450	Xã Tịnh Khê	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
451	22	00451	Xã Phước Thái	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
452	29	00452	Phường 1 Bảo Lộc	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
453	1	00453	Phường Hoàng Liệt	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
454	11	00454	Xã Hùng Châu	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
455	22	00455	Xã Bàu Hàm	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
456	10	00456	Phường Nếnh	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
457	11	00457	Xã Kim Liên	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
458	16	00458	Xã Mỹ An Hưng	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
459	22	00459	Xã Đại Phước	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
460	4	00460	Phường An Cựu	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
461	19	00461	Phường Tích Lương	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
462	6	00462	Phường Xuân Hòa	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
463	18	00463	Phường Vĩnh Thông	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
464	32	00464	Xã Trung Hưng	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
465	15	00465	Phường Bình Minh	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
466	2	00466	Xã Hưng Hà	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
467	4	00467	Phường Thuận An	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
468	14	00468	Phường Đông Hải	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
469	16	00469	Xã Mỹ Hiệp	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
470	29	00470	Phường Hàm Thắng	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
471	27	00471	Xã Ea Drăng	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
472	1	00472	Xã Thanh Oai	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
473	29	00473	Phường 3 Bảo Lộc	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
474	7	00474	Xã Triệu Sơn	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
475	12	00475	Xã Thăng Bình	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
476	33	00476	Xã Cái Nước	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
477	18	00477	Xã Đông Thái	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
478	24	00478	Xã Long Hồ	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
479	27	00479	Xã Ea Ktur	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
480	27	00480	Xã Phú Hòa 1	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
481	14	00481	Xã Vạn Ninh	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
482	1	00482	Xã Phúc Sơn	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
483	29	00483	Phường Phú Thuỷ	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
484	1	00484	Xã Ứng Thiên	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
485	16	00485	Phường Hồng Ngự	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
486	30	00486	Phường Chánh Phú Hòa	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
487	8	00487	Đặc khu Vân Đồn	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
488	18	00488	Xã An Biên	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
489	18	00489	Xã Thạnh Đông	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
490	1	00490	Xã Mỹ Đức	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
491	27	00491	Phường Hòa Hiệp	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
492	13	00492	Xã Xuân Hưng	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
493	15	00493	Phường Trảng Bàng	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
494	13	00494	Phường Nam Hoa Lư	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
495	12	00495	Xã Nam Phước	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
496	24	00496	Phường An Hội	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
497	13	00497	Xã Ý Yên	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
498	30	00498	Phường Long Nguyên	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
499	11	00499	Xã Hưng Nguyên	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
500	30	00500	Phường Long Phước	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
501	32	00501	Phường Thới Long	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
502	8	00502	Phường Hạ Long	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
503	10	00503	Xã Hoàng Vân	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
504	16	00504	Xã Hội Cư	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
505	32	00505	Xã Trần Đề	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
506	1	00506	Phường Cửa Nam	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
507	8	00507	Phường Quang Hanh	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
508	1	00508	Xã Hương Sơn	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
509	18	00509	Xã Tây Yên	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
510	30	00510	Phường Phước Thắng	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
511	18	00511	Xã Thoại Sơn	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
512	27	00512	Phường Thành Nhất	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
513	31	00513	Xã Mai Sơn	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
514	10	00514	Phường Thuận Thành	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
515	30	00515	Phường Bà Rịa	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
516	15	00516	Phường Ninh Thạnh	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
517	16	00517	Xã An Hữu	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
518	24	00518	Xã Ba Tri	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
519	1	00519	Phường Phú Lương	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
520	12	00520	Xã Thăng An	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
521	32	00521	Xã Phong Điền	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
522	15	00522	Xã Châu Thành	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
523	32	00523	Phường Vĩnh Phước	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
524	30	00524	Xã Hồ Tràm	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
525	5	00525	Phường Lê Ích Mộc	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
526	2	00526	Xã Thái Thụy	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
527	2	00527	Xã Quỳnh Phụ	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
528	8	00528	Phường Việt Hưng	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
529	32	00529	Phường Mỹ Xuyên	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
530	10	00530	Phường Đa Mai	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
531	18	00531	Xã Vĩnh Hòa	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
532	5	00532	Phường Bạch Đằng	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
533	29	00533	Phường B' Lao	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
534	5	00534	Phường Hải Dương	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
535	28	00535	Xã Phù Cát	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
536	16	00536	Xã Tân Đông	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
537	32	00537	Xã Mỹ Hương	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
538	1	00538	Xã Thanh Trì	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
539	24	00539	Xã An Bình	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
540	29	00540	Xã Bắc Bình	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
541	8	00541	Phường Hồng Gai	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
542	29	00542	Xã Hiệp Thạnh	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
543	31	00543	Phường Tô Hiệu	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
544	13	00544	Xã Hải Anh	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
545	16	00545	Xã Mỹ Thọ	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
546	29	00546	Xã Đức Linh	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
547	22	00547	Xã Phước An	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
548	16	00548	Xã Bình Phú	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
549	22	00549	Xã Trị An	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
550	32	00550	Xã Tân Hòa	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
551	32	00551	Xã Phú Lộc	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
552	3	00552	Phường Đông Hà	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
553	24	00553	Xã Tân Quới	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
554	24	00554	Phường Phước Hậu	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
555	4	00555	Xã Chân Mây – Lăng Cô	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
556	5	00556	Phường Đông Hải	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
557	10	00557	Xã Tân Yên	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
558	16	00558	Phường Mỹ Phong	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
559	18	00559	Xã Tri Tôn	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
560	29	00560	Xã Hàm Thuận	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
561	24	00561	Xã Song Phú	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
562	10	00562	Phường Phù Khê	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
563	18	00563	Xã Bình Thạnh Đông	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
564	24	00564	Xã Châu Thành	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
565	16	00565	Phường Mỹ Ngãi	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
566	28	00566	Phường An Khê	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
567	15	00567	Xã Cần Đước	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
568	7	00568	Xã Nông Cống	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
569	20	00569	Phường Đông Kinh	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
570	18	00570	Xã Chợ Vàm	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
571	5	00571	Phường Thành Đông	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
572	29	00572	Phường Mũi Né	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
573	32	00573	Phường An Bình	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
574	16	00574	Xã An Long	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
575	33	00575	Phường Lý Văn Lâm	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
576	1	00576	Xã Hòa Phú	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
577	15	00577	Xã Đức Hòa	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
578	30	00578	Xã Thái Mỹ	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
579	24	00579	Xã Mỏ Cày	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
580	33	00580	Xã Trí Phải	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
581	6	00581	Xã Vĩnh Phú	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
582	27	00582	Xã Tây Hòa	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
583	4	00583	Phường Vỹ Dạ	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
584	24	00584	Xã Phú Quới	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
585	1	00585	Phường Yên Nghĩa	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
586	29	00586	Xã Cư Jút	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
587	29	00587	Phường 2 Bảo Lộc	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
588	28	00588	Xã Tuy Phước Bắc	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
589	24	00589	Phường Long Châu	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
590	29	00590	Phường Phước Hội	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
591	14	00591	Xã Phước Hậu	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
592	3	00592	Xã Lệ Thủy	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
593	18	00593	Xã Tân Hội	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
594	28	00594	Phường An Nhơn	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
595	28	00595	Xã Phú Thiện	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
596	5	00596	Phường Lưu Kiếm	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
597	1	00597	Xã Hưng Đạo	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
598	23	00598	Phường Trương Quang Trọng	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
599	15	00599	Xã Mỹ Yên	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
600	15	00600	Xã Bến Cầu	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
601	21	00601	Phường Điện Biên Phủ	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
602	19	00602	Phường Phổ Yên	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
603	2	00603	Xã Đông Hưng	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
604	30	00604	Xã Ngãi Giao	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
605	18	00605	Xã An Phú	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
606	4	00606	Phường Kim Long	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
607	12	00607	Phường Hải Vân	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
608	1	00608	Xã Bát Tràng	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
609	28	00609	Xã Tây Sơn	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
610	29	00610	Phường Cam Ly - Đà Lạt	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
611	7	00611	Xã Thiệu Hóa	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
612	27	00612	Xã Hòa Phú	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
613	24	00613	Xã Ngãi Tứ	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
614	2	00614	Xã Khoái Châu	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
615	28	00615	Phường Thống Nhất	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
616	29	00616	Xã Đinh Văn - Lâm Hà	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
617	1	00617	Phường Xuân Đỉnh	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
618	27	00618	Xã Ea Phê	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
619	2	00619	Xã Long Hưng	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
620	29	00620	Xã Đức Lập	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
621	1	00621	Xã Kim Anh	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
622	30	00622	Phường Tân Định	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
623	27	00623	Xã Krông Ana	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
624	30	00624	Phường Xuân Hòa	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
625	16	00625	Xã Long Định	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
626	22	00626	Phường Tam Phước	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
627	6	00627	Xã Xuân Lãng	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
628	30	00628	Xã Long Điền	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
629	2	00629	Xã Kiến Xương	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
630	6	00630	Xã Tam Dương	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
631	7	00631	Phường Ngọc Sơn	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
632	2	00632	Xã Nguyễn Văn Linh	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
633	29	00633	Phường Bình Thuận	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
634	11	00634	Xã Yên Thành	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
635	1	00635	Xã Liên Minh	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
636	8	00636	Phường Hà Lầm	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
637	4	00637	Xã Phú Vinh	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
638	27	00638	Phường Đông Hòa	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
639	1	00639	Xã Đan Phượng	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
640	22	00640	Xã Xuân Đông	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
641	1	00641	Xã Trần Phú	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
642	29	00642	Xã Hoài Đức	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
643	16	00643	Xã Thanh Bình	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
644	6	00644	Xã Vĩnh Tường	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
645	16	00645	Xã Long Hưng	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
646	31	00646	Xã Phù Yên	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
647	32	00647	Xã Ngọc Tố	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
648	5	00648	Xã An Lão	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
649	30	00649	Xã Bình Lợi	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
650	7	00650	Xã Nga Sơn	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
651	5	00651	Phường Hoà Bình	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
652	33	00652	Phường Hòa Thành	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
653	28	00653	Phường Quy Nhơn Đông	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
654	6	00654	Xã Cẩm Khê	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
655	24	00655	Phường Phú Khương	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
656	30	00656	Phường Sài Gòn	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
657	31	00657	Xã Thuận Châu	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
658	11	00658	Xã Hợp Minh	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
659	1	00659	Phường Tây Mỗ	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
660	2	00660	Xã Hoàng Hoa Thám	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
661	24	00661	Xã Tân Thành Bình	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
662	16	00662	Xã Tân Khánh Trung	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
663	18	00663	Phường Long Phú	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
664	32	00664	Phường Phước Thới	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
665	18	00665	Xã Thạnh Hưng	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
666	16	00666	Phường Mỹ Trà	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
667	15	00667	Xã Hậu Nghĩa	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
668	29	00668	Xã Tánh Linh	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
669	5	00669	Xã Gia Lộc	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
670	19	00670	Phường Linh Sơn	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
671	13	00671	Phường Tây Hoa Lư	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
672	8	00672	Phường Móng Cái 1	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
673	27	00673	Xã Dliê Ya	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
674	2	00674	Xã Nghĩa Trụ	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
675	13	00675	Xã Giao Thuỷ	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
676	16	00676	Phường Sơn Qui	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
677	10	00677	Xã Mỹ Thái	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
678	6	00678	Xã Bình Nguyên	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
679	28	00679	Phường Hội Phú	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
680	33	00680	Xã Sông Đốc	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
681	16	00681	Xã Thanh Hưng	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
682	18	00682	Xã U Minh Thượng	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
683	5	00683	Xã Phú Thái	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
684	30	00684	Phường Bình Quới	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
685	32	00685	Xã Xà Phiên	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
686	30	00686	Phường Phú An	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
687	11	00687	Xã Đông Thành	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
688	16	00688	Xã Tân Dương	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
689	13	00689	Xã Xuân Giang	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
690	10	00690	Phường Đồng Nguyên	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
691	11	00691	Xã Nghi Lộc	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
692	7	00692	Phường Bỉm Sơn	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
693	14	00693	Phường Bảo An	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
694	16	00694	Xã Gia Thuận	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
695	24	00695	Xã Trà Côn	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
696	28	00696	Phường Quy Nhơn Bắc	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
697	24	00697	Xã Tân Thủy	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
698	22	00698	Xã Cẩm Mỹ	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
699	2	00699	Phường Trần Hưng Đạo	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
700	22	00700	Xã Đồng Phú	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
701	28	00701	Xã Đề Gi	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
702	23	00702	Phường Trà Câu	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
703	24	00703	Xã An Trường	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
704	10	00704	Phường Vũ Ninh	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
705	10	00705	Phường Tự Lạn	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
706	1	00706	Xã Thượng Phúc	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
707	24	00707	Phường Trà Vinh	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
708	5	00708	Xã Thanh Miện	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
709	6	00709	Xã Lương Sơn	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
710	5	00710	Xã Vĩnh Bảo	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
711	32	00711	Phường Long Tuyền	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
712	18	00712	Xã Đông Hòa	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
713	13	00713	Xã Hải Hậu	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
714	14	00714	Xã Diên Khánh	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
715	29	00715	Xã Đơn Dương	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
716	5	00716	Phường Thiên Hương	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
717	14	00717	Xã Xuân Hải	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
718	6	00718	Xã Phù Ninh	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
719	32	00719	Xã Cù Lao Dung	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
720	22	00720	Xã Xuân Bắc	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
721	5	00721	Xã Kiến Hải	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
722	1	00722	Xã Chuyên Mỹ	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
723	19	00723	Xã Phú Bình	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
724	11	00724	Xã Vạn An	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
725	10	00725	Xã Tiên Du	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
726	22	00726	Phường Phước Bình	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
727	15	00727	Xã Tân Tập	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
728	4	00728	Phường Mỹ Thượng	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
729	13	00729	Xã Hải Tiến	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
730	18	00730	Xã Gò Quao	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
731	5	00731	Phường An Phong	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
732	7	00732	Xã Sao Vàng	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
733	28	00733	Phường Hoài Nhơn Đông	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
734	28	00734	Phường Hoài Nhơn Bắc	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
735	2	00735	Xã Triệu Việt Vương	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
736	16	00736	Xã Vĩnh Bình	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
737	15	00737	Xã Thạnh Đức	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
738	15	00738	Xã Thủ Thừa	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
739	11	00739	Phường Hoàng Mai	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
740	12	00740	Xã Điện Bàn Tây	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
741	16	00741	Xã Tháp Mười	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
742	27	00742	Phường Bình Kiến	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
743	11	00743	Xã Minh Châu	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
744	24	00744	Xã Chợ Lách	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
745	29	00745	Xã Bảo Lâm 1	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
746	10	00746	Phường Yên Dũng	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
747	15	00747	Xã Phước Thạnh	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
748	19	00748	Phường Gia Sàng	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
749	12	00749	Phường Tam Kỳ	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
750	13	00750	Xã Hải Xuân	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
751	16	00751	Xã Long Tiên	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
752	2	00752	Phường Trà Lý	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
753	11	00753	Xã Vân Tụ	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
754	2	00754	Xã Vũ Thư	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
755	19	00755	Xã Phú Lương	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
756	1	00756	Xã Ngọc Hồi	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
757	30	00757	Xã Đất Đỏ	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
758	7	00758	Xã Hoằng Hóa	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
759	5	00759	Phường Nhị Chiểu	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
760	27	00760	Xã Ea Knuếc	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
761	8	00761	Phường Đông Triều	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
762	27	00762	Xã Ea Nuôl	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
763	27	00763	Xã Krông Năng	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
764	14	00764	Phường Bắc Cam Ranh	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
765	30	00765	Xã Phước Hải	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
766	32	00766	Xã Đại Hải	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
767	18	00767	Xã Vĩnh Bình	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
768	4	00768	Phường Thanh Thủy	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
769	3	00769	Xã Hoàn Lão	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
770	15	00770	Phường Thanh Điền	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
771	10	00771	Phường Nam Sơn	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
772	2	00772	Xã Việt Yên	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
773	14	00773	Phường Đông Ninh Hòa	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
774	11	00774	Xã An Châu	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
775	28	00775	Xã Phù Mỹ Đông	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
776	4	00776	Phường Thủy Xuân	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
777	1	00777	Xã Phú Cát	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
778	5	00778	Xã Mao Điền	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
779	32	00779	Xã Kế Sách	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
780	18	00780	Xã Vĩnh Phong	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
781	6	00781	Xã Thổ Tang	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
782	28	00782	Phường Hoài Nhơn	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
783	11	00783	Xã Hải Châu	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
784	34	00784	Phường An Tường	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
785	11	00785	Xã Quỳnh Văn	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
786	5	00786	Xã Kim Thành	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
787	24	00787	Xã Vĩnh Thành	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
788	5	00788	Xã Lai Khê	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
789	15	00789	Xã Phước Lý	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
790	12	00790	Xã Tam Xuân	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
791	13	00791	Xã Yên Cường	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
792	10	00792	Phường Mão Điền	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
793	1	00793	Xã Nam Phù	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
794	28	00794	Phường Bình Định	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
795	32	00795	Xã Vị Thanh 1	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
796	10	00796	Xã Gia Bình	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
797	18	00797	Xã Khánh Bình	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
798	30	00798	Xã Phú Giáo	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
799	18	00799	Xã Phú Hữu	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
800	2	00800	Xã Tiền Hải	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
801	24	00801	Xã Song Lộc	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
802	11	00802	Xã Tam Hợp	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
803	10	00803	Xã Kép	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
804	2	00804	Xã Phụ Dực	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
805	30	00805	Xã Phước Hòa	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
806	22	00806	Xã Long Phước	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
807	23	00807	Xã Sơn Tịnh	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
808	24	00808	Xã Vĩnh Xuân	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
809	12	00809	Phường Hội An Tây	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
810	10	00810	Xã Lục Ngạn	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
811	18	00811	Xã Định Mỹ	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
812	19	00812	Phường Quan Triều	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
813	12	00813	Xã Thăng Điền	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
814	24	00814	Xã Thạnh Phú	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
815	10	00815	Phường Phương Liễu	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
816	18	00816	Xã Long Thạnh	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
817	19	00817	Xã Kha Sơn	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
818	30	00818	Xã Bàu Bàng	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
819	32	00819	Xã Nhơn Mỹ	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
820	2	00820	Xã Lạc Đạo	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
821	32	00821	Xã Cờ Đỏ	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
822	27	00822	Xã Ea Na	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
823	8	00823	Phường Bãi Cháy	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
824	1	00824	Phường Tùng Thiện	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
825	6	00825	Xã Tân Lạc	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
826	34	00826	Xã Sơn Dương	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
827	18	00827	Xã Tân An	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
828	19	00828	Xã Điềm Thụy	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
829	4	00829	Xã Quảng Điền	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
830	24	00830	Phường Đông Thành	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
831	13	00831	Xã Giao Hoà	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
832	20	00832	Phường Hoàng Văn Thụ	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
833	6	00833	Xã Tu Vũ	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
834	24	00834	Xã Càng Long	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
835	24	00835	Xã Phong Thạnh	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
836	22	00836	Phường Chơn Thành	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
837	28	00837	Phường Bồng Sơn	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
838	2	00838	Phường Vũ Phúc	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
839	7	00839	Xã Hoa Lộc	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
840	17	00840	Xã Đức Thịnh	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
841	18	00841	Xã Vĩnh Xương	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
842	23	00842	Phường Đức Phổ	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
843	10	00843	Phường Phượng Sơn	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
844	4	00844	Phường Hóa Châu	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
845	18	00845	Xã Phú Hòa	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
846	12	00846	Phường Điện Bàn	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
847	32	00847	Xã Phú Hữu	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
848	33	00848	Xã Khánh Hưng	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
849	24	00849	Xã Tân Hòa	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
850	16	00850	Xã An Thạnh Thủy	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
851	25	00851	Phường Thục Phán	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
852	17	00852	Xã Can Lộc	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
853	30	00853	Phường Tam Long	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
854	22	00854	Phường Bình Long	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
855	6	00855	Xã Phùng Nguyên	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
856	32	00856	Xã Thạnh Xuân	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
857	33	00857	Xã Đá Bạc	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
858	8	00858	Xã Quảng Hà	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
859	28	00859	Xã Biển Hồ	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
860	17	00860	Xã Lộc Hà	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
861	15	00861	Phường Hoà Thành	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
862	1	00862	Phường Yên Sở	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
863	13	00863	Phường Phù Vân	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
864	11	00864	Xã Đức Châu	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
865	30	00865	Xã An Nhơn Tây	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
866	11	00866	Xã Thiên Nhẫn	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
867	27	00867	Xã Sơn Hòa	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
868	7	00868	Xã Tiên Trang	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
869	7	00869	Xã Kim Tân	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
870	16	00870	Phường Mỹ Phước Tây	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
871	32	00871	Xã Nhơn Ái	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
872	13	00872	Xã Xuân Hồng	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
873	28	00873	Phường An Phú	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
874	5	00874	Xã Gia Phúc	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
875	9	00875	Xã Mậu A	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
876	2	00876	Xã Bắc Tiên Hưng	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
877	16	00877	Xã Ngũ Hiệp	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
878	11	00878	Xã Xuân Lâm	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
879	18	00879	Phường Hà Tiên	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
880	2	00880	Xã Văn Giang	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
881	14	00881	Xã Tân Định	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
882	5	00882	Xã Tiên Lãng	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
883	16	00883	Xã Đồng Sơn	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
884	4	00884	Xã Đan Điền	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
885	7	00885	Xã Lưu Vệ	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
886	7	00886	Xã Vĩnh Lộc	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
887	11	00887	Xã Thuần Trung	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
888	24	00888	Xã Tam Ngãi	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
889	27	00889	Xã Ô Loan	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
890	24	00890	Xã Hưng Mỹ	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
891	30	00891	Xã Nhuận Đức	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
892	6	00892	Xã Tam Hồng	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
893	5	00893	Phường Nam Triệu	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
894	18	00894	Phường Vĩnh Tế	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
895	15	00895	Xã Mỹ Lộc	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
896	10	00896	Phường Quế Võ	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
897	32	00897	Xã An Ninh	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
898	15	00898	Xã Truông Mít	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
899	2	00899	Xã Diên Hà	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
900	13	00900	Xã Cổ Lễ	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
901	27	00901	Xã Ea Kly	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
902	24	00902	Xã Giao Long	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
903	32	00903	Xã Gia Hòa	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
904	13	00904	Xã Yên Khánh	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
905	27	00905	Xã Tuy An Đông	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
906	32	00906	Xã Đông Phước	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
907	16	00907	Xã Hậu Mỹ	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
908	1	00908	Xã Bất Bạt	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
909	17	00909	Xã Đức Thọ	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
910	29	00910	Phường Langbiang - Đà Lạt	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
911	16	00911	Xã Tân Thuận Bình	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
912	18	00912	Xã Phú An	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
913	7	00913	Xã Thọ Phú	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
914	24	00914	Xã Tập Sơn	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
915	16	00915	Xã Tân Hồng	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
916	25	00916	Xã Minh Khai	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
917	7	00917	Xã Xuân Thái	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
918	23	00918	Xã Cà Đam	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
919	11	00919	Xã Na Loi	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
920	31	00920	Xã Mường Lèo	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
921	9	00921	Xã Bản Liền	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
922	34	00922	Xã Cao Bồ	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
923	7	00923	Xã Tam Thanh	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
924	28	00924	Xã Ia Púch	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
925	7	00925	Xã Na Mèo	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
926	7	00926	Xã Bát Mọt	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
927	7	00927	Xã Sơn Thủy	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
928	7	00928	Xã Mường Chanh	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
929	19	00929	Xã Quảng Bạch	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
930	20	00930	Xã Đoàn Kết	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
931	4	00931	Xã A Lưới 5	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
932	19	00932	Xã Thượng Quan	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
933	3	00933	Xã Thượng Trạch	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
934	3	00934	Xã Hướng Lập	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
935	7	00935	Xã Nhi Sơn	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
936	28	00936	Xã Ia Mơ	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
937	26	00937	Xã Mù Cả	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
938	19	00938	Xã Sảng Mộc	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
939	7	00939	Xã Trung Sơn	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
940	12	00940	Xã Đắc Pring	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
941	20	00941	Xã Quý Hòa	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
942	7	00942	Xã Mường Mìn	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
943	11	00943	Xã Hữu Khuông	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
944	12	00944	Xã La Dêê	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
945	18	00945	Xã Sơn Hải	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
946	9	00946	Xã Chế Tạo	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
947	12	00947	Xã Tân Hiệp	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
948	18	00948	Xã Hòn Nghệ	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
949	12	00949	Xã La Êê	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
950	28	00950	Xã Canh Liên	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
951	28	00951	Xã Nhơn Châu	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
952	9	00952	Xã Tà Xi Láng	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
953	18	00953	Đặc khu Thổ Châu	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
954	18	00954	Xã Tiên Hải	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
955	28	00955	Xã An Toàn	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
956	9	00956	Xã Nậm Xé	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
957	8	00957	Xã Cái Chiên	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
958	5	00958	Đặc khu Bạch Long Vĩ	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
959	14	00959	Đặc khu Trường Sa	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
960	3	00960	Đặc khu Cồn Cỏ	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
961	12	00961	Đặc khu Hoàng Sa	\N	0	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
\.


ALTER TABLE public.wards ENABLE TRIGGER ALL;

--
-- Data for Name: company_profiles; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public.company_profiles DISABLE TRIGGER ALL;

COPY public.company_profiles (id, user_id, name, slug, logo_url, about, website, province_id, ward_id, industry, size, open_to_hire, tax_id, representative_name, representative_title, business_address, business_email, phone, verification_documents, verification_status, verification_note, verified_at, verified_by, created_at, updated_at, deleted_at, cover_url) FROM stdin;
1	3	Công ty UMT	c-ng-ty-umt-f4d44ec2	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	verified	Duyệt	2026-06-20 08:27:17.552+00	5	2026-06-20 08:13:45.281878+00	2026-06-20 08:27:17.754666+00	\N	\N
2	11	Công Ty TNHH MTV Mua Bán Vũ Khí Vũ Trang	c-ng-ty-tnhh-mtv-mua-b-n-v-kh-v-trang-4e73ac50	https://awetfafplorxlmdifkqd.supabase.co/storage/v1/object/public/uploads/company-logo/2026/06/11/0c0b4b6c-948f-4ce5-8071-b30c6de59afa.jpg	\N	\N	1	187	Chính trị	1000+	t	\N	K-ICM	CEO	281B phường Nasa tỉnh London	\N	\N	\N	verified	Duyệt	2026-06-20 08:27:23.737+00	5	2026-06-20 08:13:45.281878+00	2026-06-20 11:35:17.525465+00	\N	https://awetfafplorxlmdifkqd.supabase.co/storage/v1/object/public/uploads/company-cover/2026/06/11/e7da93fa-c56c-4920-8d4a-627d396da212.jpg
4	17	CÔNG TY TNHH DIGI-TEXX	c-ng-ty-tnhh-digi-texx-d7aae378	https://awetfafplorxlmdifkqd.supabase.co/storage/v1/object/public/uploads/company-logo/2026/07/17/12dceb5a-a6e1-4e48-bc53-ebc5f16f46e2.jpg	\N	\N	\N	\N	IT - Phần mềm IT - Phần cứng	1000+	f	0302940151	Nguyễn Văn C	CEO	CVPM Quang Trung, Phường Tân Chánh Hiệp, Quận 12, Thành phố Hồ Chí Minh, Việt Nam	info@digi-texx.com	\N	\N	verified	123	2026-07-04 08:09:17.329+00	5	2026-07-04 08:07:43.048089+00	2026-07-04 08:11:33.974499+00	\N	\N
3	16	Công Ty TNHH MTV Viễn Thông Quốc Tế FPT	c-ng-ty-tnhh-mtv-vi-n-th-ng-qu-c-t-fpt-df90031a	https://awetfafplorxlmdifkqd.supabase.co/storage/v1/object/public/uploads/company-logo/2026/07/16/907027d2-e248-4808-a3df-fb7cfe20ba68.jpg	\N	\N	\N	\N	Viễn thông IT - Phần mềm IT - Phần cứng	1000+	f	0305793402	Nguyễn Văn B	CEO	FPT building, đường Tân Thuận, Khu chế xuất Tân Thuận, P. Tân Thuận Đông, Quận 7, TPHCM.Chi nhán	fti.support@fpt.com	\N	\N	verified	2	2026-07-04 08:09:24.283+00	5	2026-07-04 08:05:07.678506+00	2026-07-04 08:17:01.480562+00	\N	\N
9	22	NOVALAND GROUP CORP	novaland-group-corp-b4013550	https://awetfafplorxlmdifkqd.supabase.co/storage/v1/object/public/uploads/company-logo/2026/07/22/62fc2456-830a-4096-a55f-673366cc9c69.jpg	\N	\N	\N	\N	Bất động sản	1000+	f	0301444753	Nguyễn Văn E	CEO	Novaland Building, 65 Nguyen Du street, Ben Nghe Ward, Distric 1	chamsockhachhang@novaland.com.vn	\N	\N	verified	3	2026-07-04 09:25:56.514+00	5	2026-07-04 09:25:18.568533+00	2026-07-04 09:26:23.330323+00	\N	\N
5	18	CÔNG TY TNHH TECHTRONIC PRODUCTS (VIỆT NAM)	c-ng-ty-tnhh-techtronic-products-vi-t-nam-507763ba	https://awetfafplorxlmdifkqd.supabase.co/storage/v1/object/public/uploads/company-logo/2026/07/18/8c57e852-d0c2-4d05-a61f-6a095575aaec.jpg	\N	\N	\N	\N	Sản xuất	1000+	f	3603826338	Nguyễn Văn C	CEO	9A VSIP II-A, đường số 27, khu công nghiệp Việt Nam - Singapore II A, Phường Vĩnh Tân, Thành phố Tân Uyên, Tỉnh Bình Dương, Việt Nam	comms@ttigroup.com.vn	\N	\N	verified	1	2026-07-04 08:28:24.595+00	5	2026-07-04 08:26:41.171087+00	2026-07-04 08:30:59.760093+00	\N	\N
6	19	CÔNG TY CỔ PHẦN DỊCH VỤ CÀ PHÊ CAO NGUYÊN - HIGHLAND COFFEE SERVICE JSC	c-ng-ty-c-ph-n-d-ch-v-c-ph-cao-nguy-n-highland-coffee-service-jsc-74890aac	https://awetfafplorxlmdifkqd.supabase.co/storage/v1/object/public/uploads/company-logo/2026/07/19/9cedec92-c6e8-4a5f-b6f1-051a0aa68ea0.jpg	\N	\N	\N	\N	Bán lẻ - Hàng tiêu dùng - FMCG	1000+	f	0309965814	Nguyễn Văn D	CEO	135/37/50 Nguyễn Hữu Cảnh, Thạnh Mỹ Tây, Hồ Chí Minh	customerservice@highlandscoffee.com.vn	\N	\N	verified	2	2026-07-04 08:37:37.475+00	5	2026-07-04 08:36:57.280946+00	2026-07-04 08:38:27.092749+00	\N	\N
7	20	JobLink Test Company 1783155368970	joblink-test-company-1783155368970-59f7114d	\N	\N	\N	\N	\N	Software	11-50	f	99-1783155368970	Test Representative	\N	123 Test Street	contact+1783155368970@example.com	\N	\N	pending	\N	\N	\N	2026-07-04 08:56:09.65545+00	2026-07-04 08:56:09.997685+00	\N	\N
8	21	Ngân hàng Á Châu - ACB	ng-n-h-ng-ch-u-acb-4ccbff26	https://awetfafplorxlmdifkqd.supabase.co/storage/v1/object/public/uploads/company-logo/2026/07/21/b125335d-5465-43d2-962c-caf66ffe7a54.jpg	\N	\N	\N	\N	Ngân hàng	1000+	f	0301452948	Nguyễn Văn D	CEO	442 Nguyễn Thị Minh Khai, phường 5, quận 3, tp. Hồ Chí Minh	contact@acb.com.vn	\N	\N	verified	3	2026-07-04 09:17:45.537+00	5	2026-07-04 09:17:11.284272+00	2026-07-04 09:19:25.099392+00	\N	\N
10	23	Công ty CP Vinhomes	c-ng-ty-cp-vinhomes-7956ef6e	https://awetfafplorxlmdifkqd.supabase.co/storage/v1/object/public/uploads/company-logo/2026/07/23/8cee23c6-901e-498a-a063-044b74cdfdce.jpg	\N	\N	\N	\N	Bất động sản	1000+	f	0102671977	Nguyễn Văn F	CEO	Tòa nhà văn phòng Symphony, Đường Chu Huy Mân, Khu đô thị sinh thái Vinhomes Riverside, Phường Phúc Lợi, Quận Long Biên, Thành phố Hà Nội	info@vinhomes.vn	\N	\N	verified	3	2026-07-04 09:30:02.58+00	5	2026-07-04 09:29:19.509923+00	2026-07-04 09:30:49.132206+00	\N	\N
11	24	MOMO	momo-5d76ee10	https://awetfafplorxlmdifkqd.supabase.co/storage/v1/object/public/uploads/company-logo/2026/07/24/dd04f877-b1f0-4818-80bc-5c07d6bf1802.jpg	\N	\N	\N	\N	IT - Phần mềm	1000+	f	0305289153	Nguyễn Văn G	CEO	Tầng 6, Tòa nhà Phú Mỹ Hưng, số 8 đường Hoàng Văn Thái, Phường Tân Phú, Quận 7, TP Hồ Chí Minh	hotro@momo.vn	\N	\N	verified	5	2026-07-04 09:39:59.129+00	5	2026-07-04 09:39:38.719426+00	2026-07-04 09:41:10.238203+00	\N	\N
12	25	CÔNG TY TNHH RI TA VÕ	c-ng-ty-tnhh-ri-ta-v-3c53bca9	https://awetfafplorxlmdifkqd.supabase.co/storage/v1/object/public/uploads/company-logo/2026/07/25/ac0c392c-c669-42f3-b24f-4cf63a45b290.jpg	\N	\N	\N	\N	Thiết kế / kiến trúc Xây dựng	1000+	f	0302802627	Nguyễn Văn H	CEO	327 Xa lộ Hà Nội, Khu Phố 4, Phường An Phú, Thành phố Thủ Đức, Thành phố Hồ Chí Minh, Việt Nam	info@ritavo.com	\N	\N	verified	4	2026-07-04 09:47:11.593+00	5	2026-07-04 09:46:51.60256+00	2026-07-04 09:47:40.496694+00	\N	\N
\.


ALTER TABLE public.company_profiles ENABLE TRIGGER ALL;

--
-- Data for Name: connections; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public.connections DISABLE TRIGGER ALL;

COPY public.connections (id, requester_id, receiver_id, status, requested_at, responded_at) FROM stdin;
1	2	1	accepted	2026-06-20 08:17:45.794437+00	2026-06-20 08:18:03.758+00
3	4	1	accepted	2026-06-20 08:55:17.895908+00	2026-06-20 08:55:42.688+00
4	11	1	accepted	2026-06-20 09:04:44.64553+00	2026-06-20 09:05:36.132+00
6	13	6	pending	2026-06-22 02:43:28.535463+00	\N
7	13	9	pending	2026-06-22 02:43:32.152366+00	\N
9	13	7	pending	2026-06-22 02:43:32.930909+00	\N
12	13	10	pending	2026-06-22 02:46:13.863095+00	\N
14	1	13	accepted	2026-06-22 02:47:14.089903+00	2026-06-22 02:47:21.674+00
13	13	11	accepted	2026-06-22 02:46:23.338166+00	2026-06-22 02:57:34.676+00
5	12	11	accepted	2026-06-20 11:33:14.57817+00	2026-06-22 02:57:38.25+00
8	13	4	accepted	2026-06-22 02:43:32.71378+00	2026-06-22 03:38:23.934+00
11	13	2	accepted	2026-06-22 02:46:05.411862+00	2026-06-22 04:05:18.949+00
15	4	2	accepted	2026-06-22 04:07:54.117942+00	2026-06-22 04:08:12.991+00
2	11	2	accepted	2026-06-20 08:32:25.311468+00	2026-06-22 04:20:21.932+00
10	13	12	accepted	2026-06-22 02:46:01.20477+00	2026-06-23 02:21:15.038+00
16	15	9	pending	2026-06-28 13:29:11.322748+00	\N
17	15	6	pending	2026-06-28 13:29:17.90851+00	\N
18	15	7	pending	2026-06-28 13:29:23.33074+00	\N
19	15	4	pending	2026-06-28 13:29:28.750619+00	\N
20	15	11	pending	2026-06-28 13:36:19.015462+00	\N
21	15	2	pending	2026-06-28 13:36:23.543645+00	\N
22	15	8	pending	2026-06-28 13:36:26.626424+00	\N
23	15	12	pending	2026-06-28 13:36:28.564671+00	\N
25	15	10	pending	2026-06-28 13:36:29.323114+00	\N
26	15	3	pending	2026-06-28 13:36:32.694821+00	\N
27	15	13	pending	2026-06-28 13:36:34.170996+00	\N
24	15	14	accepted	2026-06-28 13:36:28.61582+00	2026-06-30 02:58:55.215+00
28	2	26	pending	2026-07-04 13:59:13.780449+00	\N
31	4	9	pending	2026-07-04 14:12:24.051185+00	\N
32	4	12	pending	2026-07-04 14:15:11.303248+00	\N
33	4	8	pending	2026-07-04 14:17:24.42394+00	\N
\.


ALTER TABLE public.connections ENABLE TRIGGER ALL;

--
-- Data for Name: conversations; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public.conversations DISABLE TRIGGER ALL;

COPY public.conversations (id, type, last_message_id, last_content, last_sender_id, last_message_created_at, created_at, updated_at, seq) FROM stdin;
1	direct	50	abc	2	2026-07-04 07:39:40.02416+00	2026-06-20 08:18:19.491738+00	2026-07-04 07:39:40.02416+00	19
6	direct	52	áhdakjsfkds	2	2026-07-04 08:06:47.467285+00	2026-06-22 04:05:32.387829+00	2026-07-04 08:06:47.467285+00	10
11	direct	\N	\N	\N	\N	2026-07-04 15:06:51.134315+00	2026-07-04 15:06:51.134315+00	0
3	direct	20	http://localhost:3000/posts/8	4	2026-06-20 11:11:00.56356+00	2026-06-20 09:19:31.377212+00	2026-06-20 11:11:00.56356+00	2
4	direct	25	Ê ê heyo  rubychannn hiii naniga sùki?!?UwU\n\nMua bán tất cả vũ khí trong Free Fire - Công Ty TNHH MTV Mua Bán Vũ Khí Vũ Trang\nhttps://joblink.umters.club/jobs/2	13	2026-06-22 02:55:45.545292+00	2026-06-22 02:50:22.549241+00	2026-06-22 02:55:45.545292+00	3
5	direct	\N	\N	\N	\N	2026-06-22 04:04:11.71161+00	2026-06-22 04:04:11.71161+00	0
7	direct	76	T	4	2026-07-04 15:13:28.442563+00	2026-06-22 04:08:26.346445+00	2026-07-04 15:13:28.442563+00	31
2	direct	38	ayyo\nhttps://joblink.umters.club/posts/20	11	2026-06-23 01:30:35.273186+00	2026-06-20 09:07:16.180311+00	2026-06-23 01:30:35.273186+00	3
9	direct	40	ayyo\nhttps://joblink.umters.club/posts/20	11	2026-06-23 01:31:09.107108+00	2026-06-23 01:31:05.779017+00	2026-06-23 01:31:09.107108+00	1
10	direct	44	CEO công ty trên toàn thế giới	12	2026-06-23 03:17:12.808198+00	2026-06-23 02:23:25.723852+00	2026-06-23 03:17:12.808198+00	3
8	direct	46	hihihihi	13	2026-06-23 03:26:37.994169+00	2026-06-23 01:30:47.932916+00	2026-06-23 03:26:37.994169+00	4
\.


ALTER TABLE public.conversations ENABLE TRIGGER ALL;

--
-- Data for Name: conversation_participants; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public.conversation_participants DISABLE TRIGGER ALL;

COPY public.conversation_participants (conversation_id, user_id, joined_at, last_read_at, unread_count) FROM stdin;
3	4	2026-06-20 09:19:31.377212+00	\N	0
3	1	2026-06-20 09:19:31.377212+00	2026-06-20 11:19:09.01416+00	0
4	1	2026-06-22 02:50:22.549241+00	\N	2
5	4	2026-06-22 04:04:11.71161+00	\N	0
5	13	2026-06-22 04:04:11.71161+00	\N	0
4	13	2026-06-22 02:50:22.549241+00	2026-06-22 04:06:23.72266+00	0
10	13	2026-06-23 02:23:25.723852+00	2026-06-23 03:20:41.078834+00	0
8	13	2026-06-23 01:30:47.932916+00	2026-06-23 03:26:37.994169+00	0
8	11	2026-06-23 01:30:47.932916+00	2026-06-23 03:27:02.819114+00	0
1	2	2026-06-20 08:18:19.491738+00	2026-07-04 07:39:40.02416+00	0
1	1	2026-06-20 08:18:19.491738+00	2026-06-22 02:39:35.876911+00	1
6	2	2026-06-22 04:05:32.387829+00	2026-07-04 08:06:47.467285+00	0
6	13	2026-06-22 04:05:32.387829+00	2026-07-04 08:01:06.111082+00	1
11	2	2026-07-04 15:06:51.134315+00	\N	0
2	11	2026-06-20 09:07:16.180311+00	2026-06-23 01:30:35.273186+00	0
2	1	2026-06-20 09:07:16.180311+00	2026-06-20 09:09:01.8473+00	1
11	11	2026-07-04 15:06:51.134315+00	\N	0
9	11	2026-06-23 01:31:05.779017+00	2026-06-23 01:31:09.107108+00	0
7	4	2026-06-22 04:08:26.346445+00	2026-07-04 15:13:28.442563+00	0
7	2	2026-06-22 04:08:26.346445+00	2026-07-04 15:13:33.945313+00	0
9	12	2026-06-23 01:31:05.779017+00	2026-06-23 02:28:02.544336+00	0
10	12	2026-06-23 02:23:25.723852+00	2026-06-23 03:17:12.808198+00	0
\.


ALTER TABLE public.conversation_participants ENABLE TRIGGER ALL;

--
-- Data for Name: follows; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public.follows DISABLE TRIGGER ALL;

COPY public.follows (id, follower_id, followable_type, followable_id, created_at) FROM stdin;
2	1	company	11	2026-06-20 10:27:47.080771+00
5	5	user	2	2026-07-03 08:19:13.065777+00
\.


ALTER TABLE public.follows ENABLE TRIGGER ALL;

--
-- Data for Name: job_positions; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public.job_positions DISABLE TRIGGER ALL;

COPY public.job_positions (id, parent_id, code, name, name_en, description, sort_order, is_active, created_at, updated_at, deleted_at) FROM stdin;
1	\N	intern-dev	Thực tập sinh Lập trình	Intern Developer	\N	10	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
2	\N	fresher-dev	Lập trình viên Fresher	Fresher Developer	\N	20	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
3	\N	backend-dev	Lập trình viên Backend	Backend Developer	\N	30	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
4	\N	frontend-dev	Lập trình viên Frontend	Frontend Developer	\N	40	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
5	\N	fullstack-dev	Lập trình viên Fullstack	Fullstack Developer	\N	50	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
6	\N	mobile-dev	Lập trình viên Mobile	Mobile Developer	\N	60	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
7	\N	ba	Business Analyst	Business Analyst	\N	70	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
8	\N	qa-tester	Kiểm thử phần mềm	QA / Tester	\N	80	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
9	\N	devops	DevOps Engineer	DevOps Engineer	\N	90	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
10	\N	data-engineer	Kỹ sư dữ liệu	Data Engineer	\N	100	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
11	\N	data-scientist	Nhà khoa học dữ liệu	Data Scientist	\N	110	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
12	\N	ui-ux-designer	Thiết kế UI/UX	UI/UX Designer	\N	120	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
13	\N	project-manager	Quản lý dự án	Project Manager	\N	130	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
14	\N	product-manager	Quản lý sản phẩm	Product Manager	\N	140	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
15	\N	hr	Nhân sự	Human Resources	\N	150	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
16	\N	marketing	Marketing	Marketing	\N	160	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
17	\N	sales	Kinh doanh	Sales	\N	170	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
18	\N	intern	Thực tập sinh	Intern	\N	1	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
19	\N	fresher	Mới tốt nghiệp	Fresher	\N	2	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
20	\N	junior	Sơ cấp	Junior	\N	3	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
21	\N	middle	Trung cấp	Middle	\N	4	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
22	\N	senior	Cao cấp	Senior	\N	5	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
23	\N	lead	Trưởng nhóm	Lead	\N	6	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
24	\N	manager	Quản lý	Manager	\N	7	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
25	\N	director	Giám đốc	Director	\N	8	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
\.


ALTER TABLE public.job_positions ENABLE TRIGGER ALL;

--
-- Data for Name: job_types; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public.job_types DISABLE TRIGGER ALL;

COPY public.job_types (id, code, name, name_en, sort_order, is_active, is_system, created_at, updated_at, deleted_at) FROM stdin;
1	fulltime	Toàn thời gian	Full-time	1	t	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
2	parttime	Bán thời gian	Part-time	2	t	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
3	internship	Thực tập	Internship	3	t	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
4	contract	Hợp đồng	Contract	4	t	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
5	freelance	Tự do	Freelance	5	t	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
6	full_time	Toàn thời gian	Full-time	1	t	f	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	2026-06-20 09:36:45.112+00
7	part_time	Bán thời gian	Part-time	2	t	f	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	2026-06-20 09:36:50.669+00
\.


ALTER TABLE public.job_types ENABLE TRIGGER ALL;

--
-- Data for Name: work_modes; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public.work_modes DISABLE TRIGGER ALL;

COPY public.work_modes (id, code, name, name_en, sort_order, is_active, is_system, created_at, updated_at, deleted_at) FROM stdin;
1	onsite	Tại văn phòng	On-site	1	t	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
2	remote	Từ xa	Remote	2	t	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
3	hybrid	Kết hợp	Hybrid	3	t	t	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
4	on_site	Tại văn phòng	On-site	1	t	f	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	2026-06-20 14:40:55.278+00
\.


ALTER TABLE public.work_modes ENABLE TRIGGER ALL;

--
-- Data for Name: jobs; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public.jobs DISABLE TRIGGER ALL;

COPY public.jobs (id, company_user_id, title, description, requirements, province_id, ward_id, salary_min, salary_max, salary_visible, job_type_id, work_mode_id, job_position_id, position_title, status, expires_at, created_at, updated_at, deleted_at) FROM stdin;
3	11	hủy diệt umt	Công việc cần sự trung thành không phản bội Công ty khi nghe tới Điểm rèn luyện từ phía nhà trường.	Móc được thông tin để kể cho CEO nghe.	30	297	50000000	100000000	t	5	2	\N	Cánh tay trái đắc lực	removed	2026-06-30 16:59:59+00	2026-06-23 01:46:51.005563+00	2026-06-28 13:30:58.33479+00	\N
2	11	Mua bán tất cả vũ khí trong Free Fire	Giao hàng thầm kín, có che tên sản phẩm	Giả làm rắn để móc thông tin team địch	1	187	100000000	499999999	t	5	2	\N	Shipper	removed	2026-06-30 16:59:59+00	2026-06-20 10:00:58.786511+00	2026-06-28 13:31:08.72582+00	\N
1	11	Tuyển nhân viên SALE AK47	Có tinh thần, trách nhiệm	Sale,.....	30	656	8000000	20000000	t	2	1	\N	SALE	removed	2026-06-23 16:59:59+00	2026-06-20 08:40:53.404664+00	2026-06-28 13:31:19.887223+00	\N
4	17	Nhân Viên Nhập Liệu Tiếng Nhật - Nghỉ T7&CN [Quận 12]	Nhập thông tin dữ liệu chữ viết tay Tiếng Nhật mà dự án yêu cầu vào hệ thống máy tính của công ty\nNắm vững các yêu cầu của dự án và đảm bảo đáp ứng các chỉ tiêu về năng suất và chất lượng.	Tiếng Nhật tương đương N3 (không yêu cầu bằng cấp)\nNhanh nhẹn, chăm chỉ, cẩn thận\nPhần phỏng vấn bao gồm kiểm tra nhập chữ tiếng Nhật theo hướng dẫn + phỏng vấn trực tiếp	1	324	7000000	10000000	t	1	3	\N	Nhân viên	active	2026-08-09 16:59:59+00	2026-07-04 08:15:24.783305+00	2026-07-04 08:15:24.783305+00	\N
5	16	Nhân Viên Kinh Doanh Dự Án B2B (IT/Telecom)	Tìm kiếm & Phát triển mạng lưới Khách hàng Doanh nghiệp B2B/GOV (Trong nước & Quốc tế).\nKhai thác, phân tích nhu cầu, hiện trạng chuyển đổi số và ứng dụng công nghệ của Khách hàng.\nThiết kế và đề xuất/Tư vấn/Thực hiện demo cho khách hàng về Dịch vụ FTI cung cấp.\nTư vấn và hỗ trợ khách hàng trong quá trình triển khai dịch vụ.\nDuy trì tốt mối quan hệ với Doanh nghiệp trước – trong – sau bán hàng, thực hiện nâng cấp gói dịch vụ hoặc mở rộng các dịch vụ khác.\nGóp phần tạo ra những tương tác, trải nghiệm cá nhân hóa tới khách hàng ở mọi điểm chạm.\nMột số dịch vụ/giải pháp công nghệ FTI đang cung cấp:\n- Internet leased line; Server; Data Center\n- FPT Virtual Data Center Service, Office 365, Fdrive, Fshare......\n- FPT HI GIO Cloud; Microsoft Cloud\n- Dịch vụ điện thoại cố định; FPT Oncall; Tổng đài điện thoại 1900/1800 ; SMS Branding\n- Hóa đơn điện tử; Chữ ký số\n- Giải pháp FPT Cloud Wifi; WiFi Aruba;\n- Giải pháp Quản trị doanh nghiệp (FPT x Basevn)\n- Các dịch vụ về điện toán đám mây (Private/Public cloud).	Tốt nghiệp Cao đẳng, Đại học trở lên các chuyên ngành Kinh tế, Công nghệ thông tin, Điện tử viễn thông, ...\nCó kinh nghiệm direct sales, sales dự án, business development, partnership,…\nƯu tiên ứng viên có kinh nghiệm Sales B2B các lĩnh vực liên quan CNTT (phần cứng, phần mềm, lưu trữ, điện toán đám mây, bảo mật, số hóa) hoặc hiểu biết/yêu thích về các giải pháp và dịch vụ CNTT.\nCó kỹ năng giao tiếp và thuyết trình tốt.\nCó khả năng làm việc độc lập và làm việc nhóm.\nNgoại hình ưa nhìn, giọng nói dễ nghe.\nCó tư duy dịch vụ khách hàng: lấy khách hàng làm trọng tâm.\nCó tiếng Anh giao tiếp là một lợi thế.\nFTI không thu bất kỳ chi phí nào của ứng viên, trong quá trình tuyển dụng.	30	257	12000000	25000000	t	4	3	\N	Nhân viên	active	2026-08-09 16:59:59+00	2026-07-04 08:22:28.779716+00	2026-07-04 08:22:28.779716+00	\N
6	18	Shipping Specialist / OPD (Đồng Nai Or Củ Chi | Work In Shift)	Position 1: OPD Specialist (Order Processing Department Specialist)\n\nWorkout daily trucking plan to Truckers; workout daily loading plan\nDaily communicate/manage trucking plan & loading plan to zero backlog\nReceive order from Customers – mapping with Production schedule and on-hand booking to have loading plan\nBalance loading plan with Warehouse loading time so that it can be aligned with warehouse capacity\nHave a close eye on production line status to have prompt communication/alert to relating Teams and adjust loading schedule if needed\nWork with warehouse and related functions (Production, PMC, Quality..) to coordinate and get FGs ready to load\nSubmit accurate documents to Carriers/Forwarders; ensure no late submission\nWork on ERP: Oracle – Generate Shipment UI, generate Shipment note...\nDaily follow and manage booking status with forwarder\nHighlight to upper level for any potential risk of failing shipment, FGs not ready to ship on time\nCheck material status and confirm cargoes ready date to customer following customer’s request\nWork with relating functions to improve material status to meet customer request date.\nOthers tasks assigned by leader/manager\nPosition 2: Shipping Specialist\n\nFollow up all export consignment to declare CDs after WH completing loading\nFollow up all import/ GIT consignment to declare CDs for supplier to deliver material timely.\nFollow up containers status, such as dock in/ dock out/ work with forwarder to dock in/ dock out timely\nHave knowledge of different CDs modes\nOther tasks assigned by management	Working location: Dầu Giây, Đồng Nai or Củ Chi, HCMC\nAble to work in rotating shifts [02:00 PM – 10:00 PM (2 weeks/month) & 10:00 PM – 06:00 AM (2 weeks/month)]\nBachelor's Degree in Supply Chain Management, Logistics, Transportation, Import-Export, or related fields.\nMinimum 1 year of working experience in a manufacturing environment.\nBasic knowledge of logistics operations, order processing, and order management.\nGood command of English is required; Chinese proficiency is an advantage.\nStrong communication and presentation skills.\nGood teamwork, planning, and coordination skills.\nProficient in Microsoft Excel (mandatory); knowledge of VBA or Power BI is a plus.\nExperience working with ERP systems, preferably Oracle.	1	324	10000000	15000000	t	5	3	\N	Nhân viên	active	2026-08-09 16:59:59+00	2026-07-04 08:33:39.245233+00	2026-07-04 08:33:39.245233+00	\N
7	19	Chuyên Viên Phát Triển Mặt Bằng - Miền Nam	Hỗ trợ phòng ban trong việc xác định thuê các địa điểm tiềm năng trong khu vực được phân công, phù hợp với chiến lược mở rộng của công ty. Tìm kiếm mặt bằng phù hợp, xây dựng mối quan hệ với chủ nhà và các đơn vị môi giới, duy trì dữ liệu pipeline chính xác, đồng thời đóng góp vào việc đạt tiêu chuẩn Offer of Letter (OTL) trong quá trình đàm phán.	• Tốt nghiệp Cao Đẳng/ Đại học chuyên ngành Kinh doanh, Bất động sản hoặc các lĩnh vực liên quan.\n• Tối thiểu 03 năm kinh nghiệm trong lĩnh vực kinh doanh, bất động sản, phát triển kinh doanh hoặc tìm kiếm mặt bằng (có kinh nghiệm là lợi thế).\n• Kỹ năng giao tiếp, đàm phán và xây dựng quan hệ tốt.\n• Chủ động, có khả năng làm việc độc lập trong khu vực phụ trách.\n• Định hướng kết quả, chịu được áp lực để đạt chỉ tiêu tìm kiếm mặt bằng.\n• Kỹ năng giải quyết vấn đề và ra quyết định trong môi trường năng động.\n• Sử dụng thành thạo MS Office và công cụ báo cáo; quen thuộc với công cụ bản đồ hoặc CRM là một lợi thế.\n• Sẵn sàng đi công tác thường xuyên trong khu vực được phân công.	1	324	8000000	15000000	t	5	3	\N	Nhân viên	active	2026-08-09 16:59:59+00	2026-07-04 08:41:25.764091+00	2026-07-04 08:41:25.764091+00	\N
8	21	Chuyên Viên Quan Hệ Khách Hàng Doanh Nghiệp	Quản lý và phát triển danh mục khách hàng doanh nghiệp SME hiện hữu và tiềm năng theo địa bàn/phân khúc được phân công.\n\nTư vấn và triển khai giải pháp tài chính doanh nghiệp toàn diện bao gồm:\n\nTín dụng doanh nghiệp (vay vốn ngắn – trung – dài hạn)\nBảo lãnh ngân hàng\nDịch vụ tiền gửi, thanh toán\nNgân hàng số cho doanh nghiệp\nBảo hiểm doanh nghiệp và các sản phẩm tài chính liên kết\nChủ động tiếp nhận, xử lý và theo dõi phản hồi của khách hàng doanh nghiệp, duy trì hoạt động chăm sóc khách hàng nhằm đảm bảo mức độ hài lòng và gắn kết lâu dài.\n\nThực hiện thẩm định tín dụng doanh nghiệp, đề xuất cấp hạn mức và tái đánh giá khách hàng định kỳ theo quy định.\n\nKiểm tra, rà soát danh mục khách hàng, đảm bảo tuân thủ quy trình – quản trị rủi ro tín dụng ngân hàng.\n\nChủ động bán chéo sản phẩm, dịch vụ ngân hàng, phối hợp chặt chẽ với các đơn vị chức năng để tối ưu hiệu quả kinh doanh.\n\nDẫn dắt và phát triển đội nhóm QHKHDN (đối với vị trí Giám đốc); tham gia các chiến dịch phát triển khách hàng doanh nghiệp SME tại ACB.	Trình độ học vấn\nTốt nghiệp Đại học trở lên các ngành: Kinh tế, Tài chính – Ngân hàng, Quản trị Kinh doanh, Ngoại thương, Marketing hoặc lĩnh vực liên quan.\n\nKinh nghiệm\nTối thiểu 01 năm kinh nghiệm tại các tổ chức tín dụng với vị trí tương đương.\n\nKiến thức & Chuyên môn\nAm hiểu phân khúc khách hàng doanh nghiệp SME.\nNắm vững phân tích báo cáo tài chính doanh nghiệp, dòng tiền và hiệu quả kinh doanh.\nHiểu rõ quy trình tín dụng, sản phẩm – dịch vụ ngân hàng.\nTuân thủ các nguyên tắc quản trị rủi ro tín dụng.\nHiểu và đồng hành cùng văn hóa, giá trị cốt lõi ACB.\n\nKỹ năng & Phẩm chất\nKỹ năng xây dựng và duy trì mối quan hệ với khách hàng doanh nghiệp.\nGiao tiếp, đàm phán và thuyết phục hiệu quả.\nKỹ năng tư vấn bán hàng và chăm sóc khách hàng chuyên nghiệp.\nKhả năng lập kế hoạch, chủ động triển khai công việc, phối hợp đa phòng ban.\nTinh thần chủ động, năng lượng tích cực, sẵn sàng đối mặt thách thức và am hiểu nhu cầu đặc thù của doanh nghiệp SME.	1	324	20000000	30000000	t	5	3	\N	Nhân viên	active	2026-08-09 16:59:59+00	2026-07-04 09:24:11.57617+00	2026-07-04 09:24:11.57617+00	\N
9	22	Chuyên Viên Thu Hút Nhân Tài (NoVa Land)	1. Thực hiện công tác tuyển dụng đáp ứng nhu cầu nhân sự của Tập đoàn\n\n- Thực hiện tuyển dụng kịp thời, chất lượng các vị trí theo đúng quy trình hoạt động của tập đoàn.\n\n- Xây dựng và duy trì nguồn ứng viên tiềm năng phù hợp văn hóa và nhu cầu của tổ chức.\n\n- Đăng tin thông tin tuyển dụng và tìm kiếm ứng viên theo nhóm các vị trí được phân công\n\n- Thực hiện phỏng vấn và sàng lọc ứng viên; Sắp xếp lịch phỏng vấn cho các Trưởng bộ phận liên quan\n\n2. Tham gia các hoạt động quảng bá hình ảnh thương hiệu nhà tuyển dụng Novaland Group\n\n- Đề xuất các chương trình, các hoạt động quảng bá hình ảnh thương hiệu nhà tuyển dụng Novaland Group\n\n- Tham gia các chương trình, sự kiện tuyển dụng nhằm thu hút ứng viên, nâng cao hình ảnh thương hiệu nhà tuyển dụng Novaland Group.\n\n3. Thực hiện các hoạt động hỗ trợ tuyển dụng\n\n- Thực hiện các thủ tục tiếp nhận nhân sự trong quá trình tuyển dụng.\n\n- Thực hiện các hoạt động hỗ trợ nhân viên mới trong thời gian thử việc.\n\n- Định kỳ báo cáo đánh giá tình hình tuyển dụng, hiệu quả công tác tuyển dụng đối với các vị trí phụ trách.	1. Trình độ: Tốt nghiệp Đại học trở lên chuyên nghành Quản trị Nhân sự/ Kinh tế/ Quản trị kinh Doanh/ Luật,… hoặc các chuyên ngành khác có liên quan.\n\n2. Kinh nghiệm chuyên môn: Có tối thiểu 03 năm kinh nghiệm làm việc tại vị trí Thu hút Nhân tài/Tuyển dụng\n\n3. Kỹ năng:\n\n- Kỹ năng giao tiếp, xây dựng mối quan hệ tốt\n\n- Kỹ năng làm việc nhóm, xây dựng tinh thần đồng đội;\n\n- Kỹ năng phân tích, phán đoán và giải quyết vấn đề;\n\n- Kỹ năng thiết lập mục tiêu và tổ chức tốt;\n\n4. Các yêu cầu khác: Hiệu quả, Chính trực, Chuyên nghiệp\n\nQuyền lợi\n- Hỗ trợ phụ cấp cơm trưa và phí gửi xe hàng tháng\n\n- Thưởng hiệu quả tuyển dụng cạnh tranh, ghi nhận đúng năng lực\n\n- Được trang bị đầy đủ laptop, công cụ và thiết bị phục vụ công việc\n\n- Thưởng các dịp Lễ, Tết, sinh nhật và các sự kiện đặc biệt trong năm\n\n- Tham gia các khóa đào tạo chuyên môn, nâng cao kỹ năng tuyển dụng và phát triển nghề nghiệp\n\n- Môi trường làm việc trẻ trung, năng động, nhiều cơ hội phát triển và thăng tiến	1	324	7000000	11999999	t	5	3	\N	Nhân viên	active	2026-08-09 16:59:59+00	2026-07-04 09:28:39.144534+00	2026-07-04 09:28:39.144534+00	\N
10	23	Nhân Viên Y Tế - Lễ Tân Tại Long An	- Tiếp nhận và thực hiện kỹ thuật sơ cấp cứu đối với khách hàng/cư dân gặp sự cố về sức khỏe khi tham gia tập luyện, bơi lội, vui chơi tại các khu vực tiện ích công cộng;\n- Kiểm soát khách hàng/cư dân ra vào khu vực bể bơi, khu vui chơi tiện ích đúng quy định (Bao gồm việc check mã khách hàng, bán vé theo quy định)\n- Tiếp nhận và giải đáp thắc mắc của khách hàng/cư dân trong quá trình sử dụng dịch vụ tại khu vực;\n- Quan sát, nhắc nhở khách hàng/cư dân tuân thủ nội quy khu vực, tránh những nguy cơ tiềm ẩn đối với sức khỏe."	- Nam/Nữ từ 20 - 35 tuổi\n- Trình độ: Trung cấp trở lên hoặc đang là Sinh viên các trường đại học hoặc đã tốt nghiệp (Sv năm 3,4) ngành điều dưỡng, y tế, y sỹ ...\n- Ngoại hình ưa nhìn, khả năng giao tiếp tốt, thân thiện, nhiệt tình;\n- Kinh nghiệm liên quan: có kinh nghiệm về mảng dịch vụ, chăm sóc khác hàng, ưu tiên UV có bằng cấp liên quan đến y tế, có khả năng sơ cấp cứu tại chỗ, đặc biệt với các chấn thương do tập thể thao, bơi lội, vui chơi vận động\n- Tin học văn phòng từ khá trở lên	1	233	9000000	11000000	t	5	3	\N	Nhân viên	active	2026-08-09 16:59:59+00	2026-07-04 09:33:29.61506+00	2026-07-04 09:33:29.61506+00	\N
11	24	Nhân Viên Kinh Doanh	Trực tiếp giới thiệu và phân phối sản phẩm loa thanh toán Soundbox của MoMo đến các hộ kinh doanh, cửa hàng, quán ăn.\nChủ động tiếp cận khách hàng tiềm năng, truyền tải rõ ràng lợi ích và tính năng nổi bật của thiết bị.\nHướng dẫn sử dụng, giải đáp thắc mắc và duy trì sự hài lòng của khách sau bán hàng.\nXây dựng và duy trì mối quan hệ với khách hàng cũ, đồng thời liên tục tìm kiếm khách hàng mới.\nTham gia bán các sản phẩm mà MoMo sẽ đem ra thị trường trong tương lai	Ưu tiên kinh nghiệm ở vị trí bán hàng trực tiếp tại thị trường đối với sản phẩm công nghệ, tài chính, hàng tiêu dùng nhanh (có kinh nghiệm tiếp xúc trực tiếp với khách hàng SMEs)\nCó kiến thức & kinh nghiệm sử dụng trực tiếp sản phẩm thanh toán của MoMo là một lợi thế.\nKỹ năng giao tiếp tốt, tự tin\nĐam mê bán hàng, chăm chỉ, sẵn sàng di chuyển thị trường	1	51	15000000	25000000	t	5	3	\N	Nhân viên	active	2026-08-09 16:59:59+00	2026-07-04 09:44:18.519881+00	2026-07-04 09:44:18.519881+00	\N
12	25	Nhân Viên Kinh Doanh (Cửa Nhôm LifeWindow)	Tư vấn, giới thiệu sản phẩm ngành cửa của Công ty đến khách hàng: các sản phẩm cửa nhôm, cửa kính, cửa kéo và phụ kiện cửa cao cấp...\nTiếp khách hàng đến showroom, tư vấn giới thiệu sản phẩm của Công ty.\nKết hợp đi thị trường tìm kiếm khách hàng với team.\nGửi báo giá theo yêu cầu của khách hàng, thuyết phục khách hàng mua sản phẩm.\nPhối hợp với bộ phận kho vận, kế toán để theo dõi việc giao hàng, công nợ...\nThực hiện các công việc khác theo yêu cầu của quản lý trực tiếp.	Tốt nghiệp Cao Đẳng/Đại học các chuyên ngành.\nKhông yêu cầu kinh nghiệm, công ty sẽ đào tạo bài bản từ đầu.\nSinh viên mới tốt nghiệp yêu thích việc kinh doanh, bán hàng ở mảng cửa nhôm, kính, nội thất, vật liệu xây dựng, phụ kiện cửa....\nNếu ứng viên có kinh nghiệm sales/bán hàng ở mảng cửa nhôm kính hoặc nội/ngoại thất, VLXD, đá gạch ốp lát... là một lợi thế lớn.\nXây dựng mối quan hệ tốt với khách hàng.\nKỹ năng giao tiếp, đàm phán, thuyết trình tốt.\nTinh thần đồng đội, lắng nghe học hỏi.\nKhả năng làm việc độc lập/ theo nhóm.\nSử dụng tốt vi tính văn phòng.	1	51	12000000	20000000	t	4	3	\N	Nhân viên	active	2026-08-09 16:59:59+00	2026-07-04 09:50:59.647832+00	2026-07-04 09:50:59.647832+00	\N
13	25	Kỹ Sư Giám Sát MEP Tại Hà Nội	Kinh doanh mảng nội thất phụ kiện phân khúc sản phẩm của nhà tắm\nTư vấn giới thiệu khách hàng về sản phẩm của tập đoàn tại showroom\nLàm thủ tục hồ sơ với khách hàng và làm việc với bộ phận giao hàng\nĐi thị trường với team trong khu vực HCM\nTìm kiếm khách hàng mới và duy trì mối quan hệ với khách hàng cũ\nLàm báo cáo với cấp trên	Tốt nghiệp tối thiểu trung cấp\nKinh nghiệm từ dưới 1 năm vị trí tương đương hoặc liên quan\nGiao tiếp tốt và nhiệt huyết\nCó thể đi thị trường (khu vực HCM)	1	324	18000000	23000000	t	5	3	\N	Nhân viên	active	2026-08-09 16:59:59+00	2026-07-04 10:01:25.214382+00	2026-07-04 10:01:25.214382+00	\N
14	25	Nhân Viên Kinh Doanh Nội Thất Nhà Tắm	Kinh doanh mảng nội thất phụ kiện phân khúc sản phẩm của nhà tắm\nTư vấn giới thiệu khách hàng về sản phẩm của tập đoàn tại showroom\nLàm thủ tục hồ sơ với khách hàng và làm việc với bộ phận giao hàng\nĐi thị trường với team trong khu vực HCM\nTìm kiếm khách hàng mới và duy trì mối quan hệ với khách hàng cũ\nLàm báo cáo với cấp trên	Tốt nghiệp tối thiểu trung cấp\nKinh nghiệm từ dưới 1 năm vị trí tương đương hoặc liên quan\nGiao tiếp tốt và nhiệt huyết\nCó thể đi thị trường (khu vực HCM)	3	378	12000000	19999997	t	4	3	\N	Nhân viên	active	\N	2026-07-04 10:02:48.116376+00	2026-07-04 10:02:48.116376+00	\N
\.


ALTER TABLE public.jobs ENABLE TRIGGER ALL;

--
-- Data for Name: job_applications; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public.job_applications DISABLE TRIGGER ALL;

COPY public.job_applications (id, job_id, applicant_id, resume_url, cover_letter, status, applied_at, updated_at) FROM stdin;
10	6	4	4/4b156e6b-d7f3-427a-b01f-da86937c0a76.pdf	Bla bla bla	submitted	2026-07-04 09:02:06.082884+00	2026-07-04 09:02:06.082884+00
\.


ALTER TABLE public.job_applications ENABLE TRIGGER ALL;

--
-- Data for Name: skills; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public.skills DISABLE TRIGGER ALL;

COPY public.skills (id, name) FROM stdin;
1	Sale
2	Giọng tốt
3	Có bằng cấp
4	kinh nghiệm
5	Lanh lẹ
6	Kín miệng
7	Không phản bội
8	Hai mặt
9	Rắn độc
10	Ẩn thân
11	Không yêu cầu kinh nghiệm chuyên môn
12	Trung học phổ thông (Cấp 3) trở lên
13	2 năm kinh nghiệm chuyên môn
14	Cao Đẳng trở lên
15	1 năm kinh nghiệm chuyên môn
16	Từ 25 tuổi trở lên
17	Đại Học trở lên
18	3 năm kinh nghiệm chuyên môn
19	Tuổi 20 - 35
20	Trung cấp trở lên
21	Nữ
22	Dưới 1 năm kinh nghiệm chuyên môn
23	Tuổi 22 - 40
24	Nam
25	Tuổi 21 - 30
26	1 năm kinh nghiệm quản lý
\.


ALTER TABLE public.skills ENABLE TRIGGER ALL;

--
-- Data for Name: job_skills; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public.job_skills DISABLE TRIGGER ALL;

COPY public.job_skills (job_id, skill_id, is_required) FROM stdin;
1	1	t
1	2	t
1	3	t
1	4	t
2	5	t
2	6	t
2	7	t
3	5	t
3	8	t
3	9	t
3	10	t
4	11	t
4	12	t
5	13	t
5	14	t
6	15	t
6	16	t
6	17	t
7	18	t
7	14	t
8	15	t
8	17	t
9	18	t
9	17	t
10	15	t
10	19	t
10	20	t
10	21	t
11	22	t
11	23	t
11	12	t
11	24	t
12	11	t
12	25	t
12	14	t
12	24	t
13	22	t
13	26	t
13	17	t
13	24	t
14	22	t
14	20	t
\.


ALTER TABLE public.job_skills ENABLE TRIGGER ALL;

--
-- Data for Name: job_view_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public.job_view_logs DISABLE TRIGGER ALL;

COPY public.job_view_logs (id, job_id, viewer_user_id, viewed_at) FROM stdin;
1	1	1	2026-06-20 08:43:19.627443+00
2	1	1	2026-06-20 08:44:52.520013+00
3	1	1	2026-06-20 08:47:08.522266+00
4	1	1	2026-06-20 08:47:16.077029+00
5	1	1	2026-06-20 08:48:53.962437+00
6	1	4	2026-06-20 08:49:59.588946+00
7	1	4	2026-06-20 08:56:12.804854+00
8	1	1	2026-06-20 08:56:18.413594+00
9	1	1	2026-06-20 09:05:27.241428+00
10	1	1	2026-06-20 09:15:38.131831+00
11	1	5	2026-06-20 09:52:06.559224+00
12	1	2	2026-06-20 09:57:42.486501+00
13	2	1	2026-06-20 10:02:21.283502+00
14	1	4	2026-06-20 10:53:34.668344+00
15	1	4	2026-06-20 10:55:54.166301+00
16	1	2	2026-06-20 11:21:08.914163+00
17	2	12	2026-06-20 11:33:36.40127+00
18	2	2	2026-06-20 13:02:05.009321+00
19	2	2	2026-06-20 13:29:32.994012+00
20	2	2	2026-06-20 13:48:57.172986+00
21	2	2	2026-06-20 13:51:01.81059+00
22	2	13	2026-06-22 02:44:00.508482+00
23	2	13	2026-06-22 02:55:06.395832+00
24	2	13	2026-06-22 02:55:09.927156+00
25	2	13	2026-06-22 04:05:12.704937+00
26	3	12	2026-06-23 02:10:08.61943+00
27	3	12	2026-06-23 02:21:03.216898+00
28	2	12	2026-06-23 02:22:59.441041+00
29	3	13	2026-06-23 03:15:48.338189+00
30	2	14	2026-06-23 03:44:56.876905+00
31	5	2	2026-07-04 08:24:11.499519+00
32	6	4	2026-07-04 09:01:32.252363+00
33	14	4	2026-07-04 10:12:54.884582+00
34	10	4	2026-07-04 10:24:13.012472+00
35	11	26	2026-07-04 13:41:15.54077+00
36	13	4	2026-07-04 13:54:44.974577+00
\.


ALTER TABLE public.job_view_logs ENABLE TRIGGER ALL;

--
-- Data for Name: member_cvs; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public.member_cvs DISABLE TRIGGER ALL;

COPY public.member_cvs (id, user_id, file_name, storage_path, file_size, mime_type, source, builder_config, is_default, created_at, updated_at, deleted_at) FROM stdin;
1	1	CV K_ICM	1/0451cb05-7634-4bf9-89c5-e479e9c9db67.pdf	3502714	application/pdf	upload	\N	f	2026-06-20 08:44:44.909981+00	2026-06-20 08:44:44.909981+00	\N
2	1	CV Jack	1/6f1295b8-1882-40a2-85a5-dacdc0acc0f8.pdf	3411495	application/pdf	upload	\N	f	2026-06-20 08:49:32.190138+00	2026-06-20 08:49:32.190138+00	\N
3	4	Nguyen-Quoc-Minh-TopCV.vn-170526.200340	4/4b156e6b-d7f3-427a-b01f-da86937c0a76.pdf	749956	application/pdf	upload	\N	f	2026-06-20 08:49:51.494823+00	2026-06-20 08:49:51.494823+00	\N
5	6	trucdau_CV	6/6998c2e5-b091-45f8-bc89-b4b4cb019892.pdf	58776	application/pdf	builder	{"skills": ["gvhyf"], "educations": [2], "experiences": [3]}	f	2026-06-20 10:36:39.992569+00	2026-06-20 10:37:50.162105+00	\N
6	6	SRS_Joblink (1)	6/ce496ef5-f265-4205-934d-2cb44e329707.pdf	334889	application/pdf	upload	\N	t	2026-06-20 10:37:50.48283+00	2026-06-20 10:37:50.48283+00	\N
7	6	trucdau_CV	6/cd5fe4cf-3019-45d6-b0c8-e79a16f0ac49.pdf	61067	application/pdf	builder	{"skills": ["gvhyf"], "educations": [2], "experiences": [3]}	f	2026-06-20 11:18:05.302954+00	2026-06-20 11:18:05.302954+00	\N
4	2	Nguyễn_Quốc_Minh_CV	2/3af32857-041b-4737-9f1c-5bf23574f47b.pdf	94389	application/pdf	builder	{"skills": ["HTML", "PHP"], "educations": [1], "experiences": [1]}	f	2026-06-20 08:54:10.956924+00	2026-06-20 13:27:30.397852+00	2026-06-20 13:27:30.308+00
8	2	Nguyễn_Quốc_Minh_CV	2/2dc64818-c872-48f0-9ed2-19612b55dca0.pdf	123967	application/pdf	builder	{"skills": ["HTML", "PHP"], "educations": [1], "experiences": [1]}	t	2026-06-20 13:27:40.033221+00	2026-06-20 13:27:40.033221+00	\N
9	13	Tao2022	13/82e43ab3-4447-4479-8d91-e5ea23053c3c.pdf	3502714	application/pdf	upload	\N	f	2026-06-22 02:44:28.760444+00	2026-06-22 02:44:28.760444+00	\N
10	12	cv xin việc	12/e5c52aaa-5510-4f9d-a12f-41301976498f.pdf	364565	application/pdf	upload	\N	f	2026-06-23 02:15:43.187983+00	2026-06-23 02:15:43.187983+00	\N
\.


ALTER TABLE public.member_cvs ENABLE TRIGGER ALL;

--
-- Data for Name: member_educations; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public.member_educations DISABLE TRIGGER ALL;

COPY public.member_educations (id, user_id, school_name, degree, field_of_study, start_date, end_date, description, created_at, updated_at, deleted_at) FROM stdin;
1	2	UMT	Cử nhân	CNTT	2024-06-01	2028-09-01	\N	2026-06-20 08:29:55.644142+00	2026-06-20 08:29:55.644142+00	\N
2	6	hrfbd	dggn	mmjgvfv	2026-01-01	2026-02-01	\N	2026-06-20 10:36:21.300519+00	2026-06-20 10:36:21.300519+00	\N
\.


ALTER TABLE public.member_educations ENABLE TRIGGER ALL;

--
-- Data for Name: member_experiences; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public.member_experiences DISABLE TRIGGER ALL;

COPY public.member_experiences (id, user_id, company_name, "position", start_date, end_date, is_current, description, created_at, updated_at, deleted_at) FROM stdin;
1	2	UMT	SEO	2025-04-01	\N	t	\N	2026-06-20 08:29:33.475487+00	2026-06-20 08:29:33.475487+00	\N
2	1	Công Ty TNHH MTV Mua Bán Vũ Khí Vũ Trang	CEO	2026-01-01	2030-01-01	f	\N	2026-06-20 09:12:55.642018+00	2026-06-20 09:12:55.642018+00	\N
3	6	fghhyh	bvfvh	2026-01-01	\N	t	\N	2026-06-20 10:36:05.291033+00	2026-06-20 10:36:05.291033+00	\N
\.


ALTER TABLE public.member_experiences ENABLE TRIGGER ALL;

--
-- Data for Name: member_profiles; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public.member_profiles DISABLE TRIGGER ALL;

COPY public.member_profiles (id, user_id, full_name, avatar_url, cover_url, headline, about, province_id, ward_id, website, open_to_work, profile_visibility, created_at, updated_at, deleted_at) FROM stdin;
4	5	Nguyễn Quốc Minh	\N	\N	\N	\N	\N	\N	\N	f	public	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
6	7	Test User	\N	\N	\N	\N	\N	\N	\N	f	public	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
7	8	Thư Bùi Anh	https://lh3.googleusercontent.com/a/ACg8ocI2YpgGGDkHeJRMmjCGn_c_q2tsI2RtGfOQeLXKZst7JWYiVA=s96-c	\N	\N	\N	\N	\N	\N	f	public	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
8	9	Đào Nguyễn Ngọc Trúc	https://lh3.googleusercontent.com/a/ACg8ocLOcDKE7-v_mlPIyymi_6TmkNjvGejVJYyga1gURWbxbtI8D8k=s96-c	\N	\N	\N	\N	\N	\N	f	public	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
9	10	trucdau	\N	\N	\N	\N	\N	\N	\N	f	public	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00	\N
1	1	wing nhu	https://awetfafplorxlmdifkqd.supabase.co/storage/v1/object/public/uploads/member-avatar/2026/06/1/d1cdd95c-7a1b-4a03-b3ca-d3f670261566.jpg	https://awetfafplorxlmdifkqd.supabase.co/storage/v1/object/public/uploads/member-cover/2026/06/1/03057bcc-5461-4e1f-94c2-ba4b25d7a53b.jpg	\N	độc toàn thân	\N	\N	\N	f	public	2026-06-20 08:13:45.281878+00	2026-06-20 09:12:09.916737+00	\N
5	6	trucdau	\N	\N	gfhcf	ghkfdwsnl	1	324	\N	t	public	2026-06-20 08:13:45.281878+00	2026-06-20 10:38:25.826611+00	\N
10	12	Quỳnh Như	https://awetfafplorxlmdifkqd.supabase.co/storage/v1/object/public/uploads/member-avatar/2026/06/12/8a0f2aca-2ebd-4d5c-b6f9-e9f1e33a50dc.jpg	https://awetfafplorxlmdifkqd.supabase.co/storage/v1/object/public/uploads/member-cover/2026/06/12/e89939dc-ea4b-4db0-bdec-734b8c539952.jpg	\N	\N	\N	\N	\N	f	public	2026-06-20 11:30:55.400726+00	2026-06-20 11:32:32.333518+00	\N
2	2	Nguyễn Quốc Minh	https://lh3.googleusercontent.com/a/ACg8ocJ19Soyopk0N2fDRtecDGmhJNdujPBTD9nzkuvm41vRXR2fQ4Bk=s96-c	\N	Dev	Bla bla	30	216	https://nguyenquocminh.id.vn	f	public	2026-06-20 08:13:45.281878+00	2026-06-20 13:27:55.576149+00	\N
12	14	Nguyên Phan	https://lh3.googleusercontent.com/a/ACg8ocJCi6n1e-SEOO4FrSXXXE1bsqW-ZRHepcD8UmoAsV_WSnpYCybP=s96-c	\N	\N	\N	\N	\N	\N	f	public	2026-06-23 03:41:15.074292+00	2026-06-23 03:41:15.074292+00	\N
13	15	Thànhh Tr Văn	https://lh3.googleusercontent.com/a/ACg8ocJo1k1xemLnzGekmx5R5C35fJjKL-A_YSczi_rCUFnCf6nNLxA=s96-c	\N	\N	\N	\N	\N	\N	f	public	2026-06-28 13:28:20.272509+00	2026-06-28 13:28:20.272509+00	\N
11	13	Nguyễn Phúc Dui	https://awetfafplorxlmdifkqd.supabase.co/storage/v1/object/public/uploads/member-avatar/2026/06/13/0a033f7f-8c5c-4fff-ab10-459a4a46a60b.jpg	https://awetfafplorxlmdifkqd.supabase.co/storage/v1/object/public/uploads/member-cover/2026/06/13/d06a999a-67cf-484f-bf73-c9202d58ee4a.jpg	\N	Thủ khoa khối A, Alime UwU	\N	\N	\N	f	public	2026-06-22 02:42:49.761311+00	2026-06-30 01:21:48.68096+00	\N
14	26	Huy Sau Ve	https://lh3.googleusercontent.com/a/ACg8ocJZrC7jFUje6rR6vwdrA6yU9TwQiSl90F0eLfsQ2KFyyX-JUw=s96-c	\N	\N	\N	\N	\N	\N	f	public	2026-07-04 13:41:03.098649+00	2026-07-04 13:41:03.098649+00	\N
3	4	Nguyễn Quốc Minh	https://awetfafplorxlmdifkqd.supabase.co/storage/v1/object/public/uploads/member-avatar/2026/07/4/772006ae-11b0-4c89-a729-c24db39fc06d.jpg	https://awetfafplorxlmdifkqd.supabase.co/storage/v1/object/public/uploads/member-cover/2026/07/4/d54ac404-ba62-4cd5-aa4c-c1e0f3f8ccfa.jpg	\N	\N	\N	\N	\N	t	public	2026-06-20 08:13:45.281878+00	2026-07-04 14:21:11.720541+00	\N
\.


ALTER TABLE public.member_profiles ENABLE TRIGGER ALL;

--
-- Data for Name: member_skills; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public.member_skills DISABLE TRIGGER ALL;

COPY public.member_skills (id, user_id, name, endorsement_count) FROM stdin;
1	2	HTML	0
2	2	PHP	0
3	6	gvhyf	0
4	4	PHP	0
\.


ALTER TABLE public.member_skills ENABLE TRIGGER ALL;

--
-- Data for Name: messages; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public.messages DISABLE TRIGGER ALL;

COPY public.messages (id, conversation_id, sender_id, content, media, read_at, created_at, deleted_at, receiver_id) FROM stdin;
26	6	2	Cxcccccsbsbhd	\N	2026-06-22 04:18:48.9296+00	2026-06-22 04:05:49.346362+00	\N	\N
35	6	2	Jejshdhshshdhdhs	\N	2026-06-22 04:18:48.9296+00	2026-06-22 04:18:32.318094+00	\N	13
36	6	13	Hii	\N	2026-06-22 04:18:58.919607+00	2026-06-22 04:18:54.271137+00	\N	2
38	2	11	ayyo\nhttps://joblink.umters.club/posts/20	\N	\N	2026-06-23 01:30:35.273186+00	\N	1
1	1	2	hi	\N	2026-06-20 08:18:43.69681+00	2026-06-20 08:18:35.171459+00	\N	1
2	1	1	hẹ hẹ hẹ	\N	2026-06-20 08:19:39.623791+00	2026-06-20 08:18:52.114125+00	\N	2
40	9	11	ayyo\nhttps://joblink.umters.club/posts/20	\N	2026-06-23 02:04:04.535214+00	2026-06-23 01:31:09.107108+00	\N	12
4	2	11	hì looo	\N	2026-06-20 09:09:01.8473+00	2026-06-20 09:07:28.462925+00	\N	1
3	1	1	https://joblink.umters.club/posts/5	\N	2026-06-20 09:23:37.291969+00	2026-06-20 08:26:45.060098+00	\N	2
6	1	2	vjbjfjffj	\N	2026-06-20 09:24:07.604858+00	2026-06-20 09:23:39.392059+00	\N	1
7	1	2	hhh	\N	2026-06-20 09:24:07.604858+00	2026-06-20 09:23:52.833235+00	\N	1
8	1	1	jhjagj	\N	2026-06-20 09:24:17.862219+00	2026-06-20 09:23:54.216313+00	\N	2
9	3	4	hi	\N	2026-06-20 09:30:37.15357+00	2026-06-20 09:28:37.577842+00	\N	1
10	1	2	sbdfhjhdkf	\N	2026-06-20 09:31:57.525778+00	2026-06-20 09:31:20.663876+00	\N	1
11	1	2	jfjfjfj	\N	2026-06-20 09:31:57.525778+00	2026-06-20 09:31:34.561226+00	\N	1
12	1	1	ggg	\N	2026-06-20 09:32:08.847313+00	2026-06-20 09:32:07.508611+00	\N	2
14	1	1	kk	\N	2026-06-20 09:32:31.922028+00	2026-06-20 09:32:28.734839+00	\N	2
13	1	2	hhh	\N	2026-06-20 09:32:54.79811+00	2026-06-20 09:32:19.361279+00	\N	1
15	1	2	hihihi	\N	2026-06-20 09:41:16.465964+00	2026-06-20 09:41:08.600161+00	\N	1
16	1	1	jjajaj	\N	2026-06-20 09:42:09.810197+00	2026-06-20 09:41:17.998892+00	\N	2
17	1	2	hihiihiih	\N	2026-06-20 09:46:46.116973+00	2026-06-20 09:42:14.466799+00	\N	1
5	2	1	em không có nhu cầu mua bán vũ khí ạ	\N	2026-06-20 10:50:09.844977+00	2026-06-20 09:09:13.829179+00	\N	11
18	1	1	ablalal	\N	2026-06-20 10:51:16.213424+00	2026-06-20 10:28:14.824326+00	\N	2
20	3	4	http://localhost:3000/posts/8	\N	2026-06-20 11:19:09.01416+00	2026-06-20 11:11:00.56356+00	\N	1
19	1	2	https://joblink.umters.club/posts/5	\N	2026-06-20 11:19:14.180708+00	2026-06-20 11:10:10.13063+00	\N	1
21	1	2	https://joblink.umters.club/posts/8	\N	2026-06-22 02:39:35.876911+00	2026-06-20 11:19:50.329217+00	\N	1
24	4	13	Okkkk	\N	\N	2026-06-22 02:50:59.4217+00	\N	1
25	4	13	Ê ê heyo  rubychannn hiii naniga sùki?!?UwU\n\nMua bán tất cả vũ khí trong Free Fire - Công Ty TNHH MTV Mua Bán Vũ Khí Vũ Trang\nhttps://joblink.umters.club/jobs/2	\N	\N	2026-06-22 02:55:45.545292+00	\N	1
23	4	1	chao cau nha	\N	2026-06-22 04:06:23.72266+00	2026-06-22 02:50:39.168803+00	\N	13
28	7	2	Blahajhahđ	\N	2026-06-22 04:08:55.879912+00	2026-06-22 04:08:43.566159+00	\N	\N
29	7	4	...	\N	2026-06-22 04:09:35.18558+00	2026-06-22 04:09:11.210163+00	\N	\N
22	1	1	ddu me may	\N	2026-06-22 04:10:03.974592+00	2026-06-22 02:39:38.677851+00	\N	2
27	6	13	Gu em	\N	2026-06-22 04:10:17.703589+00	2026-06-22 04:06:01.149043+00	\N	\N
30	7	2	Vhhhh	\N	2026-06-22 04:15:09.91264+00	2026-06-22 04:14:50.708065+00	\N	4
31	7	2	Dd	\N	2026-06-22 04:15:43.893324+00	2026-06-22 04:15:41.547134+00	\N	4
32	7	4	sdjkfjhsd	\N	2026-06-22 04:17:09.652938+00	2026-06-22 04:15:48.731855+00	\N	2
33	7	2	Fff	\N	2026-06-22 04:17:15.586698+00	2026-06-22 04:17:13.618938+00	\N	4
34	7	4	gjgjhgjhgjfhvd	\N	2026-06-22 04:17:22.732791+00	2026-06-22 04:17:19.854065+00	\N	2
41	10	12	hiii	\N	2026-06-23 03:16:27.142789+00	2026-06-23 02:23:36.974806+00	\N	13
39	8	11	ayyo\nhttps://joblink.umters.club/posts/20	\N	2026-06-23 03:16:47.791561+00	2026-06-23 01:30:52.295658+00	\N	13
42	10	13	hi ban la ai vay	\N	2026-06-23 03:16:49.737503+00	2026-06-23 03:16:40.028924+00	\N	12
44	10	12	CEO công ty trên toàn thế giới	\N	2026-06-23 03:17:24.101703+00	2026-06-23 03:17:12.808198+00	\N	13
43	8	13	cho toi cong viec ngay lap tuc	\N	2026-06-23 03:18:22.040415+00	2026-06-23 03:16:55.910065+00	\N	11
45	8	11	ok cu	\N	2026-06-23 03:19:13.982377+00	2026-06-23 03:18:25.705323+00	\N	13
37	6	2	Hdhdhdhdbdbdhs	\N	2026-06-23 03:20:32.25577+00	2026-06-22 04:19:13.890589+00	\N	13
46	8	13	hihihihi	\N	2026-06-23 03:27:02.819114+00	2026-06-23 03:26:37.994169+00	\N	11
50	1	2	abc	\N	\N	2026-07-04 07:39:40.02416+00	\N	1
47	6	2	hiahdsakd	\N	2026-07-04 08:01:02.66731+00	2026-07-02 04:21:32.469253+00	\N	13
48	6	2	hâhhahahahhaha	\N	2026-07-04 08:01:02.66731+00	2026-07-02 04:21:47.45235+00	\N	13
49	6	2	haahádhashdádhashdh	\N	2026-07-04 08:01:02.66731+00	2026-07-02 04:22:00.200114+00	\N	13
51	6	13	haha	\N	2026-07-04 08:06:29.608952+00	2026-07-04 08:01:06.111082+00	\N	2
52	6	2	áhdakjsfkds	\N	\N	2026-07-04 08:06:47.467285+00	\N	13
53	7	4	Hâh	\N	2026-07-04 14:22:54.297857+00	2026-07-04 14:22:42.002148+00	\N	2
54	7	2	jjj	\N	2026-07-04 14:23:15.163071+00	2026-07-04 14:23:11.350965+00	\N	4
55	7	4	Dljz	\N	2026-07-04 14:23:45.992715+00	2026-07-04 14:23:38.741475+00	\N	2
56	7	2	hú	\N	2026-07-04 14:34:22.017328+00	2026-07-04 14:34:06.815741+00	\N	4
57	7	4	Bla bla bla	\N	2026-07-04 14:34:32.600125+00	2026-07-04 14:34:30.473481+00	\N	2
58	7	2	...	\N	2026-07-04 14:38:45.854896+00	2026-07-04 14:38:00.623281+00	\N	4
59	7	4	Ừ	\N	2026-07-04 14:39:15.949467+00	2026-07-04 14:39:13.879742+00	\N	2
60	7	4	Sđxxd	\N	2026-07-04 14:50:30.926294+00	2026-07-04 14:50:16.892621+00	\N	2
61	7	2	kkkkk	\N	2026-07-04 14:50:42.644699+00	2026-07-04 14:50:35.357985+00	\N	4
63	7	2	kkkhjgjjfj	\N	2026-07-04 14:51:02.615308+00	2026-07-04 14:50:59.125479+00	\N	4
62	7	4	Gdhdhdhdh	\N	2026-07-04 14:51:04.551245+00	2026-07-04 14:50:46.487322+00	\N	2
64	7	2	hhhh	\N	2026-07-04 14:51:27.66073+00	2026-07-04 14:51:22.909957+00	\N	4
65	7	2	jjjjj	\N	2026-07-04 14:57:41.348448+00	2026-07-04 14:54:41.667922+00	\N	4
67	7	2	fdfghggg	\N	2026-07-04 14:58:09.665832+00	2026-07-04 14:57:57.754051+00	\N	4
66	7	4	Hãaaa	\N	2026-07-04 14:58:12.53423+00	2026-07-04 14:57:53.53169+00	\N	2
68	7	4	Okok	\N	2026-07-04 14:58:27.130724+00	2026-07-04 14:58:21.960803+00	\N	2
69	7	4	Uk	\N	2026-07-04 15:00:00.610176+00	2026-07-04 14:59:58.816926+00	\N	2
70	7	2	okok	\N	2026-07-04 15:00:56.020221+00	2026-07-04 15:00:54.862002+00	\N	4
71	7	4	Dfff	\N	2026-07-04 15:01:06.031452+00	2026-07-04 15:01:03.590365+00	\N	2
72	7	2	kkkk	\N	2026-07-04 15:07:43.415092+00	2026-07-04 15:07:13.276889+00	\N	4
73	7	2	kghjybbyyb	\N	2026-07-04 15:11:59.212712+00	2026-07-04 15:11:09.820908+00	\N	4
74	7	2	sfdfsdf	\N	2026-07-04 15:11:59.212712+00	2026-07-04 15:11:11.783869+00	\N	4
75	7	2	àdgdfg	\N	2026-07-04 15:11:59.212712+00	2026-07-04 15:11:13.864451+00	\N	4
76	7	4	T	\N	2026-07-04 15:13:33.945313+00	2026-07-04 15:13:28.442563+00	\N	2
\.


ALTER TABLE public.messages ENABLE TRIGGER ALL;

--
-- Data for Name: reports; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public.reports DISABLE TRIGGER ALL;

COPY public.reports (id, reporter_id, target_type, target_id, reason, description, status, assigned_to, resolved_by, resolved_at, created_at, updated_at) FROM stdin;
2	1	post	4	hate_speech	không thân thiện	dismissed	\N	5	2026-06-20 09:56:37.17+00	2026-06-20 09:22:59.825744+00	2026-06-20 09:22:59.825744+00
1	1	post	5	copyright	\N	dismissed	\N	5	2026-06-20 09:56:39.502+00	2026-06-20 08:34:54.522983+00	2026-06-20 08:34:54.522983+00
3	12	post	19	inappropriate	\N	pending	\N	\N	\N	2026-06-23 02:09:17.069584+00	2026-06-23 02:09:17.069584+00
4	12	comment	20	spam	\N	pending	\N	\N	\N	2026-06-23 02:22:26.76291+00	2026-06-23 02:22:26.76291+00
\.


ALTER TABLE public.reports ENABLE TRIGGER ALL;

--
-- Data for Name: moderation_actions; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public.moderation_actions DISABLE TRIGGER ALL;

COPY public.moderation_actions (id, report_id, moderator_id, target_type, target_id, action_type, reason, created_at) FROM stdin;
\.


ALTER TABLE public.moderation_actions ENABLE TRIGGER ALL;

--
-- Data for Name: network_suggestions; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public.network_suggestions DISABLE TRIGGER ALL;

COPY public.network_suggestions (user_id, suggested_user_id, score, created_at) FROM stdin;
18	24	1	2026-07-04 09:42:56.737473+00
18	23	1	2026-07-04 09:42:56.737473+00
18	22	1	2026-07-04 09:42:56.737473+00
18	21	1	2026-07-04 09:42:56.737473+00
18	19	1	2026-07-04 09:42:56.737473+00
18	17	1	2026-07-04 09:42:56.737473+00
18	16	1	2026-07-04 09:42:56.737473+00
11	10	1	2026-06-23 01:53:18.062801+00
11	9	1	2026-06-23 01:53:18.062801+00
11	8	1	2026-06-23 01:53:18.062801+00
11	7	1	2026-06-23 01:53:18.062801+00
11	6	1	2026-06-23 01:53:18.062801+00
11	4	1	2026-06-23 01:53:18.062801+00
11	3	1	2026-06-23 01:53:18.062801+00
18	15	1	2026-07-04 09:42:56.737473+00
18	14	1	2026-07-04 09:42:56.737473+00
18	13	1	2026-07-04 09:42:56.737473+00
13	8	1	2026-06-23 03:25:29.16213+00
13	3	1	2026-06-23 03:25:29.16213+00
18	12	1	2026-07-04 09:42:56.737473+00
18	11	1	2026-07-04 09:42:56.737473+00
18	10	1	2026-07-04 09:42:56.737473+00
18	9	1	2026-07-04 09:42:56.737473+00
18	8	1	2026-07-04 09:42:56.737473+00
18	7	1	2026-07-04 09:42:56.737473+00
18	6	1	2026-07-04 09:42:56.737473+00
18	4	1	2026-07-04 09:42:56.737473+00
1	12	1	2026-06-22 02:51:51.441625+00
1	10	1	2026-06-22 02:51:51.441625+00
1	9	1	2026-06-22 02:51:51.441625+00
1	8	1	2026-06-22 02:51:51.441625+00
1	7	1	2026-06-22 02:51:51.441625+00
1	6	1	2026-06-22 02:51:51.441625+00
1	3	1	2026-06-22 02:51:51.441625+00
18	3	1	2026-07-04 09:42:56.737473+00
18	2	1	2026-07-04 09:42:56.737473+00
2	25	1	2026-07-04 15:10:34.177445+00
2	24	1	2026-07-04 15:10:34.177445+00
2	23	1	2026-07-04 15:10:34.177445+00
2	22	1	2026-07-04 15:10:34.177445+00
2	21	1	2026-07-04 15:10:34.177445+00
2	19	1	2026-07-04 15:10:34.177445+00
2	18	1	2026-07-04 15:10:34.177445+00
2	17	1	2026-07-04 15:10:34.177445+00
2	16	1	2026-07-04 15:10:34.177445+00
6	11	1	2026-06-20 10:39:04.960647+00
2	14	1	2026-07-04 15:10:34.177445+00
2	12	1	2026-07-04 15:10:34.177445+00
2	10	1	2026-07-04 15:10:34.177445+00
2	9	1	2026-07-04 15:10:34.177445+00
2	8	1	2026-07-04 15:10:34.177445+00
2	7	1	2026-07-04 15:10:34.177445+00
2	6	1	2026-07-04 15:10:34.177445+00
2	3	1	2026-07-04 15:10:34.177445+00
6	10	1	2026-06-20 10:39:04.960647+00
6	9	1	2026-06-20 10:39:04.960647+00
6	8	1	2026-06-20 10:39:04.960647+00
6	7	1	2026-06-20 10:39:04.960647+00
6	4	1	2026-06-20 10:39:04.960647+00
6	3	1	2026-06-20 10:39:04.960647+00
6	2	1	2026-06-20 10:39:04.960647+00
14	13	1	2026-06-30 07:31:42.185164+00
14	12	1	2026-06-30 07:31:42.185164+00
14	11	1	2026-06-30 07:31:42.185164+00
14	10	1	2026-06-30 07:31:42.185164+00
14	9	1	2026-06-30 07:31:42.185164+00
14	8	1	2026-06-30 07:31:42.185164+00
14	7	1	2026-06-30 07:31:42.185164+00
14	6	1	2026-06-30 07:31:42.185164+00
14	4	1	2026-06-30 07:31:42.185164+00
12	10	1	2026-06-23 02:21:20.311428+00
12	9	1	2026-06-23 02:21:20.311428+00
12	8	1	2026-06-23 02:21:20.311428+00
12	7	1	2026-06-23 02:21:20.311428+00
12	6	1	2026-06-23 02:21:20.311428+00
12	4	1	2026-06-23 02:21:20.311428+00
12	3	1	2026-06-23 02:21:20.311428+00
12	2	1	2026-06-23 02:21:20.311428+00
14	3	1	2026-06-30 07:31:42.185164+00
14	2	1	2026-06-30 07:31:42.185164+00
5	26	1	2026-07-04 13:51:06.896357+00
5	25	1	2026-07-04 13:51:06.896357+00
5	24	1	2026-07-04 13:51:06.896357+00
5	23	1	2026-07-04 13:51:06.896357+00
5	22	1	2026-07-04 13:51:06.896357+00
5	21	1	2026-07-04 13:51:06.896357+00
5	19	1	2026-07-04 13:51:06.896357+00
5	18	1	2026-07-04 13:51:06.896357+00
5	17	1	2026-07-04 13:51:06.896357+00
5	16	1	2026-07-04 13:51:06.896357+00
5	15	1	2026-07-04 13:51:06.896357+00
5	14	1	2026-07-04 13:51:06.896357+00
5	13	1	2026-07-04 13:51:06.896357+00
5	12	1	2026-07-04 13:51:06.896357+00
5	11	1	2026-07-04 13:51:06.896357+00
5	10	1	2026-07-04 13:51:06.896357+00
5	9	1	2026-07-04 13:51:06.896357+00
5	8	1	2026-07-04 13:51:06.896357+00
5	7	1	2026-07-04 13:51:06.896357+00
5	6	1	2026-07-04 13:51:06.896357+00
5	4	1	2026-07-04 13:51:06.896357+00
5	3	1	2026-07-04 13:51:06.896357+00
5	2	1	2026-07-04 13:51:06.896357+00
4	26	1	2026-07-04 15:00:31.79508+00
4	25	1	2026-07-04 15:00:31.79508+00
4	24	1	2026-07-04 15:00:31.79508+00
4	23	1	2026-07-04 15:00:31.79508+00
4	22	1	2026-07-04 15:00:31.79508+00
4	21	1	2026-07-04 15:00:31.79508+00
4	19	1	2026-07-04 15:00:31.79508+00
4	18	1	2026-07-04 15:00:31.79508+00
4	17	1	2026-07-04 15:00:31.79508+00
4	16	1	2026-07-04 15:00:31.79508+00
4	14	1	2026-07-04 15:00:31.79508+00
4	11	1	2026-07-04 15:00:31.79508+00
4	10	1	2026-07-04 15:00:31.79508+00
4	7	1	2026-07-04 15:00:31.79508+00
4	6	1	2026-07-04 15:00:31.79508+00
4	3	1	2026-07-04 15:00:31.79508+00
\.


ALTER TABLE public.network_suggestions ENABLE TRIGGER ALL;

--
-- Data for Name: notification_preferences; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public.notification_preferences DISABLE TRIGGER ALL;

COPY public.notification_preferences (id, user_id, type, in_app_enabled, email_enabled) FROM stdin;
1	4	like	t	t
2	4	comment	t	t
3	4	newConnection	t	t
\.


ALTER TABLE public.notification_preferences ENABLE TRIGGER ALL;

--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public.notifications DISABLE TRIGGER ALL;

COPY public.notifications (id, user_id, type, title, payload, read_at, created_at) FROM stdin;
181	11	post_reaction	\N	{"type": "post_reaction", "postId": 13, "userId": 2, "avatarUrl": "https://lh3.googleusercontent.com/a/ACg8ocJ19Soyopk0N2fDRtecDGmhJNdujPBTD9nzkuvm41vRXR2fQ4Bk=s96-c", "displayName": "Nguyễn Quốc Minh", "reactionType": "like"}	\N	2026-07-02 10:16:22.4585+00
1	1	connection_request	\N	{"type": "connection_request", "userId": 2, "avatarUrl": "https://lh3.googleusercontent.com/a/ACg8ocJ19Soyopk0N2fDRtecDGmhJNdujPBTD9nzkuvm41vRXR2fQ4Bk=s96-c", "displayName": "Minh Nguyễn Quốc (Min min)", "connectionId": 1}	2026-06-20 08:17:59.387+00	2026-06-20 08:17:46.350368+00
182	11	post_reaction	\N	{"type": "post_reaction", "postId": 13, "userId": 2, "avatarUrl": "https://lh3.googleusercontent.com/a/ACg8ocJ19Soyopk0N2fDRtecDGmhJNdujPBTD9nzkuvm41vRXR2fQ4Bk=s96-c", "displayName": "Nguyễn Quốc Minh", "reactionType": "like"}	\N	2026-07-02 10:16:29.744436+00
192	9	connection_request	\N	{"type": "connection_request", "userId": 4, "avatarUrl": "https://awetfafplorxlmdifkqd.supabase.co/storage/v1/object/public/uploads/member-avatar/2026/07/4/772006ae-11b0-4c89-a729-c24db39fc06d.jpg", "displayName": "Nguyễn Quốc Minh", "connectionId": 31}	\N	2026-07-04 14:12:24.289166+00
2	2	connection_accepted	\N	{"type": "connection_accepted", "userId": 1, "avatarUrl": null, "displayName": "wing nhu", "connectionId": 1}	2026-06-20 08:18:43.108+00	2026-06-20 08:18:04.395515+00
3	1	new_message	\N	{"type": "new_message", "userId": 2, "excerpt": "hi", "avatarUrl": "https://lh3.googleusercontent.com/a/ACg8ocJ19Soyopk0N2fDRtecDGmhJNdujPBTD9nzkuvm41vRXR2fQ4Bk=s96-c", "displayName": "Minh Nguyễn Quốc (Min min)", "conversationId": 1}	2026-06-20 08:18:43.837+00	2026-06-20 08:18:35.841724+00
4	2	new_message	\N	{"type": "new_message", "userId": 1, "excerpt": "hẹ hẹ hẹ", "avatarUrl": null, "displayName": "wing nhu", "conversationId": 1}	2026-06-20 08:19:39.764+00	2026-06-20 08:18:52.671505+00
201	2	new_message	\N	{"type": "new_message", "userId": 4, "excerpt": "Ừ", "avatarUrl": "https://awetfafplorxlmdifkqd.supabase.co/storage/v1/object/public/uploads/member-avatar/2026/07/4/772006ae-11b0-4c89-a729-c24db39fc06d.jpg", "displayName": "Nguyễn Quốc Minh", "conversationId": 7}	2026-07-04 14:39:16.105+00	2026-07-04 14:39:14.434201+00
73	1	post_comment	\N	{"type": "post_comment", "postId": 5, "userId": 5, "excerpt": "@wing nhu hehe", "avatarUrl": null, "commentId": 9, "displayName": "Nguyễn Quốc Minh"}	2026-06-22 02:43:31.336+00	2026-06-20 13:38:32.174123+00
5	1	post_comment	\N	{"type": "post_comment", "postId": 6, "userId": 2, "excerpt": "dữ dữ", "avatarUrl": "https://lh3.googleusercontent.com/a/ACg8ocJ19Soyopk0N2fDRtecDGmhJNdujPBTD9nzkuvm41vRXR2fQ4Bk=s96-c", "commentId": 1, "displayName": "Minh Nguyễn Quốc (Min min)"}	2026-06-20 08:33:31.455+00	2026-06-20 08:26:09.066783+00
9	2	connection_request	\N	{"type": "connection_request", "userId": 11, "avatarUrl": null, "displayName": "Công Ty TNHH MTV Mua Bán Vũ Khí Vũ Trang", "connectionId": 2}	2026-06-20 08:44:08.211+00	2026-06-20 08:32:25.843545+00
8	2	post_reaction	\N	{"type": "post_reaction", "postId": 5, "userId": 1, "avatarUrl": null, "displayName": "wing nhu", "reactionType": "like"}	2026-06-20 08:44:08.211+00	2026-06-20 08:27:08.049722+00
7	2	new_message	\N	{"type": "new_message", "userId": 1, "excerpt": "https://joblink.umters.club/posts/5", "avatarUrl": null, "displayName": "wing nhu", "conversationId": 1}	2026-06-20 08:44:08.211+00	2026-06-20 08:26:45.613799+00
6	2	post_comment	\N	{"type": "post_comment", "postId": 5, "userId": 1, "excerpt": "hình như nhóm này lên trình bày sai không có điểm", "avatarUrl": null, "commentId": 2, "displayName": "wing nhu"}	2026-06-20 08:44:08.211+00	2026-06-20 08:26:31.459363+00
82	7	connection_request	\N	{"type": "connection_request", "userId": 13, "avatarUrl": null, "displayName": "Nguyễn Fuck Dui", "connectionId": 9}	\N	2026-06-22 02:43:33.451516+00
71	11	company_followed	\N	{"type": "company_followed", "userId": 2, "avatarUrl": "https://lh3.googleusercontent.com/a/ACg8ocJ19Soyopk0N2fDRtecDGmhJNdujPBTD9nzkuvm41vRXR2fQ4Bk=s96-c", "displayName": "Nguyễn Quốc Minh"}	2026-06-22 02:58:58.933+00	2026-06-20 13:02:36.004552+00
78	2	new_message	\N	{"type": "new_message", "userId": 1, "excerpt": "ddu me may", "avatarUrl": "https://awetfafplorxlmdifkqd.supabase.co/storage/v1/object/public/uploads/member-avatar/2026/06/1/d1cdd95c-7a1b-4a03-b3ca-d3f670261566.jpg", "displayName": "wing nhu", "conversationId": 1}	2026-06-22 03:22:50.477+00	2026-06-22 02:39:39.203925+00
13	4	connection_accepted	\N	{"type": "connection_accepted", "userId": 1, "avatarUrl": null, "displayName": "wing nhu", "connectionId": 3}	2026-06-20 08:56:44.21+00	2026-06-20 08:55:43.337551+00
17	4	interview_scheduled	\N	{"type": "interview_scheduled", "jobId": 1, "userId": 11, "jobTitle": "Tuyển nhân viên SALE AK47", "avatarUrl": null, "displayName": "Công Ty TNHH MTV Mua Bán Vũ Khí Vũ Trang", "scheduledAt": "2026-06-21T08:58:00+00:00", "applicationId": 6}	2026-06-20 08:59:05.659+00	2026-06-20 08:58:29.460137+00
19	11	interview_response	\N	{"type": "interview_response", "jobId": 1, "userId": 4, "accepted": true, "jobTitle": "Tuyển nhân viên SALE AK47", "avatarUrl": null, "displayName": "Nguyễn Quốc Minh", "applicationId": 6}	2026-06-20 09:00:00.205+00	2026-06-20 08:59:42.127938+00
22	11	connection_accepted	\N	{"type": "connection_accepted", "userId": 1, "avatarUrl": null, "displayName": "wing nhu", "connectionId": 4}	2026-06-20 09:06:48.723+00	2026-06-20 09:05:36.784822+00
15	11	job_application_received	\N	{"type": "job_application_received", "jobId": 1, "userId": 1, "jobTitle": "Tuyển nhân viên SALE AK47", "avatarUrl": null, "displayName": "wing nhu", "applicationId": 7}	2026-06-20 09:06:48.723+00	2026-06-20 08:56:36.587046+00
14	11	job_application_received	\N	{"type": "job_application_received", "jobId": 1, "userId": 4, "jobTitle": "Tuyển nhân viên SALE AK47", "avatarUrl": null, "displayName": "Nguyễn Quốc Minh", "applicationId": 6}	2026-06-20 09:06:48.723+00	2026-06-20 08:56:16.916441+00
20	4	application_status_changed	\N	{"type": "application_status_changed", "jobId": 1, "userId": 11, "jobTitle": "Tuyển nhân viên SALE AK47", "avatarUrl": null, "newStatus": "hired", "displayName": "Công Ty TNHH MTV Mua Bán Vũ Khí Vũ Trang", "applicationId": 6}	2026-06-20 09:16:04.609+00	2026-06-20 09:02:07.933941+00
25	1	post_reaction	\N	{"type": "post_reaction", "postId": 6, "userId": 11, "avatarUrl": null, "displayName": "Công Ty TNHH MTV Mua Bán Vũ Khí Vũ Trang", "reactionType": "like"}	2026-06-20 09:23:37.079+00	2026-06-20 09:06:45.10399+00
24	1	post_reaction	\N	{"type": "post_reaction", "postId": 8, "userId": 11, "avatarUrl": null, "displayName": "Công Ty TNHH MTV Mua Bán Vũ Khí Vũ Trang", "reactionType": "like"}	2026-06-20 09:23:37.079+00	2026-06-20 09:06:36.425712+00
10	11	company_followed	\N	{"type": "company_followed", "userId": 1, "avatarUrl": null, "displayName": "wing nhu"}	2026-06-20 09:06:48.723+00	2026-06-20 08:45:08.890611+00
26	1	new_message	\N	{"type": "new_message", "userId": 11, "excerpt": "hì looo", "avatarUrl": null, "displayName": "Công Ty TNHH MTV Mua Bán Vũ Khí Vũ Trang", "conversationId": 2}	2026-06-20 09:09:02.032+00	2026-06-20 09:07:29.013989+00
21	1	connection_request	\N	{"type": "connection_request", "userId": 11, "avatarUrl": null, "displayName": "Công Ty TNHH MTV Mua Bán Vũ Khí Vũ Trang", "connectionId": 4}	2026-06-20 09:23:37.079+00	2026-06-20 09:04:45.224777+00
18	1	application_status_changed	\N	{"type": "application_status_changed", "jobId": 1, "userId": 11, "jobTitle": "Tuyển nhân viên SALE AK47", "avatarUrl": null, "newStatus": "hired", "displayName": "Công Ty TNHH MTV Mua Bán Vũ Khí Vũ Trang", "applicationId": 7}	2026-06-20 09:23:37.079+00	2026-06-20 08:59:28.960497+00
184	2	user_followed	\N	{"type": "user_followed", "userId": 5, "avatarUrl": null, "displayName": "Nguyễn Quốc Minh"}	2026-07-03 08:21:59.535+00	2026-07-03 08:19:13.582895+00
12	1	connection_request	\N	{"type": "connection_request", "userId": 4, "avatarUrl": null, "displayName": "Nguyễn Quốc Minh", "connectionId": 3}	2026-06-20 09:23:37.079+00	2026-06-20 08:55:18.013228+00
183	2	user_followed	\N	{"type": "user_followed", "userId": 5, "avatarUrl": null, "displayName": "Nguyễn Quốc Minh"}	2026-07-03 08:21:59.535+00	2026-07-03 08:19:06.263699+00
72	2	post_comment	\N	{"type": "post_comment", "postId": 5, "userId": 5, "excerpt": "@wing nhu hehe", "avatarUrl": null, "commentId": 9, "displayName": "Nguyễn Quốc Minh"}	2026-06-20 15:42:09.56+00	2026-06-20 13:38:32.149994+00
28	1	new_message	\N	{"type": "new_message", "userId": 2, "excerpt": "vjbjfjffj", "avatarUrl": "https://lh3.googleusercontent.com/a/ACg8ocJ19Soyopk0N2fDRtecDGmhJNdujPBTD9nzkuvm41vRXR2fQ4Bk=s96-c", "displayName": "Nguyễn Quốc Minh", "conversationId": 1}	2026-06-20 09:23:40.19+00	2026-06-20 09:23:39.937033+00
193	12	connection_request	\N	{"type": "connection_request", "userId": 4, "avatarUrl": "https://awetfafplorxlmdifkqd.supabase.co/storage/v1/object/public/uploads/member-avatar/2026/07/4/772006ae-11b0-4c89-a729-c24db39fc06d.jpg", "displayName": "Nguyễn Quốc Minh", "connectionId": 32}	\N	2026-07-04 14:15:11.549361+00
79	6	connection_request	\N	{"type": "connection_request", "userId": 13, "avatarUrl": null, "displayName": "Nguyễn Fuck Dui", "connectionId": 6}	\N	2026-06-22 02:43:29.10888+00
29	1	new_message	\N	{"type": "new_message", "userId": 2, "excerpt": "hhh", "avatarUrl": "https://lh3.googleusercontent.com/a/ACg8ocJ19Soyopk0N2fDRtecDGmhJNdujPBTD9nzkuvm41vRXR2fQ4Bk=s96-c", "displayName": "Nguyễn Quốc Minh", "conversationId": 1}	2026-06-20 09:24:07.779+00	2026-06-20 09:23:53.364936+00
30	2	new_message	\N	{"type": "new_message", "userId": 1, "excerpt": "jhjagj", "avatarUrl": "https://awetfafplorxlmdifkqd.supabase.co/storage/v1/object/public/uploads/member-avatar/2026/06/1/d1cdd95c-7a1b-4a03-b3ca-d3f670261566.jpg", "displayName": "wing nhu", "conversationId": 1}	2026-06-20 09:24:18.041+00	2026-06-20 09:23:54.741271+00
80	9	connection_request	\N	{"type": "connection_request", "userId": 13, "avatarUrl": null, "displayName": "Nguyễn Fuck Dui", "connectionId": 7}	\N	2026-06-22 02:43:32.686198+00
202	2	new_message	\N	{"type": "new_message", "userId": 4, "excerpt": "Sđxxd", "avatarUrl": "https://awetfafplorxlmdifkqd.supabase.co/storage/v1/object/public/uploads/member-avatar/2026/07/4/772006ae-11b0-4c89-a729-c24db39fc06d.jpg", "displayName": "Nguyễn Quốc Minh", "conversationId": 7}	2026-07-04 14:50:31.061+00	2026-07-04 14:50:17.949084+00
205	4	new_message	\N	{"type": "new_message", "userId": 2, "excerpt": "kkkhjgjjfj", "avatarUrl": "https://lh3.googleusercontent.com/a/ACg8ocJ19Soyopk0N2fDRtecDGmhJNdujPBTD9nzkuvm41vRXR2fQ4Bk=s96-c", "displayName": "Nguyễn Quốc Minh", "conversationId": 7}	2026-07-04 14:51:02.761+00	2026-07-04 14:50:59.706488+00
31	1	new_message	\N	{"type": "new_message", "userId": 4, "excerpt": "hi", "avatarUrl": null, "displayName": "Nguyễn Quốc Minh", "conversationId": 3}	2026-06-20 09:30:37.328+00	2026-06-20 09:28:37.68943+00
34	1	new_message	\N	{"type": "new_message", "userId": 2, "excerpt": "jfjfjfj", "avatarUrl": "https://lh3.googleusercontent.com/a/ACg8ocJ19Soyopk0N2fDRtecDGmhJNdujPBTD9nzkuvm41vRXR2fQ4Bk=s96-c", "displayName": "Nguyễn Quốc Minh", "conversationId": 1}	2026-06-20 09:31:57.707+00	2026-06-20 09:31:21.189016+00
35	2	new_message	\N	{"type": "new_message", "userId": 1, "excerpt": "ggg", "avatarUrl": "https://awetfafplorxlmdifkqd.supabase.co/storage/v1/object/public/uploads/member-avatar/2026/06/1/d1cdd95c-7a1b-4a03-b3ca-d3f670261566.jpg", "displayName": "wing nhu", "conversationId": 1}	2026-06-20 09:32:09.021+00	2026-06-20 09:32:08.037734+00
37	2	new_message	\N	{"type": "new_message", "userId": 1, "excerpt": "kk", "avatarUrl": "https://awetfafplorxlmdifkqd.supabase.co/storage/v1/object/public/uploads/member-avatar/2026/06/1/d1cdd95c-7a1b-4a03-b3ca-d3f670261566.jpg", "displayName": "wing nhu", "conversationId": 1}	2026-06-20 09:32:32.097+00	2026-06-20 09:32:29.272615+00
36	1	new_message	\N	{"type": "new_message", "userId": 2, "excerpt": "hhh", "avatarUrl": "https://lh3.googleusercontent.com/a/ACg8ocJ19Soyopk0N2fDRtecDGmhJNdujPBTD9nzkuvm41vRXR2fQ4Bk=s96-c", "displayName": "Nguyễn Quốc Minh", "conversationId": 1}	2026-06-20 09:32:54.972+00	2026-06-20 09:32:19.914652+00
38	1	new_message	\N	{"type": "new_message", "userId": 2, "excerpt": "hihihi", "avatarUrl": "https://lh3.googleusercontent.com/a/ACg8ocJ19Soyopk0N2fDRtecDGmhJNdujPBTD9nzkuvm41vRXR2fQ4Bk=s96-c", "displayName": "Nguyễn Quốc Minh", "conversationId": 1}	2026-06-20 09:41:16.648+00	2026-06-20 09:41:09.160225+00
39	2	new_message	\N	{"type": "new_message", "userId": 1, "excerpt": "jjajaj", "avatarUrl": "https://awetfafplorxlmdifkqd.supabase.co/storage/v1/object/public/uploads/member-avatar/2026/06/1/d1cdd95c-7a1b-4a03-b3ca-d3f670261566.jpg", "displayName": "wing nhu", "conversationId": 1}	2026-06-20 09:42:09.996+00	2026-06-20 09:41:18.523412+00
40	1	new_message	\N	{"type": "new_message", "userId": 2, "excerpt": "hihiihiih", "avatarUrl": "https://lh3.googleusercontent.com/a/ACg8ocJ19Soyopk0N2fDRtecDGmhJNdujPBTD9nzkuvm41vRXR2fQ4Bk=s96-c", "displayName": "Nguyễn Quốc Minh", "conversationId": 1}	2026-06-20 09:46:46.299+00	2026-06-20 09:42:15.012679+00
42	1	post_reaction	\N	{"type": "post_reaction", "postId": 11, "userId": 11, "avatarUrl": null, "displayName": "Công Ty TNHH MTV Mua Bán Vũ Khí Vũ Trang", "reactionType": "like"}	2026-06-20 10:15:07.992+00	2026-06-20 09:55:40.530343+00
27	11	new_message	\N	{"type": "new_message", "userId": 1, "excerpt": "em không có nhu cầu mua bán vũ khí ạ", "avatarUrl": null, "displayName": "wing nhu", "conversationId": 2}	2026-06-20 10:16:26.011+00	2026-06-20 09:09:14.353997+00
57	11	company_followed	\N	{"type": "company_followed", "userId": 1, "avatarUrl": "https://awetfafplorxlmdifkqd.supabase.co/storage/v1/object/public/uploads/member-avatar/2026/06/1/d1cdd95c-7a1b-4a03-b3ca-d3f670261566.jpg", "displayName": "wing nhu"}	2026-06-20 11:23:44.414+00	2026-06-20 10:27:47.64026+00
69	1	new_message	\N	{"type": "new_message", "userId": 2, "excerpt": "https://joblink.umters.club/posts/8", "avatarUrl": "https://lh3.googleusercontent.com/a/ACg8ocJ19Soyopk0N2fDRtecDGmhJNdujPBTD9nzkuvm41vRXR2fQ4Bk=s96-c", "displayName": "Nguyễn Quốc Minh", "conversationId": 1}	2026-06-22 02:39:36.055+00	2026-06-20 11:19:50.95273+00
185	1	new_message	\N	{"type": "new_message", "userId": 2, "excerpt": "abc", "avatarUrl": "https://lh3.googleusercontent.com/a/ACg8ocJ19Soyopk0N2fDRtecDGmhJNdujPBTD9nzkuvm41vRXR2fQ4Bk=s96-c", "displayName": "Nguyễn Quốc Minh", "conversationId": 1}	\N	2026-07-04 07:39:40.592472+00
194	8	connection_request	\N	{"type": "connection_request", "userId": 4, "avatarUrl": "https://awetfafplorxlmdifkqd.supabase.co/storage/v1/object/public/uploads/member-avatar/2026/07/4/772006ae-11b0-4c89-a729-c24db39fc06d.jpg", "displayName": "Nguyễn Quốc Minh", "connectionId": 33}	\N	2026-07-04 14:17:24.633941+00
203	4	new_message	\N	{"type": "new_message", "userId": 2, "excerpt": "kkkkk", "avatarUrl": "https://lh3.googleusercontent.com/a/ACg8ocJ19Soyopk0N2fDRtecDGmhJNdujPBTD9nzkuvm41vRXR2fQ4Bk=s96-c", "displayName": "Nguyễn Quốc Minh", "conversationId": 7}	2026-07-04 14:50:42.81+00	2026-07-04 14:50:36.393195+00
209	4	new_message	\N	{"type": "new_message", "userId": 2, "excerpt": "fdfghggg", "avatarUrl": "https://lh3.googleusercontent.com/a/ACg8ocJ19Soyopk0N2fDRtecDGmhJNdujPBTD9nzkuvm41vRXR2fQ4Bk=s96-c", "displayName": "Nguyễn Quốc Minh", "conversationId": 7}	2026-07-04 14:58:09.803+00	2026-07-04 14:57:58.293739+00
212	4	new_message	\N	{"type": "new_message", "userId": 2, "excerpt": "okok", "avatarUrl": "https://lh3.googleusercontent.com/a/ACg8ocJ19Soyopk0N2fDRtecDGmhJNdujPBTD9nzkuvm41vRXR2fQ4Bk=s96-c", "displayName": "Nguyễn Quốc Minh", "conversationId": 7}	2026-07-04 15:00:56.154+00	2026-07-04 15:00:55.46127+00
216	2	new_message	\N	{"type": "new_message", "userId": 4, "excerpt": "T", "avatarUrl": "https://awetfafplorxlmdifkqd.supabase.co/storage/v1/object/public/uploads/member-avatar/2026/07/4/772006ae-11b0-4c89-a729-c24db39fc06d.jpg", "displayName": "Nguyễn Quốc Minh", "conversationId": 7}	2026-07-04 15:13:34.089+00	2026-07-04 15:13:28.998388+00
43	1	post_comment	\N	{"type": "post_comment", "postId": 11, "userId": 11, "excerpt": "nếu làm cả 2 mà vẫn không được thì liên hệ công ty chị", "avatarUrl": null, "commentId": 3, "displayName": "Công Ty TNHH MTV Mua Bán Vũ Khí Vũ Trang"}	2026-06-20 10:15:07.992+00	2026-06-20 09:56:25.889036+00
44	1	post_comment	\N	{"type": "post_comment", "postId": 10, "userId": 11, "excerpt": "súng ảnh hay súng bên chị nhanh hơn?", "avatarUrl": null, "commentId": 4, "displayName": "Công Ty TNHH MTV Mua Bán Vũ Khí Vũ Trang"}	2026-06-20 10:15:07.992+00	2026-06-20 09:57:19.406275+00
46	1	post_reaction	\N	{"type": "post_reaction", "postId": 11, "userId": 11, "avatarUrl": null, "displayName": "Công Ty TNHH MTV Mua Bán Vũ Khí Vũ Trang", "reactionType": "like"}	2026-06-20 10:15:07.992+00	2026-06-20 10:06:17.862851+00
47	1	post_reaction	\N	{"type": "post_reaction", "postId": 11, "userId": 11, "avatarUrl": null, "displayName": "Công Ty TNHH MTV Mua Bán Vũ Khí Vũ Trang", "reactionType": "like"}	2026-06-20 10:15:07.992+00	2026-06-20 10:06:25.352272+00
48	1	post_reaction	\N	{"type": "post_reaction", "postId": 11, "userId": 11, "avatarUrl": null, "displayName": "Công Ty TNHH MTV Mua Bán Vũ Khí Vũ Trang", "reactionType": "like"}	2026-06-20 10:15:07.992+00	2026-06-20 10:06:31.867827+00
49	1	post_reaction	\N	{"type": "post_reaction", "postId": 11, "userId": 11, "avatarUrl": null, "displayName": "Công Ty TNHH MTV Mua Bán Vũ Khí Vũ Trang", "reactionType": "like"}	2026-06-20 10:15:07.992+00	2026-06-20 10:06:41.80764+00
50	1	post_reaction	\N	{"type": "post_reaction", "postId": 11, "userId": 11, "avatarUrl": null, "displayName": "Công Ty TNHH MTV Mua Bán Vũ Khí Vũ Trang", "reactionType": "like"}	2026-06-20 10:15:07.992+00	2026-06-20 10:06:53.800945+00
51	1	post_reaction	\N	{"type": "post_reaction", "postId": 11, "userId": 11, "avatarUrl": null, "displayName": "Công Ty TNHH MTV Mua Bán Vũ Khí Vũ Trang", "reactionType": "like"}	2026-06-20 10:15:07.992+00	2026-06-20 10:07:00.337263+00
56	11	post_share	\N	{"type": "post_share", "postId": 13, "userId": 1, "excerpt": null, "shareId": 1, "avatarUrl": "https://awetfafplorxlmdifkqd.supabase.co/storage/v1/object/public/uploads/member-avatar/2026/06/1/d1cdd95c-7a1b-4a03-b3ca-d3f670261566.jpg", "displayName": "wing nhu"}	2026-06-20 10:16:26.011+00	2026-06-20 10:12:38.642289+00
54	11	post_reaction	\N	{"type": "post_reaction", "postId": 12, "userId": 1, "avatarUrl": "https://awetfafplorxlmdifkqd.supabase.co/storage/v1/object/public/uploads/member-avatar/2026/06/1/d1cdd95c-7a1b-4a03-b3ca-d3f670261566.jpg", "displayName": "wing nhu", "reactionType": "like"}	2026-06-20 10:16:26.011+00	2026-06-20 10:12:12.451109+00
53	11	post_reaction	\N	{"type": "post_reaction", "postId": 13, "userId": 1, "avatarUrl": "https://awetfafplorxlmdifkqd.supabase.co/storage/v1/object/public/uploads/member-avatar/2026/06/1/d1cdd95c-7a1b-4a03-b3ca-d3f670261566.jpg", "displayName": "wing nhu", "reactionType": "like"}	2026-06-20 10:16:26.011+00	2026-06-20 10:12:07.082902+00
55	4	post_reaction	\N	{"type": "post_reaction", "postId": 4, "userId": 1, "avatarUrl": "https://awetfafplorxlmdifkqd.supabase.co/storage/v1/object/public/uploads/member-avatar/2026/06/1/d1cdd95c-7a1b-4a03-b3ca-d3f670261566.jpg", "displayName": "wing nhu", "reactionType": "like"}	2026-06-20 10:38:33.371+00	2026-06-20 10:12:25.254443+00
58	2	new_message	\N	{"type": "new_message", "userId": 1, "excerpt": "ablalal", "avatarUrl": "https://awetfafplorxlmdifkqd.supabase.co/storage/v1/object/public/uploads/member-avatar/2026/06/1/d1cdd95c-7a1b-4a03-b3ca-d3f670261566.jpg", "displayName": "wing nhu", "conversationId": 1}	2026-06-20 10:51:16.333+00	2026-06-20 10:28:15.390498+00
60	1	post_reaction	\N	{"type": "post_reaction", "postId": 10, "userId": 4, "avatarUrl": null, "displayName": "Nguyễn Quốc Minh", "reactionType": "like"}	2026-06-20 10:57:07.567+00	2026-06-20 10:56:55.22389+00
61	1	post_comment	\N	{"type": "post_comment", "postId": 10, "userId": 4, "excerpt": "cc;", "avatarUrl": null, "commentId": 5, "displayName": "Nguyễn Quốc Minh"}	2026-06-20 10:57:11.53+00	2026-06-20 10:57:03.251777+00
64	1	new_message	\N	{"type": "new_message", "userId": 4, "excerpt": "http://localhost:3000/posts/8", "avatarUrl": null, "displayName": "Nguyễn Quốc Minh", "conversationId": 3}	2026-06-20 11:19:09.142+00	2026-06-20 11:11:00.766663+00
63	1	new_message	\N	{"type": "new_message", "userId": 2, "excerpt": "https://joblink.umters.club/posts/5", "avatarUrl": "https://lh3.googleusercontent.com/a/ACg8ocJ19Soyopk0N2fDRtecDGmhJNdujPBTD9nzkuvm41vRXR2fQ4Bk=s96-c", "displayName": "Nguyễn Quốc Minh", "conversationId": 1}	2026-06-20 11:19:14.313+00	2026-06-20 11:10:11.170134+00
76	1	post_comment	\N	{"type": "post_comment", "postId": 11, "userId": 2, "excerpt": "@Công Ty TNHH MTV Mua Bán Vũ Khí Vũ Trang gê zzz", "avatarUrl": "https://lh3.googleusercontent.com/a/ACg8ocJ19Soyopk0N2fDRtecDGmhJNdujPBTD9nzkuvm41vRXR2fQ4Bk=s96-c", "commentId": 10, "displayName": "Nguyễn Quốc Minh"}	2026-06-22 02:42:20.409+00	2026-06-21 14:18:47.857068+00
74	1	post_reaction	\N	{"type": "post_reaction", "postId": 14, "userId": 2, "avatarUrl": "https://lh3.googleusercontent.com/a/ACg8ocJ19Soyopk0N2fDRtecDGmhJNdujPBTD9nzkuvm41vRXR2fQ4Bk=s96-c", "displayName": "Nguyễn Quốc Minh", "reactionType": "like"}	2026-06-22 02:42:33.979+00	2026-06-20 15:43:58.978665+00
186	2	new_message	\N	{"type": "new_message", "userId": 13, "excerpt": "haha", "avatarUrl": "https://awetfafplorxlmdifkqd.supabase.co/storage/v1/object/public/uploads/member-avatar/2026/06/13/0a033f7f-8c5c-4fff-ab10-459a4a46a60b.jpg", "displayName": "Nguyễn Phúc Dui", "conversationId": 6}	2026-07-04 08:06:29.75+00	2026-07-04 08:01:07.177554+00
195	2	new_message	\N	{"type": "new_message", "userId": 4, "excerpt": "Hâh", "avatarUrl": "https://awetfafplorxlmdifkqd.supabase.co/storage/v1/object/public/uploads/member-avatar/2026/07/4/772006ae-11b0-4c89-a729-c24db39fc06d.jpg", "displayName": "Nguyễn Quốc Minh", "conversationId": 7}	2026-07-04 14:22:54.473+00	2026-07-04 14:22:43.058729+00
204	2	new_message	\N	{"type": "new_message", "userId": 4, "excerpt": "Gdhdhdhdh", "avatarUrl": "https://awetfafplorxlmdifkqd.supabase.co/storage/v1/object/public/uploads/member-avatar/2026/07/4/772006ae-11b0-4c89-a729-c24db39fc06d.jpg", "displayName": "Nguyễn Quốc Minh", "conversationId": 7}	2026-07-04 14:51:04.688+00	2026-07-04 14:50:47.496504+00
208	2	new_message	\N	{"type": "new_message", "userId": 4, "excerpt": "Hãaaa", "avatarUrl": "https://awetfafplorxlmdifkqd.supabase.co/storage/v1/object/public/uploads/member-avatar/2026/07/4/772006ae-11b0-4c89-a729-c24db39fc06d.jpg", "displayName": "Nguyễn Quốc Minh", "conversationId": 7}	2026-07-04 14:58:12.667+00	2026-07-04 14:57:54.089738+00
213	2	new_message	\N	{"type": "new_message", "userId": 4, "excerpt": "Dfff", "avatarUrl": "https://awetfafplorxlmdifkqd.supabase.co/storage/v1/object/public/uploads/member-avatar/2026/07/4/772006ae-11b0-4c89-a729-c24db39fc06d.jpg", "displayName": "Nguyễn Quốc Minh", "conversationId": 7}	2026-07-04 15:01:06.163+00	2026-07-04 15:01:04.129064+00
96	1	connection_accepted	\N	{"type": "connection_accepted", "userId": 13, "avatarUrl": "https://awetfafplorxlmdifkqd.supabase.co/storage/v1/object/public/uploads/member-avatar/2026/06/13/0a033f7f-8c5c-4fff-ab10-459a4a46a60b.jpg", "displayName": "Nguyễn Fuck Dui", "connectionId": 14}	2026-06-22 02:49:42.291+00	2026-06-22 02:47:22.323581+00
94	1	post_comment	\N	{"type": "post_comment", "postId": 15, "userId": 2, "excerpt": "@wing nhu Kemetao", "avatarUrl": "https://lh3.googleusercontent.com/a/ACg8ocJ19Soyopk0N2fDRtecDGmhJNdujPBTD9nzkuvm41vRXR2fQ4Bk=s96-c", "commentId": 14, "displayName": "Nguyễn Quốc Minh"}	2026-06-22 02:49:42.291+00	2026-06-22 02:46:50.376598+00
91	1	post_comment	\N	{"type": "post_comment", "postId": 15, "userId": 2, "excerpt": "@wing nhu Cc", "avatarUrl": "https://lh3.googleusercontent.com/a/ACg8ocJ19Soyopk0N2fDRtecDGmhJNdujPBTD9nzkuvm41vRXR2fQ4Bk=s96-c", "commentId": 12, "displayName": "Nguyễn Quốc Minh"}	2026-06-22 02:49:42.291+00	2026-06-22 02:46:15.193791+00
92	11	connection_request	\N	{"type": "connection_request", "userId": 13, "avatarUrl": "https://awetfafplorxlmdifkqd.supabase.co/storage/v1/object/public/uploads/member-avatar/2026/06/13/0a033f7f-8c5c-4fff-ab10-459a4a46a60b.jpg", "displayName": "Nguyễn Fuck Dui", "connectionId": 13}	2026-06-22 02:53:37.115+00	2026-06-22 02:46:23.88132+00
83	11	job_application_received	\N	{"type": "job_application_received", "jobId": 2, "userId": 13, "jobTitle": "Mua bán tất cả vũ khí trong Free Fire", "avatarUrl": null, "displayName": "Nguyễn Fuck Dui", "applicationId": 8}	2026-06-22 02:53:44.819+00	2026-06-22 02:44:39.05769+00
85	2	post_reaction	\N	{"type": "post_reaction", "postId": 15, "userId": 1, "avatarUrl": "https://awetfafplorxlmdifkqd.supabase.co/storage/v1/object/public/uploads/member-avatar/2026/06/1/d1cdd95c-7a1b-4a03-b3ca-d3f670261566.jpg", "displayName": "wing nhu", "reactionType": "like"}	2026-06-22 03:22:50.477+00	2026-06-22 02:45:06.998663+00
86	2	post_reaction	\N	{"type": "post_reaction", "postId": 15, "userId": 1, "avatarUrl": "https://awetfafplorxlmdifkqd.supabase.co/storage/v1/object/public/uploads/member-avatar/2026/06/1/d1cdd95c-7a1b-4a03-b3ca-d3f670261566.jpg", "displayName": "wing nhu", "reactionType": "like"}	2026-06-22 03:22:50.477+00	2026-06-22 02:45:14.495781+00
87	2	post_comment	\N	{"type": "post_comment", "postId": 15, "userId": 1, "excerpt": "hih", "avatarUrl": "https://awetfafplorxlmdifkqd.supabase.co/storage/v1/object/public/uploads/member-avatar/2026/06/1/d1cdd95c-7a1b-4a03-b3ca-d3f670261566.jpg", "commentId": 11, "displayName": "wing nhu"}	2026-06-22 03:22:50.477+00	2026-06-22 02:45:31.540244+00
81	4	connection_request	\N	{"type": "connection_request", "userId": 13, "avatarUrl": null, "displayName": "Nguyễn Fuck Dui", "connectionId": 8}	2026-06-22 03:26:28.532+00	2026-06-22 02:43:33.249673+00
88	12	connection_request	\N	{"type": "connection_request", "userId": 13, "avatarUrl": "https://awetfafplorxlmdifkqd.supabase.co/storage/v1/object/public/uploads/member-avatar/2026/06/13/0a033f7f-8c5c-4fff-ab10-459a4a46a60b.jpg", "displayName": "Nguyễn Fuck Dui", "connectionId": 10}	2026-06-23 02:09:45.571+00	2026-06-22 02:46:01.7607+00
95	13	connection_request	\N	{"type": "connection_request", "userId": 1, "avatarUrl": "https://awetfafplorxlmdifkqd.supabase.co/storage/v1/object/public/uploads/member-avatar/2026/06/1/d1cdd95c-7a1b-4a03-b3ca-d3f670261566.jpg", "displayName": "wing nhu", "connectionId": 14}	2026-06-23 03:16:07.805+00	2026-06-22 02:47:14.646138+00
187	13	new_message	\N	{"type": "new_message", "userId": 2, "excerpt": "áhdakjsfkds", "avatarUrl": "https://lh3.googleusercontent.com/a/ACg8ocJ19Soyopk0N2fDRtecDGmhJNdujPBTD9nzkuvm41vRXR2fQ4Bk=s96-c", "displayName": "Nguyễn Quốc Minh", "conversationId": 6}	\N	2026-07-04 08:06:48.50774+00
90	10	connection_request	\N	{"type": "connection_request", "userId": 13, "avatarUrl": "https://awetfafplorxlmdifkqd.supabase.co/storage/v1/object/public/uploads/member-avatar/2026/06/13/0a033f7f-8c5c-4fff-ab10-459a4a46a60b.jpg", "displayName": "Nguyễn Fuck Dui", "connectionId": 12}	\N	2026-06-22 02:46:14.380983+00
97	1	post_comment	\N	{"type": "post_comment", "postId": 11, "userId": 13, "excerpt": "Đi coi ám ảnh", "avatarUrl": "https://awetfafplorxlmdifkqd.supabase.co/storage/v1/object/public/uploads/member-avatar/2026/06/13/0a033f7f-8c5c-4fff-ab10-459a4a46a60b.jpg", "commentId": 15, "displayName": "Nguyễn Fuck Dui"}	2026-06-22 02:49:42.291+00	2026-06-22 02:48:04.742087+00
66	1	post_reaction	\N	{"type": "post_reaction", "postId": 11, "userId": 4, "avatarUrl": null, "displayName": "Nguyễn Quốc Minh", "reactionType": "like"}	2026-06-22 02:49:42.291+00	2026-06-20 11:11:31.79445+00
65	1	post_reaction	\N	{"type": "post_reaction", "postId": 11, "userId": 4, "avatarUrl": null, "displayName": "Nguyễn Quốc Minh", "reactionType": "like"}	2026-06-22 02:49:42.291+00	2026-06-20 11:11:28.770898+00
62	1	post_comment	\N	{"type": "post_comment", "postId": 11, "userId": 4, "excerpt": "bsjadks", "avatarUrl": null, "commentId": 8, "displayName": "Nguyễn Quốc Minh"}	2026-06-22 02:49:42.291+00	2026-06-20 10:59:18.524703+00
196	4	new_message	\N	{"type": "new_message", "userId": 2, "excerpt": "jjj", "avatarUrl": "https://lh3.googleusercontent.com/a/ACg8ocJ19Soyopk0N2fDRtecDGmhJNdujPBTD9nzkuvm41vRXR2fQ4Bk=s96-c", "displayName": "Nguyễn Quốc Minh", "conversationId": 7}	2026-07-04 14:23:15.346+00	2026-07-04 14:23:11.915504+00
100	1	post_reaction	\N	{"type": "post_reaction", "postId": 10, "userId": 11, "avatarUrl": "https://awetfafplorxlmdifkqd.supabase.co/storage/v1/object/public/uploads/company-logo/2026/06/11/0c0b4b6c-948f-4ce5-8071-b30c6de59afa.jpg", "displayName": "Công Ty TNHH MTV Mua Bán Vũ Khí Vũ Trang", "reactionType": "like"}	\N	2026-06-22 02:52:47.880809+00
101	1	post_reaction	\N	{"type": "post_reaction", "postId": 10, "userId": 13, "avatarUrl": "https://awetfafplorxlmdifkqd.supabase.co/storage/v1/object/public/uploads/member-avatar/2026/06/13/0a033f7f-8c5c-4fff-ab10-459a4a46a60b.jpg", "displayName": "Nguyễn Fuck Dui", "reactionType": "like"}	\N	2026-06-22 02:52:58.752679+00
102	1	post_reaction	\N	{"type": "post_reaction", "postId": 10, "userId": 11, "avatarUrl": "https://awetfafplorxlmdifkqd.supabase.co/storage/v1/object/public/uploads/company-logo/2026/06/11/0c0b4b6c-948f-4ce5-8071-b30c6de59afa.jpg", "displayName": "Công Ty TNHH MTV Mua Bán Vũ Khí Vũ Trang", "reactionType": "like"}	\N	2026-06-22 02:53:00.156878+00
103	1	post_reaction	\N	{"type": "post_reaction", "postId": 10, "userId": 13, "avatarUrl": "https://awetfafplorxlmdifkqd.supabase.co/storage/v1/object/public/uploads/member-avatar/2026/06/13/0a033f7f-8c5c-4fff-ab10-459a4a46a60b.jpg", "displayName": "Nguyễn Fuck Dui", "reactionType": "like"}	\N	2026-06-22 02:53:05.945899+00
104	1	post_reaction	\N	{"type": "post_reaction", "postId": 9, "userId": 11, "avatarUrl": "https://awetfafplorxlmdifkqd.supabase.co/storage/v1/object/public/uploads/company-logo/2026/06/11/0c0b4b6c-948f-4ce5-8071-b30c6de59afa.jpg", "displayName": "Công Ty TNHH MTV Mua Bán Vũ Khí Vũ Trang", "reactionType": "like"}	\N	2026-06-22 02:53:06.531421+00
105	1	post_reaction	\N	{"type": "post_reaction", "postId": 10, "userId": 13, "avatarUrl": "https://awetfafplorxlmdifkqd.supabase.co/storage/v1/object/public/uploads/member-avatar/2026/06/13/0a033f7f-8c5c-4fff-ab10-459a4a46a60b.jpg", "displayName": "Nguyễn Fuck Dui", "reactionType": "like"}	\N	2026-06-22 02:53:12.880351+00
106	1	post_comment	\N	{"type": "post_comment", "postId": 10, "userId": 13, "excerpt": "Hey hay om em", "avatarUrl": "https://awetfafplorxlmdifkqd.supabase.co/storage/v1/object/public/uploads/member-avatar/2026/06/13/0a033f7f-8c5c-4fff-ab10-459a4a46a60b.jpg", "commentId": 16, "displayName": "Nguyễn Fuck Dui"}	\N	2026-06-22 02:53:21.359074+00
107	1	post_reaction	\N	{"type": "post_reaction", "postId": 9, "userId": 11, "avatarUrl": "https://awetfafplorxlmdifkqd.supabase.co/storage/v1/object/public/uploads/company-logo/2026/06/11/0c0b4b6c-948f-4ce5-8071-b30c6de59afa.jpg", "displayName": "Công Ty TNHH MTV Mua Bán Vũ Khí Vũ Trang", "reactionType": "like"}	\N	2026-06-22 02:53:22.203071+00
108	13	application_status_changed	\N	{"type": "application_status_changed", "jobId": 2, "userId": 11, "jobTitle": "Mua bán tất cả vũ khí trong Free Fire", "avatarUrl": "https://awetfafplorxlmdifkqd.supabase.co/storage/v1/object/public/uploads/company-logo/2026/06/11/0c0b4b6c-948f-4ce5-8071-b30c6de59afa.jpg", "newStatus": "reviewed", "displayName": "Công Ty TNHH MTV Mua Bán Vũ Khí Vũ Trang", "applicationId": 8}	2026-06-22 02:55:06.046+00	2026-06-22 02:54:33.575172+00
99	1	new_message	\N	{"type": "new_message", "userId": 13, "excerpt": "Ê ê heyo  rubychannn hiii naniga sùki?!?UwU\\n\\nMua bán tất cả vũ khí trong Free Fire - Công Ty TNHH MTV Mua Bán Vũ Khí Vũ…", "avatarUrl": "https://awetfafplorxlmdifkqd.supabase.co/storage/v1/object/public/uploads/member-avatar/2026/06/13/0a033f7f-8c5c-4fff-ab10-459a4a46a60b.jpg", "displayName": "Nguyễn Fuck Dui", "conversationId": 4}	\N	2026-06-22 02:50:59.995928+00
77	11	post_comment	\N	{"type": "post_comment", "postId": 11, "userId": 2, "excerpt": "@Công Ty TNHH MTV Mua Bán Vũ Khí Vũ Trang gê zzz", "avatarUrl": "https://lh3.googleusercontent.com/a/ACg8ocJ19Soyopk0N2fDRtecDGmhJNdujPBTD9nzkuvm41vRXR2fQ4Bk=s96-c", "commentId": 10, "displayName": "Nguyễn Quốc Minh"}	2026-06-22 02:56:09.921+00	2026-06-21 14:18:48.373923+00
70	11	connection_request	\N	{"type": "connection_request", "userId": 12, "avatarUrl": "https://awetfafplorxlmdifkqd.supabase.co/storage/v1/object/public/uploads/member-avatar/2026/06/12/8a0f2aca-2ebd-4d5c-b6f9-e9f1e33a50dc.jpg", "displayName": "Quỳnh Như", "connectionId": 5}	2026-06-22 02:57:27.298+00	2026-06-20 11:33:15.132873+00
98	13	new_message	\N	{"type": "new_message", "userId": 1, "excerpt": "chao cau nha", "avatarUrl": "https://awetfafplorxlmdifkqd.supabase.co/storage/v1/object/public/uploads/member-avatar/2026/06/1/d1cdd95c-7a1b-4a03-b3ca-d3f670261566.jpg", "displayName": "wing nhu", "conversationId": 4}	2026-06-22 04:06:23.847+00	2026-06-22 02:50:39.752256+00
110	13	connection_accepted	\N	{"type": "connection_accepted", "userId": 11, "avatarUrl": "https://awetfafplorxlmdifkqd.supabase.co/storage/v1/object/public/uploads/company-logo/2026/06/11/0c0b4b6c-948f-4ce5-8071-b30c6de59afa.jpg", "displayName": "Công Ty TNHH MTV Mua Bán Vũ Khí Vũ Trang", "connectionId": 13}	2026-06-23 03:16:07.805+00	2026-06-22 02:57:35.354669+00
112	1	post_reaction	\N	{"type": "post_reaction", "postId": 11, "userId": 2, "avatarUrl": "https://lh3.googleusercontent.com/a/ACg8ocJ19Soyopk0N2fDRtecDGmhJNdujPBTD9nzkuvm41vRXR2fQ4Bk=s96-c", "displayName": "Nguyễn Quốc Minh", "reactionType": "like"}	\N	2026-06-22 03:22:43.733059+00
84	2	post_reaction	\N	{"type": "post_reaction", "postId": 15, "userId": 1, "avatarUrl": "https://awetfafplorxlmdifkqd.supabase.co/storage/v1/object/public/uploads/member-avatar/2026/06/1/d1cdd95c-7a1b-4a03-b3ca-d3f670261566.jpg", "displayName": "wing nhu", "reactionType": "like"}	2026-06-22 03:22:50.477+00	2026-06-22 02:44:59.119087+00
93	2	post_comment	\N	{"type": "post_comment", "postId": 15, "userId": 1, "excerpt": "@Nguyễn Quốc Minh ddu me may chui tao har", "avatarUrl": "https://awetfafplorxlmdifkqd.supabase.co/storage/v1/object/public/uploads/member-avatar/2026/06/1/d1cdd95c-7a1b-4a03-b3ca-d3f670261566.jpg", "commentId": 13, "displayName": "wing nhu"}	2026-06-22 03:22:50.477+00	2026-06-22 02:46:39.135445+00
89	2	connection_request	\N	{"type": "connection_request", "userId": 13, "avatarUrl": "https://awetfafplorxlmdifkqd.supabase.co/storage/v1/object/public/uploads/member-avatar/2026/06/13/0a033f7f-8c5c-4fff-ab10-459a4a46a60b.jpg", "displayName": "Nguyễn Fuck Dui", "connectionId": 11}	2026-06-22 03:22:50.477+00	2026-06-22 02:46:05.951719+00
113	1	post_reaction	\N	{"type": "post_reaction", "postId": 10, "userId": 2, "avatarUrl": "https://lh3.googleusercontent.com/a/ACg8ocJ19Soyopk0N2fDRtecDGmhJNdujPBTD9nzkuvm41vRXR2fQ4Bk=s96-c", "displayName": "Nguyễn Quốc Minh", "reactionType": "like"}	\N	2026-06-22 03:22:58.075447+00
114	1	post_reaction	\N	{"type": "post_reaction", "postId": 9, "userId": 2, "avatarUrl": "https://lh3.googleusercontent.com/a/ACg8ocJ19Soyopk0N2fDRtecDGmhJNdujPBTD9nzkuvm41vRXR2fQ4Bk=s96-c", "displayName": "Nguyễn Quốc Minh", "reactionType": "like"}	\N	2026-06-22 03:23:02.544786+00
115	1	post_reaction	\N	{"type": "post_reaction", "postId": 14, "userId": 4, "avatarUrl": null, "displayName": "Nguyễn Quốc Minh", "reactionType": "like"}	\N	2026-06-22 03:24:20.83752+00
116	1	post_reaction	\N	{"type": "post_reaction", "postId": 14, "userId": 4, "avatarUrl": null, "displayName": "Nguyễn Quốc Minh", "reactionType": "like"}	\N	2026-06-22 03:25:16.034218+00
117	1	post_comment	\N	{"type": "post_comment", "postId": 11, "userId": 4, "excerpt": "hmmmm", "avatarUrl": null, "commentId": 17, "displayName": "Nguyễn Quốc Minh"}	\N	2026-06-22 03:26:21.179644+00
118	1	post_reaction	\N	{"type": "post_reaction", "postId": 8, "userId": 4, "avatarUrl": null, "displayName": "Nguyễn Quốc Minh", "reactionType": "like"}	\N	2026-06-22 03:29:31.197596+00
119	1	post_reaction	\N	{"type": "post_reaction", "postId": 8, "userId": 4, "avatarUrl": null, "displayName": "Nguyễn Quốc Minh", "reactionType": "like"}	\N	2026-06-22 03:29:36.767018+00
120	1	post_reaction	\N	{"type": "post_reaction", "postId": 6, "userId": 4, "avatarUrl": null, "displayName": "Nguyễn Quốc Minh", "reactionType": "like"}	\N	2026-06-22 03:29:38.829016+00
188	18	job_application_received	\N	{"type": "job_application_received", "jobId": 6, "userId": 4, "jobTitle": "Shipping Specialist / OPD (Đồng Nai Or Củ Chi | Work In Shift)", "avatarUrl": null, "displayName": "Nguyễn Quốc Minh", "applicationId": 10}	2026-07-04 09:03:40.013+00	2026-07-04 09:02:07.370443+00
197	2	new_message	\N	{"type": "new_message", "userId": 4, "excerpt": "Dljz", "avatarUrl": "https://awetfafplorxlmdifkqd.supabase.co/storage/v1/object/public/uploads/member-avatar/2026/07/4/772006ae-11b0-4c89-a729-c24db39fc06d.jpg", "displayName": "Nguyễn Quốc Minh", "conversationId": 7}	2026-07-04 14:23:46.185+00	2026-07-04 14:23:39.265844+00
214	4	new_message	\N	{"type": "new_message", "userId": 2, "excerpt": "kkkk", "avatarUrl": "https://lh3.googleusercontent.com/a/ACg8ocJ19Soyopk0N2fDRtecDGmhJNdujPBTD9nzkuvm41vRXR2fQ4Bk=s96-c", "displayName": "Nguyễn Quốc Minh", "conversationId": 7}	2026-07-04 15:07:43.548+00	2026-07-04 15:07:13.859237+00
129	4	new_message	\N	{"type": "new_message", "userId": 2, "excerpt": "Blahajhahđ", "avatarUrl": "https://lh3.googleusercontent.com/a/ACg8ocJ19Soyopk0N2fDRtecDGmhJNdujPBTD9nzkuvm41vRXR2fQ4Bk=s96-c", "displayName": "Nguyễn Quốc Minh", "conversationId": 7}	2026-06-22 04:08:55.814+00	2026-06-22 04:08:44.118081+00
128	4	connection_accepted	\N	{"type": "connection_accepted", "userId": 2, "avatarUrl": "https://lh3.googleusercontent.com/a/ACg8ocJ19Soyopk0N2fDRtecDGmhJNdujPBTD9nzkuvm41vRXR2fQ4Bk=s96-c", "displayName": "Nguyễn Quốc Minh", "connectionId": 15}	2026-06-22 04:08:58.766+00	2026-06-22 04:08:13.663886+00
130	2	new_message	\N	{"type": "new_message", "userId": 4, "excerpt": "...", "avatarUrl": null, "displayName": "Nguyễn Quốc Minh", "conversationId": 7}	2026-06-22 04:09:35.328+00	2026-06-22 04:09:11.429211+00
126	2	new_message	\N	{"type": "new_message", "userId": 13, "excerpt": "Gu em", "avatarUrl": "https://awetfafplorxlmdifkqd.supabase.co/storage/v1/object/public/uploads/member-avatar/2026/06/13/0a033f7f-8c5c-4fff-ab10-459a4a46a60b.jpg", "displayName": "Nguyễn Fuck Dui", "conversationId": 6}	2026-06-22 04:10:17.826+00	2026-06-22 04:06:02.162255+00
127	2	connection_request	\N	{"type": "connection_request", "userId": 4, "avatarUrl": null, "displayName": "Nguyễn Quốc Minh", "connectionId": 15}	2026-06-22 04:10:34.252+00	2026-06-22 04:07:54.334379+00
131	4	new_message	\N	{"type": "new_message", "userId": 2, "excerpt": "Vhhhh", "avatarUrl": "https://lh3.googleusercontent.com/a/ACg8ocJ19Soyopk0N2fDRtecDGmhJNdujPBTD9nzkuvm41vRXR2fQ4Bk=s96-c", "displayName": "Nguyễn Quốc Minh", "conversationId": 7}	2026-06-22 04:15:09.864+00	2026-06-22 04:14:51.247151+00
132	4	new_message	\N	{"type": "new_message", "userId": 2, "excerpt": "Dd", "avatarUrl": "https://lh3.googleusercontent.com/a/ACg8ocJ19Soyopk0N2fDRtecDGmhJNdujPBTD9nzkuvm41vRXR2fQ4Bk=s96-c", "displayName": "Nguyễn Quốc Minh", "conversationId": 7}	2026-06-22 04:15:43.834+00	2026-06-22 04:15:42.081493+00
133	2	new_message	\N	{"type": "new_message", "userId": 4, "excerpt": "sdjkfjhsd", "avatarUrl": null, "displayName": "Nguyễn Quốc Minh", "conversationId": 7}	2026-06-22 04:17:09.785+00	2026-06-22 04:15:49.110206+00
111	12	connection_accepted	\N	{"type": "connection_accepted", "userId": 11, "avatarUrl": "https://awetfafplorxlmdifkqd.supabase.co/storage/v1/object/public/uploads/company-logo/2026/06/11/0c0b4b6c-948f-4ce5-8071-b30c6de59afa.jpg", "displayName": "Công Ty TNHH MTV Mua Bán Vũ Khí Vũ Trang", "connectionId": 5}	2026-06-23 02:09:45.571+00	2026-06-22 02:57:38.85302+00
125	13	new_message	\N	{"type": "new_message", "userId": 2, "excerpt": "Jejshdhshshdhdhs", "avatarUrl": "https://lh3.googleusercontent.com/a/ACg8ocJ19Soyopk0N2fDRtecDGmhJNdujPBTD9nzkuvm41vRXR2fQ4Bk=s96-c", "displayName": "Nguyễn Quốc Minh", "conversationId": 6}	2026-06-22 04:18:49.059+00	2026-06-22 04:05:49.910613+00
124	13	connection_accepted	\N	{"type": "connection_accepted", "userId": 2, "avatarUrl": "https://lh3.googleusercontent.com/a/ACg8ocJ19Soyopk0N2fDRtecDGmhJNdujPBTD9nzkuvm41vRXR2fQ4Bk=s96-c", "displayName": "Nguyễn Quốc Minh", "connectionId": 11}	2026-06-23 03:16:07.805+00	2026-06-22 04:05:20.137138+00
134	4	new_message	\N	{"type": "new_message", "userId": 2, "excerpt": "Fff", "avatarUrl": "https://lh3.googleusercontent.com/a/ACg8ocJ19Soyopk0N2fDRtecDGmhJNdujPBTD9nzkuvm41vRXR2fQ4Bk=s96-c", "displayName": "Nguyễn Quốc Minh", "conversationId": 7}	2026-06-22 04:17:15.749+00	2026-06-22 04:17:14.180304+00
189	26	connection_request	\N	{"type": "connection_request", "userId": 2, "avatarUrl": "https://lh3.googleusercontent.com/a/ACg8ocJ19Soyopk0N2fDRtecDGmhJNdujPBTD9nzkuvm41vRXR2fQ4Bk=s96-c", "displayName": "Nguyễn Quốc Minh", "connectionId": 28}	\N	2026-07-04 13:59:14.789536+00
135	2	new_message	\N	{"type": "new_message", "userId": 4, "excerpt": "gjgjhgjhgjfhvd", "avatarUrl": null, "displayName": "Nguyễn Quốc Minh", "conversationId": 7}	2026-06-22 04:17:22.856+00	2026-06-22 04:17:20.100347+00
136	2	new_message	\N	{"type": "new_message", "userId": 13, "excerpt": "Hii", "avatarUrl": "https://awetfafplorxlmdifkqd.supabase.co/storage/v1/object/public/uploads/member-avatar/2026/06/13/0a033f7f-8c5c-4fff-ab10-459a4a46a60b.jpg", "displayName": "Nguyễn Fuck Dui", "conversationId": 6}	2026-06-22 04:18:59.048+00	2026-06-22 04:18:54.787933+00
198	4	new_message	\N	{"type": "new_message", "userId": 2, "excerpt": "hú", "avatarUrl": "https://lh3.googleusercontent.com/a/ACg8ocJ19Soyopk0N2fDRtecDGmhJNdujPBTD9nzkuvm41vRXR2fQ4Bk=s96-c", "displayName": "Nguyễn Quốc Minh", "conversationId": 7}	2026-07-04 14:34:22.195+00	2026-07-04 14:34:07.400899+00
138	11	connection_accepted	\N	{"type": "connection_accepted", "userId": 2, "avatarUrl": "https://lh3.googleusercontent.com/a/ACg8ocJ19Soyopk0N2fDRtecDGmhJNdujPBTD9nzkuvm41vRXR2fQ4Bk=s96-c", "displayName": "Nguyễn Quốc Minh", "connectionId": 2}	\N	2026-06-22 04:20:23.122517+00
140	1	new_message	\N	{"type": "new_message", "userId": 11, "excerpt": "ayyo\\nhttps://joblink.umters.club/posts/20", "avatarUrl": "https://awetfafplorxlmdifkqd.supabase.co/storage/v1/object/public/uploads/company-logo/2026/06/11/0c0b4b6c-948f-4ce5-8071-b30c6de59afa.jpg", "displayName": "Công Ty TNHH MTV Mua Bán Vũ Khí Vũ Trang", "conversationId": 2}	\N	2026-06-23 01:30:35.83782+00
199	2	new_message	\N	{"type": "new_message", "userId": 4, "excerpt": "Bla bla bla", "avatarUrl": "https://awetfafplorxlmdifkqd.supabase.co/storage/v1/object/public/uploads/member-avatar/2026/07/4/772006ae-11b0-4c89-a729-c24db39fc06d.jpg", "displayName": "Nguyễn Quốc Minh", "conversationId": 7}	2026-07-04 14:34:32.784+00	2026-07-04 14:34:31.049323+00
206	4	new_message	\N	{"type": "new_message", "userId": 2, "excerpt": "hhhh", "avatarUrl": "https://lh3.googleusercontent.com/a/ACg8ocJ19Soyopk0N2fDRtecDGmhJNdujPBTD9nzkuvm41vRXR2fQ4Bk=s96-c", "displayName": "Nguyễn Quốc Minh", "conversationId": 7}	2026-07-04 14:51:27.798+00	2026-07-04 14:51:23.483045+00
142	12	new_message	\N	{"type": "new_message", "userId": 11, "excerpt": "ayyo\\nhttps://joblink.umters.club/posts/20", "avatarUrl": "https://awetfafplorxlmdifkqd.supabase.co/storage/v1/object/public/uploads/company-logo/2026/06/11/0c0b4b6c-948f-4ce5-8071-b30c6de59afa.jpg", "displayName": "Công Ty TNHH MTV Mua Bán Vũ Khí Vũ Trang", "conversationId": 9}	2026-06-23 02:04:04.665+00	2026-06-23 01:31:09.636831+00
143	11	job_application_received	\N	{"type": "job_application_received", "jobId": 3, "userId": 12, "jobTitle": "hủy diệt umt", "avatarUrl": "https://awetfafplorxlmdifkqd.supabase.co/storage/v1/object/public/uploads/member-avatar/2026/06/12/8a0f2aca-2ebd-4d5c-b6f9-e9f1e33a50dc.jpg", "displayName": "Quỳnh Như", "applicationId": 9}	\N	2026-06-23 02:16:23.059317+00
146	11	post_comment	\N	{"type": "post_comment", "postId": 12, "userId": 12, "excerpt": "yeuanh", "avatarUrl": "https://awetfafplorxlmdifkqd.supabase.co/storage/v1/object/public/uploads/member-avatar/2026/06/12/8a0f2aca-2ebd-4d5c-b6f9-e9f1e33a50dc.jpg", "commentId": 19, "displayName": "Quỳnh Như"}	\N	2026-06-23 02:21:52.451703+00
147	11	post_comment	\N	{"type": "post_comment", "postId": 12, "userId": 12, "excerpt": "hii", "avatarUrl": "https://awetfafplorxlmdifkqd.supabase.co/storage/v1/object/public/uploads/member-avatar/2026/06/12/8a0f2aca-2ebd-4d5c-b6f9-e9f1e33a50dc.jpg", "commentId": 20, "displayName": "Quỳnh Như"}	\N	2026-06-23 02:22:15.843895+00
148	11	post_reaction	\N	{"type": "post_reaction", "postId": 12, "userId": 12, "avatarUrl": "https://awetfafplorxlmdifkqd.supabase.co/storage/v1/object/public/uploads/member-avatar/2026/06/12/8a0f2aca-2ebd-4d5c-b6f9-e9f1e33a50dc.jpg", "displayName": "Quỳnh Như", "reactionType": "like"}	\N	2026-06-23 02:22:36.479697+00
149	11	post_reaction	\N	{"type": "post_reaction", "postId": 12, "userId": 12, "avatarUrl": "https://awetfafplorxlmdifkqd.supabase.co/storage/v1/object/public/uploads/member-avatar/2026/06/12/8a0f2aca-2ebd-4d5c-b6f9-e9f1e33a50dc.jpg", "displayName": "Quỳnh Như", "reactionType": "like"}	\N	2026-06-23 02:22:41.206064+00
145	13	connection_accepted	\N	{"type": "connection_accepted", "userId": 12, "avatarUrl": "https://awetfafplorxlmdifkqd.supabase.co/storage/v1/object/public/uploads/member-avatar/2026/06/12/8a0f2aca-2ebd-4d5c-b6f9-e9f1e33a50dc.jpg", "displayName": "Quỳnh Như", "connectionId": 10}	2026-06-23 03:16:06.251+00	2026-06-23 02:21:15.712205+00
150	13	new_message	\N	{"type": "new_message", "userId": 12, "excerpt": "hiii", "avatarUrl": "https://awetfafplorxlmdifkqd.supabase.co/storage/v1/object/public/uploads/member-avatar/2026/06/12/8a0f2aca-2ebd-4d5c-b6f9-e9f1e33a50dc.jpg", "displayName": "Quỳnh Như", "conversationId": 10}	2026-06-23 03:16:06.172+00	2026-06-23 02:23:37.528315+00
141	13	new_message	\N	{"type": "new_message", "userId": 11, "excerpt": "ayyo\\nhttps://joblink.umters.club/posts/20", "avatarUrl": "https://awetfafplorxlmdifkqd.supabase.co/storage/v1/object/public/uploads/company-logo/2026/06/11/0c0b4b6c-948f-4ce5-8071-b30c6de59afa.jpg", "displayName": "Công Ty TNHH MTV Mua Bán Vũ Khí Vũ Trang", "conversationId": 8}	2026-06-23 03:16:07.805+00	2026-06-23 01:30:53.307478+00
137	13	new_message	\N	{"type": "new_message", "userId": 2, "excerpt": "Hdhdhdhdbdbdhs", "avatarUrl": "https://lh3.googleusercontent.com/a/ACg8ocJ19Soyopk0N2fDRtecDGmhJNdujPBTD9nzkuvm41vRXR2fQ4Bk=s96-c", "displayName": "Nguyễn Quốc Minh", "conversationId": 6}	2026-06-23 03:16:07.805+00	2026-06-22 04:19:14.425723+00
123	13	post_comment	\N	{"type": "post_comment", "postId": 17, "userId": 4, "excerpt": "dì z", "avatarUrl": null, "commentId": 18, "displayName": "Nguyễn Quốc Minh"}	2026-06-23 03:16:07.805+00	2026-06-22 03:44:14.842529+00
122	13	post_reaction	\N	{"type": "post_reaction", "postId": 17, "userId": 4, "avatarUrl": null, "displayName": "Nguyễn Quốc Minh", "reactionType": "like"}	2026-06-23 03:16:07.805+00	2026-06-22 03:44:07.403417+00
121	13	connection_accepted	\N	{"type": "connection_accepted", "userId": 4, "avatarUrl": null, "displayName": "Nguyễn Quốc Minh", "connectionId": 8}	2026-06-23 03:16:07.805+00	2026-06-22 03:38:24.408619+00
139	4	post_reaction	\N	{"type": "post_reaction", "postId": 18, "userId": 2, "avatarUrl": "https://lh3.googleusercontent.com/a/ACg8ocJ19Soyopk0N2fDRtecDGmhJNdujPBTD9nzkuvm41vRXR2fQ4Bk=s96-c", "displayName": "Nguyễn Quốc Minh", "reactionType": "like"}	2026-06-23 12:28:55.229+00	2026-06-22 05:54:28.675794+00
109	13	interview_scheduled	\N	{"type": "interview_scheduled", "jobId": 2, "userId": 11, "jobTitle": "Mua bán tất cả vũ khí trong Free Fire", "avatarUrl": "https://awetfafplorxlmdifkqd.supabase.co/storage/v1/object/public/uploads/company-logo/2026/06/11/0c0b4b6c-948f-4ce5-8071-b30c6de59afa.jpg", "displayName": "Công Ty TNHH MTV Mua Bán Vũ Khí Vũ Trang", "scheduledAt": "2026-07-07T02:55:00+00:00", "applicationId": 8}	2026-06-23 03:16:07.805+00	2026-06-22 02:55:23.718288+00
151	12	new_message	\N	{"type": "new_message", "userId": 13, "excerpt": "hi ban la ai vay", "avatarUrl": "https://awetfafplorxlmdifkqd.supabase.co/storage/v1/object/public/uploads/member-avatar/2026/06/13/0a033f7f-8c5c-4fff-ab10-459a4a46a60b.jpg", "displayName": "Nguyễn Fuck Dui", "conversationId": 10}	2026-06-23 03:16:49.89+00	2026-06-23 03:16:40.609419+00
153	13	new_message	\N	{"type": "new_message", "userId": 12, "excerpt": "CEO công ty trên toàn thế giới", "avatarUrl": "https://awetfafplorxlmdifkqd.supabase.co/storage/v1/object/public/uploads/member-avatar/2026/06/12/8a0f2aca-2ebd-4d5c-b6f9-e9f1e33a50dc.jpg", "displayName": "Quỳnh Như", "conversationId": 10}	2026-06-23 03:17:24.245+00	2026-06-23 03:17:13.31829+00
152	11	new_message	\N	{"type": "new_message", "userId": 13, "excerpt": "cho toi cong viec ngay lap tuc", "avatarUrl": "https://awetfafplorxlmdifkqd.supabase.co/storage/v1/object/public/uploads/member-avatar/2026/06/13/0a033f7f-8c5c-4fff-ab10-459a4a46a60b.jpg", "displayName": "Nguyễn Fuck Dui", "conversationId": 8}	2026-06-23 03:18:22.194+00	2026-06-23 03:16:56.452562+00
210	2	new_message	\N	{"type": "new_message", "userId": 4, "excerpt": "Okok", "avatarUrl": "https://awetfafplorxlmdifkqd.supabase.co/storage/v1/object/public/uploads/member-avatar/2026/07/4/772006ae-11b0-4c89-a729-c24db39fc06d.jpg", "displayName": "Nguyễn Quốc Minh", "conversationId": 7}	2026-07-04 14:58:27.265+00	2026-07-04 14:58:22.517917+00
154	13	new_message	\N	{"type": "new_message", "userId": 11, "excerpt": "ok cu", "avatarUrl": "https://awetfafplorxlmdifkqd.supabase.co/storage/v1/object/public/uploads/company-logo/2026/06/11/0c0b4b6c-948f-4ce5-8071-b30c6de59afa.jpg", "displayName": "Công Ty TNHH MTV Mua Bán Vũ Khí Vũ Trang", "conversationId": 8}	2026-06-23 03:19:14.117+00	2026-06-23 03:18:26.211623+00
155	11	new_message	\N	{"type": "new_message", "userId": 13, "excerpt": "hihihihi", "avatarUrl": "https://awetfafplorxlmdifkqd.supabase.co/storage/v1/object/public/uploads/member-avatar/2026/06/13/0a033f7f-8c5c-4fff-ab10-459a4a46a60b.jpg", "displayName": "Nguyễn Fuck Dui", "conversationId": 8}	2026-06-23 03:27:02.925+00	2026-06-23 03:26:38.521677+00
157	1	post_reaction	\N	{"type": "post_reaction", "postId": 10, "userId": 11, "avatarUrl": "https://awetfafplorxlmdifkqd.supabase.co/storage/v1/object/public/uploads/company-logo/2026/06/11/0c0b4b6c-948f-4ce5-8071-b30c6de59afa.jpg", "displayName": "Công Ty TNHH MTV Mua Bán Vũ Khí Vũ Trang", "reactionType": "like"}	\N	2026-06-23 03:47:27.903511+00
158	1	post_reaction	\N	{"type": "post_reaction", "postId": 10, "userId": 11, "avatarUrl": "https://awetfafplorxlmdifkqd.supabase.co/storage/v1/object/public/uploads/company-logo/2026/06/11/0c0b4b6c-948f-4ce5-8071-b30c6de59afa.jpg", "displayName": "Công Ty TNHH MTV Mua Bán Vũ Khí Vũ Trang", "reactionType": "like"}	\N	2026-06-23 03:47:34.924853+00
160	1	post_reaction	\N	{"type": "post_reaction", "postId": 10, "userId": 13, "avatarUrl": "https://awetfafplorxlmdifkqd.supabase.co/storage/v1/object/public/uploads/member-avatar/2026/06/13/0a033f7f-8c5c-4fff-ab10-459a4a46a60b.jpg", "displayName": "Nguyễn Fuck Dui", "reactionType": "like"}	\N	2026-06-23 03:47:54.847036+00
161	1	post_reaction	\N	{"type": "post_reaction", "postId": 10, "userId": 11, "avatarUrl": "https://awetfafplorxlmdifkqd.supabase.co/storage/v1/object/public/uploads/company-logo/2026/06/11/0c0b4b6c-948f-4ce5-8071-b30c6de59afa.jpg", "displayName": "Công Ty TNHH MTV Mua Bán Vũ Khí Vũ Trang", "reactionType": "like"}	\N	2026-06-23 03:47:55.654016+00
162	1	post_comment	\N	{"type": "post_comment", "postId": 10, "userId": 13, "excerpt": "anh oi dep trai quaaaaaaaaaaaaaaaaaaaaaaaaaa iuuuuuu", "avatarUrl": "https://awetfafplorxlmdifkqd.supabase.co/storage/v1/object/public/uploads/member-avatar/2026/06/13/0a033f7f-8c5c-4fff-ab10-459a4a46a60b.jpg", "commentId": 21, "displayName": "Nguyễn Fuck Dui"}	\N	2026-06-23 03:47:59.187678+00
163	13	post_reaction	\N	{"type": "post_reaction", "postId": 22, "userId": 11, "avatarUrl": "https://awetfafplorxlmdifkqd.supabase.co/storage/v1/object/public/uploads/company-logo/2026/06/11/0c0b4b6c-948f-4ce5-8071-b30c6de59afa.jpg", "displayName": "Công Ty TNHH MTV Mua Bán Vũ Khí Vũ Trang", "reactionType": "like"}	\N	2026-06-23 03:48:13.464502+00
164	1	post_share	\N	{"type": "post_share", "postId": 10, "userId": 13, "excerpt": null, "shareId": 4, "avatarUrl": "https://awetfafplorxlmdifkqd.supabase.co/storage/v1/object/public/uploads/member-avatar/2026/06/13/0a033f7f-8c5c-4fff-ab10-459a4a46a60b.jpg", "displayName": "Nguyễn Fuck Dui"}	\N	2026-06-23 03:49:29.332511+00
156	4	post_reaction	\N	{"type": "post_reaction", "postId": 23, "userId": 13, "avatarUrl": "https://awetfafplorxlmdifkqd.supabase.co/storage/v1/object/public/uploads/member-avatar/2026/06/13/0a033f7f-8c5c-4fff-ab10-459a4a46a60b.jpg", "displayName": "Nguyễn Fuck Dui", "reactionType": "like"}	2026-06-23 12:28:55.229+00	2026-06-23 03:43:46.483788+00
165	9	connection_request	\N	{"type": "connection_request", "userId": 15, "avatarUrl": "https://lh3.googleusercontent.com/a/ACg8ocJo1k1xemLnzGekmx5R5C35fJjKL-A_YSczi_rCUFnCf6nNLxA=s96-c", "displayName": "Thànhh Tr Văn", "connectionId": 16}	\N	2026-06-28 13:29:12.396644+00
166	6	connection_request	\N	{"type": "connection_request", "userId": 15, "avatarUrl": "https://lh3.googleusercontent.com/a/ACg8ocJo1k1xemLnzGekmx5R5C35fJjKL-A_YSczi_rCUFnCf6nNLxA=s96-c", "displayName": "Thànhh Tr Văn", "connectionId": 17}	\N	2026-06-28 13:29:18.426576+00
167	7	connection_request	\N	{"type": "connection_request", "userId": 15, "avatarUrl": "https://lh3.googleusercontent.com/a/ACg8ocJo1k1xemLnzGekmx5R5C35fJjKL-A_YSczi_rCUFnCf6nNLxA=s96-c", "displayName": "Thànhh Tr Văn", "connectionId": 18}	\N	2026-06-28 13:29:23.855387+00
169	11	post_reaction	\N	{"type": "post_reaction", "postId": 20, "userId": 15, "avatarUrl": "https://lh3.googleusercontent.com/a/ACg8ocJo1k1xemLnzGekmx5R5C35fJjKL-A_YSczi_rCUFnCf6nNLxA=s96-c", "displayName": "Thànhh Tr Văn", "reactionType": "like"}	\N	2026-06-28 13:32:40.582234+00
168	4	connection_request	\N	{"type": "connection_request", "userId": 15, "avatarUrl": "https://lh3.googleusercontent.com/a/ACg8ocJo1k1xemLnzGekmx5R5C35fJjKL-A_YSczi_rCUFnCf6nNLxA=s96-c", "displayName": "Thànhh Tr Văn", "connectionId": 19}	2026-07-01 07:02:22.471+00	2026-06-28 13:29:29.269311+00
159	2	post_reaction	\N	{"type": "post_reaction", "postId": 15, "userId": 13, "avatarUrl": "https://awetfafplorxlmdifkqd.supabase.co/storage/v1/object/public/uploads/member-avatar/2026/06/13/0a033f7f-8c5c-4fff-ab10-459a4a46a60b.jpg", "displayName": "Nguyễn Fuck Dui", "reactionType": "like"}	2026-07-02 04:21:23.716+00	2026-06-23 03:47:37.700391+00
170	11	post_reaction	\N	{"type": "post_reaction", "postId": 20, "userId": 15, "avatarUrl": "https://lh3.googleusercontent.com/a/ACg8ocJo1k1xemLnzGekmx5R5C35fJjKL-A_YSczi_rCUFnCf6nNLxA=s96-c", "displayName": "Thànhh Tr Văn", "reactionType": "like"}	\N	2026-06-28 13:32:48.590135+00
171	11	connection_request	\N	{"type": "connection_request", "userId": 15, "avatarUrl": "https://lh3.googleusercontent.com/a/ACg8ocJo1k1xemLnzGekmx5R5C35fJjKL-A_YSczi_rCUFnCf6nNLxA=s96-c", "displayName": "Thànhh Tr Văn", "connectionId": 20}	\N	2026-06-28 13:36:19.563352+00
180	13	new_message	\N	{"type": "new_message", "userId": 2, "excerpt": "haahádhashdádhashdh", "avatarUrl": "https://lh3.googleusercontent.com/a/ACg8ocJ19Soyopk0N2fDRtecDGmhJNdujPBTD9nzkuvm41vRXR2fQ4Bk=s96-c", "displayName": "Nguyễn Quốc Minh", "conversationId": 6}	2026-07-04 08:01:02.815+00	2026-07-02 04:21:33.535985+00
173	8	connection_request	\N	{"type": "connection_request", "userId": 15, "avatarUrl": "https://lh3.googleusercontent.com/a/ACg8ocJo1k1xemLnzGekmx5R5C35fJjKL-A_YSczi_rCUFnCf6nNLxA=s96-c", "displayName": "Thànhh Tr Văn", "connectionId": 22}	\N	2026-06-28 13:36:27.158115+00
174	12	connection_request	\N	{"type": "connection_request", "userId": 15, "avatarUrl": "https://lh3.googleusercontent.com/a/ACg8ocJo1k1xemLnzGekmx5R5C35fJjKL-A_YSczi_rCUFnCf6nNLxA=s96-c", "displayName": "Thànhh Tr Văn", "connectionId": 23}	\N	2026-06-28 13:36:29.081384+00
176	10	connection_request	\N	{"type": "connection_request", "userId": 15, "avatarUrl": "https://lh3.googleusercontent.com/a/ACg8ocJo1k1xemLnzGekmx5R5C35fJjKL-A_YSczi_rCUFnCf6nNLxA=s96-c", "displayName": "Thànhh Tr Văn", "connectionId": 25}	\N	2026-06-28 13:36:29.857971+00
177	3	connection_request	\N	{"type": "connection_request", "userId": 15, "avatarUrl": "https://lh3.googleusercontent.com/a/ACg8ocJo1k1xemLnzGekmx5R5C35fJjKL-A_YSczi_rCUFnCf6nNLxA=s96-c", "displayName": "Thànhh Tr Văn", "connectionId": 26}	\N	2026-06-28 13:36:33.21971+00
178	13	connection_request	\N	{"type": "connection_request", "userId": 15, "avatarUrl": "https://lh3.googleusercontent.com/a/ACg8ocJo1k1xemLnzGekmx5R5C35fJjKL-A_YSczi_rCUFnCf6nNLxA=s96-c", "displayName": "Thànhh Tr Văn", "connectionId": 27}	\N	2026-06-28 13:36:34.69578+00
175	14	connection_request	\N	{"type": "connection_request", "userId": 15, "avatarUrl": "https://lh3.googleusercontent.com/a/ACg8ocJo1k1xemLnzGekmx5R5C35fJjKL-A_YSczi_rCUFnCf6nNLxA=s96-c", "displayName": "Thànhh Tr Văn", "connectionId": 24}	2026-06-30 02:21:02.643+00	2026-06-28 13:36:29.135706+00
179	15	connection_accepted	\N	{"type": "connection_accepted", "userId": 14, "avatarUrl": "https://lh3.googleusercontent.com/a/ACg8ocJCi6n1e-SEOO4FrSXXXE1bsqW-ZRHepcD8UmoAsV_WSnpYCybP=s96-c", "displayName": "Nguyên Phan", "connectionId": 24}	\N	2026-06-30 02:58:55.945487+00
172	2	connection_request	\N	{"type": "connection_request", "userId": 15, "avatarUrl": "https://lh3.googleusercontent.com/a/ACg8ocJo1k1xemLnzGekmx5R5C35fJjKL-A_YSczi_rCUFnCf6nNLxA=s96-c", "displayName": "Thànhh Tr Văn", "connectionId": 21}	2026-07-02 04:21:23.716+00	2026-06-28 13:36:24.070635+00
200	4	new_message	\N	{"type": "new_message", "userId": 2, "excerpt": "...", "avatarUrl": "https://lh3.googleusercontent.com/a/ACg8ocJ19Soyopk0N2fDRtecDGmhJNdujPBTD9nzkuvm41vRXR2fQ4Bk=s96-c", "displayName": "Nguyễn Quốc Minh", "conversationId": 7}	2026-07-04 14:38:46.027+00	2026-07-04 14:38:01.230843+00
207	4	new_message	\N	{"type": "new_message", "userId": 2, "excerpt": "jjjjj", "avatarUrl": "https://lh3.googleusercontent.com/a/ACg8ocJ19Soyopk0N2fDRtecDGmhJNdujPBTD9nzkuvm41vRXR2fQ4Bk=s96-c", "displayName": "Nguyễn Quốc Minh", "conversationId": 7}	2026-07-04 14:57:41.482+00	2026-07-04 14:54:42.247895+00
211	2	new_message	\N	{"type": "new_message", "userId": 4, "excerpt": "Uk", "avatarUrl": "https://awetfafplorxlmdifkqd.supabase.co/storage/v1/object/public/uploads/member-avatar/2026/07/4/772006ae-11b0-4c89-a729-c24db39fc06d.jpg", "displayName": "Nguyễn Quốc Minh", "conversationId": 7}	2026-07-04 15:00:00.747+00	2026-07-04 14:59:59.367574+00
215	4	new_message	\N	{"type": "new_message", "userId": 2, "excerpt": "àdgdfg", "avatarUrl": "https://lh3.googleusercontent.com/a/ACg8ocJ19Soyopk0N2fDRtecDGmhJNdujPBTD9nzkuvm41vRXR2fQ4Bk=s96-c", "displayName": "Nguyễn Quốc Minh", "conversationId": 7}	2026-07-04 15:11:59.354+00	2026-07-04 15:11:10.893219+00
\.


ALTER TABLE public.notifications ENABLE TRIGGER ALL;

--
-- Data for Name: posts; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public.posts DISABLE TRIGGER ALL;

COPY public.posts (id, author_id, content, post_type, media, visibility, status, reaction_count, comment_count, share_count, created_at, updated_at, deleted_at) FROM stdin;
25	13		text	{"type": "shared", "original": {"id": 10, "media": {"type": "image", "items": [{"url": "https://awetfafplorxlmdifkqd.supabase.co/storage/v1/object/public/uploads/post-media/2026/06/1/30092b0f-37aa-49ff-a8dc-0c4e150f7adf.webp", "width": 435, "height": 266}]}, "author": {"role": "admin", "userId": 1, "headline": null, "avatarUrl": "https://awetfafplorxlmdifkqd.supabase.co/storage/v1/object/public/uploads/member-avatar/2026/06/1/d1cdd95c-7a1b-4a03-b3ca-d3f670261566.jpg", "displayName": "wing nhu"}, "content": "Ôm chầm lấy em <333 \\n#J97official #chiyeuminhem #chongquocdan", "authorId": 1, "postType": "image", "createdAt": "2026-06-20T09:52:45.255301+00:00"}, "originalPostId": 10}	public	active	0	0	0	2026-06-23 03:49:28.811222+00	2026-06-23 03:49:28.811222+00	\N
10	1	Ôm chầm lấy em <333 \n#J97official #chiyeuminhem #chongquocdan	image	{"type": "image", "items": [{"url": "https://awetfafplorxlmdifkqd.supabase.co/storage/v1/object/public/uploads/post-media/2026/06/1/30092b0f-37aa-49ff-a8dc-0c4e150f7adf.webp", "width": 435, "height": 266}]}	public	active	5	3	1	2026-06-20 09:52:45.255301+00	2026-06-23 03:49:28.811222+00	\N
24	4		text	{"type": "shared", "original": {"id": 23, "media": null, "author": {"role": "member", "userId": 4, "headline": null, "avatarUrl": null, "displayName": "Nguyễn Quốc Minh"}, "content": ".....", "authorId": 4, "postType": "text", "createdAt": "2026-06-23T03:42:57.807311+00:00"}, "originalPostId": 23}	public	active	0	0	0	2026-06-23 03:47:27.617135+00	2026-06-23 03:50:45.019692+00	2026-06-23 03:50:44.759+00
9	1	khi nào về	text	\N	public	active	2	0	0	2026-06-20 09:29:34.25502+00	2026-06-27 10:49:28.52996+00	\N
16	13	Hiiiiu	text	\N	public	active	0	0	0	2026-06-22 02:52:00.92024+00	2026-06-22 02:52:00.92024+00	\N
11	1	Làm thể nào để Jack quay lại với K-ICM?\n#tachop #love #tinhmotdem #domdom #keys	text	\N	public	active	3	5	0	2026-06-20 09:54:54.0487+00	2026-06-27 10:49:28.52996+00	\N
8	1	ăn gì nhỉ?	text	\N	public	active	3	0	0	2026-06-20 08:34:23.10669+00	2026-06-27 10:49:28.52996+00	\N
13	11	Sale 25% loại vũ trang nào?	text	\N	public	active	2	0	1	2026-06-20 10:11:29.705336+00	2026-07-02 10:16:28.949694+00	\N
7	11	Cần gấp 1 khẩu súng lục bạc giá hữu nghị\n#j4f	text	\N	public	active	1	0	0	2026-06-20 08:30:48.151818+00	2026-06-20 08:31:53.086512+00	2026-06-20 08:31:52.95+00
20	11		text	{"type": "shared", "original": {"id": 19, "media": null, "author": {"role": "company", "userId": 11, "headline": "Chính trị", "avatarUrl": "https://awetfafplorxlmdifkqd.supabase.co/storage/v1/object/public/uploads/company-logo/2026/06/11/0c0b4b6c-948f-4ce5-8071-b30c6de59afa.jpg", "displayName": "Công Ty TNHH MTV Mua Bán Vũ Khí Vũ Trang"}, "content": "ngày mới mệt mỏi quá các vợ", "authorId": 11, "postType": "text", "createdAt": "2026-06-23T01:09:20.035989+00:00"}, "originalPostId": 19}	public	active	1	0	0	2026-06-23 01:29:47.265507+00	2026-06-28 13:32:47.809255+00	\N
27	15	Tuyển dụng 5000 lao động tại khu tự trị joblink umters \ncông việc: ăn ngủ nghỉ\nyêu cầu: 500tr để gia nhập	text	\N	public	active	0	0	0	2026-06-28 13:33:44.536534+00	2026-06-28 13:33:44.536534+00	\N
29	2		text	{"type": "shared", "original": {"id": 15, "media": {"type": "image", "items": [{"url": "https://awetfafplorxlmdifkqd.supabase.co/storage/v1/object/public/uploads/post-media/2026/06/2/da13dbbd-a62d-4119-8847-cbeaeacbca18.jpeg", "width": 896, "height": 1087}, {"url": "https://awetfafplorxlmdifkqd.supabase.co/storage/v1/object/public/uploads/post-media/2026/06/2/3f24c2aa-cf0d-4fc1-939d-8e10e4b899b6.jpg", "width": 885, "height": 1920}, {"url": "https://awetfafplorxlmdifkqd.supabase.co/storage/v1/object/public/uploads/post-media/2026/06/2/7c2eec2b-ab0a-4c99-975d-b45f004534d0.jpg", "width": 1440, "height": 1920}, {"url": "https://awetfafplorxlmdifkqd.supabase.co/storage/v1/object/public/uploads/post-media/2026/06/2/33ab9091-df4f-4932-a438-5ccba2928f1f.jpg", "width": 885, "height": 1920}]}, "author": {"role": "member", "userId": 2, "headline": "Dev", "avatarUrl": "https://lh3.googleusercontent.com/a/ACg8ocJ19Soyopk0N2fDRtecDGmhJNdujPBTD9nzkuvm41vRXR2fQ4Bk=s96-c", "displayName": "Nguyễn Quốc Minh"}, "content": "Ngon quá điiiiiii", "authorId": 2, "postType": "image", "createdAt": "2026-06-20T11:43:34.800621+00:00"}, "originalPostId": 15}	public	active	0	0	0	2026-07-04 07:37:07.925436+00	2026-07-04 07:37:07.925436+00	\N
14	1		text	{"type": "shared", "original": {"id": 13, "media": {"type": "poll", "options": [{"id": 8, "voteCount": 0, "optionText": "AK47"}, {"id": 9, "voteCount": 0, "optionText": "Shotgun"}, {"id": 10, "voteCount": 0, "optionText": "MP40"}, {"id": 11, "voteCount": 0, "optionText": "Lục bạc"}], "totalVotes": 0}, "author": {"role": "company", "userId": 11, "headline": "Chính trị", "avatarUrl": null, "displayName": "Công Ty TNHH MTV Mua Bán Vũ Khí Vũ Trang"}, "content": "Sale 25% loại vũ trang nào?", "authorId": 11, "postType": "poll", "createdAt": "2026-06-20T10:11:29.705336+00:00"}, "originalPostId": 13}	public	active	3	0	0	2026-06-20 10:12:37.832911+00	2026-06-22 03:25:15.65472+00	\N
6	1	mewwww	image	{"type": "image", "items": [{"url": "https://awetfafplorxlmdifkqd.supabase.co/storage/v1/object/public/uploads/post-media/2026/06/1/ef863dff-6039-44f1-bada-6c55dc216ac1.jpg", "width": 236, "height": 227}]}	public	active	3	1	0	2026-06-20 08:25:55.581466+00	2026-06-22 03:29:38.501424+00	\N
17	13	Hiiiiui	text	\N	public	active	1	1	0	2026-06-22 02:52:20.699526+00	2026-06-22 03:44:14.531329+00	\N
18	4	hêhhhehehehe	text	\N	public	active	1	0	0	2026-06-22 03:49:06.593981+00	2026-06-22 05:54:27.404804+00	\N
4	4	hi	text	\N	public	active	1	0	0	2026-06-20 08:24:12.989009+00	2026-06-20 10:12:24.478186+00	\N
19	11	ngày mới mệt mỏi quá các vợ	text	\N	public	active	1	0	1	2026-06-23 01:09:20.035989+00	2026-06-23 01:29:47.265507+00	\N
12	11	Anh cần gấp 1 khẩu tiểu liên UMP giá cả bàn bạc\n#chiyeuminhem #khongluadao #hangchinhhang	text	\N	public	active	2	1	0	2026-06-20 10:05:53.353649+00	2026-06-23 02:22:40.424718+00	\N
21	12	Hôm nay toi buồn một mình trên phố đông...\n#tamtrang #sadgirl	text	\N	public	active	0	0	0	2026-06-23 02:27:46.655576+00	2026-06-23 02:27:46.655576+00	\N
5	2	lien minh tri thuc	image	{"type": "image", "items": [{"url": "https://awetfafplorxlmdifkqd.supabase.co/storage/v1/object/public/uploads/post-media/2026/06/2/ff4256b2-bc75-42eb-9969-2537b63849a2.jpg", "width": 1920, "height": 1072}]}	public	active	1	2	0	2026-06-20 08:25:52.571106+00	2026-06-20 13:38:31.91824+00	\N
23	4	.....	text	\N	public	active	1	0	1	2026-06-23 03:42:57.807311+00	2026-06-23 03:47:27.617135+00	\N
22	13	hi my name is dui dep trai conba hai say hi o ye yo ye	text	\N	public	active	2	0	0	2026-06-23 03:25:27.28101+00	2026-06-23 03:48:12.694669+00	\N
26	15	:))) chào ac	text	\N	public	active	0	0	0	2026-06-28 13:29:42.824191+00	2026-06-28 13:29:42.824191+00	\N
28	15	vẫn lỗi nhiều lắm các a ơi :)))này khó tốt nghiệp rồi	text	\N	public	active	0	0	0	2026-06-28 13:37:06.980157+00	2026-06-28 13:37:06.980157+00	\N
15	2	Ngon quá điiiiiii	image	{"type": "image", "items": [{"url": "https://awetfafplorxlmdifkqd.supabase.co/storage/v1/object/public/uploads/post-media/2026/06/2/da13dbbd-a62d-4119-8847-cbeaeacbca18.jpeg", "width": 896, "height": 1087}, {"url": "https://awetfafplorxlmdifkqd.supabase.co/storage/v1/object/public/uploads/post-media/2026/06/2/3f24c2aa-cf0d-4fc1-939d-8e10e4b899b6.jpg", "width": 885, "height": 1920}, {"url": "https://awetfafplorxlmdifkqd.supabase.co/storage/v1/object/public/uploads/post-media/2026/06/2/7c2eec2b-ab0a-4c99-975d-b45f004534d0.jpg", "width": 1440, "height": 1920}, {"url": "https://awetfafplorxlmdifkqd.supabase.co/storage/v1/object/public/uploads/post-media/2026/06/2/33ab9091-df4f-4932-a438-5ccba2928f1f.jpg", "width": 885, "height": 1920}]}	public	active	2	4	1	2026-06-20 11:43:34.800621+00	2026-07-04 07:37:07.925436+00	\N
30	2	Apply điiii\n\nhttps://joblink.umters.club/jobs/5	text	\N	public	active	0	0	0	2026-07-04 08:23:40.002828+00	2026-07-04 08:23:40.002828+00	\N
31	4	Apply nè	text	{"job": {"id": 13, "title": "Kỹ Sư Giám Sát MEP Tại Hà Nội", "wardName": "Phường Ba Đình", "createdAt": "2026-07-04T10:01:25.214382+00:00", "salaryMax": 23000000, "salaryMin": 18000000, "companyName": "CÔNG TY TNHH RI TA VÕ", "jobTypeName": "Tự do", "provinceName": "Hà Nội", "workModeName": "Kết hợp", "companyUserId": 25, "salaryVisible": true, "companyLogoUrl": "https://awetfafplorxlmdifkqd.supabase.co/storage/v1/object/public/uploads/company-logo/2026/07/25/ac0c392c-c669-42f3-b24f-4cf63a45b290.jpg", "companyVerified": true}, "type": "job_share", "jobId": 13}	public	active	0	0	0	2026-07-04 13:52:07.944904+00	2026-07-04 13:52:07.944904+00	\N
\.


ALTER TABLE public.posts ENABLE TRIGGER ALL;

--
-- Data for Name: post_comments; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public.post_comments DISABLE TRIGGER ALL;

COPY public.post_comments (id, post_id, user_id, parent_id, content, status, created_at, updated_at, deleted_at) FROM stdin;
1	6	2	\N	dữ dữ	active	2026-06-20 08:26:08.265967+00	2026-06-20 08:26:08.265967+00	\N
2	5	1	\N	hình như nhóm này lên trình bày sai không có điểm	active	2026-06-20 08:26:30.683219+00	2026-06-20 08:26:30.683219+00	\N
3	11	11	\N	nếu làm cả 2 mà vẫn không được thì liên hệ công ty chị	active	2026-06-20 09:56:24.637784+00	2026-06-20 09:56:24.637784+00	\N
4	10	11	\N	súng ảnh hay súng bên chị nhanh hơn?	active	2026-06-20 09:57:18.133076+00	2026-06-20 09:57:18.133076+00	\N
5	10	4	\N	cc;	deleted	2026-06-20 10:57:03.093525+00	2026-06-20 10:57:07.459335+00	2026-06-20 10:57:07.265+00
6	10	1	\N	nhảy vào lòng anh	deleted	2026-06-20 10:57:48.765247+00	2026-06-20 10:58:22.526791+00	2026-06-20 10:58:22.389+00
7	10	1	\N	hi	deleted	2026-06-20 10:58:30.728435+00	2026-06-20 10:59:14.607846+00	2026-06-20 10:59:14.466+00
8	11	4	\N	bsjadks	active	2026-06-20 10:59:18.354244+00	2026-06-20 10:59:18.354244+00	\N
9	5	5	2	@[wing nhu](1) hehe	active	2026-06-20 13:38:31.91824+00	2026-06-20 13:38:31.91824+00	\N
10	11	2	3	@[Công Ty TNHH MTV Mua Bán Vũ Khí Vũ Trang](11) gê zzz	active	2026-06-21 14:18:45.819502+00	2026-06-21 14:18:45.819502+00	\N
11	15	1	\N	hih	active	2026-06-22 02:45:30.262874+00	2026-06-22 02:45:30.262874+00	\N
12	15	2	11	@[wing nhu](1) Cc	active	2026-06-22 02:46:14.081158+00	2026-06-22 02:46:14.081158+00	\N
13	15	1	11	@[Nguyễn Quốc Minh](2) ddu me may chui tao har	active	2026-06-22 02:46:38.048756+00	2026-06-22 02:46:38.048756+00	\N
14	15	2	11	@[wing nhu](1) Kemetao	active	2026-06-22 02:46:48.639795+00	2026-06-22 02:46:48.639795+00	\N
15	11	13	\N	Đi coi ám ảnh	active	2026-06-22 02:48:03.944348+00	2026-06-22 02:48:03.944348+00	\N
16	10	13	\N	Hey hay om em	active	2026-06-22 02:53:20.548758+00	2026-06-22 02:53:20.548758+00	\N
17	11	4	\N	hmmmm	active	2026-06-22 03:26:20.831687+00	2026-06-22 03:26:20.831687+00	\N
18	17	4	\N	dì z	active	2026-06-22 03:44:14.531329+00	2026-06-22 03:44:14.531329+00	\N
19	12	12	\N	yeuanh	deleted	2026-06-23 02:21:51.644991+00	2026-06-23 02:22:00.567221+00	2026-06-23 02:22:00.433+00
20	12	12	\N	hii	active	2026-06-23 02:22:15.045424+00	2026-06-23 02:22:15.045424+00	\N
21	10	13	\N	anh oi dep trai quaaaaaaaaaaaaaaaaaaaaaaaaaa iuuuuuu	active	2026-06-23 03:47:58.417216+00	2026-06-23 03:47:58.417216+00	\N
\.


ALTER TABLE public.post_comments ENABLE TRIGGER ALL;

--
-- Data for Name: post_reactions; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public.post_reactions DISABLE TRIGGER ALL;

COPY public.post_reactions (id, post_id, user_id, reaction_type, created_at) FROM stdin;
1	6	1	like	2026-06-20 08:27:05.402416+00
2	5	1	like	2026-06-20 08:27:07.253184+00
3	7	11	like	2026-06-20 08:30:56.096017+00
4	8	11	like	2026-06-20 09:06:35.649624+00
5	6	11	like	2026-06-20 09:06:44.306916+00
6	9	1	like	2026-06-20 09:29:53.317528+00
7	10	1	like	2026-06-20 09:52:50.60954+00
15	13	1	like	2026-06-20 10:12:06.31568+00
16	12	1	like	2026-06-20 10:12:11.678087+00
17	11	1	like	2026-06-20 10:12:15.916808+00
18	8	1	like	2026-06-20 10:12:20.335801+00
19	4	1	like	2026-06-20 10:12:24.478186+00
20	14	1	like	2026-06-20 10:14:54.65871+00
21	10	4	like	2026-06-20 10:56:54.956506+00
23	11	4	like	2026-06-20 11:11:31.593552+00
25	14	2	like	2026-06-20 15:43:57.205208+00
35	9	11	like	2026-06-22 02:53:21.423066+00
36	15	2	like	2026-06-22 03:06:11.326724+00
37	11	2	like	2026-06-22 03:22:42.403419+00
38	10	2	like	2026-06-22 03:22:57.306508+00
41	14	4	like	2026-06-22 03:25:15.65472+00
43	8	4	like	2026-06-22 03:29:36.492646+00
44	6	4	like	2026-06-22 03:29:38.501424+00
45	17	4	like	2026-06-22 03:44:06.946689+00
46	18	2	like	2026-06-22 05:54:27.404804+00
48	19	11	like	2026-06-23 01:10:21.222443+00
50	12	12	like	2026-06-23 02:22:40.424718+00
51	23	13	like	2026-06-23 03:43:44.701636+00
52	22	13	like	2026-06-23 03:43:51.121525+00
55	15	13	like	2026-06-23 03:47:36.91666+00
56	10	13	like	2026-06-23 03:47:54.086656+00
57	10	11	like	2026-06-23 03:47:54.893891+00
58	22	11	like	2026-06-23 03:48:12.694669+00
60	20	15	like	2026-06-28 13:32:47.809255+00
62	13	2	like	2026-07-02 10:16:28.949694+00
\.


ALTER TABLE public.post_reactions ENABLE TRIGGER ALL;

--
-- Data for Name: post_shares; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public.post_shares DISABLE TRIGGER ALL;

COPY public.post_shares (id, post_id, user_id, comment_content, created_at) FROM stdin;
1	13	1	\N	2026-06-20 10:12:38.115386+00
2	19	11	\N	2026-06-23 01:29:47.265507+00
3	23	4	\N	2026-06-23 03:47:27.617135+00
4	10	13	\N	2026-06-23 03:49:28.811222+00
5	15	2	\N	2026-07-04 07:37:07.925436+00
\.


ALTER TABLE public.post_shares ENABLE TRIGGER ALL;

--
-- Data for Name: profile_view_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public.profile_view_logs DISABLE TRIGGER ALL;

COPY public.profile_view_logs (id, target_user_id, viewer_user_id, viewed_at) FROM stdin;
1	4	11	2026-06-20 08:57:13.898449+00
2	1	4	2026-06-20 08:57:15.494171+00
3	1	11	2026-06-20 08:58:44.942976+00
4	4	11	2026-06-20 09:01:05.301767+00
5	1	11	2026-06-20 09:06:07.612828+00
6	1	4	2026-06-20 09:06:23.108307+00
7	1	11	2026-06-20 09:07:12.258293+00
8	1	4	2026-06-20 09:18:20.012462+00
9	4	1	2026-06-20 09:26:18.285968+00
10	2	1	2026-06-20 09:26:29.761751+00
11	2	1	2026-06-20 09:27:26.577168+00
12	2	1	2026-06-20 09:27:47.783123+00
13	2	5	2026-06-20 13:36:58.862133+00
14	13	1	2026-06-22 02:50:24.008814+00
15	2	4	2026-06-22 04:08:23.738045+00
16	15	5	2026-07-01 07:03:04.129277+00
17	13	2	2026-07-02 12:43:59.523113+00
18	2	5	2026-07-03 08:19:01.641738+00
19	2	5	2026-07-03 08:19:31.918163+00
20	15	4	2026-07-04 13:03:31.666504+00
21	26	4	2026-07-04 13:44:46.595368+00
22	26	4	2026-07-04 13:58:28.544738+00
23	26	2	2026-07-04 14:02:41.411244+00
\.


ALTER TABLE public.profile_view_logs ENABLE TRIGGER ALL;

--
-- Data for Name: rate_limits; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public.rate_limits DISABLE TRIGGER ALL;

COPY public.rate_limits (id, user_id, action_type, window_start, created_at) FROM stdin;
119	13	share	2026-06-23 03:49:27+00	2026-06-23 03:49:27.992489+00
4	2	vote	2026-06-21 14:18:26+00	2026-06-21 14:18:26.356374+00
9	1	vote	2026-06-22 02:41:27+00	2026-06-22 02:41:27.559624+00
126	15	reaction	2026-06-28 13:32:39+00	2026-06-28 13:32:39.00408+00
127	15	reaction	2026-06-28 13:32:43+00	2026-06-28 13:32:43.905318+00
128	15	reaction	2026-06-28 13:32:47+00	2026-06-28 13:32:47.53323+00
14	13	application	2026-06-22 02:44:37+00	2026-06-22 02:44:37.654062+00
15	1	reaction	2026-06-22 02:44:57+00	2026-06-22 02:44:57.749996+00
16	1	reaction	2026-06-22 02:45:01+00	2026-06-22 02:45:01.884159+00
17	1	reaction	2026-06-22 02:45:05+00	2026-06-22 02:45:05.158703+00
18	1	reaction	2026-06-22 02:45:09+00	2026-06-22 02:45:09.572656+00
19	1	reaction	2026-06-22 02:45:13+00	2026-06-22 02:45:13.182417+00
20	1	reaction	2026-06-22 02:45:18+00	2026-06-22 02:45:18.191455+00
130	15	connection	2026-06-28 13:36:17+00	2026-06-28 13:36:17.949434+00
22	13	connection	2026-06-22 02:46:00+00	2026-06-22 02:46:00.132921+00
23	13	connection	2026-06-22 02:46:04+00	2026-06-22 02:46:04.336339+00
24	13	connection	2026-06-22 02:46:12+00	2026-06-22 02:46:12.769333+00
25	2	comment	2026-06-22 02:46:13+00	2026-06-22 02:46:13.805419+00
26	13	connection	2026-06-22 02:46:22+00	2026-06-22 02:46:22.285058+00
27	1	comment	2026-06-22 02:46:37+00	2026-06-22 02:46:37.779633+00
28	2	comment	2026-06-22 02:46:48+00	2026-06-22 02:46:48.356255+00
29	1	connection	2026-06-22 02:47:12+00	2026-06-22 02:47:12.981527+00
131	15	connection	2026-06-28 13:36:22+00	2026-06-28 13:36:22.497087+00
31	1	message	2026-06-22 02:50:38+00	2026-06-22 02:50:38.876699+00
132	15	connection	2026-06-28 13:36:25+00	2026-06-28 13:36:25.04539+00
133	15	connection	2026-06-28 13:36:27+00	2026-06-28 13:36:27.044356+00
134	15	connection	2026-06-28 13:36:27+00	2026-06-28 13:36:27.091194+00
135	15	connection	2026-06-28 13:36:28+00	2026-06-28 13:36:28.282246+00
136	15	connection	2026-06-28 13:36:31+00	2026-06-28 13:36:31.535375+00
137	15	connection	2026-06-28 13:36:33+00	2026-06-28 13:36:33.126911+00
138	15	post	2026-06-28 13:37:06+00	2026-06-28 13:37:06.690322+00
142	2	reaction	2026-07-02 10:16:20+00	2026-07-02 10:16:20.254986+00
143	2	reaction	2026-07-02 10:16:26+00	2026-07-02 10:16:26.126707+00
144	2	reaction	2026-07-02 10:16:28+00	2026-07-02 10:16:28.687952+00
145	5	connection	2026-07-03 08:19:04+00	2026-07-03 08:19:04.940839+00
146	5	connection	2026-07-03 08:19:08+00	2026-07-03 08:19:08.890409+00
47	11	company_action	2026-06-22 02:54:32+00	2026-06-22 02:54:32.41416+00
48	11	company_action	2026-06-22 02:55:22+00	2026-06-22 02:55:22.765471+00
147	5	connection	2026-07-03 08:19:12+00	2026-07-03 08:19:12.808742+00
148	2	share	2026-07-04 07:37:05+00	2026-07-04 07:37:05.605265+00
150	13	message	2026-07-04 08:01:05+00	2026-07-04 08:01:05.81276+00
152	17	job	2026-07-04 08:15:23+00	2026-07-04 08:15:23.949508+00
153	16	job	2026-07-04 08:22:28+00	2026-07-04 08:22:28.463956+00
154	2	post	2026-07-04 08:23:39+00	2026-07-04 08:23:39.664317+00
155	18	job	2026-07-04 08:33:38+00	2026-07-04 08:33:38.903261+00
156	19	job	2026-07-04 08:41:25+00	2026-07-04 08:41:25.419989+00
157	4	application	2026-07-04 09:02:04+00	2026-07-04 09:02:04.983104+00
158	21	job	2026-07-04 09:24:10+00	2026-07-04 09:24:10.767554+00
159	22	job	2026-07-04 09:28:38+00	2026-07-04 09:28:38.836338+00
160	23	job	2026-07-04 09:33:29+00	2026-07-04 09:33:29.273854+00
63	4	reaction	2026-06-22 03:44:06+00	2026-06-22 03:44:06.749424+00
64	4	comment	2026-06-22 03:44:14+00	2026-06-22 03:44:14.38806+00
161	24	job	2026-07-04 09:44:18+00	2026-07-04 09:44:18.185714+00
164	25	job	2026-07-04 10:02:47+00	2026-07-04 10:02:47.808471+00
165	4	post	2026-07-04 13:52:07+00	2026-07-04 13:52:07.811034+00
166	2	connection	2026-07-04 13:59:11+00	2026-07-04 13:59:11.727441+00
80	11	post	2026-06-23 01:09:19+00	2026-06-23 01:09:19.264192+00
171	4	connection	2026-07-04 14:17:23+00	2026-07-04 14:17:23.963434+00
84	11	share	2026-06-23 01:29:46+00	2026-06-23 01:29:46.383374+00
88	11	job	2026-06-23 01:46:50+00	2026-06-23 01:46:50.201809+00
89	12	application	2026-06-23 02:16:21+00	2026-06-23 02:16:21.23087+00
90	12	vote	2026-06-23 02:18:45+00	2026-06-23 02:18:45.53664+00
91	12	comment	2026-06-23 02:21:51+00	2026-06-23 02:21:51.373195+00
92	12	comment	2026-06-23 02:22:14+00	2026-06-23 02:22:14.777926+00
93	12	reaction	2026-06-23 02:22:35+00	2026-06-23 02:22:35.43175+00
94	12	reaction	2026-06-23 02:22:39+00	2026-06-23 02:22:39.656015+00
95	12	reaction	2026-06-23 02:22:39+00	2026-06-23 02:22:39.931751+00
97	12	post	2026-06-23 02:27:46+00	2026-06-23 02:27:46.349807+00
100	12	message	2026-06-23 03:17:12+00	2026-06-23 03:17:12.041498+00
101	11	message	2026-06-23 03:18:25+00	2026-06-23 03:18:25.441432+00
102	13	post	2026-06-23 03:25:26+00	2026-06-23 03:25:26.996081+00
107	11	reaction	2026-06-23 03:47:23+00	2026-06-23 03:47:23.723955+00
108	11	reaction	2026-06-23 03:47:26+00	2026-06-23 03:47:26.855436+00
109	4	share	2026-06-23 03:47:27+00	2026-06-23 03:47:27.296611+00
110	11	reaction	2026-06-23 03:47:30+00	2026-06-23 03:47:30.742382+00
111	11	reaction	2026-06-23 03:47:33+00	2026-06-23 03:47:33.889382+00
112	13	reaction	2026-06-23 03:47:36+00	2026-06-23 03:47:36.652525+00
113	13	reaction	2026-06-23 03:47:49+00	2026-06-23 03:47:49.760499+00
114	11	reaction	2026-06-23 03:47:51+00	2026-06-23 03:47:51.462956+00
115	13	reaction	2026-06-23 03:47:53+00	2026-06-23 03:47:53.832635+00
116	11	reaction	2026-06-23 03:47:54+00	2026-06-23 03:47:54.632615+00
117	13	comment	2026-06-23 03:47:58+00	2026-06-23 03:47:58.154311+00
118	11	reaction	2026-06-23 03:48:12+00	2026-06-23 03:48:12.439913+00
192	2	message	2026-07-04 15:11:09+00	2026-07-04 15:11:09.508377+00
193	2	message	2026-07-04 15:11:11+00	2026-07-04 15:11:11.521022+00
194	2	message	2026-07-04 15:11:13+00	2026-07-04 15:11:13.600851+00
195	4	message	2026-07-04 15:13:28+00	2026-07-04 15:13:28.118671+00
\.


ALTER TABLE public.rate_limits ENABLE TRIGGER ALL;

--
-- Data for Name: saved_jobs; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public.saved_jobs DISABLE TRIGGER ALL;

COPY public.saved_jobs (user_id, job_id, created_at) FROM stdin;
1	1	2026-06-20 08:43:15.465357+00
12	2	2026-06-20 11:32:50.23223+00
12	1	2026-06-20 11:32:51.481039+00
2	2	2026-06-20 13:51:37.495973+00
14	2	2026-06-23 03:45:20.220722+00
\.


ALTER TABLE public.saved_jobs ENABLE TRIGGER ALL;

--
-- Data for Name: system_settings; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public.system_settings DISABLE TRIGGER ALL;

COPY public.system_settings (id, setting_key, setting_group, value, encrypted, updated_by, created_at, updated_at) FROM stdin;
12	smtp_password	smtp	null	t	5	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00
13	smtp_encryption	smtp	"none"	f	5	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00
14	smtp_from_email	smtp	"noreply@joblink.local"	f	5	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00
15	smtp_from_name	smtp	"Joblink Local"	f	5	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00
19	login_rate_limit	security	10	f	5	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00
20	upload_max_mb	security	10	f	5	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00
22	google_auth_enabled	security	true	f	5	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00
1	site_name	site_identity	"Joblink"	f	5	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00
2	site_description	site_identity	"Mạng xã hội việc làm và tuyển dụng chuyên nghiệp"	f	5	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00
3	site_logo_url	site_identity	\N	f	5	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00
4	site_favicon_url	site_identity	\N	f	5	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00
5	default_locale	regional	"vi"	f	5	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00
6	default_timezone	regional	"Asia/Ho_Chi_Minh"	f	5	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00
7	default_currency	regional	"VND"	f	5	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00
8	available_locales	regional	["vi", "en"]	f	5	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00
9	smtp_host	smtp	"127.0.0.1"	t	5	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00
10	smtp_port	smtp	54325	f	5	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00
11	smtp_username	smtp	null	t	5	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00
23	require_email_verification	security	true	f	5	2026-06-20 08:13:45.281878+00	2026-06-20 08:13:45.281878+00
\.


ALTER TABLE public.system_settings ENABLE TRIGGER ALL;

--
-- Data for Name: user_blocks; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public.user_blocks DISABLE TRIGGER ALL;

COPY public.user_blocks (id, blocker_id, blocked_id, reason, created_at) FROM stdin;
\.


ALTER TABLE public.user_blocks ENABLE TRIGGER ALL;

--
-- Data for Name: user_feeds; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public.user_feeds DISABLE TRIGGER ALL;

COPY public.user_feeds (user_id, post_id, created_at) FROM stdin;
4	4	2026-06-20 08:24:12.989009+00
1	6	2026-06-20 08:25:55.581466+00
2	6	2026-06-20 08:25:55.581466+00
11	7	2026-06-20 08:30:48.151818+00
1	8	2026-06-20 08:34:23.10669+00
2	8	2026-06-20 08:34:23.10669+00
1	4	2026-06-20 08:24:12.989009+00
4	8	2026-06-20 08:34:23.10669+00
11	8	2026-06-20 08:34:23.10669+00
4	6	2026-06-20 08:25:55.581466+00
11	6	2026-06-20 08:25:55.581466+00
2	5	2026-06-20 08:25:52.571106+00
1	5	2026-06-20 08:25:52.571106+00
1	9	2026-06-20 09:29:34.25502+00
2	9	2026-06-20 09:29:34.25502+00
4	9	2026-06-20 09:29:34.25502+00
11	9	2026-06-20 09:29:34.25502+00
1	10	2026-06-20 09:52:45.255301+00
2	10	2026-06-20 09:52:45.255301+00
4	10	2026-06-20 09:52:45.255301+00
11	10	2026-06-20 09:52:45.255301+00
1	11	2026-06-20 09:54:54.0487+00
2	11	2026-06-20 09:54:54.0487+00
4	11	2026-06-20 09:54:54.0487+00
11	11	2026-06-20 09:54:54.0487+00
11	12	2026-06-20 10:05:53.353649+00
1	12	2026-06-20 10:05:53.353649+00
11	13	2026-06-20 10:11:29.705336+00
1	13	2026-06-20 10:11:29.705336+00
1	14	2026-06-20 10:12:37.832911+00
2	14	2026-06-20 10:12:37.832911+00
4	14	2026-06-20 10:12:37.832911+00
11	14	2026-06-20 10:12:37.832911+00
2	15	2026-06-20 11:43:34.800621+00
1	15	2026-06-20 11:43:34.800621+00
13	6	2026-06-20 08:25:55.581466+00
13	9	2026-06-20 09:29:34.25502+00
13	8	2026-06-20 08:34:23.10669+00
13	10	2026-06-20 09:52:45.255301+00
13	14	2026-06-20 10:12:37.832911+00
13	11	2026-06-20 09:54:54.0487+00
13	16	2026-06-22 02:52:00.92024+00
13	17	2026-06-22 02:52:20.699526+00
13	13	2026-06-20 10:11:29.705336+00
13	12	2026-06-20 10:05:53.353649+00
11	16	2026-06-22 02:52:00.92024+00
11	17	2026-06-22 02:52:20.699526+00
12	13	2026-06-20 10:11:29.705336+00
12	12	2026-06-20 10:05:53.353649+00
13	4	2026-06-20 08:24:12.989009+00
4	16	2026-06-22 02:52:00.92024+00
4	17	2026-06-22 02:52:20.699526+00
4	18	2026-06-22 03:49:06.593981+00
13	18	2026-06-22 03:49:06.593981+00
13	15	2026-06-20 11:43:34.800621+00
13	5	2026-06-20 08:25:52.571106+00
2	16	2026-06-22 02:52:00.92024+00
2	17	2026-06-22 02:52:20.699526+00
4	15	2026-06-20 11:43:34.800621+00
4	5	2026-06-20 08:25:52.571106+00
2	18	2026-06-22 03:49:06.593981+00
2	4	2026-06-20 08:24:12.989009+00
11	15	2026-06-20 11:43:34.800621+00
11	5	2026-06-20 08:25:52.571106+00
2	13	2026-06-20 10:11:29.705336+00
2	12	2026-06-20 10:05:53.353649+00
11	19	2026-06-23 01:09:20.035989+00
13	19	2026-06-23 01:09:20.035989+00
11	20	2026-06-23 01:29:47.265507+00
13	20	2026-06-23 01:29:47.265507+00
12	16	2026-06-22 02:52:00.92024+00
12	17	2026-06-22 02:52:20.699526+00
12	21	2026-06-23 02:27:46.655576+00
11	21	2026-06-23 02:27:46.655576+00
13	21	2026-06-23 02:27:46.655576+00
13	22	2026-06-23 03:25:27.28101+00
4	22	2026-06-23 03:25:27.28101+00
11	22	2026-06-23 03:25:27.28101+00
12	22	2026-06-23 03:25:27.28101+00
4	23	2026-06-23 03:42:57.807311+00
13	23	2026-06-23 03:42:57.807311+00
13	25	2026-06-23 03:49:28.811222+00
4	25	2026-06-23 03:49:28.811222+00
11	25	2026-06-23 03:49:28.811222+00
12	25	2026-06-23 03:49:28.811222+00
15	26	2026-06-28 13:29:42.824191+00
15	27	2026-06-28 13:33:44.536534+00
15	28	2026-06-28 13:37:06.980157+00
14	26	2026-06-28 13:29:42.824191+00
14	27	2026-06-28 13:33:44.536534+00
14	28	2026-06-28 13:37:06.980157+00
2	29	2026-07-04 07:37:07.925436+00
2	30	2026-07-04 08:23:40.002828+00
4	31	2026-07-04 13:52:07.944904+00
2	31	2026-07-04 13:52:07.944904+00
\.


ALTER TABLE public.user_feeds ENABLE TRIGGER ALL;

--
-- Data for Name: user_last_active; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public.user_last_active DISABLE TRIGGER ALL;

COPY public.user_last_active (user_id, last_active) FROM stdin;
11	2026-06-23 01:29:47.265507+00
12	2026-06-23 02:27:46.655576+00
13	2026-06-23 03:49:28.811222+00
15	2026-06-28 13:37:06.980157+00
2	2026-07-04 08:23:40.002828+00
4	2026-07-04 13:52:07.944904+00
\.


ALTER TABLE public.user_last_active ENABLE TRIGGER ALL;

--
-- Name: audit_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.audit_logs_id_seq', 273, true);


--
-- Name: company_profiles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.company_profiles_id_seq', 12, true);


--
-- Name: connections_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.connections_id_seq', 33, true);


--
-- Name: conversations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.conversations_id_seq', 11, true);


--
-- Name: follows_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.follows_id_seq', 5, true);


--
-- Name: job_applications_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.job_applications_id_seq', 10, true);


--
-- Name: job_positions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.job_positions_id_seq', 25, true);


--
-- Name: job_types_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.job_types_id_seq', 10, true);


--
-- Name: job_view_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.job_view_logs_id_seq', 36, true);


--
-- Name: jobs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.jobs_id_seq', 14, true);


--
-- Name: member_cvs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.member_cvs_id_seq', 10, true);


--
-- Name: member_educations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.member_educations_id_seq', 2, true);


--
-- Name: member_experiences_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.member_experiences_id_seq', 3, true);


--
-- Name: member_profiles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.member_profiles_id_seq', 14, true);


--
-- Name: member_skills_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.member_skills_id_seq', 4, true);


--
-- Name: messages_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.messages_id_seq', 76, true);


--
-- Name: moderation_actions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.moderation_actions_id_seq', 1, false);


--
-- Name: notification_preferences_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.notification_preferences_id_seq', 3, true);


--
-- Name: notifications_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.notifications_id_seq', 216, true);


--
-- Name: post_comments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.post_comments_id_seq', 21, true);


--
-- Name: post_reactions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.post_reactions_id_seq', 62, true);


--
-- Name: post_shares_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.post_shares_id_seq', 5, true);


--
-- Name: posts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.posts_id_seq', 31, true);


--
-- Name: profile_view_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.profile_view_logs_id_seq', 23, true);


--
-- Name: provinces_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.provinces_id_seq', 34, true);


--
-- Name: rate_limits_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.rate_limits_id_seq', 195, true);


--
-- Name: reports_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.reports_id_seq', 4, true);


--
-- Name: skills_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.skills_id_seq', 26, true);


--
-- Name: system_settings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.system_settings_id_seq', 31, true);


--
-- Name: user_blocks_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.user_blocks_id_seq', 1, false);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_id_seq', 26, true);


--
-- Name: wards_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.wards_id_seq', 961, true);


--
-- Name: work_modes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.work_modes_id_seq', 6, true);


--
-- PostgreSQL database dump complete
--

\unrestrict zUtLrnHN6oEZlez8PVv6P1rwn1BVskEGlcuSaPhwD5pILWRaxuxf1eda43MvqrN

