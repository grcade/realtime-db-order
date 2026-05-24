import { faker } from "@faker-js/faker";
import { getDbPool } from "./db.js";

faker.seed(42);

const USER_COUNT = 6;
const ORDER_COUNT = 12;
const ORDER_STATUSES = ["pending", "processing", "shipped", "delivered"];
const ROLES = ["admin", "user"];

async function seedDB() {
  const db = await getDbPool();
  const client = await db.connect();

  try {
    await client.query("BEGIN");
    await client.query(
      "TRUNCATE TABLE orders, users RESTART IDENTITY CASCADE;",
    );

    const users = [];

    for (let index = 0; index < USER_COUNT; index += 1) {
      const firstName = faker.person.firstName();
      const lastName = faker.person.lastName();
      const username = `${faker.internet.username({ firstName, lastName }).toLowerCase()}_${index + 1}`;
      const email = `${username}@example.com`;
      const role =
        index === 0 ? "admin" : faker.helpers.arrayElement(ROLES.slice(1));
      const createdAt = faker.date.past({ years: 1 });

      const result = await client.query(
        `
					INSERT INTO users (username, email, role, created_at)
					VALUES ($1, $2, $3, $4)
					RETURNING id
				`,
        [username, email, role, createdAt],
      );

      users.push({
        id: result.rows[0].id,
        createdAt,
      });
    }

    for (let index = 0; index < ORDER_COUNT; index += 1) {
      const user = faker.helpers.arrayElement(users);
      const quantity = faker.number.int({ min: 1, max: 8 });
      const unitPrice = Number(
        faker.commerce.price({ min: 15, max: 250, dec: 2 }),
      );
      const totalPrice = Number((quantity * unitPrice).toFixed(2));
      const createdAt = faker.date.between({
        from: user.createdAt,
        to: new Date(),
      });

      await client.query(
        `
					INSERT INTO orders (user_id, product_name, quantity, total_price, status, created_at)
					VALUES ($1, $2, $3, $4, $5, $6)
				`,
        [
          user.id,
          faker.commerce.productName(),
          quantity,
          totalPrice,
          faker.helpers.arrayElement(ORDER_STATUSES),
          createdAt,
        ],
      );
    }

    await client.query("COMMIT");
    console.log(
      `Seeded ${USER_COUNT} users and ${ORDER_COUNT} orders successfully.`,
    );
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("DB seed failed:", error);
    process.exitCode = 1;
  } finally {
    client.release();
    await db.end();
  }
}

seedDB();
