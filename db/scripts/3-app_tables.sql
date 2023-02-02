CREATE TABLE budgets (
	id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
	name VARCHAR ( 50 ) NOT NULL UNIQUE,
	created_on TIMESTAMP NOT NULL DEFAULT NOW(),
	created_sub VARCHAR ( 50 ),
	updated_on TIMESTAMP,
	updated_sub VARCHAR ( 50 ),
	enabled BOOLEAN NOT NULL DEFAULT true
);

INSERT INTO
	budgets (name)
VALUES
  ('$500 - $1,000'),
  ('$1,000 - $10,000'),
  ('$10,000 - $100,000');

CREATE TABLE timelines (
	id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
	name VARCHAR ( 50 ) NOT NULL UNIQUE,
	created_on TIMESTAMP NOT NULL DEFAULT NOW(),
	created_sub VARCHAR ( 50 ),
	updated_on TIMESTAMP,
	updated_sub VARCHAR ( 50 ),
	enabled BOOLEAN NOT NULL DEFAULT true
);

INSERT INTO
	timelines (name)
VALUES
  ('1 month'),
  ('6 months'),
  ('1 year');

CREATE TABLE services (
	id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
	name VARCHAR ( 50 ) NOT NULL UNIQUE,
	cost INTEGER NOT NULL,
	created_on TIMESTAMP NOT NULL DEFAULT NOW(),
	created_sub VARCHAR ( 50 ),
	updated_on TIMESTAMP,
	updated_sub VARCHAR ( 50 ),
	enabled BOOLEAN NOT NULL DEFAULT true
);

INSERT INTO
	services (name, cost)
VALUES
  ('Architecture', 200),
  ('Development', 200),
  ('Consulting/Tutoring', 100);

CREATE TABLE schedule_contexts (
	id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
	name VARCHAR ( 50 ) NOT NULL UNIQUE,
	created_on TIMESTAMP NOT NULL DEFAULT NOW(),
	created_sub VARCHAR ( 50 ),
	updated_on TIMESTAMP,
	updated_sub VARCHAR ( 50 ),
	enabled BOOLEAN NOT NULL DEFAULT true
);

INSERT INTO
	schedule_contexts (name)
VALUES
  ('seconds'),
  ('minutes'),
  ('hours'),
  ('days'),
  ('weeks'),
  ('months'),
  ('years');

CREATE TABLE service_addons (
	id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
	name VARCHAR ( 50 ) NOT NULL UNIQUE,
	created_on TIMESTAMP NOT NULL DEFAULT NOW(),
	created_sub VARCHAR ( 50 ),
	updated_on TIMESTAMP,
	updated_sub VARCHAR ( 50 ),
	enabled BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE service_tiers (
	id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
	name VARCHAR ( 500 ) NOT NULL,
	service_id uuid NOT NULL REFERENCES services (id) ON DELETE CASCADE,
	multiplier DECIMAL NOT NULL,
	created_on TIMESTAMP NOT NULL DEFAULT NOW(),
	created_sub VARCHAR ( 50 ),
	updated_on TIMESTAMP,
	updated_sub VARCHAR ( 50 ),
	enabled BOOLEAN NOT NULL DEFAULT true,
	UNIQUE (name, service_id)
);

CREATE TABLE service_tier_addons (
	service_tier_id uuid NOT NULL REFERENCES service_tiers (id) ON DELETE CASCADE,
	service_addon_id uuid NOT NULL REFERENCES service_addons (id) ON DELETE CASCADE,
	created_on TIMESTAMP NOT NULL DEFAULT NOW(),
	created_sub VARCHAR ( 50 ),
	updated_on TIMESTAMP,
	updated_sub VARCHAR ( 50 ),
	enabled BOOLEAN NOT NULL DEFAULT true,
	UNIQUE (service_tier_id, service_addon_id)
);

CREATE TABLE contacts (
	id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
	name VARCHAR ( 250 ),
	email VARCHAR ( 250 ),
	phone VARCHAR ( 20 ),
	created_on TIMESTAMP NOT NULL DEFAULT NOW(),
	created_sub VARCHAR ( 50 ),
	updated_on TIMESTAMP,
	updated_sub VARCHAR ( 50 ),
	enabled BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE schedules (
	id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
	name VARCHAR ( 50 ),
  overbook BOOLEAN NOT NULL DEFAULT false,
	created_on TIMESTAMP NOT NULL DEFAULT NOW(),
	created_sub VARCHAR ( 50 ),
	updated_on TIMESTAMP,
	updated_sub VARCHAR ( 50 ),
	enabled BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE schedule_terms (
	id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
	schedule_id uuid NOT NULL REFERENCES schedules (id) ON DELETE CASCADE,
	schedule_context_id uuid NOT NULL REFERENCES schedule_contexts (id) ON DELETE CASCADE,
  duration INTEGER NOT NULL,
	created_on TIMESTAMP NOT NULL DEFAULT NOW(),
	created_sub VARCHAR ( 50 ),
	updated_on TIMESTAMP,
	updated_sub VARCHAR ( 50 ),
	enabled BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE schedule_brackets (
	id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
	schedule_id uuid NOT NULL REFERENCES schedules (id) ON DELETE CASCADE,
	schedule_context_id uuid NOT NULL REFERENCES schedule_contexts (id) ON DELETE CASCADE,
  bracket INTEGER NOT NULL,
  multiplier DECIMAL NOT NULL,
	created_on TIMESTAMP NOT NULL DEFAULT NOW(),
	created_sub VARCHAR ( 50 ),
	updated_on TIMESTAMP,
	updated_sub VARCHAR ( 50 ),
	enabled BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE schedule_services (
	schedule_id uuid NOT NULL REFERENCES schedules (id) ON DELETE CASCADE,
	service_id uuid NOT NULL REFERENCES services (id) ON DELETE CASCADE,
	created_on TIMESTAMP NOT NULL DEFAULT NOW(),
	created_sub VARCHAR ( 50 ),
	updated_on TIMESTAMP,
	updated_sub VARCHAR ( 50 ),
	enabled BOOLEAN NOT NULL DEFAULT true,
	UNIQUE (schedule_id, service_id)
);

CREATE TABLE quotes (
	id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
	name VARCHAR ( 250 ) NOT NULL,
  description VARCHAR ( 5000 ) NOT NULL,
	budget_id uuid NOT NULL REFERENCES budgets (id) ON DELETE CASCADE,
	timeline_id uuid NOT NULL REFERENCES timelines (id) ON DELETE CASCADE,
	service_tier_id uuid NOT NULL REFERENCES service_tiers (id) ON DELETE CASCADE,
	desired_duration INTEGER NOT NULL,
	contact_id uuid NOT NULL REFERENCES contacts (id) ON DELETE CASCADE,
  respond_by TIMESTAMP NOT NULL,
	created_on TIMESTAMP NOT NULL DEFAULT NOW(),
	created_sub VARCHAR ( 50 ),
	updated_on TIMESTAMP,
	updated_sub VARCHAR ( 50 ),
	enabled BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE payments (
	id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
	contact_id uuid NOT NULL REFERENCES contacts (id) ON DELETE CASCADE,
  details jsonb NOT NULL,
	created_on TIMESTAMP NOT NULL DEFAULT NOW(),
	created_sub VARCHAR ( 50 ),
	updated_on TIMESTAMP,
	updated_sub VARCHAR ( 50 ),
	enabled BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE bookings (
	id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
	service_tier_id uuid NOT NULL REFERENCES service_tiers (id) ON DELETE CASCADE,
	contact_id uuid NOT NULL REFERENCES contacts (id) ON DELETE CASCADE,
	payment_id uuid NOT NULL REFERENCES payments (id) ON DELETE CASCADE,
  agreement BOOLEAN NOT NULL,
  description VARCHAR ( 5000 ) NOT NULL,
	created_on TIMESTAMP NOT NULL DEFAULT NOW(),
	created_sub VARCHAR ( 50 ),
	updated_on TIMESTAMP,
	updated_sub VARCHAR ( 50 ),
	enabled BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE booking_schedule_brackets (
	id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
	booking_id uuid NOT NULL REFERENCES bookings (id) ON DELETE CASCADE,
	schedule_bracket_id uuid NOT NULL REFERENCES schedule_brackets (id) ON DELETE CASCADE,
	duration INTEGER NOT NULL,
	created_on TIMESTAMP NOT NULL DEFAULT NOW(),
	created_sub VARCHAR ( 50 ),
	updated_on TIMESTAMP,
	updated_sub VARCHAR ( 50 ),
	enabled BOOLEAN NOT NULL DEFAULT true,
	UNIQUE (booking_id, schedule_bracket_id)
);





