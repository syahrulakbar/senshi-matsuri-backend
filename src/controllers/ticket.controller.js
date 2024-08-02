const supabase = require("../utils/supabase");
const transporter = require("../utils/mail");
const generateToken = require("../utils/generateToken");
const { destroyImage } = require("../utils/cloudinary");
const generatePdf = require("../utils/generatePdf");
const moment = require("moment");

exports.sendEmailResult = async (req, res) => {
  try {
    const { name, email, time, date } = req.body;
    const results = [
      {
        name: "Blood Pressure",
        value: "120/80 mmHg",
      },
      {
        name: "Blood Sugar",
        value: "90 mg/dL",
      },
      {
        name: "Cholesterol",
        value: "200 mg/dL",
      },
      {
        name: "BMI",
        value: "22.5 kg/m2",
      },
      {
        name: "Heart Rate",
        value: "75 bpm",
      },
      {
        name: "Temperature",
        value: "36.5 °C",
      },
    ];

    const mailOptions = {
      from: `PT Bank Mandiri <${process.env.EMAIL}>`,
      to: email,
      subject: "Result Mini MCU - PT Bank Mandiri",
      html: `
        <h1>Result Mini Medical Check Up | PT Bank Mandiri</h1>
        <p>Dear <strong>${name}</strong>,</p>

        <p>We hope this message finds you well.</p>
        <p>We are pleased to provide you with the results of your Medical Check-Up conducted on <strong>${moment(
          date,
          "DD-MM-YYYY",
        ).format(
          "dddd, LL",
        )} </strong> at <strong>${time}</strong> with PT Bank Mandiri. Below is a summary of your health examination:</p>

        <h2>Health Examination Results:</h2>
        <ul>
        ${results
          .map(
            (result) => `
          <li><strong>${result.name}</strong>: ${result.value}</li>
        `,
          )
          .join("")}
        </ul>

        <p>We sincerely thank you for participating in the Mini Medical Check-Up at PT Bank Mandiri.</p>

        <p>Should you have any further questions or require clarification regarding these results, please do not hesitate to contact us.</p>

        <p>Thank you once again for taking part in the Mini Medical Check-Up.</p>

        <p>Wishing you good health,</p>

        <>Best Regards,<br />
        PT Bank Mandiri<br>
        +62-815-4896-2893 (Mochamad Syahrul Akbar)</p>
        
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`Email sent: ${info.response}`);

    return res.status(200).json({
      message: "Email sent successfully",
      data: { mail: mailOptions },
    });
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: "Error while sending email" });
  }
};
exports.sendEmail = async (req, res) => {
  try {
    const { name, email, time, date } = req.body;

    const mailOptions = {
      from: `PT Bank Mandiri <${process.env.EMAIL}>`,
      to: email,
      subject: "Medical Check UP - PT Bank Mandiri",
      html: `
        <h1>Medical Check Up | PT Bank Mandiri</h1>
        <p>
          Hi ${name}, <br />
          <br />
          Your Medical Check Up at ${time} on ${moment(date, "DD-MM-YYYY").format(
        "dddd, LL",
      )} is scheduled.
        </p>
        <p><strong>Location:</strong> Jl. Jend. Sudirman No. 54, Jakarta Selatan, 12190</p>
        <p><strong>What to bring:</strong> Please bring your ID card</p>
        <p><strong>Notes:</strong> Come 15 minutes before the appointment time.</p>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`Email sent: ${info.response}`);

    return res.status(200).json({
      message: "Email sent successfully",
      data: { mail: mailOptions },
    });
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: "Error while sending email" });
  }
};

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
    const { eventId, name, email, total_ticket, proof_of_payment } = req.body;
    const { data: response, error } = await supabase
      .from("ticket")
      .insert([
        {
          eventId,
          name,
          email,
          total_ticket,
          proof_of_payment,
          status: "pending",
        },
      ])
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

      const { name, email, event, token, total_ticket } = joinedData[0];
      const { event_name, price } = event;
      const ticketPresale = await generatePdf({
        name,
        email,
        ticket_purchased: total_ticket,
        price,
        event_name,
        token,
      });

      const mailOptions = {
        from: `Akita Japan Fest <${process.env.EMAIL}>`,
        to: email,
        subject: "Presale Ticket - Akita Japan Fest",
        text: `
Hello ${name || "Friend"},

Thank you so much for purchasing a presale ticket for the Akita Japan Fest! We are thrilled to have you join us for this exciting event.

Please find your QR code attached to this email. Show this QR code to the Akita Japan Fest team to exchange it for your physical tickets at the event.

We look forward to seeing you there!

Best regards,
Akita Japan Fest
      `,
        attachments: [
          {
            filename: `${name || "Akita"} - Ticket Presale.pdf`,
            content: ticketPresale,
          },
        ],
      };

      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.error("Error sending email: ", error);
          throw new Error("Error sending email:", error.message);
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
    throw new Error("Error while generating QR Code");
  }
};
