const { userController } = require("../controllers");
const { authJWT } = require("../middlewares");
module.exports = (app) => {
  app.use((req, res, next) => {
    next();
  });

  app.post("/api/login", userController.signIn);
  app.post("/api/admin/login", userController.adminSignIn);
  app.delete("/api/logout", userController.signOut);
  app.post("/api/register", userController.createUser);
  app.get("/api/users/token", userController.refreshToken);
  app.get("/api/users/profile", userController.currentUser);
  app.get("/api/users/admin", userController.currentUser);
  app.get("/api/users", userController.getAllUsers);
  app.get("/api/users/:id", userController.getUserById);
  app.patch("/api/users/:id", userController.updateUserById);
  app.delete("/api/users/:id", userController.deleteUserById);
};
