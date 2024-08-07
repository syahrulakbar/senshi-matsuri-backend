const eventRoutes = require("./event.route");
const ticketRoutes = require("./ticket.route");
const userRoutes = require("./user.route");
const tenantRoutes = require("./tenant.route");
module.exports = (app) => {
  eventRoutes(app);
  ticketRoutes(app);
  userRoutes(app);
  tenantRoutes(app);
};
