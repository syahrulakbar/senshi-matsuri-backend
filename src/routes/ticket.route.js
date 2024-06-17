const { ticketController } = require("../controllers");
const { authJWT } = require("../middlewares");

module.exports = (app) => {
  app.use((req, res, next) => {
    next();
  });
  app.get("/api/ticket", ticketController.getAllTicket);
  app.post("/api/ticket", ticketController.addTicket);
  app.delete("/api/ticket/:id", ticketController.deleteTicketById);
  app.patch("/api/ticket/:id", ticketController.updateTicketById);
};
