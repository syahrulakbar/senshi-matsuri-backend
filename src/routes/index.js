const eventRoutes = require("./event.route");
const ticketRoutes = require("./ticket.route");
module.exports = (app) => {
  eventRoutes(app);
  ticketRoutes(app);
};
