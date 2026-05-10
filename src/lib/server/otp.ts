import { dbQuery } from "./db";

export async function generateOtp(email: string) {
  const code = `${Math.floor(100000 + Math.random() * 900000)}`;
  await dbQuery(
    `INSERT INTO otp_codes (email, code, expires_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 10 MINUTE))`,
    [email.toLowerCase(), code],
  );
  return code;
}

export async function consumeOtp(email: string, code: string) {
  const rows = await dbQuery<{ id: number }[]>(
    `SELECT id
     FROM otp_codes
     WHERE email = ?
       AND code = ?
       AND consumed_at IS NULL
       AND expires_at > NOW()
     ORDER BY id DESC
     LIMIT 1`,
    [email.toLowerCase(), code],
  );
  const otp = rows[0];
  if (!otp) return false;
  await dbQuery(`UPDATE otp_codes SET consumed_at = NOW() WHERE id = ?`, [otp.id]);
  return true;
}
