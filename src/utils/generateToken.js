const { nanoid } = require("nanoid");

function generateToken(length) {
  return nanoid(length);
}
module.exports = generateToken;
