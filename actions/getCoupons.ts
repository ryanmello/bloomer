"use server";

import db from "@/lib/prisma";
import { getCurrentUser } from "@/actions/getCurrentUser";
import { revalidatePath } from "next/cache";

export async function createCoupon(formData: FormData) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { error: "You must be logged in to create coupons" };
    }

    const codeName = formData.get("codeName") as string;
    const description = (formData.get("description") as string)?.trim() || null;
    const discount = parseFloat(formData.get("discount") as string);
    const validUntil = new Date(formData.get("validUntil") as string);

    // Validate inputs
    if (!codeName || !discount || !validUntil) {
      return { error: "All fields are required" };
    }

    if (discount <= 0 || discount > 100) {
      return { error: "Discount must be between 0 and 100" };
    }

    // Check if code already exists
    const existingCoupon = await db.coupon.findUnique({
      where: { codeName },
    });

    if (existingCoupon) {
      return { error: "This coupon code already exists" };
    }

    const coupon = await db.coupon.create({
      data: {
        codeName,
        description,
        discount,
        validUntil,
        userId: user.id,
      },
    });

    revalidatePath("/coupons"); // Adjust path as needed
    return { success: true, coupon };
  } catch (error: any) {
    return { error: error.message || "Failed to create coupon" };
  }
}

export async function getUserCoupons() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { error: "You must be logged in" };
    }

    const coupons = await db.coupon.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });

    return { success: true, coupons };
  } catch (error: any) {
    return { error: error.message || "Failed to fetch coupons" };
  }
}

export async function updateCoupon(id: string, formData: FormData) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { error: "You must be logged in" };
    }

    // Verify the coupon belongs to this user
    const existingCoupon = await db.coupon.findUnique({
      where: { id },
    });

    if (!existingCoupon || existingCoupon.userId !== user.id) {
      return { error: "Coupon not found or unauthorized" };
    }

    const codeName = formData.get("codeName") as string;
    const description = (formData.get("description") as string)?.trim() || null;
    const discount = parseFloat(formData.get("discount") as string);
    const validUntil = new Date(formData.get("validUntil") as string);

    const updatedCoupon = await db.coupon.update({
      where: { id },
      data: {
        codeName,
        description,
        discount,
        validUntil,
      },
    });

    revalidatePath("/coupons");
    return { success: true, coupon: updatedCoupon };
  } catch (error: any) {
    return { error: error.message || "Failed to update coupon" };
  }
}

export async function deleteCoupon(id: string) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { error: "You must be logged in" };
    }

    // Verify the coupon belongs to this user
    const existingCoupon = await db.coupon.findUnique({
      where: { id },
    });

    if (!existingCoupon || existingCoupon.userId !== user.id) {
      return { error: "Coupon not found or unauthorized" };
    }

    await db.coupon.delete({
      where: { id },
    });

    revalidatePath("/coupons");
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Failed to delete coupon" };
  }
}
