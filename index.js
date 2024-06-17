require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");

const app = express();

const corsOPTIONS = {
  origin: ["http://localhost:3000"],
};

app.use(cors(corsOPTIONS));
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

require("./src/routes/index.js")(app);
app.get("/", (req, res) => {
  res.send("Sensi Matsuri API");
});

app.listen(5000, () => {
  console.log(`Server running on port 5000`);
});
