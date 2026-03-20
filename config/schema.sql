-- ============================================================
-- BANTAYAN FERRY DATABASE SCHEMA
-- ============================================================
CREATE DATABASE IF NOT EXISTS bantayan_ferry;
USE bantayan_ferry;

CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(150) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  contact_number VARCHAR(20),
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE admins (
  id INT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(150) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('superadmin','admin') DEFAULT 'admin',
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE shipping_lines (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  is_active TINYINT(1) DEFAULT 1
);

CREATE TABLE routes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  origin VARCHAR(100) NOT NULL,
  destination VARCHAR(100) NOT NULL,
  distance_km DECIMAL(6,2),
  is_active TINYINT(1) DEFAULT 1
);

CREATE TABLE ships (
  id INT AUTO_INCREMENT PRIMARY KEY,
  shipping_line_id INT NOT NULL,
  ship_name VARCHAR(100) NOT NULL,
  capacity INT DEFAULT 0,
  is_active TINYINT(1) DEFAULT 1,
  FOREIGN KEY (shipping_line_id) REFERENCES shipping_lines(id) ON DELETE CASCADE
);

CREATE TABLE schedules (
  id INT AUTO_INCREMENT PRIMARY KEY,
  shipping_line_id INT NOT NULL,
  ship_id INT NOT NULL,
  route_id INT NOT NULL,
  departure_time TIME NOT NULL,
  arrival_time TIME NOT NULL,
  days_of_week VARCHAR(50) DEFAULT 'Daily',
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (shipping_line_id) REFERENCES shipping_lines(id),
  FOREIGN KEY (ship_id) REFERENCES ships(id),
  FOREIGN KEY (route_id) REFERENCES routes(id)
);

CREATE TABLE fares (
  id INT AUTO_INCREMENT PRIMARY KEY,
  shipping_line_id INT NOT NULL,
  route_id INT NOT NULL,
  passenger_type ENUM('regular','student','senior','pwd','child') NOT NULL,
  fare_amount DECIMAL(10,2) NOT NULL,
  FOREIGN KEY (shipping_line_id) REFERENCES shipping_lines(id),
  FOREIGN KEY (route_id) REFERENCES routes(id)
);

CREATE TABLE cargo_rates (
  id INT AUTO_INCREMENT PRIMARY KEY,
  shipping_line_id INT NOT NULL,
  cargo_type ENUM('motorcycle','car','truck','others') NOT NULL,
  rate_amount DECIMAL(10,2) NOT NULL,
  FOREIGN KEY (shipping_line_id) REFERENCES shipping_lines(id)
);

CREATE TABLE bookings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  booking_code VARCHAR(20) UNIQUE NOT NULL,
  user_id INT NOT NULL,
  schedule_id INT NOT NULL,
  travel_date DATE NOT NULL,
  full_name VARCHAR(150) NOT NULL,
  contact_number VARCHAR(20),
  passenger_type ENUM('regular','student','senior','pwd','child') DEFAULT 'regular',
  total_fare DECIMAL(10,2) NOT NULL,
  payment_method VARCHAR(50) DEFAULT 'Cash on Port',
  status ENUM('pending','verified','cancelled') DEFAULT 'pending',
  qr_code TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (schedule_id) REFERENCES schedules(id)
);

-- SEED DATA
INSERT INTO shipping_lines (name, description) VALUES
('Island Shipping','Serving Hagnaya to Santa Fe route'),
('Super Shuttle Ferry','Fast ferry service to Bantayan Island'),
('Aznar Shipping','Reliable cargo and passenger ferry');

INSERT INTO routes (origin, destination) VALUES
('Hagnaya','Santa Fe'),
('Santa Fe','Hagnaya');

INSERT INTO ships (shipping_line_id, ship_name, capacity) VALUES
(1,'MV Island Princess',250),(1,'MV Island Queen',300),
(2,'MV Super Shuttle 1',200),(2,'MV Super Shuttle 2',200),
(3,'MV Aznar Star',350),(3,'MV Aznar Express',400);

INSERT INTO schedules (shipping_line_id, ship_id, route_id, departure_time, arrival_time, days_of_week) VALUES
(1,1,1,'06:00:00','07:30:00','Daily'),(1,2,1,'10:00:00','11:30:00','Daily'),
(1,1,2,'08:00:00','09:30:00','Daily'),(2,3,1,'07:00:00','08:00:00','Daily'),
(2,4,1,'13:00:00','14:00:00','Daily'),(2,3,2,'09:00:00','10:00:00','Daily'),
(3,5,1,'05:00:00','07:00:00','Daily'),(3,6,2,'12:00:00','14:00:00','Daily');

INSERT INTO fares (shipping_line_id, route_id, passenger_type, fare_amount) VALUES
(1,1,'regular',185),(1,1,'student',160),(1,1,'senior',140),(1,1,'pwd',140),(1,1,'child',95),
(1,2,'regular',185),(1,2,'student',160),(1,2,'senior',140),(1,2,'pwd',140),(1,2,'child',95),
(2,1,'regular',200),(2,1,'student',175),(2,1,'senior',150),(2,1,'pwd',150),(2,1,'child',100),
(2,2,'regular',200),(2,2,'student',175),(2,2,'senior',150),(2,2,'pwd',150),(2,2,'child',100),
(3,1,'regular',170),(3,1,'student',145),(3,1,'senior',130),(3,1,'pwd',130),(3,1,'child',85),
(3,2,'regular',170),(3,2,'student',145),(3,2,'senior',130),(3,2,'pwd',130),(3,2,'child',85);

INSERT INTO cargo_rates (shipping_line_id, cargo_type, rate_amount) VALUES
(1,'motorcycle',350),(1,'car',1200),(1,'truck',3500),(1,'others',500),
(2,'motorcycle',400),(2,'car',1400),(2,'truck',4000),(2,'others',600),
(3,'motorcycle',300),(3,'car',1000),(3,'truck',3000),(3,'others',450);
