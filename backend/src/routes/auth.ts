import { Router, Request, Response } from "express";
import { lucia } from "../lib/auth";
import { db } from "../db/db";
import { profiles, store_members, stores } from "../db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { Argon2id } from "oslo/password";
import { requireAuth } from "../middleware/auth";

export const authRouter = Router();

function extractSessionId(req: Request): string | null {
  const cookieSession = lucia.readSessionCookie(req.headers.cookie ?? "");
  if (cookieSession) return cookieSession;

  const authHeader = req.headers.authorization;
  if (authHeader && typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
    const bearerToken = authHeader.substring(7).trim();
    if (bearerToken && bearerToken !== 'null' && bearerToken !== 'undefined') {
      return bearerToken;
    }
  }
  return null;
}

const handleSignup = async (req: Request, res: Response) => {
  try {
    const { email, password, full_name, role } = req.body;
    
    if (typeof email !== "string" || typeof password !== "string") {
      return res.status(400).json({ error: "Invalid credentials" });
    }
    
    const existingUser = await db.select().from(profiles).where(eq(profiles.email, email.trim().toLowerCase()));
    if (existingUser.length > 0) {
      return res.status(400).json({ error: "User already exists" });
    }

    const hashedPassword = await new Argon2id().hash(password);
    const isPlatform = res.locals.isPlatform || !res.locals.storeId;
    
    // Begin transaction for signup
    const newUser = await db.transaction(async (tx) => {
      // Platform signups are always merchants; Storefront signups are always customers
      const userRole = role || (isPlatform ? "merchant" : "customer");

      const [user] = await tx.insert(profiles).values({
        email: email.trim().toLowerCase(),
        password_hash: hashedPassword,
        full_name: full_name || (isPlatform ? 'Store Owner' : 'Customer'),
        phone: req.body.phone || null,
        role: userRole,
      }).returning();
      
      // Associate with current store only if within a specific store context
      if (res.locals.storeId) {
        await tx.insert(store_members).values({
          store_id: res.locals.storeId,
          user_id: user.id,
          role: userRole === "merchant" || userRole === "admin" ? "owner" : "customer"
        });
      }
      
      return user;
    });

    const session = await lucia.createSession(newUser.id, {});
    const sessionCookie = lucia.createSessionCookie(session.id);
    
    res.setHeader("Set-Cookie", sessionCookie.serialize());
    return res.status(201).json({
      message: "User created",
      token: session.id,
      user: {
        id: newUser.id,
        email: newUser.email,
        full_name: newUser.full_name,
        role: newUser.role,
      }
    });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ error: "An error occurred during signup" });
  }
};

authRouter.post("/signup", handleSignup);
authRouter.post("/register", handleSignup);

authRouter.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (typeof email !== "string" || typeof password !== "string") {
      return res.status(400).json({ error: "Invalid credentials" });
    }
    
    const [existingUser] = await db.select().from(profiles).where(eq(profiles.email, email.trim().toLowerCase()));
    
    if (!existingUser || !existingUser.password_hash) {
      return res.status(400).json({ error: "Incorrect email or password" });
    }
    
    let validPassword = false;
    try {
      validPassword = await new Argon2id().verify(existingUser.password_hash, password);
    } catch (e) {
      validPassword = false; // Gracefully handle invalid hash formats
    }
    
    if (!validPassword) {
      return res.status(400).json({ error: "Incorrect email or password" });
    }

    const isPlatform = res.locals.isPlatform || !res.locals.storeId;

    // ── Architectural Security Guard: Prevent Storefront Customers from Logging into Platform ──
    if (isPlatform) {
      // Check if this user has any merchant/admin store roles
      const merchantMemberships = await db
        .select({
          store_id: store_members.store_id,
          role: store_members.role,
        })
        .from(store_members)
        .where(
          and(
            eq(store_members.user_id, existingUser.id),
            inArray(store_members.role, ['owner', 'admin', 'member'])
          )
        );

      const isMerchantOrAdmin = existingUser.role === 'merchant' || existingUser.role === 'admin' || existingUser.role === 'seller' || merchantMemberships.length > 0;

      if (!isMerchantOrAdmin && existingUser.role === 'customer') {
        // Find their registered storefront to provide a helpful redirect
        const [customerStore] = await db
          .select({
            store_name: stores.name,
            store_hostname: stores.hostname
          })
          .from(store_members)
          .innerJoin(stores, eq(stores.id, store_members.store_id))
          .where(eq(store_members.user_id, existingUser.id))
          .limit(1);

        return res.status(403).json({
          error: "CUSTOMER_ACCOUNT_ON_PLATFORM",
          message: "This is the Merchant Platform portal. You have a customer account. Please log in directly on your store's website.",
          storeName: customerStore?.store_name || "your store",
          storeHostname: customerStore?.store_hostname || null,
          storeUrl: customerStore?.store_hostname ? `https://${customerStore.store_hostname}/auth` : null
        });
      }
    }
    
    // Auto-associate or verify store membership if logging in on a specific store tenant domain
    if (res.locals.storeId) {
      const [membership] = await db.select().from(store_members).where(
        and(eq(store_members.store_id, res.locals.storeId), eq(store_members.user_id, existingUser.id))
      );
      
      if (!membership) {
        // Automatically enroll customer to this store
        await db.insert(store_members).values({
          store_id: res.locals.storeId,
          user_id: existingUser.id,
          role: existingUser.role === 'admin' || existingUser.role === 'merchant' ? 'member' : 'customer'
        }).onConflictDoNothing();
      }
    }

    const session = await lucia.createSession(existingUser.id, {});
    const sessionCookie = lucia.createSessionCookie(session.id);
    
    // Fetch associated store if owner/admin
    let store = null;
    try {
      const [membership] = await db
        .select({ store_id: store_members.store_id, role: store_members.role })
        .from(store_members)
        .where(
          and(
            eq(store_members.user_id, existingUser.id),
            inArray(store_members.role, ['owner', 'admin', 'member'])
          )
        )
        .limit(1);

      if (membership) {
        const [storeRow] = await db
          .select({ id: stores.id, name: stores.name, slug: stores.slug, hostname: stores.hostname, logo_url: stores.logo_url, is_active: stores.is_active })
          .from(stores)
          .where(eq(stores.id, membership.store_id))
          .limit(1);
        store = storeRow || null;
      }
    } catch (_) {}

    res.setHeader("Set-Cookie", sessionCookie.serialize());
    return res.status(200).json({
      message: "Logged in",
      token: session.id,
      user: {
        id: existingUser.id,
        email: existingUser.email,
        full_name: existingUser.full_name,
        role: existingUser.role,
        avatar_url: existingUser.avatar_url,
        phone: existingUser.phone,
      },
      store,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "An error occurred during login" });
  }
});

authRouter.post("/logout", async (req, res) => {
  try {
    const sessionId = extractSessionId(req);
    if (!sessionId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    await lucia.invalidateSession(sessionId);
    
    const sessionCookie = lucia.createBlankSessionCookie();
    res.setHeader("Set-Cookie", sessionCookie.serialize());
    return res.status(200).json({ message: "Logged out" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "An error occurred" });
  }
});

authRouter.get("/me", async (req, res) => {
  try {
    const sessionId = extractSessionId(req);
    if (!sessionId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { session, user } = await lucia.validateSession(sessionId);
    
    if (!session) {
      const sessionCookie = lucia.createBlankSessionCookie();
      res.setHeader("Set-Cookie", sessionCookie.serialize());
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    if (session && session.fresh) {
      const sessionCookie = lucia.createSessionCookie(session.id);
      res.setHeader("Set-Cookie", sessionCookie.serialize());
    }

    // Get full user profile
    const [profile] = await db
      .select({
        id: profiles.id,
        email: profiles.email,
        full_name: profiles.full_name,
        role: profiles.role,
        avatar_url: profiles.avatar_url,
        phone: profiles.phone,
        gender: profiles.gender,
        date_of_birth: profiles.date_of_birth,
      })
      .from(profiles)
      .where(eq(profiles.id, user.id));

    // Fetch the user's owned/admin store so the dashboard can show store context
    let store = null;
    try {
      const [membership] = await db
        .select({ store_id: store_members.store_id, role: store_members.role })
        .from(store_members)
        .where(
          and(
            eq(store_members.user_id, user.id),
            inArray(store_members.role, ['owner', 'admin', 'member'])
          )
        )
        .limit(1);

      if (membership) {
        const [storeRow] = await db
          .select({ id: stores.id, name: stores.name, slug: stores.slug, hostname: stores.hostname, logo_url: stores.logo_url, is_active: stores.is_active })
          .from(stores)
          .where(eq(stores.id, membership.store_id))
          .limit(1);
        store = storeRow || null;
      }
    } catch (_) {
      // non-fatal: dashboard works without store info
    }

    return res.status(200).json({
      token: session.id,
      user: profile || user,
      store,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "An error occurred" });
  }
});

// Update Profile
authRouter.put("/profile", requireAuth, async (req, res) => {
  try {
    const userId = res.locals.user.id;
    const { full_name, fullName, phone, avatar_url, avatar, gender, date_of_birth, dateOfBirth } = req.body;

    const updates: any = {};
    if (full_name !== undefined) updates.full_name = full_name;
    if (fullName !== undefined) updates.full_name = fullName;
    if (phone !== undefined) updates.phone = phone;
    if (avatar_url !== undefined) updates.avatar_url = avatar_url;
    if (avatar !== undefined) updates.avatar_url = avatar;
    if (gender !== undefined) updates.gender = gender;
    if (date_of_birth !== undefined) updates.date_of_birth = date_of_birth;
    if (dateOfBirth !== undefined) updates.date_of_birth = dateOfBirth;

    if (Object.keys(updates).length > 0) {
      await db.update(profiles).set(updates).where(eq(profiles.id, userId));
    }

    const [updated] = await db.select().from(profiles).where(eq(profiles.id, userId));
    return res.status(200).json({
      success: true,
      user: {
        id: updated.id,
        email: updated.email,
        full_name: updated.full_name,
        role: updated.role,
        avatar_url: updated.avatar_url,
        phone: updated.phone,
        gender: updated.gender,
        date_of_birth: updated.date_of_birth,
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Change Password
authRouter.post("/change-password", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = res.locals.user.id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: "Current password and new password are required" });
    }

    if (typeof newPassword !== 'string' || newPassword.length < 6) {
      return res.status(400).json({ error: "New password must be at least 6 characters long" });
    }

    const [existingUser] = await db.select().from(profiles).where(eq(profiles.id, userId));
    if (!existingUser || !existingUser.password_hash) {
      return res.status(400).json({ error: "User account does not have a password configured" });
    }

    const validPassword = await new Argon2id().verify(existingUser.password_hash, currentPassword);
    if (!validPassword) {
      return res.status(400).json({ error: "Current password is incorrect" });
    }

    const newHashedPassword = await new Argon2id().hash(newPassword);
    await db.update(profiles).set({ password_hash: newHashedPassword, updated_at: new Date() }).where(eq(profiles.id, userId));

    return res.status(200).json({ success: true, message: "Password updated successfully" });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: "Failed to change password" });
  }
});

