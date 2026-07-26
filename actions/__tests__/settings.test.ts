jest.mock("@/lib/auth", () => ({
  currentUser: jest.fn(),
}));

jest.mock("@/lib/db", () => ({
  db: {
    user: {
      update: jest.fn(),
    },
  },
}));

jest.mock("@/data/user", () => ({
  getUserById: jest.fn(),
  getUserByEmail: jest.fn(),
}));

jest.mock("@/lib/logger", () => ({
  logBackendAction: jest.fn(),
}));

jest.mock("@/lib/mail", () => ({
  sendVerificationEmail: jest.fn(),
}));

jest.mock("@/lib/tokens", () => ({
  generateVerificationToken: jest.fn(),
}));

jest.mock("bcryptjs", () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

import bcrypt from "bcryptjs";

import { getUserByEmail, getUserById } from "@/data/user";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { sendVerificationEmail } from "@/lib/mail";
import { generateVerificationToken } from "@/lib/tokens";

import { settings } from "../settings";

const mockCurrentUser = currentUser as jest.MockedFunction<typeof currentUser>;
const mockGetUserById = getUserById as jest.MockedFunction<typeof getUserById>;
const mockGetUserByEmail = getUserByEmail as jest.MockedFunction<
  typeof getUserByEmail
>;
const mockCompare = bcrypt.compare as jest.MockedFunction<typeof bcrypt.compare>;
const mockHash = bcrypt.hash as jest.MockedFunction<typeof bcrypt.hash>;

const sessionUser = {
  id: "user-1",
  email: "member@example.com",
  isOAuth: false,
};

const databaseUser = {
  id: "user-1",
  name: "Member",
  email: "member@example.com",
  hashedPassword: "stored-hash",
};

describe("settings action", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrentUser.mockResolvedValue(sessionUser as never);
    mockGetUserById.mockResolvedValue(databaseUser as never);
    mockGetUserByEmail.mockResolvedValue(null);
    (db.user.update as jest.Mock).mockResolvedValue(databaseUser);
    mockCompare.mockResolvedValue(true as never);
    mockHash.mockResolvedValue("new-hash" as never);
  });

  it("rejects unauthenticated requests before accessing the database", async () => {
    mockCurrentUser.mockResolvedValue(undefined);

    await expect(settings({ name: "New name" })).resolves.toEqual({
      error: "Unauthorized!",
    });
    expect(mockGetUserById).not.toHaveBeenCalled();
    expect(db.user.update).not.toHaveBeenCalled();
  });

  it("rejects requests when the database user no longer exists", async () => {
    mockGetUserById.mockResolvedValue(null);

    await expect(settings({ name: "New name" })).resolves.toEqual({
      error: "Unauthorized!",
    });
    expect(db.user.update).not.toHaveBeenCalled();
  });

  it("validates incoming values on the server", async () => {
    const result = await settings({ name: "" });

    expect(result).toEqual({ error: "Minimum 2 characters required" });
    expect(db.user.update).not.toHaveBeenCalled();
  });

  it("rejects an email address used by another account", async () => {
    mockGetUserByEmail.mockResolvedValue({
      id: "user-2",
      email: "taken@example.com",
    } as never);

    const result = await settings({
      name: "Member",
      email: "taken@example.com",
    });

    expect(result).toEqual({ error: "Email already in use!" });
    expect(sendVerificationEmail).not.toHaveBeenCalled();
    expect(db.user.update).not.toHaveBeenCalled();
  });

  it("sends a confirmation mail instead of changing the email immediately", async () => {
    (generateVerificationToken as jest.Mock).mockResolvedValue({
      email: "new@example.com",
      token: "verification-token",
    });

    const result = await settings({
      name: "Member",
      email: "new@example.com",
    });

    expect(generateVerificationToken).toHaveBeenCalledWith("new@example.com");
    expect(sendVerificationEmail).toHaveBeenCalledWith(
      "new@example.com",
      "verification-token",
    );
    expect(db.user.update).not.toHaveBeenCalled();
    expect(result).toEqual({ success: "Confirmation email sent!" });
  });

  it("updates profile details and two-factor state without overwriting the password", async () => {
    const result = await settings({
      name: "Updated Member",
      email: "member@example.com",
      isTwoFactorEnabled: true,
      role: "ADMIN",
      password: "",
      newPassword: "",
    });

    expect(db.user.update).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: {
        name: "Updated Member",
        email: "member@example.com",
        isTwoFactorEnabled: true,
      },
    });
    expect(db.user.update).not.toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ role: expect.anything() }),
      }),
    );
    expect(result).toEqual({ success: "Settings updated!" });
  });

  it("rejects an incorrect current password", async () => {
    mockCompare.mockResolvedValue(false as never);

    const result = await settings({
      name: "Member",
      password: "wrong-password",
      newPassword: "New-password-123",
    });

    expect(result).toEqual({ error: "Incorrect password!" });
    expect(mockHash).not.toHaveBeenCalled();
    expect(db.user.update).not.toHaveBeenCalled();
  });

  it("hashes a valid new password before updating the account", async () => {
    const result = await settings({
      name: "Member",
      password: "current-password",
      newPassword: "New-password-123",
    });

    expect(mockCompare).toHaveBeenCalledWith(
      "current-password",
      "stored-hash",
    );
    expect(mockHash).toHaveBeenCalledWith("New-password-123", 10);
    expect(db.user.update).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: {
        name: "Member",
        hashedPassword: "new-hash",
      },
    });
    expect(result).toEqual({ success: "Settings updated!" });
  });

  it("ignores credential and two-factor changes for OAuth accounts", async () => {
    mockCurrentUser.mockResolvedValue({
      ...sessionUser,
      isOAuth: true,
    } as never);

    const result = await settings({
      name: "OAuth Member",
      email: "attacker@example.com",
      password: "current-password",
      newPassword: "New-password-123",
      isTwoFactorEnabled: true,
      role: "ADMIN",
    });

    expect(mockGetUserByEmail).not.toHaveBeenCalled();
    expect(mockCompare).not.toHaveBeenCalled();
    expect(db.user.update).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: { name: "OAuth Member" },
    });
    expect(result).toEqual({ success: "Settings updated!" });
  });
});
