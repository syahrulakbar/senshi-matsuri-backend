const jwt = require("jsonwebtoken");
const { TokenExpiredError } = jwt;
const supabase = require("../utils/supabase");

const catchError = (err, res) => {
  if (err instanceof TokenExpiredError) {
    res.status(401).send({
      message: "Unauthorized! Access Token was expired!",
    });
    res.status(401).send({ message: "Unauthorized!" });
  }
};

const verifyToken = (req, res, next) => {
  const refreshToken = req.cookies.refreshToken;
  const token = req.cookies.accessToken;
  if (!refreshToken || !token) {
    return res.status(404).send({ message: "No token provided!" });
  }

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decode) => {
    if (err) {
      return catchError(err, res);
    }
    req.userId = decode.id;
    next();
  });
};

const isAdmin = async (req, res, next) => {
  const { data: user, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", req.userId)
    .single();

  if (error || !user) {
    return res.status(404).send({ message: "User Not found." });
  }
  if (user.role === 2) {
    next();
    return;
  }
  return res.status(403).send({ message: "Require Admin Role!" });
};

const authJWT = {
  verifyToken,
  isAdmin,
};
module.exports = authJWT;
