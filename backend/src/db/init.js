import { getDbPool } from "./db.js";

export async function initDB() {
  const db = await getDbPool();

  try {
    await db.query(`
			CREATE TABLE IF NOT EXISTS users (
				id SERIAL PRIMARY KEY,
				username VARCHAR(100) NOT NULL UNIQUE,
				email VARCHAR(255) UNIQUE NOT NULL,
				role VARCHAR(10) CHECK (role IN ('admin', 'user')),
				created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
			);
		`);

    await db.query(`
			CREATE TABLE IF NOT EXISTS orders (
				id SERIAL PRIMARY KEY,
				user_id INTEGER REFERENCES users(id),
				product_name VARCHAR(255) NOT NULL,
				quantity INTEGER NOT NULL,
				total_price DECIMAL(10, 2) NOT NULL,
				status VARCHAR(20) CHECK (status IN ('pending', 'processing', 'shipped', 'delivered')),
				created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
			);
		`);

    await db.query(`
			CREATE OR REPLACE FUNCTION notify_order_change()
			RETURNS TRIGGER AS $$
			DECLARE
				payload JSON;
				channel TEXT;
			BEGIN
				IF TG_OP = 'DELETE' THEN
					payload := json_build_object(
						'operation', TG_OP,
						'order', row_to_json(OLD)
					);
					channel := 'order_updates';
				ELSIF TG_OP = 'INSERT' THEN
					payload := json_build_object(
						'operation', TG_OP,
						'order', row_to_json(NEW)
					);
					channel := 'order_created';
				ELSE
					payload := json_build_object(
						'operation', TG_OP,
						'order', row_to_json(NEW)
					);
					channel := 'order_updates';
				END IF;

				PERFORM pg_notify(channel, payload::TEXT);
				RETURN COALESCE(NEW, OLD);
			END;
			$$ LANGUAGE plpgsql;
		`);

    await db.query(`
			CREATE OR REPLACE FUNCTION notify_user_created()
			RETURNS TRIGGER AS $$
			DECLARE
				payload JSON;
			BEGIN
				payload := json_build_object(
					'operation', TG_OP,
					'user', row_to_json(NEW)
				);

				PERFORM pg_notify('user_created', payload::TEXT);
				RETURN NEW;
			END;
			$$ LANGUAGE plpgsql;
		`);

    await db.query(`
			DROP TRIGGER IF EXISTS order_changes ON orders;
			CREATE TRIGGER order_changes
			AFTER INSERT OR UPDATE OR DELETE ON orders
			FOR EACH ROW EXECUTE FUNCTION notify_order_change();
		`);

    await db.query(`
			DROP TRIGGER IF EXISTS user_changes ON users;
			CREATE TRIGGER user_changes
			AFTER INSERT ON users
			FOR EACH ROW EXECUTE FUNCTION notify_user_created();
		`);

    // Ensure at least one user exists for orders
    const userCheck = await db.query("SELECT id FROM users LIMIT 1");
    if (userCheck.rows.length === 0) {
      await db.query(
        "INSERT INTO users (username, email, role) VALUES ($1, $2, $3)",
        ["admin", "admin@example.com", "admin"],
      );
      console.log("Created default admin user");
    }

    console.log("Tables created successfully");
  } catch (error) {
    console.error("DB init failed:", error);
    throw error;
  } finally {
    await db.end();
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  initDB().catch(() => {
    process.exit(1);
  });
}
