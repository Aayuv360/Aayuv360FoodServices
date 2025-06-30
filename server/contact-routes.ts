
import { Router } from "express";
import { ContactReview } from "../shared/mongoModels";

const router = Router();

// Submit contact/review form
router.post("/api/contact-review", async (req, res) => {
  try {
    const { name, email, phone, message, rating } = req.body;

    // Validate required fields
    if (!name || !email || !message) {
      return res.status(400).json({ 
        error: "Name, email, and message are required" 
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        error: "Please provide a valid email address" 
      });
    }

    // Validate rating
    if (rating && (rating < 1 || rating > 5)) {
      return res.status(400).json({ 
        error: "Rating must be between 1 and 5" 
      });
    }

    // Create new contact review
    const contactReview = new ContactReview({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: phone?.trim() || null,
      message: message.trim(),
      rating: rating || 5,
      submittedAt: new Date(),
      status: "new"
    });

    await contactReview.save();

    console.log(`New contact/review submitted by ${name} (${email})`);

    res.status(201).json({
      message: "Thank you for your feedback! We'll get back to you soon.",
      id: contactReview._id
    });

  } catch (error) {
    console.error("Error saving contact/review:", error);
    res.status(500).json({ 
      error: "Failed to submit your message. Please try again." 
    });
  }
});

// Get all contact reviews (admin only)
router.get("/api/contact-reviews", async (req, res) => {
  try {
    // Check if user is admin (you may want to add proper auth middleware)
    const user = req.session?.user;
    if (!user || user.role !== "admin") {
      return res.status(403).json({ error: "Access denied" });
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const reviews = await ContactReview.find()
      .sort({ submittedAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await ContactReview.countDocuments();

    res.json({
      reviews,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error("Error fetching contact reviews:", error);
    res.status(500).json({ error: "Failed to fetch reviews" });
  }
});

// Update review status (admin only)
router.patch("/api/contact-reviews/:id/status", async (req, res) => {
  try {
    const user = req.session?.user;
    if (!user || user.role !== "admin") {
      return res.status(403).json({ error: "Access denied" });
    }

    const { id } = req.params;
    const { status } = req.body;

    if (!["new", "in_progress", "resolved", "closed"].includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    const review = await ContactReview.findByIdAndUpdate(
      id,
      { status, updatedAt: new Date() },
      { new: true }
    );

    if (!review) {
      return res.status(404).json({ error: "Review not found" });
    }

    res.json({ message: "Status updated successfully", review });

  } catch (error) {
    console.error("Error updating review status:", error);
    res.status(500).json({ error: "Failed to update status" });
  }
});

export default router;
