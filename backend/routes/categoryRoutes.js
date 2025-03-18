const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Transaction = require("../models/Transaction");
const Category = require("../models/Category");
const Budget = require("../models/Budget");

router.post("/:userid", async (req, res) => {
  const { category_name, color, category_limit } = req.body;
  const userId = req.params.userid;

  try {
    // Find the user by user_id field instead of _id
    const user = await User.findOne({ user_id: userId });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    // return res.status(201).json({ user });

    const category = new Category({
      user_id: userId,
      category_name,
      color,
    });
    await category.save();

    const category_id = category._id;
    const transaction = new Transaction({
      user_id: userId,
      category_id,
      amount: 0,
      description: "Initial Balance",
    });
    await transaction.save();

    const budget = new Budget({
      user_id: userId,
      category_id,
      limit: category_limit,
      startDate: new Date(),
      endDate: new Date(),
    });
    await budget.save();

    res.status(201).json({ category, transaction, budget });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get("/:userid", async (req, res) => {
  const userId = req.params.userid;
  let userCategories = {};
  try {
    const user = await User.findOne({ user_id: userId })
      .select("-password")
      .lean();
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    const categories = await Category.find({ user_id: userId });
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
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete("/:userid/:categoryid", async (req, res) => {
  const { userid, categoryid } = req.params;
  try {
    const category = await Category.findById(categoryid);
    if (!category) {
      return res.status(404).json({ error: "Category not found" });
    }
    const category_id = category._id;
    await Category.findByIdAndDelete(categoryid);
    await Transaction.deleteMany({ user_id: userid, category_id });
    await Budget.deleteMany({ user_id: userid, category_id });
    res.json({ message: "Category deleted" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
