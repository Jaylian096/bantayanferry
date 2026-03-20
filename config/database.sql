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

CREATE TABLE IF NOT EXISTS shipping_lines (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS routes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  origin VARCHAR(100) NOT NULL,
  destination VARCHAR(100) NOT NULL,
  distance_km DECIMAL(8,2),
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ships (
  id INT AUTO_INCREMENT PRIMARY KEY,
  shipping_line_id INT NOT NULL,
  ship_name VARCHAR(100) NOT NULL,
  capacity INT NOT NULL DEFAULT 100,
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (shipping_line_id) REFERENCES shipping_lines(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS schedules (
  id INT AUTO_INCREMENT PRIMARY KEY,
  shipping_line_id INT NOT NULL,
  ship_id INT NOT NULL,
  route_id INT NOT NULL,
  departure_time TIME NOT NULL,
  arrival_time TIME NOT NULL,
  days_of_week VARCHAR(50) DEFAULT 'Mon,Tue,Wed,Thu,Fri,Sat,Sun',
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (shipping_line_id) REFERENCES shipping_lines(id),
  FOREIGN KEY (ship_id) REFERENCES ships(id),
  FOREIGN KEY (route_id) REFERENCES routes(id)
);

CREATE TABLE IF NOT EXISTS fares (
  id INT AUTO_INCREMENT PRIMARY KEY,
  shipping_line_id INT NOT NULL,
  route_id INT NOT NULL,
  passenger_type ENUM('regular','student','senior_citizen','pwd','child') NOT NULL,
  fare_amount DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (shipping_line_id) REFERENCES shipping_lines(id),
  FOREIGN KEY (route_id) REFERENCES routes(id),
  UNIQUE KEY unique_fare (shipping_line_id, route_id, passenger_type)
);

CREATE TABLE IF NOT EXISTS cargo_rates (
  id INT AUTO_INCREMENT PRIMARY KEY,
  shipping_line_id INT NOT NULL,
  cargo_type ENUM('motorcycle','car','truck','others') NOT NULL,
  rate_amount DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (shipping_line_id) REFERENCES shipping_lines(id),
  UNIQUE KEY unique_cargo (shipping_line_id, cargo_type)
);

CREATE TABLE IF NOT EXISTS bookings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  booking_reference VARCHAR(20) UNIQUE NOT NULL,
  user_id INT NOT NULL,
  schedule_id INT NOT NULL,
  travel_date DATE NOT NULL,
  full_name VARCHAR(100) NOT NULL,
  contact_number VARCHAR(20) NOT NULL,
  passenger_type ENUM('regular','student','senior_citizen','pwd','child') NOT NULL,
  fare_amount DECIMAL(10,2) NOT NULL,
  payment_method ENUM('cash_on_port') DEFAULT 'cash_on_port',
  status ENUM('pending','verified','cancelled') DEFAULT 'pending',
  qr_code TEXT,
  verified_at TIMESTAMP NULL,
  verified_by INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (schedule_id) REFERENCES schedules(id),
  FOREIGN KEY (verified_by) REFERENCES admins(id)
);

-- Seed Data
INSERT INTO shipping_lines (name, description) VALUES
('Island Shipping', 'Island Shipping Corporation - Bantayan Island'),
('Super Shuttle Ferry', 'Super Shuttle Ferry - Fast and reliable service'),
('Aznar Shipping', 'Aznar Shipping Lines - Affordable fares');

INSERT INTO routes (origin, destination) VALUES
('Hagnaya', 'Santa Fe'),
('Santa Fe', 'Hagnaya');

INSERT INTO ships (shipping_line_id, ship_name, capacity) VALUES
(1, 'MV Island Express', 200),(1, 'MV Bantayan Star', 180),
(2, 'MV Super Shuttle 1', 150),(2, 'MV Fast Ferry 2', 160),
(3, 'MV Aznar Pride', 170),(3, 'MV Cebu Aznar', 190);

INSERT INTO schedules (shipping_line_id, ship_id, route_id, departure_time, arrival_time) VALUES
(1,1,1,'05:00:00','06:30:00'),(1,1,2,'07:00:00','08:30:00'),
(1,2,1,'09:00:00','10:30:00'),(1,2,2,'11:00:00','12:30:00'),
(2,3,1,'06:00:00','07:30:00'),(2,3,2,'08:00:00','09:30:00'),
(2,4,1,'13:00:00','14:30:00'),(2,4,2,'15:00:00','16:30:00'),
(3,5,1,'07:30:00','09:00:00'),(3,5,2,'10:00:00','11:30:00'),
(3,6,1,'14:00:00','15:30:00'),(3,6,2,'16:00:00','17:30:00');

INSERT INTO fares (shipping_line_id, route_id, passenger_type, fare_amount) VALUES
(1,1,'regular',185.00),(1,1,'student',155.00),(1,1,'senior_citizen',148.00),(1,1,'pwd',148.00),(1,1,'child',100.00),
(1,2,'regular',185.00),(1,2,'student',155.00),(1,2,'senior_citizen',148.00),(1,2,'pwd',148.00),(1,2,'child',100.00),
(2,1,'regular',200.00),(2,1,'student',170.00),(2,1,'senior_citizen',160.00),(2,1,'pwd',160.00),(2,1,'child',110.00),
(2,2,'regular',200.00),(2,2,'student',170.00),(2,2,'senior_citizen',160.00),(2,2,'pwd',160.00),(2,2,'child',110.00),
(3,1,'regular',175.00),(3,1,'student',145.00),(3,1,'senior_citizen',140.00),(3,1,'pwd',140.00),(3,1,'child',90.00),
(3,2,'regular',175.00),(3,2,'student',145.00),(3,2,'senior_citizen',140.00),(3,2,'pwd',140.00),(3,2,'child',90.00);

INSERT INTO cargo_rates (shipping_line_id, cargo_type, rate_amount) VALUES
(1,'motorcycle',250.00),(1,'car',900.00),(1,'truck',2500.00),(1,'others',150.00),
(2,'motorcycle',280.00),(2,'car',950.00),(2,'truck',2700.00),(2,'others',180.00),
(3,'motorcycle',230.00),(3,'car',850.00),(3,'truck',2300.00),(3,'others',130.00);

INSERT INTO admins (full_name, email, password, role) VALUES
('Super Admin', 'admin@bantayanferry.com', '$2b$10$rQZ9uX1Hy2V.Kj5mN0pXeO8KLmP3qR7sT4vW6xY9zA1bC2dE5fG', 'superadmin');