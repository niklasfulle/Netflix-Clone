import { readFileSync } from "node:fs";
import { join } from "node:path";

// Mock modules to allow import of metadata
jest.mock("next-auth/react", () => ({
  SessionProvider: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock("react-hot-toast", () => ({
  Toaster: () => null,
}));

jest.mock("@/auth", () => ({
  auth: jest.fn(),
}));

import { metadata } from "../layout";

describe("RootLayout (layout.tsx)", () => {
  const layoutPath = join(__dirname, "..", "layout.tsx");
  const source = readFileSync(layoutPath, "utf-8");

  describe("Metadata Configuration", () => {
    it("should export metadata", () => {
      expect(metadata).toBeDefined();
    });

    it("should have title Netflix - Home", () => {
      expect(metadata.title).toBe("Netflix - Home");
    });

    it("should have icon metadata set", () => {
      expect(metadata.icons).toBeDefined();
      expect(
        typeof metadata.icons === "object" &&
          !Array.isArray(metadata.icons) &&
          metadata.icons !== null &&
          "icon" in metadata.icons
          ? metadata.icons.icon
          : undefined
      ).toBe("/icon.ico");
    });

    it("metadata should be of correct type", () => {
      expect(typeof metadata.title).toBe("string");
      expect(typeof metadata.icons).toBe("object");
    });

    it("should have title property defined", () => {
      expect("title" in metadata).toBe(true);
    });

    it("should have icons property defined", () => {
      expect("icons" in metadata).toBe(true);
    });
  });

  describe("Component Structure", () => {
    it("should use SessionProvider", () => {
      expect(source).toContain("SessionProvider");
    });

    it("should have html with lang en", () => {
      expect(source).toContain('lang="en"');
    });

    it("should have body element", () => {
      expect(source).toContain("<body");
    });

    it("should apply antialiased class", () => {
      expect(source).toContain("antialiased");
    });

    it("should apply bg-zinc-900 class", () => {
      expect(source).toContain("bg-zinc-900");
    });

    it("should have Toaster component", () => {
      expect(source).toContain("<Toaster");
    });

    it("Toaster should be at bottom-right", () => {
      expect(source).toContain('position="bottom-right"');
    });

    it("Toaster should have gutter of 5", () => {
      expect(source).toContain("gutter={5}");
    });
  });

  describe("CSS and Styling", () => {
    it("should import globals.css", () => {
      expect(source).toContain("import './globals.css'");
    });

    it("should apply global styles", () => {
      expect(source).toContain("className");
    });

    it("should customize scrollbar width", () => {
      expect(source).toContain("[&::-webkit-scrollbar]:w-2");
    });

    it("should style scrollbar track border-radius", () => {
      expect(source).toContain("[&::-webkit-scrollbar-track]:rounded-full");
    });

    it("should style scrollbar thumb border-radius", () => {
      expect(source).toContain("[&::-webkit-scrollbar-thumb]:rounded-full");
    });

    it("should use neutral-700 for track background", () => {
      expect(source).toContain("[&::-webkit-scrollbar-track]:bg-neutral-700");
    });

    it("should use neutral-500 for thumb background", () => {
      expect(source).toContain("[&::-webkit-scrollbar-thumb]:bg-neutral-500");
    });
  });

  describe("NextAuth Integration", () => {
    it("should use SessionProvider", () => {
      expect(source).toContain("SessionProvider");
    });

    it("should call auth() function", () => {
      expect(source).toContain("await auth()");
    });

    it("should pass session to SessionProvider", () => {
      expect(source).toContain("session={session}");
    });
  });

  describe("Component Hierarchy", () => {
    it("SessionProvider should be root", () => {
      expect(source).toContain("<SessionProvider");
      expect(source).toContain("<html");
      expect(source).toContain("<body");
    });

    it("html should be child of SessionProvider", () => {
      const sessionIndex = source.indexOf("<SessionProvider");
      const htmlIndex = source.indexOf("<html");
      expect(htmlIndex).toBeGreaterThan(sessionIndex);
    });

    it("body should be child of html", () => {
      const htmlIndex = source.indexOf("<html");
      const bodyIndex = source.indexOf("<body");
      expect(bodyIndex).toBeGreaterThan(htmlIndex);
    });

    it("children should be inside body", () => {
      const bodyIndex = source.indexOf("<body");
      const childrenIndex = source.indexOf("{children}");
      expect(childrenIndex).toBeGreaterThan(bodyIndex);
    });

    it("Toaster should be last in body", () => {
      const childrenIndex = source.indexOf("{children}");
      const toasterIndex = source.indexOf("<Toaster");
      expect(toasterIndex).toBeGreaterThan(childrenIndex);
    });
  });

  describe("Type Definitions", () => {
    it("should accept Readonly children prop", () => {
      expect(source).toContain("Readonly<{");
    });

    it("should have Metadata type", () => {
      expect(source).toContain(": Metadata");
    });

    it("should return JSX Element", () => {
      expect(source).toContain("return (");
    });
  });

  describe("Component Properties", () => {
    it("should be an async function", () => {
      expect(source).toContain("async function");
    });

    it("should be a Server Component", () => {
      expect(source).not.toContain('"use client"');
    });

    it("should accept children prop", () => {
      expect(source).toContain("children: React.ReactNode");
    });

    it("should render html5 structure", () => {
      expect(source).toContain("<html");
    });

    it("should support internationalization", () => {
      expect(source).toContain('lang="en"');
    });
  });
});
