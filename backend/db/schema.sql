CREATE TABLE IF NOT EXISTS clients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_name VARCHAR(255) NOT NULL,
    prefix VARCHAR(50) UNIQUE NOT NULL, -- e.g., 'QMLK', 'AKTAS'
    webhook_url VARCHAR(500) NOT NULL,
    api_key VARCHAR(255) NOT NULL,
    phone_number VARCHAR(50),
    contact_name VARCHAR(100),
    contact_surname VARCHAR(100),
    hourly_wage REAL DEFAULT 0,
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
    hourly_wage REAL DEFAULT 0,
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

-- Sunucu tarafinda uretilen tek kullanimlik OTP kodlari.
-- module + purpose izolasyonu login/delivery kodlarini ve modulleri ayirir.
-- used=1 ile tek kullanimlik olur.
CREATE TABLE IF NOT EXISTS otp_codes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    module VARCHAR(20) NOT NULL,
    purpose VARCHAR(20) NOT NULL,     -- 'login' | 'delivery'
    phone_number VARCHAR(50) NOT NULL,
    code VARCHAR(10) NOT NULL,
    package_id INTEGER,               -- delivery için ilgili paket
    used BOOLEAN DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_otp_lookup ON otp_codes (module, purpose, code, used);

-- Default settings
INSERT INTO global_settings (key, value, description)
VALUES 
('MAINTENANCE_MODE', 'false', 'If true, system halts webhook processing'),
('GLOBAL_RATE_LIMIT', '100', 'Max requests per minute globally'),
('ADMIN_USERNAME', 'admin', 'SuperAdmin Panel Kullanıcı Adı'),
('ADMIN_PASSWORD', 'admin123', 'SuperAdmin Panel Şifresi')
ON CONFLICT (key) DO NOTHING;


-- --- DIJITAL.QIMLIK.COM TABLES ---
CREATE TABLE IF NOT EXISTS dijital_companies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_name VARCHAR(255) NOT NULL,
    contact_name VARCHAR(100),
    contact_surname VARCHAR(100),
    phone_number VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    hourly_wage REAL DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS dijital_technicians (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id INTEGER REFERENCES dijital_companies(id),
    name VARCHAR(100) NOT NULL,
    surname VARCHAR(100) NOT NULL,
    phone_number VARCHAR(50) NOT NULL,
    hourly_wage REAL DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS dijital_forms (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id INTEGER REFERENCES dijital_companies(id),
    title VARCHAR(255) NOT NULL,
    fields_json TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS dijital_machines (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id INTEGER REFERENCES dijital_companies(id),
    machine_code VARCHAR(100) UNIQUE NOT NULL,
    machine_name VARCHAR(255) NOT NULL,
    model VARCHAR(255),
    serial_number VARCHAR(100),
    location VARCHAR(255),
    gps_latitude REAL,
    gps_longitude REAL,
    require_location_match BOOLEAN DEFAULT 0,
    allowed_radius INTEGER DEFAULT 50,
    maintenance_interval_days INTEGER,
    last_maintenance_date TIMESTAMP,
    form_template_id INTEGER REFERENCES dijital_forms(id),
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS dijital_maintenance_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    machine_id INTEGER REFERENCES dijital_machines(id),
    technician_id INTEGER REFERENCES dijital_technicians(id),
    form_data_json TEXT NOT NULL,
    status_after VARCHAR(50) NOT NULL,
    notes TEXT,
    photo_base64 TEXT,
    technician_latitude REAL,
    technician_longitude REAL,
    calculated_distance REAL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);



CREATE TABLE IF NOT EXISTS dijital_incidents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    machine_id INTEGER REFERENCES dijital_machines(id),
    reporter_name VARCHAR(255) NOT NULL,
    reporter_phone VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS dijital_spare_parts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id INTEGER REFERENCES dijital_companies(id),
    part_name VARCHAR(255) NOT NULL,
    stock_quantity INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS dijital_maintenance_parts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    log_id INTEGER REFERENCES dijital_maintenance_logs(id),
    part_id INTEGER REFERENCES dijital_spare_parts(id),
    quantity_used INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- --- MESAİ.QIMLIK.COM TABLES ---
CREATE TABLE IF NOT EXISTS mesai_companies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_name VARCHAR(255) NOT NULL,
    contact_name VARCHAR(100),
    contact_surname VARCHAR(100),
    phone_number VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    hourly_wage REAL DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    shift_type VARCHAR(50) DEFAULT 'company_wide',
    shift_start_time VARCHAR(10) DEFAULT '09:00',
    shift_end_time VARCHAR(10) DEFAULT '18:00',
    tolerance_minutes INTEGER DEFAULT 15,
    deduct_break_time BOOLEAN DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS mesai_employees (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id INTEGER REFERENCES mesai_companies(id),
    name VARCHAR(100) NOT NULL,
    surname VARCHAR(100) NOT NULL,
    phone_number VARCHAR(50) NOT NULL,
    photo_base64 TEXT, -- Storing compressed base64 profile photo
    hourly_wage REAL DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS mesai_locations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id INTEGER REFERENCES mesai_companies(id),
    location_name VARCHAR(255) NOT NULL,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    allowed_radius INTEGER DEFAULT 50,
    maintenance_interval_days INTEGER,
    last_maintenance_date TIMESTAMP, -- in meters
    shift_start_time VARCHAR(10) DEFAULT '09:00',
    shift_end_time VARCHAR(10) DEFAULT '18:00',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS mesai_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id INTEGER REFERENCES mesai_employees(id),
    location_id INTEGER REFERENCES mesai_locations(id),
    log_type VARCHAR(20) NOT NULL, -- 'check_in', 'check_out'
    gps_latitude REAL NOT NULL,
    gps_longitude REAL NOT NULL,
    calculated_distance REAL NOT NULL, -- in meters
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);



CREATE TABLE IF NOT EXISTS mesai_leaves (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id INTEGER REFERENCES mesai_employees(id),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    leave_type VARCHAR(50) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- --- TESLİMAT.QIMLIK.COM TABLES ---
CREATE TABLE IF NOT EXISTS teslimat_companies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_name VARCHAR(255) NOT NULL,
    contact_name VARCHAR(100),
    contact_surname VARCHAR(100),
    phone_number VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    hourly_wage REAL DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS teslimat_couriers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id INTEGER REFERENCES teslimat_companies(id),
    name VARCHAR(100) NOT NULL,
    surname VARCHAR(100) NOT NULL,
    phone_number VARCHAR(50) NOT NULL,
    hourly_wage REAL DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS teslimat_packages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id INTEGER REFERENCES teslimat_companies(id),
    package_code VARCHAR(100) UNIQUE NOT NULL,
    recipient_name VARCHAR(255) NOT NULL,
    recipient_phone VARCHAR(50) NOT NULL,
    delivery_address TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'created', -- 'created', 'in_transit', 'delivered', 'failed'
    courier_id INTEGER REFERENCES teslimat_couriers(id),
    return_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS teslimat_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    package_id INTEGER REFERENCES teslimat_packages(id),
    log_type VARCHAR(50) NOT NULL, -- 'picked_up', 'delivered_success', 'delivery_failed'
    gps_latitude REAL NOT NULL,
    gps_longitude REAL NOT NULL,
    recipient_signature_base64 TEXT, -- Drawing canvas base64 image
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


