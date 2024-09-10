import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import jwt from "jsonwebtoken";
import path from "path";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import UsersModel from "./module/Users.js";

dotenv.config();

const __dirname = path.resolve();
const app = express();

app.use(express.json());

if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "/frontend/build")));
  app.get("*", (req, res) => {
    res.sendFile(path.resolve(__dirname, "frontend", "build", "index.html"));
  });
}

// app.use(cors());
// app.use((req, res, next) => {
//   res.setHeader("Access-Control-Allow-Origin", "*");
//   next();
// });

mongoose.connect(process.env.MONGO_URI);

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Server Running at http://localhost:${PORT}`);
});

app.get("/", async (req, res) => {
  res.json("Hello");
});

app.post("/api/register", async (req, res) => {
  const { username, name, email, password } = req.body;
  const checkUser = await UsersModel.findOne({ username: username });
  if (checkUser) {
    res.status(400).json("User already exists");
  } else {
    const hashedPassword = await bcrypt.hash(password, 10);
    await UsersModel.insertMany({
      username,
      name,
      email,
      password: hashedPassword,
    });
    res.status(200).json("User Created Successfully");
  }
});

app.post("/api/login", async (req, res) => {
  const { username, password } = req.body;
  const user = await UsersModel.findOne({ username });
  if (username === "" || password === "") {
    res.status(400).json("Bad Request");
  } else if (!user) {
    res.status(400).json("Invalid User");
  } else {
    const isPasswordMatched = await bcrypt.compare(password, user.password);
    if (isPasswordMatched) {
      const payload = { username: username };
      const jwtToken = jwt.sign(payload, process.env.JWT_TOKEN);
      res.send({ jwtToken });
    } else {
      res.status(400).json("Invalid Password");
    }
  }
});
