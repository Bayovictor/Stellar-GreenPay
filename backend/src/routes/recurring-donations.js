/**
 * src/routes/recurring-donations.js
 */
"use strict";
const express = require("express");
const router = express.Router();
const crypto = require("crypto");
const { z } = require("zod");
const logger = require("../logger");
const { sanitizedStringField, validateBody } = require("../middleware/validation");

function generateId() {
  return crypto.randomUUID();
}

const recurringDonationSchema = z.object({
  projectId: z.string().min(1, "projectId is required"),
  projectName: sanitizedStringField({ required: true, maxLength: 200, message: "must not contain HTML" }),
  amountXLM: z
    .union([z.string(), z.number()])
    .transform((value) => {
      if (typeof value === "string") {
        const parsed = Number.parseFloat(value);
        if (Number.isNaN(parsed)) return NaN;
        return parsed;
      }
      return value;
    })
    .refine((val) => Number.isFinite(val) && val >= 1, { message: "Recurring donation must be at least 1 XLM" }),
  startDate: z.string().min(1, "startDate is required"),
  durationMonths: z.union([z.number().int().positive(), z.null()]).optional().default(null),
});

router.post("/", validateBody(recurringDonationSchema), async (req, res, next) => {
  try {
    const { projectId, projectName, amountXLM, startDate, durationMonths } = req.body;

    const donation = {
      id: generateId(),
      projectId,
      projectName,
      amountXLM: amountXLM.toFixed(7),
      startDate: new Date(startDate).toISOString(),
      durationMonths,
      status: "active",
      createdAt: new Date().toISOString(),
    };

    logger.info({ event: "recurring_donation_created", projectId, amountXLM }, "Recurring donation validated");

    res.status(201).json({ success: true, data: donation });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
