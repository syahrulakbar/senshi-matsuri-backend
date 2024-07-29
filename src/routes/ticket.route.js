const { ticketController } = require("../controllers");

module.exports = (app) => {
  app.use((req, res, next) => {
    next();
  });
  app.post("/api/send-email", ticketController.sendEmail);
  app.get("/api/ticket", ticketController.getAllTicket);
  app.post("/api/ticket", ticketController.addTicket);
  app.delete("/api/ticket/:id", ticketController.deleteTicketById);
  app.patch("/api/ticket/:id", ticketController.updateTicketById);
};
