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
  update_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unique_creditor_bal UNIQUE (creditor)
);
--- insert into rg_balances (creditor, amount) values ('0x90F79bf6EB2c4f870365E785982E1f101E93b906', 9876789111222333);
--- insert into rg_balances (creditor, amount) values ('0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65', 10000000600902709);
--- insert into rg_balances (creditor, amount) values ('0x90F79bf6EB2c4f870365E785982E1f101E93b906', 8159);
--- insert into rg_balances (creditor, amount) values ('0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65', 253);
--- insert into rg_balances (creditor, amount) values ('0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266', 9748253);

CREATE TABLE rg_detailed_credits (
  id SERIAL PRIMARY KEY,  -- Auto-incrementing integer for ID
  serial_number NUMERIC,
  creditor VARCHAR(255) NOT NULL,
  clear_record TEXT,
  internal_uniq_key TEXT,
  handler_hash TEXT,
  amount NUMERIC,
  CONSTRAINT unique_credit_details UNIQUE (internal_uniq_key)
);

CREATE TABLE rg_detailed_credits_obfuscated (
  id SERIAL PRIMARY KEY,  -- Auto-incrementing integer for ID
  serial_number NUMERIC,
  creditor VARCHAR(255) NOT NULL,
  obf_record TEXT,
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

-- for internal money transfer logs
CREATE TABLE rg_transaction_log (
  id SERIAL PRIMARY KEY, -- Auto-incrementing integer for ID
  creditor VARCHAR(255) NOT NULL, 
  recipient VARCHAR(255) NOT NULL, 
  amount numeric NOT NULL, -- credit Amount 
  request TEXT NOT NULL, 
  request_signature TEXT NOT NULL, 
  insert_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

/** 
select * from rg_balances;
select * from rg_detailed_credits order by creditor, amount DESC;
select * from rg_detailed_credits_obfuscated order by creditor, amount DESC;
select * from rg_detailed_credits_obfuscated_profile order by id;

SELECT *, CONCAT(clr.clear_record, '+', obf.proofs) AS withdraw_proof
FROM rg_detailed_credits clr 
JOIN rg_detailed_credits_obfuscated obf 
ON clr.internal_uniq_key = obf.internal_uniq_key 
ORDER BY clr.serial_number DESC, clr.creditor, clr.amount DESC
LIMIT 2;

SELECT clr.serial_number, clr.id, 
clr.clear_record, clr.amount, 
obf.obf_record,
CONCAT(clr.clear_record, '+', obf.proofs) AS withdraw_proof
FROM rg_detailed_credits clr 
JOIN rg_detailed_credits_obfuscated obf 
ON clr.internal_uniq_key = obf.internal_uniq_key 
ORDER BY clr.id DESC, clr.creditor, clr.amount DESC
LIMIT 5;


DELETE FROM rg_balances;

DELETE FROM rg_detailed_credits;
DELETE FROM rg_detailed_credits_obfuscated;
DELETE FROM rg_detailed_credits_obfuscated_profile;

1      ->          0.000000000000000001
10      ->          0.00000000000000001
100      ->          0.0000000000000001
1000      ->          0.000000000000001
10000      ->          0.00000000000001
100000      ->          0.0000000000001
1000000      ->          0.000000000001
10000000      ->          0.00000000001
100000000      ->          0.0000000001
1000000000      ->          0.000000001
10000000000      ->          0.00000001
100000000000      ->          0.0000001
1000000000000      ->          0.000001
10000000000000      ->          0.00001
100000000000000      ->          0.0001
1000000000000000      ->          0.001
10000000000000000      ->          0.01
100000000000000000      ->          0.1
1000000000000000000      ->         1.0
10000000000000000000      ->       10
100000000000000000000      ->     100
1000000000000000000000      ->   1000
10000000000000000000000      -> 10000


TODO:

*/