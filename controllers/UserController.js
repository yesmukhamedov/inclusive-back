import jwt from "jsonwebtoken";
import bcryptjs from "bcryptjs";
import mongoose from "mongoose";
import User from "../models/User.js";

export const register = async (req, res) => {
  try {
    const salt = await bcryptjs.genSalt(10);
    const hash = await bcryptjs.hash(req.body.password, salt);

    let supervisorObjectId = null;

    if (req.body.supervisorId) {
      try {
        supervisorObjectId = new mongoose.Types.ObjectId(req.body.supervisorId);
      } catch (error) {
        return res.status(400).json({
          status: {
            type: "error",
            message: "Тіркелу орындалмады",
            description: "Мұғалім кодының қате форматы",
          },
        });
      }
    }

    if (supervisorObjectId) {
      const supervisor = await User.findOne({ _id: supervisorObjectId });

      if (!supervisor) {
        return res.status(404).json({
          status: {
            type: "error",
            message: "Тіркелу орындалмады",
            description: "Ұсынылған жетекші жүйеден табылмады",
          },
        });
      }
    }

    const user = new User({
      fullName: req.body.fullName,
      email: req.body.email,
      passwordHash: hash,
      supervisor: supervisorObjectId
    });

    await user.save();

    res.json({
      status: {
        type: "success",
        message: "Қош келдіңіз!",
        description:
          "Жүйеге тіркелу сәтті орындалды. Барлық мәліметтерді жеке парақшаңыздан тексере аласыз",
      },
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      status: {
        type: "error",
        message: "Тіркелу орындалмады",
        description: "Жүйеге тіркелу орындалмады",
      },
    });
  }
};

export const login = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email }).populate({
      path: "supervisor",
      select: "-passwordHash -updatedAt -createdAt -__v",
    });

    if (!user)
      return res.status(404).json({
        status: {
          type: "error",
          message: "Жүйеге кіру орындалмады",
          description: "Электронды почта немесе құпиясөз қате!",
        },
      });

    const isValidPass = await bcryptjs.compare(
      req.body.password,
      user._doc.passwordHash
    );

    if (!isValidPass)
      return res.status(404).json({
        status: {
          type: "error",
          message: "Жүйеге кіру орындалмады",
          description: "Электронды почта немесе құпиясөз қате!",
        },
      });

    const token = jwt.sign({ _id: user._id }, "key", { expiresIn: "30d" });

    const { passwordHash, __v, createdAt, updatedAt, ...userData } = user._doc;

    res.json({
      status: {
        type: "success",
        message: "Қош келдіңіз!",
        description: "Жүйеге кіру сәтті орындалды",
      },
      user: { ...userData, token },
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      status: {
        type: "error",
        message: "Жүйеге кіру орындалмады",
        description: "Жүйеге кіру кезіндегі ескерту",
      },
    });
  }
};

export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.userId).populate({
      path: "supervisor",
      select: "-passwordHash -updatedAt -createdAt -__v",
    });

    if (!user)
      return res.status(404).json({
        status: {
          type: "warning",
          message: "Жүйеге тіркелмеген қолданушы",
          message: "Қолданушы табылмады",
        },
      });

    const { passwordHash, __v, createdAt, updatedAt, ...userData } = user._doc;

    res.json({
      status: {
        type: "success",
        message: user.fullName,
        description: "Жүйеге қайта оралуыңызбен",
      },
      user: userData,
    });
  } catch (err) {
    res.status(500).json({
      status: {
        type: "error",
        message: "Қате",
        description: "Қолданушыны жүйеден іздеу кезіндегі ескерту",
      },
    });
  }
};

export const setTheme = async (req, res) => {
  try {
    const { _id, ...theme } = req.body;
    if (!_id || !theme) return;
    const updatedUser = await User.findByIdAndUpdate(_id, { theme },
      { new: true, select: "-passwordHash -updatedAt -createdAt -__v" }
    );
    if (!updatedUser) {
      return res.status(404).json({
        status: {
          type: "error",
          message: "Өзгерту орындалмады",
          description: "Қолданушы стильін өзгерту кезіндегі ескерту",
        },
      });
    }

    const { passwordHash, __v, createdAt, updatedAt, ...userData } = updatedUser._doc;
    res.json({
      status: {
        type: "success",
        message: "Сәтті орындалды",
        description: `${userData.fullName} өзгерістері сәтті сақталды!`,
      },
      user: userData,
    });
  } catch (error) {
    res.status(500).json({
      status: {
        type: "error",
        message: "Қате",
        description: "Қолданушы стильін өзгерту кезіндегі ескерту",
      },
    });
  }
};

export const getStudents = async (req, res) => {
  try {
    if (!req.userId || !await User.findById(req.userId)) 
      return res.status(400).json({
        status: {
          type: "error",
          message: "Қате",
          description: "Мұғалім ID-і қате!",
        },
      });

    res.json(await User.find({ supervisor: req.userId })
    .select("-supervisor -passwordHash -__v -updatedAt -createdAt"));
  } catch (err) {
    res.status(500).json({
      status: {
        type: "error",
        message: "Қате",
        description: "Қолданушыны жүйеден іздеу кезіндегі ескерту",
      },
    });
  }
};