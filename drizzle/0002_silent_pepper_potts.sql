CREATE TABLE "transcription_session" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"provider" text NOT NULL,
	"duration_ms" integer NOT NULL,
	"cost_usd" numeric(10, 6) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_api_key" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"provider" text NOT NULL,
	"encrypted_api_key" text NOT NULL,
	"key_hint" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_api_key_user_provider_unique" UNIQUE("user_id","provider")
);
--> statement-breakpoint
ALTER TABLE "transcription_session" ADD CONSTRAINT "transcription_session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_api_key" ADD CONSTRAINT "user_api_key_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "transcription_session_user_id_idx" ON "transcription_session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "transcription_session_created_at_idx" ON "transcription_session" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "transcription_session_user_provider_idx" ON "transcription_session" USING btree ("user_id","provider");--> statement-breakpoint
CREATE INDEX "user_api_key_user_id_idx" ON "user_api_key" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_api_key_user_provider_idx" ON "user_api_key" USING btree ("user_id","provider");