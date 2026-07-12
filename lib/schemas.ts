import { z } from "zod";

export const seatSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^([1-9]|[1-2][0-9]|3[0-2])[A-F]$/, "Enter a seat like 18A");

export const checkoutSchema = z.object({
  seat: seatSchema,
  itemId: z.string().min(1, "Choose a meal"),
  serviceWindow: z.enum(["Main service", "After take-off"]),
});

export const discountApprovalSchema = z.object({
  discount: z.number().min(0).max(15),
  remainingMargin: z.number().min(25),
});
