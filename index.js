require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const swaggerUi = require("swagger-ui-express");
const swaggerDocument = require("./swagger.json");

const app = express();

const corsOPTIONS = {
  origin: [
    "http://localhost:3000",
    "https://senshi-matsuri.vercel.app",
    "https://senshi-matsuri-x.vercel.app",
  ],
  credentials: true,
};

app.use(cors(corsOPTIONS));
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

require("./src/routes/index.js")(app);
app.get("/", (req, res) => {
  res.send("Sensi Matsuri API");
});
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.listen(5000, () => {
  console.log(`Server running on port 5000`);
});
