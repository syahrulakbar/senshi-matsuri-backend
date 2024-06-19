const supabase = require("../utils/supabase");
const transporter = require("../utils/mail");
const generateToken = require("../utils/generateToken");
const { destroyImage } = require("../utils/cloudinary");

exports.addTicket = async (req, res) => {
  try {
    const { data: event, error: eventError } = await supabase
      .from("events")
      .select()
      .eq("id", req.body.eventId)
      .single();

    if (eventError) {
      console.error("Error get data event:", eventError);
      return res.status(500).json({ error: "Failed to get data" });
    }
    if (event.end_date < new Date()) return res.status(400).json({ error: "Event has ended" });

    const { data: response, error } = await supabase
      .from("ticket")
      .insert([{ ...req.body, status: "pending" }])
      .select();

    if (error) {
      throw new Error(error.message);
    }
    return res.status(201).json({
      message: "Ticket created successfully",
      data: response,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: "Error while creating Ticket" });
  }
};

exports.getTicketById = async (req, res) => {
  try {
    const id = req.params.id;
    const { data: response, error: error } = await supabase
      .from("ticket")
      .select(
        `
  *,
  event:events(*)
`,
      )
      .eq("ticket.eventId", id);

    if (error) {
      throw new Error(error.message);
    }
    return res.status(200).json({
      message: "Get ticket by id successfully",
      data: response,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: "Error while get ticket by id" });
  }
};

exports.getAllTicket = async (req, res) => {
  try {
    const { data: response, error } = await supabase
      .from("ticket")
      .select(
        `
      *,
      event:events(*)
    `,
      )
      .or(`name.ilike.%${req.query.name}%,token.ilike.%${req.query.token}%`)
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(error.message);
    }
    return res.status(200).json({
      message: "Get all ticket successfully",
      data: response,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: "Error while get all ticket" });
  }
};

exports.deleteTicketById = async (req, res) => {
  try {
    const { data: ticketData, error: ticketError } = await supabase
      .from("ticket")
      .select()
      .eq("id", req.params.id)
      .single();

    if (ticketError) {
      console.error("Error get data ticket:", ticketError);
      return res.status(500).json({ error: "Failed to get data" });
    }

    if (ticketData.length === 0) {
      console.error("Error get data ticket:", ticketError);
      return res.status(404).json({ error: "Ticket not found" });
    }

    await destroyImage(ticketData.proof_of_payment);

    const { data: response, error } = await supabase
      .from("ticket")
      .delete()
      .eq("id", req.params.id);

    if (error) {
      console.error("Error get data ticket:", error);
      return res.status(500).json({ error: "Failed to get data" });
    }
    return res.status(200).json({
      message: "Ticket deleted successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: "Error while deleting ticket" });
  }
};

exports.updateTicketById = async (req, res) => {
  try {
    if (req.body.status === "approved") {
      const { data: ticketData, error: ticketError } = await supabase
        .from("ticket")
        .select()
        .eq("id", req.params.id)
        .single();
      if (ticketError) {
        console.error("Error get data ticket:", ticketError);
        return res.status(500).json({ error: "Failed to get data" });
      }

      if (ticketData.status === "approved" && ticketData.token) {
        const { data: response, error } = await supabase
          .from("ticket")
          .update({ ...req.body, updated_at: new Date() })
          .eq("id", req.params.id);

        if (error) {
          throw new Error(error.message);
        }

        return res.status(200).json({
          message: "Ticket updated successfully",
          data: response,
        });
      }

      while (true) {
        let token = generateToken(6);
        const { data: response, error } = await supabase.from("ticket").select().eq("token", token);
        if (error) {
          console.error("Error joining tables:", error);
          return res.status(500).json({ error: "Failed to get data" });
        }
        if (response.length === 0) {
          req.body.token = token;
          break;
        }
      }

      const { data: response, error } = await supabase
        .from("ticket")
        .update({ ...req.body, updated_at: new Date() })
        .eq("id", req.params.id);

      if (error) {
        console.error("Error joining tables:", error);
        return res.status(500).json({ error: "Failed to get data" });
      }

      const { data: joinedData, error: joinError } = await supabase
        .from("ticket")
        .select(
          `*,
        event:events(*)
      `,
        )
        .eq("id", req.params.id);

      if (joinError) {
        console.error("Error joining tables:", joinError);
        return res.status(500).json({ error: "Failed to retrieve joined data" });
      }

      const { name, email, event, token } = joinedData[0];
      const { event_name } = event;

      const mailOptions = {
        from: process.env.EMAIL,
        to: email,
        subject: "Token Tiket",
        html: `
        <p>Hello, <strong>${name || "Friend"}</strong>!</p>
        <p>Arigathanks for purchasing the ticket for <strong>${
          event_name || "Ticket Presale"
        }</strong>. Your ticket token is <strong>${token || "000000"}</strong>.</p>
        <p>Best regards,<br/>Senshi Matsuri</p>
      `,
      };

      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.error("Error sending email: ", error);
        } else {
          console.log(`Email sent: ${info.response}`);
        }
      });

      return res.status(200).json({
        message: "Ticket updated successfully",
        data: { ...response, mail: mailOptions },
      });
    } else {
      const { data: response, error } = await supabase
        .from("ticket")
        .update({ ...req.body, updated_at: new Date() })
        .eq("id", req.params.id);

      if (error) {
        throw new Error(error.message);
      }

      return res.status(200).json({
        message: "Ticket updated successfully",
        data: response,
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: "Error while updating ticket" });
  }
};
