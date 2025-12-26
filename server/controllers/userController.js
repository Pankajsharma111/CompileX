import bcrypt from "bcrypt";
import User from "../models/User.js";
import jwt from "jsonwebtoken";

//Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });
};

//API to register user
export const registerUser = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.json({ success: false, message: "User already exists" });
    }

    const user = await User.create({ name, email, password });
    const token = generateToken(user._id);

    res.json({ success: true, token });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

//API to login user
export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (user) {
      const isMatch = await bcrypt.compare(password, user.password);

      if (isMatch) {
        const token = generateToken(user._id);
        return res.json({ success: true, token });
      }
    }

    res.json({ success: false, message: "Invalid email or password" });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

//API to get user data
export const getUser = async (req, res) => {
  try {
    // If protect middleware attached a full user doc you could return it,
    // but to be 100% certain fetch from DB so we have joinedAt / createdAt etc.
    const userId = req.user?._id || req.user?.id;
    if (!userId) return res.json({ success: false, message: "No user found" });

    // fetch full user from DB, exclude password
    const user = await User.findById(userId).select("-password");
    if (!user) return res.json({ success: false, message: "User not found" });

    return res.json({ success: true, user });
  } catch (error) {
    return res.json({ success: false, message: error.message });
  }
};
