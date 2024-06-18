const supabase = require("../utils/supabase");

exports.addEvent = async (req, res) => {
  try {
    const { data: response, error } = await supabase
      .from("events")
      .insert([{ ...req.body }])
      .select();

    if (error) {
      throw new Error(error.message);
    }
    return res.status(201).json({
      message: "Event created successfully",
      data: response,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: "Error while creating event" });
  }
};

exports.checkEventStatus = async (req, res) => {
  try {
    const { data: event, error: eventError } = await supabase
      .from("events")
      .select()
      .eq("id", req.params.id)
      .single();

    if (eventError) {
      console.error("Error get data event:", eventError);
      return res.status(500).json({ error: "Failed to get data" });
    }
    if (event.end_date < new Date()) return res.status(400).json({ error: "Event has ended" });

    return res.status(200).json({
      message: "Event is still ongoing",
      data: event,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: "Error while get event by id" });
  }
};

exports.getAllEvent = async (req, res) => {
  try {
    const { data: response, error } = await supabase
      .from("events")
      .select("*")
      .ilike("event_name", `%${req.query.eventName}%`);
    if (error) {
      throw new Error(error.message);
    }
    return res.status(200).json({
      message: "Get all event successfully",
      data: response,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: "Error while get all event" });
  }
};

exports.deleteEventById = async (req, res) => {
  try {
    const { data: response, error } = await supabase
      .from("events")
      .delete()
      .eq("id", req.params.id);

    if (error) {
      throw new Error(error.message);
    }
    return res.status(200).json({
      message: "Event deleted successfully",
      data: response,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: "Error while deleting event" });
  }
};

exports.updateEventById = async (req, res) => {
  try {
    const { data: response, error } = await supabase
      .from("events")
      .update({ ...req.body, updated_at: new Date() })
      .eq("id", req.params.id);

    if (error) {
      throw new Error(error.message);
    }
    return res.status(200).json({
      message: "Event updated successfully",
      data: response,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: "Error while updating event" });
  }
};
