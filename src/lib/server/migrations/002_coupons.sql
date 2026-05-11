CREATE TABLE IF NOT EXISTS coupons (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  code VARCHAR(64) NOT NULL,
  description VARCHAR(255) DEFAULT NULL,
  discount_type ENUM('percent', 'fixed') NOT NULL,
  discount_value INT NOT NULL,
  active TINYINT(1) NOT NULL DEFAULT 1,
  max_uses INT DEFAULT NULL,
  uses_count INT NOT NULL DEFAULT 0,
  valid_from DATE NULL,
  valid_until DATE NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_coupons_code (code)
);

CREATE TABLE IF NOT EXISTS coupon_scopes (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  coupon_id BIGINT NOT NULL,
  item_type ENUM('course', 'event') NOT NULL,
  item_slug VARCHAR(140) NOT NULL,
  CONSTRAINT fk_coupon_scopes_coupon FOREIGN KEY (coupon_id) REFERENCES coupons(id) ON DELETE CASCADE,
  UNIQUE KEY uq_coupon_scope (coupon_id, item_type, item_slug)
);

ALTER TABLE orders ADD COLUMN coupon_id BIGINT NULL DEFAULT NULL;
ALTER TABLE orders ADD COLUMN original_amount INT NULL DEFAULT NULL;
ALTER TABLE orders ADD COLUMN discount_amount INT NOT NULL DEFAULT 0;
ALTER TABLE orders ADD CONSTRAINT fk_orders_coupon FOREIGN KEY (coupon_id) REFERENCES coupons(id) ON DELETE SET NULL;

ALTER TABLE enrollments ADD COLUMN coupon_id BIGINT NULL DEFAULT NULL;
ALTER TABLE enrollments ADD COLUMN original_amount INT NULL DEFAULT NULL;
ALTER TABLE enrollments ADD COLUMN discount_amount INT NOT NULL DEFAULT 0;
ALTER TABLE enrollments ADD CONSTRAINT fk_enrollments_coupon FOREIGN KEY (coupon_id) REFERENCES coupons(id) ON DELETE SET NULL;
