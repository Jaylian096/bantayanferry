-- ============================================
-- BANTAYAN FERRY DATABASE SCHEMA
-- ============================================

CREATE DATABASE IF NOT EXISTS bantayan_ferry;
USE bantayan_ferry;

-- USERS TABLE
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  contact_number VARCHAR(20),
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ADMINS TABLE
CREATE TABLE IF NOT EXISTS admins (
  id INT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('superadmin', 'admin') DEFAULT 'admin',
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- SHIPPING LINES TABLE
CREATE TABLE IF NOT EXISTS shipping_lines (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ROUTES TABLE
CREATE TABLE IF NOT EXISTS routes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  origin VARCHAR(100) NOT NULL,
  destination VARCHAR(100) NOT NULL,
  distance_km DECIMAL(10,2),
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- SHIPS TABLE
CREATE TABLE IF NOT EXISTS ships (
  id INT AUTO_INCREMENT PRIMARY KEY,
  shipping_line_id INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  capacity INT NOT NULL,
  description TEXT,
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (shipping_line_id) REFERENCES shipping_lines(id) ON DELETE CASCADE
);

-- SCHEDULES TABLE
CREATE TABLE IF NOT EXISTS schedules (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ship_id INT NOT NULL,
  route_id INT NOT NULL,
  shipping_line_id INT NOT NULL,
  departure_time TIME NOT NULL,
  arrival_time TIME NOT NULL,
  available_days VARCHAR(50) DEFAULT 'daily',
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (ship_id) REFERENCES ships(id) ON DELETE CASCADE,
  FOREIGN KEY (route_id) REFERENCES routes(id) ON DELETE CASCADE,
  FOREIGN KEY (shipping_line_id) REFERENCES shipping_lines(id) ON DELETE CASCADE
);

-- FARES TABLE
CREATE TABLE IF NOT EXISTS fares (
  id INT AUTO_INCREMENT PRIMARY KEY,
  shipping_line_id INT NOT NULL,
  route_id INT NOT NULL,
  passenger_type ENUM('regular','student','senior_citizen','pwd','child') NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (shipping_line_id) REFERENCES shipping_lines(id) ON DELETE CASCADE,
  FOREIGN KEY (route_id) REFERENCES routes(id) ON DELETE CASCADE
);

-- CARGO RATES TABLE
CREATE TABLE IF NOT EXISTS cargo_rates (
  id INT AUTO_INCREMENT PRIMARY KEY,
  shipping_line_id INT NOT NULL,
  cargo_type ENUM('motorcycle','car','truck','others') NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (shipping_line_id) REFERENCES shipping_lines(id) ON DELETE CASCADE
);

-- BOOKINGS TABLE
CREATE TABLE IF NOT EXISTS bookings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  booking_code VARCHAR(20) UNIQUE NOT NULL,
  user_id INT NOT NULL,
  schedule_id INT NOT NULL,
  travel_date DATE NOT NULL,
  full_name VARCHAR(100) NOT NULL,
  contact_number VARCHAR(20) NOT NULL,
  passenger_type ENUM('regular','student','senior_citizen','pwd','child') NOT NULL,
  total_fare DECIMAL(10,2) NOT NULL,
  payment_method ENUM('cash_on_port') DEFAULT 'cash_on_port',
  status ENUM('pending','verified','cancelled') DEFAULT 'pending',
  qr_code TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (schedule_id) REFERENCES schedules(id) ON DELETE CASCADE
);

-- ============================================
-- SEED DATA
-- ============================================

-- Insert Shipping Lines
INSERT INTO shipping_lines (name, description) VALUES
('Island Shipping', 'Regular ferry service between Hagnaya and Santa Fe'),
('Super Shuttle Ferry', 'Fast ferry service with modern vessels'),
('Aznar Shipping', 'Reliable shipping line serving Bantayan Island');

-- Insert Routes
INSERT INTO routes (origin, destination, distance_km) VALUES
('Hagnaya', 'Santa Fe', 45.0),
('Santa Fe', 'Hagnaya', 45.0);

-- Insert Ships
INSERT INTO ships (shipping_line_id, name, capacity) VALUES
(1, 'MV Island Queen', 300),
(1, 'MV Island Star', 250),
(2, 'Super Shuttle 1', 200),
(2, 'Super Shuttle 2', 180),
(3, 'MV Aznar Pride', 350),
(3, 'MV Bantayan Express', 320);

-- Insert Schedules
INSERT INTO schedules (ship_id, route_id, shipping_line_id, departure_time, arrival_time, available_days) VALUES
(1, 1, 1, '05:00:00', '07:00:00', 'daily'),
(1, 1, 1, '08:00:00', '10:00:00', 'daily'),
(1, 1, 1, '11:00:00', '13:00:00', 'daily'),
(2, 2, 1, '14:00:00', '16:00:00', 'daily'),
(3, 1, 2, '06:00:00', '07:30:00', 'daily'),
(3, 1, 2, '10:00:00', '11:30:00', 'daily'),
(4, 2, 2, '13:00:00', '14:30:00', 'daily'),
(5, 1, 3, '07:00:00', '09:00:00', 'daily'),
(6, 2, 3, '12:00:00', '14:00:00', 'daily');

-- Insert Fares (per shipping line + route)
INSERT INTO fares (shipping_line_id, route_id, passenger_type, amount) VALUES
-- Island Shipping Route 1
(1, 1, 'regular', 185.00), (1, 1, 'student', 140.00), (1, 1, 'senior_citizen', 130.00), (1, 1, 'pwd', 130.00), (1, 1, 'child', 95.00),
-- Island Shipping Route 2
(1, 2, 'regular', 185.00), (1, 2, 'student', 140.00), (1, 2, 'senior_citizen', 130.00), (1, 2, 'pwd', 130.00), (1, 2, 'child', 95.00),
-- Super Shuttle Route 1
(2, 1, 'regular', 200.00), (2, 1, 'student', 155.00), (2, 1, 'senior_citizen', 145.00), (2, 1, 'pwd', 145.00), (2, 1, 'child', 105.00),
-- Super Shuttle Route 2
(2, 2, 'regular', 200.00), (2, 2, 'student', 155.00), (2, 2, 'senior_citizen', 145.00), (2, 2, 'pwd', 145.00), (2, 2, 'child', 105.00),
-- Aznar Shipping Route 1
(3, 1, 'regular', 175.00), (3, 1, 'student', 135.00), (3, 1, 'senior_citizen', 125.00), (3, 1, 'pwd', 125.00), (3, 1, 'child', 90.00),
-- Aznar Shipping Route 2
(3, 2, 'regular', 175.00), (3, 2, 'student', 135.00), (3, 2, 'senior_citizen', 125.00), (3, 2, 'pwd', 125.00), (3, 2, 'child', 90.00);

-- Insert Cargo Rates
INSERT INTO cargo_rates (shipping_line_id, cargo_type, amount) VALUES
(1, 'motorcycle', 250.00), (1, 'car', 800.00), (1, 'truck', 2000.00), (1, 'others', 150.00),
(2, 'motorcycle', 280.00), (2, 'car', 900.00), (2, 'truck', 2200.00), (2, 'others', 170.00),
(3, 'motorcycle', 230.00), (3, 'car', 750.00), (3, 'truck', 1900.00), (3, 'others', 140.00);

-- Insert default superadmin (password: admin123)
INSERT INTO admins (full_name, email, password, role) VALUES
('Super Admin', 'admin@bantayanferry.com', '$2a$10$y6TR80T/cVw2XNCDaHdDBeOELFUtSWuM9VpS9UK0Xzop5KQQoN/4K', 'superadmin');
