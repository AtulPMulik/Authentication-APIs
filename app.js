const express = require("express");
const app = express();

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const bcrypt = require("bcrypt");

const path = require("path");
const dbPath = path.join(__dirname, "userData.db");

let db = null;
app.use(express.json());

const initializeTheDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is running at localhost:3000");
    });
  } catch (e) {
    console.log(e.message);
    process.exit(1);
  }
};
initializeTheDbAndServer();

const getUserDetails = async (username) => {
  const checkUserQuery = `
     SELECT * 
     FROM user 
     WHERE username = "${username}";
     `;
  const dbUser = await db.get(checkUserQuery);
  return dbUser;
};
// API 1
app.post("/register", async (request, response) => {
  const { username, name, password, gender, location } = request.body;

  const dbUser = await getUserDetails(username);
  if (dbUser !== undefined) {
    await response.status(400);
    await response.send("User already exists");
  } else {
    if (password.length < 5) {
      await response.status(400);
      await response.send("Password is too short");
    } else {
      const hashedPassword = await bcrypt.hash(request.body.password, 10);
      const addUserQuery = `
     INSERT INTO user (username, name, password, gender, location)
     VALUES ("${username}", "${name}","${hashedPassword}", "${gender}", "${location}");
     `;
      await db.run(addUserQuery);
      await response.status(200);
      await response.send("User created successfully");
    }
  }
});

//API 2
app.post("/login", async (request, response) => {
  const { username, password } = request.body;
  const dbUser = await getUserDetails(username);
  if (dbUser === undefined) {
    await response.status(400);
    await response.send("Invalid user");
  } else {
    const isPasswordMatch = await bcrypt.compare(password, dbUser.password);
    if (isPasswordMatch === true) {
      await response.status(200);
      await response.send("Login success!");
    } else {
      await response.status(400);
      await response.send("Invalid password");
    }
  }
});

// API 3
app.put("/change-password", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;
  const dbUser = await getUserDetails(username);
  const isOldPasswordMatch = await bcrypt.compare(oldPassword, dbUser.password);
  if (isOldPasswordMatch === false) {
    await response.status(400);
    await response.send("Invalid current password");
  } else {
    if (newPassword.length < 5) {
      await response.status(400);
      await response.send("Password is too short");
    } else {
      const hashedNewPassword = await bcrypt.hash(newPassword, 10);
      const updatePasswordQuery = `
     UPDATE user 
     SET password = "${hashedNewPassword}"
     WHERE username = "${username}";
     `;
      await db.run(updatePasswordQuery);
      await response.status(200);
      await response.send("Password updated");
    }
  }
});
module.exports = app;
