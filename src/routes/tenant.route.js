const { tenantController } = require("../controllers");

module.exports = (app) => {
  app.use((req, res, next) => {
    next();
  });

  app.post("/api/tenant", tenantController.addTenant);
};
