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
    "http://127.0.0.1:5500",
    "https://akita-psi.vercel.app",
    "https://senshi-matsuri.vercel.app",
    "https://animated-gelato-8b5a0b.netlify.app",
  ],
  credentials: true,
};

app.use(cors(corsOPTIONS));
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

require("./src/routes/index.js")(app);
app.get("/", (req, res) => {
  res.send("Akita Japan Fest API");
});
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.listen(5000, () => {
  console.log(`Server running on port 5000`);
});
