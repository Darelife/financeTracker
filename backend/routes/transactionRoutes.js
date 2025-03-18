const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Transaction = require("../models/Transaction");
const Category = require("../models/Category");
const Budget = require("../models/Budget");

router.get("/:userid", async (req, res) => {
  const category_id = req.body.category_id;
  const user_id = req.params.userid;
  const transactions = await Transaction.find({ user_id, category_id });
  res.json(transactions);
});

router.post("/:userid", async (req, res) => {
  const { category_id, amount, description } = req.body;
  const user_id = req.params.userid;
  try {
    const transaction = new Transaction({
      user_id: user_id,
      category_id: category_id,
      amount: amount,
      description: description,
    });
    await transaction.save();
    // edit the budget
    const budget = await Budget.findOne({ user_id, category_id });
    budget.spent += amount;
    await budget
      .save()
      .then(() => console.log("Budget updated"))
      .catch((err) => console.log("Error updating budget", err));

    res.status(201).json(transaction);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete("/:userid/:transactionid", async (req, res) => {
  const { userid, transactionid } = req.params;
  try {
    const transaction = await Transaction.findById(transactionid);
    if (!transaction) {
      return res.status(404).json({ error: "Transaction not found" });
    }
    const category_id = transaction.category_id;
    const amount = transaction.amount;
    const budget = await Budget.findOne({ user_id: userid, category_id });
    budget.spent -= amount;
    await budget.save();
    await Transaction.findByIdAndDelete(transactionid);
    res.json({ message: "Transaction deleted" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
