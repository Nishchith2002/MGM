// server/controllers/authController.js
const axios = require("axios");
const qs = require("qs");

exports.loginToSkySpark = async (req, res) => {
  const { username, password } = req.body;

  try {
    const response = await axios.post(
      `${process.env.SKY_HOST}/api/auth`,
      qs.stringify({ user: username, pass: password }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        withCredentials: true,
      }
    );

    const cookies = response.headers["set-cookie"];
    if (cookies) {
      res.setHeader("Set-Cookie", cookies);
    }

    return res.status(200).json({ success: true, message: "Login successful" });
  } catch (err) {
    return res.status(401).json({ success: false, message: "Login failed" });
  }
};
