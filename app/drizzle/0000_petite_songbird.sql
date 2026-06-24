CREATE TABLE "agent_skills" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"category" text NOT NULL,
	"description" text NOT NULL,
	"privacy_level" text DEFAULT 'local' NOT NULL,
	"docs_url" text,
	"supported_sources" text[],
	"install_config" jsonb,
	CONSTRAINT "agent_skills_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "audit_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"actor_id" uuid,
	"action" text NOT NULL,
	"target_type" text,
	"target_id" text,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "badges" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" text NOT NULL,
	"label" text NOT NULL,
	"awarded_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "badge_user_type_uniq" UNIQUE("user_id","type")
);
--> statement-breakpoint
CREATE TABLE "consents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"action_type" text NOT NULL,
	"scope" text,
	"related_type" text,
	"related_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contact_disclosures" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"exchange_id" uuid NOT NULL,
	"discloser_id" uuid NOT NULL,
	"recipient_id" uuid NOT NULL,
	"snapshot" jsonb NOT NULL,
	"disclosed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"revoked_for_future" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contact_info" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" text NOT NULL,
	"value" text NOT NULL,
	"label" text,
	"visibility" text DEFAULT 'private' NOT NULL,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "exchanges" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"public_ref" text NOT NULL,
	"requester_id" uuid NOT NULL,
	"target_module_id" uuid NOT NULL,
	"offered_module_id" uuid,
	"status" text DEFAULT 'Requested' NOT NULL,
	"delivery_channel" text DEFAULT 'github_private_repo',
	"requester_confirmed_delivery" boolean DEFAULT false NOT NULL,
	"owner_confirmed_delivery" boolean DEFAULT false NOT NULL,
	"feedback_window_closes_at" timestamp with time zone,
	"cancel_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "exchanges_public_ref_unique" UNIQUE("public_ref")
);
--> statement-breakpoint
CREATE TABLE "feedback" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"exchange_id" uuid NOT NULL,
	"author_id" uuid NOT NULL,
	"scores" jsonb NOT NULL,
	"public_comment" text,
	"weight" numeric DEFAULT '1' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "feedback_ex_author_uniq" UNIQUE("exchange_id","author_id")
);
--> statement-breakpoint
CREATE TABLE "knowledge_modules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" uuid NOT NULL,
	"title" text NOT NULL,
	"summary" text DEFAULT '' NOT NULL,
	"type" text,
	"status" text DEFAULT 'Draft' NOT NULL,
	"freshness" text,
	"published_at" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "manifests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"module_id" uuid NOT NULL,
	"summary" text NOT NULL,
	"topics" text[] DEFAULT '{}' NOT NULL,
	"freshness" text,
	"source_stats" jsonb NOT NULL,
	"content_commitment" text,
	"privacy_boundary" text,
	"sensitivity" text,
	"covered_questions" text[],
	"source_types" text[] DEFAULT '{}' NOT NULL,
	"version" text NOT NULL,
	"is_current" boolean DEFAULT true NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "module_topics" (
	"module_id" uuid NOT NULL,
	"topic_id" uuid NOT NULL,
	CONSTRAINT "module_topics_module_id_topic_id_pk" PRIMARY KEY("module_id","topic_id")
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"href" text,
	"read" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "privacy_scans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"submission_id" uuid NOT NULL,
	"overall_status" text NOT NULL,
	"findings" jsonb NOT NULL,
	"sensitivity_declaration" text,
	"scanner_version" text,
	"scanned_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reporter_id" uuid NOT NULL,
	"target_type" text NOT NULL,
	"target_id" uuid NOT NULL,
	"reason" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "review_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kind" text NOT NULL,
	"submission_id" uuid,
	"report_id" uuid,
	"gate" text,
	"risk_level" text,
	"risk_summary" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"assignee_id" uuid,
	"resolution" text,
	"reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "social_signals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"actor_id" uuid NOT NULL,
	"kind" text NOT NULL,
	"target_type" text NOT NULL,
	"target_id" uuid NOT NULL,
	"text" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "favorite_uniq" UNIQUE("actor_id","kind","target_type","target_id")
);
--> statement-breakpoint
CREATE TABLE "submissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"module_id" uuid,
	"manifest_id" uuid,
	"submitter_id" uuid NOT NULL,
	"status" text DEFAULT 'Draft' NOT NULL,
	"step" integer,
	"manifest_hash_at_scan" text,
	"draft_data" jsonb,
	"submitted_at" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "topics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"label" text NOT NULL,
	CONSTRAINT "topics_label_unique" UNIQUE("label")
);
--> statement-breakpoint
CREATE TABLE "trust_profiles" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"score" integer DEFAULT 0 NOT NULL,
	"level" text DEFAULT 'new' NOT NULL,
	"breakdown" jsonb NOT NULL,
	"trend" jsonb,
	"recomputed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "usage_stats" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"metric_key" text NOT NULL,
	"value" numeric NOT NULL,
	"window" text,
	"captured_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"github_id" text NOT NULL,
	"login" text NOT NULL,
	"display_name" text NOT NULL,
	"avatar_url" text NOT NULL,
	"github_verified" boolean DEFAULT false NOT NULL,
	"is_admin" boolean DEFAULT false NOT NULL,
	"bio" text,
	"domains" text[] DEFAULT '{}' NOT NULL,
	"restriction_state" text DEFAULT 'normal' NOT NULL,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_github_id_unique" UNIQUE("github_id"),
	CONSTRAINT "users_login_unique" UNIQUE("login")
);
--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "badges" ADD CONSTRAINT "badges_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consents" ADD CONSTRAINT "consents_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contact_disclosures" ADD CONSTRAINT "contact_disclosures_exchange_id_exchanges_id_fk" FOREIGN KEY ("exchange_id") REFERENCES "public"."exchanges"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contact_disclosures" ADD CONSTRAINT "contact_disclosures_discloser_id_users_id_fk" FOREIGN KEY ("discloser_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contact_disclosures" ADD CONSTRAINT "contact_disclosures_recipient_id_users_id_fk" FOREIGN KEY ("recipient_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contact_info" ADD CONSTRAINT "contact_info_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exchanges" ADD CONSTRAINT "exchanges_requester_id_users_id_fk" FOREIGN KEY ("requester_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exchanges" ADD CONSTRAINT "exchanges_target_module_id_knowledge_modules_id_fk" FOREIGN KEY ("target_module_id") REFERENCES "public"."knowledge_modules"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exchanges" ADD CONSTRAINT "exchanges_offered_module_id_knowledge_modules_id_fk" FOREIGN KEY ("offered_module_id") REFERENCES "public"."knowledge_modules"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feedback" ADD CONSTRAINT "feedback_exchange_id_exchanges_id_fk" FOREIGN KEY ("exchange_id") REFERENCES "public"."exchanges"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feedback" ADD CONSTRAINT "feedback_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge_modules" ADD CONSTRAINT "knowledge_modules_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "manifests" ADD CONSTRAINT "manifests_module_id_knowledge_modules_id_fk" FOREIGN KEY ("module_id") REFERENCES "public"."knowledge_modules"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "module_topics" ADD CONSTRAINT "module_topics_module_id_knowledge_modules_id_fk" FOREIGN KEY ("module_id") REFERENCES "public"."knowledge_modules"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "module_topics" ADD CONSTRAINT "module_topics_topic_id_topics_id_fk" FOREIGN KEY ("topic_id") REFERENCES "public"."topics"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "privacy_scans" ADD CONSTRAINT "privacy_scans_submission_id_submissions_id_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."submissions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_reporter_id_users_id_fk" FOREIGN KEY ("reporter_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_items" ADD CONSTRAINT "review_items_submission_id_submissions_id_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."submissions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_items" ADD CONSTRAINT "review_items_report_id_reports_id_fk" FOREIGN KEY ("report_id") REFERENCES "public"."reports"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_items" ADD CONSTRAINT "review_items_assignee_id_users_id_fk" FOREIGN KEY ("assignee_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "social_signals" ADD CONSTRAINT "social_signals_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_module_id_knowledge_modules_id_fk" FOREIGN KEY ("module_id") REFERENCES "public"."knowledge_modules"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_manifest_id_manifests_id_fk" FOREIGN KEY ("manifest_id") REFERENCES "public"."manifests"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_submitter_id_users_id_fk" FOREIGN KEY ("submitter_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trust_profiles" ADD CONSTRAINT "trust_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "audit_created_idx" ON "audit_log" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "consent_user_action_idx" ON "consents" USING btree ("user_id","action_type");--> statement-breakpoint
CREATE INDEX "disc_exchange_idx" ON "contact_disclosures" USING btree ("exchange_id");--> statement-breakpoint
CREATE INDEX "contact_info_user_idx" ON "contact_info" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "ex_requester_idx" ON "exchanges" USING btree ("requester_id");--> statement-breakpoint
CREATE INDEX "ex_target_idx" ON "exchanges" USING btree ("target_module_id");--> statement-breakpoint
CREATE INDEX "ex_status_idx" ON "exchanges" USING btree ("status");--> statement-breakpoint
CREATE INDEX "km_owner_idx" ON "knowledge_modules" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "km_status_idx" ON "knowledge_modules" USING btree ("status");--> statement-breakpoint
CREATE INDEX "manifest_module_idx" ON "manifests" USING btree ("module_id");--> statement-breakpoint
CREATE INDEX "notif_user_read_idx" ON "notifications" USING btree ("user_id","read");--> statement-breakpoint
CREATE INDEX "scan_submission_idx" ON "privacy_scans" USING btree ("submission_id");--> statement-breakpoint
CREATE INDEX "ri_status_idx" ON "review_items" USING btree ("status");--> statement-breakpoint
CREATE INDEX "sub_submitter_idx" ON "submissions" USING btree ("submitter_id");--> statement-breakpoint
CREATE INDEX "usage_key_time_idx" ON "usage_stats" USING btree ("metric_key","captured_at");--> statement-breakpoint
CREATE INDEX "users_login_idx" ON "users" USING btree ("login");