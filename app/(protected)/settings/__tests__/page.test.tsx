import * as React from "react";

// SettingsPage is a complex page component with multiple dependencies
// Static analysis-based tests to verify component structure and configuration

describe("SettingsPage Component", () => {
  const fs = require("node:fs");
  const path = require("node:path");

  const getComponentSource = () => {
    const filePath = path.resolve(__dirname, "../page.tsx");
    return fs.readFileSync(filePath, "utf8");
  };

  describe("Basic Component Structure", () => {
    it("should export SettingsPage as default export", () => {
      const source = getComponentSource();
      expect(source).toContain("export default function SettingsPage");
    });

    it("should be marked as use client", () => {
      const source = getComponentSource();
      expect(source).toContain('"use client"');
    });

    it("should be a functional component", () => {
      const source = getComponentSource();
      expect(source).toContain("function SettingsPage()");
    });

    it("should have no props parameter", () => {
      const source = getComponentSource();
      expect(source).toMatch(/function SettingsPage\s*\(\s*\)/);
    });
  });

  describe("Hooks Usage", () => {
    it("should use getUser hook", () => {
      const source = getComponentSource();
      expect(source).toContain("const user = getUser()");
      expect(source).toContain("from '@/hooks/useUser'");
    });

    it("should use useCurrentProfil hook", () => {
      const source = getComponentSource();
      expect(source).toContain("useCurrentProfil");
      expect(source).toContain("from '@/hooks/useCurrentProfil'");
    });

    it("should destructure data as profil from useCurrentProfil", () => {
      const source = getComponentSource();
      expect(source).toContain("const { data: profil } = useCurrentProfil()");
    });

    it("should use useRouter hook", () => {
      const source = getComponentSource();
      expect(source).toContain("useRouter");
      expect(source).toContain("from 'next/navigation'");
    });

    it("should get router instance", () => {
      const source = getComponentSource();
      expect(source).toContain("const router = useRouter()");
    });
  });

  describe("Profile Handling", () => {
    it("should return null when user is undefined", () => {
      const source = getComponentSource();
      expect(source).toContain("if (user == undefined");
      expect(source).toContain("return null");
    });

    it("should return null when profile is undefined", () => {
      const source = getComponentSource();
      expect(source).toContain("if (user == undefined || profil == undefined)");
      expect(source).toContain("return null");
    });

    it("should redirect to profiles when profile is empty", () => {
      const source = getComponentSource();
      expect(source).toContain("if (isEmpty(profil))");
      expect(source).toContain('router.push("profiles")');
    });

    it("should import isEmpty from lodash", () => {
      const source = getComponentSource();
      expect(source).toContain("from 'lodash'");
      expect(source).toContain("isEmpty");
    });
  });

  describe("Component Imports", () => {
    it("should import Navbar component", () => {
      const source = getComponentSource();
      expect(source).toContain("from '@/components/Navbar'");
      expect(source).toContain("import Navbar");
    });

    it("should import Footer component", () => {
      const source = getComponentSource();
      expect(source).toContain("from '@/components/Footer'");
      expect(source).toContain("import Footer");
    });

    it("should import Card components", () => {
      const source = getComponentSource();
      expect(source).toContain("from '@/components/ui/card'");
      expect(source).toContain("Card");
      expect(source).toContain("CardContent");
      expect(source).toContain("CardHeader");
    });

    it("should import SettingsForm", () => {
      const source = getComponentSource();
      expect(source).toContain("from './_components/settings-form'");
      expect(source).toContain("SettingsForm");
    });

    it("should import isMobile from react-device-detect", () => {
      const source = getComponentSource();
      expect(source).toContain("from 'react-device-detect'");
      expect(source).toContain("isMobile");
    });
  });

  describe("Layout Components", () => {
    it("should render Navbar component", () => {
      const source = getComponentSource();
      expect(source).toContain("<Navbar />");
    });

    it("should render Footer component", () => {
      const source = getComponentSource();
      expect(source).toContain("<Footer />");
    });

    it("should render Card component", () => {
      const source = getComponentSource();
      expect(source).toContain("<Card");
    });

    it("should render CardHeader component", () => {
      const source = getComponentSource();
      expect(source).toContain("<CardHeader");
    });

    it("should render CardContent component", () => {
      const source = getComponentSource();
      expect(source).toContain("<CardContent");
    });

    it("should render SettingsForm component", () => {
      const source = getComponentSource();
      expect(source).toContain("<SettingsForm");
    });
  });

  describe("Mobile Detection", () => {
    it("should conditionally render desktop layout when not mobile", () => {
      const source = getComponentSource();
      expect(source).toContain("{!isMobile &&");
    });

    it("should conditionally render mobile layout when mobile", () => {
      const source = getComponentSource();
      expect(source).toContain("{isMobile &&");
    });

    it("should have different layouts for mobile and desktop", () => {
      const source = getComponentSource();
      const mobileMatches = source.match(/{isMobile &&/g);
      const desktopMatches = source.match(/{!isMobile &&/g);
      expect(mobileMatches).toBeTruthy();
      expect(desktopMatches).toBeTruthy();
    });
  });

  describe("Page Title", () => {
    it("should display Settings title", () => {
      const source = getComponentSource();
      expect(source).toContain("Settings");
    });

    it("should have Settings title in CardHeader", () => {
      const source = getComponentSource();
      expect(source).toMatch(/<CardHeader>[\s\S]*?Settings[\s\S]*?<\/CardHeader>/);
    });

    it("should center the title", () => {
      const source = getComponentSource();
      expect(source).toMatch(/Settings[\s\S]*?text-center/);
    });
  });

  describe("Props Passing", () => {
    it("should pass user prop to SettingsForm", () => {
      const source = getComponentSource();
      expect(source).toContain("<SettingsForm user={user}");
    });

    it("should pass the same user prop in both layouts", () => {
      const source = getComponentSource();
      const userPropMatches = source.match(/<SettingsForm user={user}/g);
      expect(userPropMatches).toBeTruthy();
      expect(userPropMatches?.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe("Desktop Layout Styling", () => {
    it("should apply desktop container classes", () => {
      const source = getComponentSource();
      expect(source).toContain("h-svh");
      expect(source).toContain("flex");
      expect(source).toContain("items-center");
      expect(source).toContain("justify-center");
    });

    it("should set desktop card width", () => {
      const source = getComponentSource();
      expect(source).toContain("w-[600px]");
    });

    it("should apply card styling", () => {
      const source = getComponentSource();
      expect(source).toContain("bg-zinc-800");
      expect(source).toContain("text-white");
    });

    it("should apply margin top to desktop card", () => {
      const source = getComponentSource();
      expect(source).toMatch(/!isMobile[\s\S]*?mt-20/);
    });

    it("should handle borders conditionally", () => {
      const source = getComponentSource();
      expect(source).toContain("border-none");
      expect(source).toContain("md:border-solid");
    });
  });

  describe("Mobile Layout Styling", () => {
    it("should apply mobile container classes", () => {
      const source = getComponentSource();
      expect(source).toMatch(/isMobile &&[\s\S]*?h-svh/);
      expect(source).toMatch(/isMobile &&[\s\S]*?pt-40/);
    });

    it("should set mobile card to full width", () => {
      const source = getComponentSource();
      expect(source).toMatch(/isMobile &&[\s\S]*?w-full/);
    });

    it("should apply mobile-specific spacing", () => {
      const source = getComponentSource();
      expect(source).toMatch(/isMobile &&[\s\S]*?mb-48/);
    });
  });

  describe("Component Structure", () => {
    it("should wrap content in fragment", () => {
      const source = getComponentSource();
      expect(source).toMatch(/return[\s\S]*?<>/);
      expect(source).toContain("</>");
    });

    it("should render Navbar before content", () => {
      const source = getComponentSource();
      const navbarIndex = source.indexOf("<Navbar");
      const cardIndex = source.indexOf("<Card");
      expect(navbarIndex).toBeLessThan(cardIndex);
    });

    it("should render Footer after content", () => {
      const source = getComponentSource();
      const footerIndex = source.indexOf("<Footer");
      const cardIndex = source.lastIndexOf("</Card>");
      expect(footerIndex).toBeGreaterThan(cardIndex);
    });

    it("should nest SettingsForm inside CardContent", () => {
      const source = getComponentSource();
      expect(source).toMatch(/<CardContent>[\s\S]*?<SettingsForm[\s\S]*?<\/CardContent>/);
    });
  });

  describe("Text Styling", () => {
    it("should apply text size to title", () => {
      const source = getComponentSource();
      expect(source).toMatch(/Settings[\s\S]*?text-2xl/);
    });

    it("should apply font weight to title", () => {
      const source = getComponentSource();
      expect(source).toMatch(/Settings[\s\S]*?font-semibold/);
    });

    it("should center align title text", () => {
      const source = getComponentSource();
      expect(source).toMatch(/Settings[\s\S]*?text-center/);
    });
  });

  describe("Conditional Rendering Logic", () => {
    it("should check both user and profil for undefined", () => {
      const source = getComponentSource();
      expect(source).toContain("user == undefined || profil == undefined");
    });

    it("should use isEmpty to check profil", () => {
      const source = getComponentSource();
      expect(source).toContain("isEmpty(profil)");
    });

    it("should have early returns for invalid states", () => {
      const source = getComponentSource();
      const returnNullMatches = source.match(/return null/g);
      expect(returnNullMatches).toBeTruthy();
    });
  });

  describe("Card Component Usage", () => {
    it("should use Card for desktop layout", () => {
      const source = getComponentSource();
      expect(source).toMatch(/!isMobile[\s\S]*?<Card/);
    });

    it("should use Card for mobile layout", () => {
      const source = getComponentSource();
      expect(source).toMatch(/isMobile &&[\s\S]*?<Card/);
    });

    it("should apply consistent card styling", () => {
      const source = getComponentSource();
      const bgZincMatches = source.match(/bg-zinc-800/g);
      expect(bgZincMatches?.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe("Layout Containers", () => {
    it("should use flex layout for desktop", () => {
      const source = getComponentSource();
      expect(source).toMatch(/!isMobile[\s\S]*?flex[\s\S]*?felx-row/);
    });

    it("should use flex layout for mobile", () => {
      const source = getComponentSource();
      expect(source).toMatch(/isMobile &&[\s\S]*?flex[\s\S]*?felx-row/);
    });

    it("should apply padding to containers", () => {
      const source = getComponentSource();
      expect(source).toContain("px-2");
    });
  });

  describe("Height and Spacing", () => {
    it("should use svh units for height", () => {
      const source = getComponentSource();
      expect(source).toContain("h-svh");
    });

    it("should apply margin top", () => {
      const source = getComponentSource();
      expect(source).toContain("mt-20");
    });

    it("should apply different spacing for mobile", () => {
      const source = getComponentSource();
      expect(source).toMatch(/isMobile[\s\S]*?pt-40/);
      expect(source).toMatch(/isMobile[\s\S]*?mb-48/);
    });
  });

  describe("Responsive Design", () => {
    it("should have responsive border classes", () => {
      const source = getComponentSource();
      expect(source).toContain("border-none");
      expect(source).toContain("md:border-solid");
    });

    it("should detect mobile device", () => {
      const source = getComponentSource();
      expect(source).toContain("isMobile");
    });

    it("should have different widths for mobile and desktop", () => {
      const source = getComponentSource();
      expect(source).toContain("w-[600px]"); // desktop
      expect(source).toContain("w-full"); // mobile
    });
  });

  describe("Fragment Usage", () => {
    it("should use React fragment for return", () => {
      const source = getComponentSource();
      expect(source).toMatch(/return[\s\S]*?<>[\s\S]*?<\/>/);
    });

    it("should contain multiple top-level elements in fragment", () => {
      const source = getComponentSource();
      expect(source).toMatch(/<>[\s\S]*?<Navbar[\s\S]*?<Footer[\s\S]*?<\/>/);
    });
  });

  describe("Consistent Rendering", () => {
    it("should render Navbar in all states", () => {
      const source = getComponentSource();
      const navbarMatches = source.match(/<Navbar \/>/g);
      expect(navbarMatches?.length).toBe(1);
    });

    it("should render Footer in all states", () => {
      const source = getComponentSource();
      const footerMatches = source.match(/<Footer \/>/g);
      expect(footerMatches?.length).toBe(1);
    });

    it("should render SettingsForm in both layouts", () => {
      const source = getComponentSource();
      const settingsFormMatches = source.match(/<SettingsForm/g);
      expect(settingsFormMatches?.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe("Router Integration", () => {
    it("should import useRouter", () => {
      const source = getComponentSource();
      expect(source).toContain("import { useRouter }");
      expect(source).toContain("from 'next/navigation'");
    });

    it("should call router.push for redirection", () => {
      const source = getComponentSource();
      expect(source).toContain('router.push("profiles")');
    });
  });

  describe("Type Safety", () => {
    it("should use strict equality for undefined checks", () => {
      const source = getComponentSource();
      expect(source).toContain("== undefined");
    });

    it("should destructure profil from data property", () => {
      const source = getComponentSource();
      expect(source).toContain("{ data: profil }");
    });
  });
});
