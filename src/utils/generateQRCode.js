const qrcode = require("qrcode");

const generateQRCode = async (user) => {
  try {
    const { name, email, event_name, token, ticket_purchased } = user;
    const data = `Name: ${name}\nEmail: ${email}\nEvent: ${event_name}\nTicket Purchased:${ticket_purchased}\nToken: ${token}`;
    const qrCode = await qrcode.toDataURL(data);
    return qrCode;
  } catch (error) {
    console.error("Error while generating QR Code:", error);
    throw new Error("Error while generating QR Code");
  }
};

module.exports = generateQRCode;
