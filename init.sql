-- init.sql

CREATE TABLE rg_payments_to_contract (
  id SERIAL PRIMARY KEY, -- Auto-incrementing integer for ID
  payer VARCHAR(255) NOT NULL, -- Payer's address or name (adjust max length as needed)
  amount numeric NOT NULL, -- Amount paid
  payment_id VARCHAR(255) NOT NULL UNIQUE, -- Unique identifier for the payment
  payment_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP -- Payment timestamp with default to current time
);

CREATE TABLE rg_balances (
  id SERIAL PRIMARY KEY, -- Auto-incrementing integer for ID
  creditor VARCHAR(255) NOT NULL, 
  amount numeric NOT NULL, -- credit Amount 
  update_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
--- insert into rg_balances (creditor, amount) values ('0x90F79bf6EB2c4f870365E785982E1f101E93b906', 9876789111222333);
--- insert into rg_balances (creditor, amount) values ('0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65', 10000000600902709);
--- insert into rg_balances (creditor, amount) values ('0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65', 8159);


CREATE TABLE rg_detailed_credits (
  id SERIAL PRIMARY KEY,  -- Auto-incrementing integer for ID
  serial_number NUMERIC,
  creditor VARCHAR(255) NOT NULL,
  record_line TEXT,
  internal_uniq_key TEXT,
  handler_hash TEXT,
  amount NUMERIC,
  CONSTRAINT unique_credit_details UNIQUE (internal_uniq_key)
);

CREATE TABLE rg_detailed_credits_obfuscated (
  id SERIAL PRIMARY KEY,  -- Auto-incrementing integer for ID
  serial_number NUMERIC,
  creditor VARCHAR(255) NOT NULL,
  obf_record_line TEXT,
  internal_uniq_key TEXT,
  handler_hash TEXT,
  amount NUMERIC,
  proofs TEXT,
  CONSTRAINT unique_handler_hash UNIQUE (internal_uniq_key)
);

CREATE TABLE rg_detailed_credits_obfuscated_profile (
  id SERIAL PRIMARY KEY,  -- Auto-incrementing integer for ID
  serial_number NUMERIC,
  root_hash VARCHAR(255) NOT NULL,
  records_str TEXT,
  create_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unique_ser_hash UNIQUE (serial_number)
);

