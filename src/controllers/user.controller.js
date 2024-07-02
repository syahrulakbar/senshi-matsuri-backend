const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const supabase = require("../utils/supabase.js");
const generateToken = require("../utils/generateToken.js");
const transporter = require("../utils/mail");

const isProd = process.env.NODE_ENV === "production";

exports.verifyToken = async (req, res) => {
  try {
    const { data: response, error } = await supabase
      .from("users")
      .select("*")
      .eq("reset_password", req.params.token);

    if (error) {
      console.error("Error when verify token reset password", error?.message);
      return res.status(500).json({
        message: error?.message || "Error when verify reset password",
      });
    }

    if (response.length === 0) {
      console.error("Error when verify token reset password", error);
      return res.status(404).json({
        message: "Token Not Found",
      });
    }

    return res.status(200).json({
      message: "Token Found",
    });
  } catch (error) {
    console.error("Error when verify token reset password", error);
    return res.status(500).json({
      message: error?.message || "Error when verify token reset password",
    });
  }
};

exports.verifyResetPassword = async (req, res) => {
  try {
    const { data: response, error } = await supabase
      .from("users")
      .select("*")
      .eq("reset_password", req.params.token)
      .single();

    if (error) {
      console.error("Error when verify reset password", error);
      return res.status(500).json({
        message: error?.message || "Error when verify reset password",
      });
    }
    if (!response) {
      console.error("Error when verify reset password", error);
      return res.status(404).json({
        message: "Token Not Found",
      });
    }
    const { reset_password_expires } = response;
    if (reset_password_expires < new Date().getTime()) {
      console.error("Error when verify reset password", error);
      return res.status(404).json({
        message: "Token Expired",
      });
    }
    const { password } = req.body;
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(password, salt);

    const { data: responseUpdate, error: errorUpdate } = await supabase
      .from("users")
      .update({ password: hashedPassword, reset_password: null, reset_password_expires: null })
      .eq("reset_password", req.params.token);

    if (errorUpdate) {
      console.error("Error when verify reset password", error);

      return res.status(500).json({
        message: errorUpdate?.message || "Error when verify reset password",
      });
    }

    return res.status(201).json({
      message: "Reset password success",
      data: responseUpdate,
    });
  } catch (error) {
    console.error("Error when verify reset password", error);
    return res.status(500).json({
      message: error?.message || "Error when verify reset password",
    });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const MINIMUM_TIME_BETWEEN_OTP_REQUESTS = 5 * 60 * 1000;
    const { data: response, error } = await supabase
      .from("users")
      .select("*")
      .eq("email", req.body.email)
      .single();
    if (error) {
      return res.status(500).json({
        message: error?.message || "Error when reset password",
      });
    }
    if (!response) {
      return res.status(404).json({
        message: "Email Not Registered",
      });
    }
    if (new Date() - new Date(response.last_request_otp) < MINIMUM_TIME_BETWEEN_OTP_REQUESTS) {
      const remainingTime =
        MINIMUM_TIME_BETWEEN_OTP_REQUESTS - (new Date() - new Date(response.last_request_otp));
      return res.status(429).json({
        message: `Please wait ${Math.ceil(
          remainingTime / 1000,
        )} seconds before requesting another OTP.`,
        data: { remainingTime: Math.ceil(remainingTime / 1000) },
      });
    }

    while (true) {
      const token = generateToken(10);
      const { data: response, error } = await supabase
        .from("users")
        .select("*")
        .eq("reset_password", token);
      if (error) {
        return res.status(500).json({
          message: error?.message || "Error when reset password",
        });
      }
      if (response.length === 0) {
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(now.getDate() + 1);
        const expiresISO = tomorrow.toISOString();
        req.body.reset_password = token;
        req.body.reset_password_expires = expiresISO;
        req.body.last_request_otp = now.toISOString();
        break;
      }
    }
    const { name, email } = response;

    const mailOptions = {
      from: process.env.EMAIL,
      to: email,
      subject: "Reset your password",
      html: `
      <p>Hello, <strong>${name || "Friend"}</strong>!</p>
      <p>To reset your password, please click on the link below.</p>
      <a href=${
        process.env.FRONTEND_URL + "forget-password/" + req.body.reset_password
      } target="_blank" rel="noopener noreferrer">Reset your password</a>
      <p>Best regards,<br/>Senshi Matsuri</p>
    `,
    };

    transporter.sendMail(mailOptions, async (error, info) => {
      if (error) {
        console.error("Error sending email: ", error);
        throw error;
      } else {
        console.log(`Email sent: ${info.response}`);
        const { data: responseUpdate, error: errorUpdate } = await supabase
          .from("users")
          .update(req.body)
          .eq("email", req.body.email);

        if (errorUpdate) {
          console.error(errorUpdate?.message || "Error when reset password");
          return res.status(500).json({
            message: errorUpdate?.message || "Error when reset password",
          });
        }

        return res.status(200).json({
          message: "Reset password success, check your email for token",
          data: responseUpdate,
        });
      }
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: error?.message || "Error when reset password",
    });
  }
};

exports.createUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(password, salt);

    const { data: response, error } = await supabase
      .from("users")
      .insert([{ ...req.body, password: hashedPassword }])
      .select();

    if (error) {
      return res.status(500).json({
        message: error?.message || "Error when signup user",
      });
    }

    return res.status(201).json({
      message: "User created",
      data: {
        id: response.id,
        name,
        email,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: error?.message || "Error when signup user",
    });
  }
};

exports.signIn = async (req, res) => {
  try {
    const { data: user, error } = await supabase
      .from("users")
      .select("*")
      .eq("email", req.body.email)
      .single();

    if (error || !user) {
      return res.status(404).json({
        message: "Email Not Registered",
      });
    }

    const match = await bcrypt.compare(req.body.password, user.password);
    if (!match) {
      return res.status(400).json({
        message: "Wrong Password",
      });
    }

    const { id, name, email, role } = user;
    const accessToken = jwt.sign({ id, name, email, role }, process.env.ACCESS_TOKEN_SECRET, {
      expiresIn: "15m",
    });
    const refreshToken = jwt.sign({ id, name, email, role }, process.env.REFRESH_TOKEN_SECRET, {
      expiresIn: "1d",
    });

    const { error: updateError } = await supabase
      .from("users")
      .update({ refresh_token: refreshToken })
      .eq("id", id);

    if (updateError) {
      return res.status(500).json({ message: "Error updating refresh token" });
    }

    const currentDate = new Date();
    const exp = currentDate.getTime() + 15 * 60 * 1000;
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 1 day
      secure: isProd,
      sameSite: isProd ? "None" : "Lax",
    });
    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      maxAge: 15 * 60 * 1000, // 15 minutes
      secure: isProd,
      sameSite: isProd ? "None" : "Lax",
    });

    return res.status(200).json({
      message: "Successfully logged in",
      data: {
        expire: exp,
        userId: id,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: error?.message || "Error when signin user",
    });
  }
};

exports.adminSignIn = async (req, res) => {
  try {
    const { data: user, error } = await supabase
      .from("users")
      .select("*")
      .eq("email", req.body.email)
      .single();

    if (error || !user) {
      return res.status(404).json({
        message: "Email Not Registered",
      });
    }

    const match = await bcrypt.compare(req.body.password, user.password);
    if (!match) {
      return res.status(400).json({
        message: "Wrong Password",
      });
    }

    if (user.role !== 2) {
      return res.status(403).json({
        message: "403 Forbidden",
      });
    }

    const { id, name, email, role } = user;
    const accessToken = jwt.sign({ id, name, email, role }, process.env.ACCESS_TOKEN_SECRET, {
      expiresIn: "15m",
    });
    const refreshToken = jwt.sign({ id, name, email, role }, process.env.REFRESH_TOKEN_SECRET, {
      expiresIn: "1d",
    });

    const { error: updateError } = await supabase
      .from("users")
      .update({ refresh_token: refreshToken })
      .eq("id", id);

    if (updateError) {
      return res.status(500).json({ message: "Error updating refresh token" });
    }

    const currentDate = new Date();
    const exp = currentDate.getTime() + 15 * 60 * 1000;

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 1 day
      secure: isProd,
      sameSite: isProd ? "None" : "Lax",
    });
    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      maxAge: 15 * 60 * 1000, // 15 minutes
      secure: isProd,
      sameSite: isProd ? "None" : "Lax",
    });

    return res.status(200).json({
      message: "Successfully logged in",
      data: {
        expire: exp,
        userId: id,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: error?.message || "Error when signin user",
    });
  }
};

exports.signOut = async (req, res) => {
  try {
    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) {
      return res.status(400).json({
        message: "Refresh token not found",
      });
    }

    const { data: user, error } = await supabase
      .from("users")
      .select("*")
      .eq("refresh_token", refreshToken)
      .single();

    if (error || !user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    await supabase.from("users").update({ refresh_token: null }).eq("id", user.id);

    res.clearCookie("refreshToken");
    res.clearCookie("accessToken");
    return res.status(200).json({
      message: "Successfully logged out",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: error?.message || "Error when signout user",
    });
  }
};

exports.refreshToken = async (req, res) => {
  try {
    const refreshToken = req.cookies?.refreshToken;
    const { data: user, error } = await supabase
      .from("users")
      .select("*")
      .eq("refresh_token", refreshToken)
      .single();

    if (error || !user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, decode) => {
      if (err) {
        return res.status(403).json({
          message: "Invalid refresh token",
        });
      }
      const { id, name, email, role } = decode;
      const currentDate = new Date();
      const exp = currentDate.getTime() + 15 * 60 * 1000;

      const accessToken = jwt.sign({ id, name, email, role }, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "15m",
      });
      res.cookie("accessToken", accessToken, {
        httpOnly: true,
        maxAge: 15 * 60 * 1000, // 15 minutes
        secure: isProd,
        sameSite: isProd ? "None" : "Lax",
      });

      return res.status(200).json({
        message: "Successfully new token",
        data: {
          expire: exp,
          userId: id,
        },
      });
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: error?.message || "Error when refresh token",
    });
  }
};
exports.currentUser = async (req, res) => {
  try {
    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) {
      return res.status(400).json({
        message: "Refresh token not found",
      });
    }

    const { data: user, error } = await supabase
      .from("users")
      .select("id, name, email")
      .eq("refresh_token", refreshToken)
      .single();

    if (error || !user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, decode) => {
      if (err) {
        return res.status(403).json({
          message: "Invalid refresh token",
        });
      }
      return res.status(200).json({
        message: "Successfully check user",
        data: user,
      });
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: error?.message || "Error when refresh token",
    });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const { data: users, error } = await supabase
      .from("users")
      .select(`id, name, email, roleId, role:roles(*)`)
      .or(`name.ilike.%${req.query.name}%,email.ilike.%${req.query.email}%`)
      .order("created_at", { ascending: false });

    if (error) {
      return res.status(500).json({
        message: error?.message || "Error when get all users",
      });
    }
    return res.status(200).json({
      message: "Successfully get all users",
      data: users,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: error?.message || "Error when get all users",
    });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const id = req.params.id;
    const { data: user, error } = await supabase
      .from("users")
      .select("id,name,email,profilePicture,role")
      .eq("id", id)
      .single();
    if (error || !user) {
      return res.status(404).json({
        message: "User not found",
      });
    }
    return res.status(200).json({
      message: "Successfully get user by id",
      data: user,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: error?.message || "Error when get user by id",
    });
  }
};

exports.updateUserById = async (req, res) => {
  if (req.body.password) {
    req.body.password = bcrypt.hashSync(req.body.password, 8);
  }
  try {
    const id = req.params.id;
    const { data: user, error } = await supabase.from("users").select("*").eq("id", id).single();

    if (error || !user) {
      return res.status(404).json({
        message: "User not found",
      });
    } else if (user) {
      if (req.body.password && req.body.password === "") {
        delete req.body.password;
      }

      const { data: userUpdate, error } = await supabase
        .from("users")
        .update(req.body)
        .eq("id", id)
        .select("id, name, email, roleId");

      if (error) {
        return res.status(500).json({
          message: error?.message || "Error when update profile",
        });
      }

      return res.status(200).json({
        message: "Successfully update profile",
        data: {
          userUpdate,
        },
      });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: error?.message || "Error when update profile",
    });
  }
};

exports.deleteUserById = async (req, res) => {
  try {
    const id = req.params.id;
    const { data: user, error } = await supabase.from("users").select("*").eq("id", id).single();

    if (user) {
      await supabase.from("users").delete().eq("id", id);
      return res.status(200).json({
        message: "Successfully delete user",
      });
    }
    return res.status(404).json({
      message: "User not found",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: error?.message || "Error when delete user",
    });
  }
};
