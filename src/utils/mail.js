const nodemailer = require("nodemailer");
const transporter = nodemailer.createTransport({
  name: "vercel.app",
  service: "Gmail",
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL,
    pass: process.env.PASSWORD,
  },
});
module.exports = transporter;
