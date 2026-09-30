const bcrypt = require("bcryptjs");
const User = require("../models/user");

const signup = async (req, res, next) => {
  try {
    const { firstname, lastname, email, password } = req.body;

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      throw new Error("Email already exists");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      firstname,
      lastname,
      email,
      password: hashedPassword,
      role: "student",
    });

    user.password = undefined;

    res.status(201).json({
      status: "successful",
      data: {
        user,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  signup,
};