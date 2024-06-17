const { eventController } = require("../controllers");
const { authJWT } = require("../middlewares");

module.exports = (app) => {
  app.use((req, res, next) => {
    next();
  });
  app.get("/api/event", eventController.getAllEvent);
  app.post("/api/event", eventController.addEvent);
  app.delete("/api/event/:id", eventController.deleteEventById);
  app.patch("/api/event/:id", eventController.updateEventById);
};
