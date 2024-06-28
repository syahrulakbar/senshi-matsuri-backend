const PDFDocument = require("pdfkit");
const fs = require("fs");
const generateQRCode = require("./generateQRCode");
const path = require("path");

const generatePdf = async (data) => {
  try {
    const { name, email, ticket_purchased, price, token } = data;
    const qrcodeImg = await generateQRCode(data);

    const pdfBuffer = await new Promise((resolve) => {
      const doc = new PDFDocument();
      let buffers = [];

      const body = `
Hello ${name || "Friend"},

Thank you so much for purchasing a presale ticket for the Akita Japan Fest! We are thrilled to have you join us for this exciting event.

Here are the details of your purchase:

Name: ${name || "Friend"}
Email: ${email || "example@gmail.com"}
Ticket Purchased: ${ticket_purchased || 0}
Price per Ticket: Rp${price || 0}
Total Amount: Rp${parseInt(ticket_purchased) * parseInt(price) || 0}
Token: ${token || "XXXXXX"}

Here your QR code, show it to the akita team to exchange for physical tickets.

We look forward to seeing you there!
      `;

      doc.image(path.join(__dirname, "../images/logo.png"), (doc.page.width - 50) / 2, doc.y, {
        fit: [50, 50],
        align: "center",
        valign: "top",
      });
      doc.moveDown(3);

      doc
        .font(path.join(__dirname, "../fonts/Geist.ttf"))
        .fontSize(25)
        .text("AKITA JAPAN FESTIVAL", {
          align: "center",
        });
      doc.fontSize(15).text(body, {
        align: "left",
      });
      doc.moveDown();
      doc.image(qrcodeImg, { width: 100, height: 100, align: "left" });
      doc.moveDown(7);
      doc.text("Best regards,", { align: "left" }).text("Akita Japan Fest", { align: "left" });
      doc.end();

      doc.on("data", buffers.push.bind(buffers));
      doc.on("end", () => {
        try {
          let pdfData = Buffer.concat(buffers);
          resolve(pdfData);
        } catch (err) {
          reject(err);
        }
      });
    });

    return pdfBuffer;
  } catch (error) {
    console.error("Error while generating PDF:", error);
    throw new Error("Error while generating PDF");
  }
};

module.exports = generatePdf;
