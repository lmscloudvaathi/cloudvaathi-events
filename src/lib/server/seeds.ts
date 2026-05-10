import bcrypt from "bcryptjs";
import { dbQuery } from "./db";
import { getEnv } from "./env";
import { courses, events } from "../mock-data";

export async function seedInitialData() {
  for (const c of courses) {
    await dbQuery(
      `INSERT INTO courses
       (slug, title, tagline, description, level, duration, start_date, price, seats, enrolled, tags_json, instructor, modules_json, active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
       ON DUPLICATE KEY UPDATE
       title=VALUES(title), tagline=VALUES(tagline), description=VALUES(description),
       level=VALUES(level), duration=VALUES(duration), start_date=VALUES(start_date),
       price=VALUES(price), seats=VALUES(seats), enrolled=VALUES(enrolled),
       tags_json=VALUES(tags_json), instructor=VALUES(instructor), modules_json=VALUES(modules_json), active=1`,
      [
        c.slug,
        c.title,
        c.tagline,
        c.description,
        c.level,
        c.duration,
        c.startDate,
        c.price,
        c.seats,
        c.enrolled,
        JSON.stringify(c.tags),
        c.instructor,
        JSON.stringify(c.modules),
      ],
    );
  }

  for (const e of events) {
    await dbQuery(
      `INSERT INTO events
       (slug, title, type, event_date, event_time, venue, price, seats, registered, description, speakers_json, active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
       ON DUPLICATE KEY UPDATE
       title=VALUES(title), type=VALUES(type), event_date=VALUES(event_date),
       event_time=VALUES(event_time), venue=VALUES(venue), price=VALUES(price),
       seats=VALUES(seats), registered=VALUES(registered), description=VALUES(description),
       speakers_json=VALUES(speakers_json), active=1`,
      [
        e.slug,
        e.title,
        e.type,
        e.date,
        e.time,
        e.venue,
        e.price,
        e.seats,
        e.registered,
        e.description,
        JSON.stringify(e.speakers),
      ],
    );
  }

  const env = getEnv();
  const adminHash = await bcrypt.hash(env.ADMIN_SEED_PASSWORD, 12);
  await dbQuery(
    `INSERT INTO users (name, email, password_hash, role, email_verified)
     VALUES (?, ?, ?, 'admin', 1)
     ON DUPLICATE KEY UPDATE
     name=VALUES(name), password_hash=VALUES(password_hash), role='admin', email_verified=1`,
    [env.ADMIN_SEED_NAME, env.ADMIN_SEED_EMAIL.toLowerCase(), adminHash],
  );
}
