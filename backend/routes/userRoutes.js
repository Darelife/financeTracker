const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Transaction = require("../models/Transaction");
const Category = require("../models/Category");
const Budget = require("../models/Budget");

router.get("/", async (req, res) => {
  const users = await User.find();
  res.json(users);
});

router.get("/verify", async (req, res) => {
  const { user_id, password } = req.body;
  const user = await User.findOne({
    user_id,
    password,
  });
  if (user_id == "admin" && password == "admin") {
    res.status(200).json({ admin: true });
  } else if (user) {
    res.status(200).json({ admin: false }, user);
  } else {
    res.status(400).json({ error: "Invalid credentials" }, { admin: false });
  }
});

router.post("/", async (req, res) => {
  const { user_id, name, email, password, balance } = req.body;
  try {
    const user = new User({ user_id, name, email, password, balance });
    await user.save();
    res.status(201).json(user);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// for each user, get the categories -> for each category, get the limit data, and then, the transactions
/*
  {
    user : {
      userData
    },
    categories : {
      categoryId1 : {
        CategoryData,
        Limit : {
          limitData
        },
        Transactions : [
          transaction1,
          transaction2,
          ...
        ]
      }
    }  
  }
*/
router.get("/:userid", async (req, res) => {
  const userId = req.params.userid;
  const user = await User.findOne({ user_id: userId })
    .select("-password")
    .lean();
  const categories = await Category.find({ user_id: userId });
  const userCategories = {};
  for (let category of categories) {
    const category_id = category._id;
    const limit = await Budget.findOne({ user_id: userId, category_id });
    const transactions = await Transaction.find({
      user_id: userId,
      category_id,
    });
    userCategories[category_id] = {
      CategoryData: category,
      Limit: limit,
      Transactions: transactions,
    };
  }
  res.json({ user, categories: userCategories });
});

router.delete("/:userid", async (req, res) => {
  const userId = req.params.userid;
  try {
    await User.deleteOne({ user_id: userId });
    await Category.deleteMany({ user_id: userId });
    await Budget.deleteMany({ user_id: userId });
    await Transaction.deleteMany({ user_id: userId });
    res.json({ message: "User deleted" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
