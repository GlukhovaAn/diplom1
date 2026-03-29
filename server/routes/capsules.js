const express = require("express");
const router = express.Router();
const Capsule = require("../models/Capsule");
const { protect } = require("../middleware/auth");
const { generateCapsule } = require("../services/capsuleService");

// ==================== PUBLIC ROUTES ====================

// Get all capsules (with filters)
router.get("/", async (req, res) => {
  try {
    const {
      type,
      isTrending,
      isPublished = true,
      user,
      sort = "-createdAt",
      page = 1,
      limit = 12,
    } = req.query;

    const query = {};

    if (type) {
      query.type = type;
    }

    if (isTrending !== undefined) {
      query.isTrending = isTrending === "true";
    }

    if (isPublished !== undefined) {
      query.isPublished = isPublished === "true";
    }

    if (user) {
      query.user = user;
    }

    const total = await Capsule.countDocuments(query);

    const capsules = await Capsule.find(query)
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate("items.product products")
      .lean();

    res.json({
      capsules,
      pagination: {
        page: Number(page),
        pages: Math.ceil(total / limit),
        total,
      },
    });
  } catch (error) {
    console.error("Error fetching capsules:", error);
    res.status(500).json({ message: error.message });
  }
});

// Get single capsule
router.get("/:id", async (req, res) => {
  try {
    const capsule = await Capsule.findById(req.params.id).populate(
      "items.product products"
    );

    if (!capsule) {
      return res.status(404).json({ message: "Capsule not found" });
    }

    // увеличиваем просмотры
    capsule.stats.views += 1;
    await capsule.save();

    res.json(capsule);
  } catch (error) {
    console.error("Error fetching capsule:", error);
    res.status(500).json({ message: error.message });
  }
});

// Get trending capsules (отдельный endpoint для фронта)
router.get("/featured/trending", async (req, res) => {
  try {
    const capsules = await Capsule.find({
      isTrending: true,
      isPublished: true,
    })
      .sort("-priority -createdAt")
      .limit(10)
      .populate("items.product products")
      .lean();

    res.json(capsules);
  } catch (error) {
    console.error("Error fetching trending capsules:", error);
    res.status(500).json({ message: error.message });
  }
});

// Get personal capsules (для текущего пользователя)
router.get("/user/me", protect, async (req, res) => {
  try {
    const capsules = await Capsule.find({
      user: req.user._id,
      type: "personal",
    })
      .sort("-createdAt")
      .populate("items.product products")
      .lean();

    res.json(capsules);
  } catch (error) {
    console.error("Error fetching user capsules:", error);
    res.status(500).json({ message: error.message });
  }
});

// ==================== ADMIN ROUTES ====================

// Create capsule
router.post("/", protect, async (req, res) => {
  try {
    if (req.user.email !== "admin@gmail.com") {
      return res.status(403).json({ message: "Not authorized" });
    }

    const capsule = new Capsule(req.body);

    const savedCapsule = await capsule.save();

    res.status(201).json(savedCapsule);
  } catch (error) {
    console.error("Error creating capsule:", error);
    res.status(400).json({ message: error.message });
  }
});

// Update capsule
router.put("/:id", protect, async (req, res) => {
  try {
    if (req.user.email !== "admin@gmail.com") {
      return res.status(403).json({ message: "Not authorized" });
    }

    const capsule = await Capsule.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!capsule) {
      return res.status(404).json({ message: "Capsule not found" });
    }

    res.json(capsule);
  } catch (error) {
    console.error("Error updating capsule:", error);
    res.status(400).json({ message: error.message });
  }
});

// Delete capsule
router.delete("/:id", protect, async (req, res) => {
  try {
    if (req.user.email !== "admin@gmail.com") {
      return res.status(403).json({ message: "Not authorized" });
    }

    const capsule = await Capsule.findByIdAndDelete(req.params.id);

    if (!capsule) {
      return res.status(404).json({ message: "Capsule not found" });
    }

    res.json({ message: "Capsule deleted successfully" });
  } catch (error) {
    console.error("Error deleting capsule:", error);
    res.status(500).json({ message: error.message });
  }
});

// ==================== EXTRA (очень полезно) ====================

// Regenerate auto capsule
router.post("/:id/regenerate", protect, async (req, res) => {
  try {
    if (req.user.email !== "admin@gmail.com") {
      return res.status(403).json({ message: "Not authorized" });
    }

    const capsule = await Capsule.findById(req.params.id);

    if (!capsule) {
      return res.status(404).json({ message: "Capsule not found" });
    }

    const items = await generateCapsule(capsule);

    capsule.items = items;
    capsule.products = items.map((i) => i.product);
    capsule.lastGeneratedAt = new Date();

    await capsule.save();

    res.json(capsule);
  } catch (error) {
    console.error("Error regenerating capsule:", error);
    res.status(500).json({ message: error.message });
  }
});

router.post("/generate-all", protect, async (req, res) => {
  try {
    if (req.user.email !== "admin@gmail.com") {
      return res.status(403).json({ message: "Not authorized" });
    }

    const capsules = await Capsule.find({ type: "auto" });

    for (const capsule of capsules) {
      const items = await generateCapsule(capsule);

      capsule.items = items;
      capsule.products = items.map((i) => i.product);
      capsule.lastGeneratedAt = new Date();

      await capsule.save();
    }

    res.json({ message: "All capsules generated", count: capsules.length });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
