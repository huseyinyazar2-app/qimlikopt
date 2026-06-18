CREATE TABLE IF NOT EXISTS clients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_name VARCHAR(255) NOT NULL,
    prefix VARCHAR(50) UNIQUE NOT NULL, -- e.g., 'QMLK', 'AKTAS'
    webhook_url VARCHAR(500) NOT NULL,
    api_key VARCHAR(255) UNIQUE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id INTEGER REFERENCES clients(id),
    phone_number VARCHAR(50) NOT NULL,
    message_body TEXT,
    status VARCHAR(50) NOT NULL, -- 'success', 'failed_to_send_webhook', 'invalid_prefix'
    error_details TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE IF NOT EXISTS gateway_devices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    device_id VARCHAR(100) UNIQUE NOT NULL,
    device_name VARCHAR(255),
    battery_level INTEGER,
    network_status VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS global_settings (
    key VARCHAR(100) PRIMARY KEY,
    value TEXT NOT NULL,
    description TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Default settings
INSERT INTO global_settings (key, value, description)
VALUES 
('MAINTENANCE_MODE', 'false', 'If true, system halts webhook processing'),
('GLOBAL_RATE_LIMIT', '100', 'Max requests per minute globally')
ON CONFLICT (key) DO NOTHING;
