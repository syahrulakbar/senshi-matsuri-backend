const supabase = require("../utils/supabase");

exports.addTenant = async (req, res) => {
  try {
    const { data: response, error } = await supabase
      .from("tenant")
      .insert([{ ...req.body, status: "pending" }])
      .select()
      .single();

    if (error) {
      console.error("Error get data event:", error);
      return res.status(500).json({ error: "Failed to create tenant" });
    }
    return res.status(201).json({
      message: "Tenant created successfully",
      data: response,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send({
      message: "Error while creating Tenant",
    });
  }
};
