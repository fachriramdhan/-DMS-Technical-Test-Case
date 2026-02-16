const bcrypt = require("bcrypt");

async function generateHash() {
  const password = "admin123";
  const hash = await bcrypt.hash(password, 10);

  console.log("=================================");
  console.log("Password:", password);
  console.log("Hash:", hash);
  console.log("=================================");
  console.log("\nCopy hash di atas dan gunakan di MySQL query:");
  console.log(
    `UPDATE users SET password = '${hash}' WHERE email = 'admin@dms.com';`,
  );
}

generateHash();
