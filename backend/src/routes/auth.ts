import { Router } from "express";
import { lucia } from "../lib/auth";
import { db } from "../db/db";
import { profiles, store_members, stores } from "../db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { Argon2id } from "oslo/password";

export const authRouter = Router();

authRouter.post("/signup", async (req, res) => {
  try {
    const { email, password, full_name, role } = req.body;
    
    if (typeof email !== "string" || typeof password !== "string") {
      return res.status(400).json({ error: "Invalid credentials" });
    }
    
    const existingUser = await db.select().from(profiles).where(eq(profiles.email, email));
    if (existingUser.length > 0) {
      return res.status(400).json({ error: "User already exists" });
    }

    const hashedPassword = await new Argon2id().hash(password);
    
    // Begin transaction for signup
    const newUser = await db.transaction(async (tx) => {
      const userRole = role || (res.locals.storeId ? "customer" : "merchant");

      const [user] = await tx.insert(profiles).values({
        email,
        password_hash: hashedPassword,
        full_name: full_name || 'User',
        phone: req.body.phone || null,
        role: userRole,
      }).returning();
      
      // Associate with current store only if within a specific store context
      if (res.locals.storeId) {
        await tx.insert(store_members).values({
          store_id: res.locals.storeId,
          user_id: user.id,
          role: userRole === "merchant" ? "owner" : "customer"
        });
      }
      
      return user;
    });

    const session = await lucia.createSession(newUser.id, {});
    const sessionCookie = lucia.createSessionCookie(session.id);
    
    res.setHeader("Set-Cookie", sessionCookie.serialize());
    return res.status(201).json({
      message: "User created",
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
});

authRouter.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (typeof email !== "string" || typeof password !== "string") {
      return res.status(400).json({ error: "Invalid credentials" });
    }
    
    const [existingUser] = await db.select().from(profiles).where(eq(profiles.email, email));
    
    if (!existingUser || !existingUser.password_hash) {
      return res.status(400).json({ error: "Incorrect email or password" });
    }
    
    let validPassword = false;
    try {
      validPassword = await new Argon2id().verify(existingUser.password_hash, password);
    } catch (e) {
      validPassword = false; // Gracefully handle invalid hash formats (e.g. from migrations)
    }
    
    if (!validPassword) {
      return res.status(400).json({ error: "Incorrect email or password" });
    }
    
    // Verify store membership IF logging in on a specific store tenant domain
    if (res.locals.storeId) {
      const [membership] = await db.select().from(store_members).where(
        and(eq(store_members.store_id, res.locals.storeId), eq(store_members.user_id, existingUser.id))
      );
      
      if (!membership && existingUser.role !== 'admin' && existingUser.role !== 'merchant' && !existingUser.is_super_admin) {
        return res.status(403).json({ error: "User does not belong to this store" });
      }
    }

    const session = await lucia.createSession(existingUser.id, {});
    const sessionCookie = lucia.createSessionCookie(session.id);
    
    res.setHeader("Set-Cookie", sessionCookie.serialize());
    return res.status(200).json({
      message: "Logged in",
      user: {
        id: existingUser.id,
        email: existingUser.email,
        full_name: existingUser.full_name,
        role: existingUser.role,
      }
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "An error occurred during login" });
  }
});

authRouter.post("/logout", async (req, res) => {
  try {
    const sessionId = lucia.readSessionCookie(req.headers.cookie ?? "");
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
    const sessionId = lucia.readSessionCookie(req.headers.cookie ?? "");
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
          .select({ id: stores.id, name: stores.name, hostname: stores.hostname, logo_url: stores.logo_url, is_active: stores.is_active })
          .from(stores)
          .where(eq(stores.id, membership.store_id))
          .limit(1);
        store = storeRow || null;
      }
    } catch (_) {
      // non-fatal: dashboard works without store info
    }

    return res.status(200).json({ user, store });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "An error occurred" });
  }
});
