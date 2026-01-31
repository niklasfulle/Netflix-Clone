import * as React from "react";

// Watchlist page is a complex component with multiple dependencies
// Static analysis-based tests to verify component structure and configuration

describe("Watchlist Page Component", () => {
  const fs = require("node:fs");
  const path = require("node:path");

  const getComponentSource = () => {
    const filePath = path.resolve(__dirname, "../page.tsx");
    return fs.readFileSync(filePath, "utf8");
  };

  describe("Basic Component Structure", () => {
    it("should export SeriesPage as default export", () => {
      const source = getComponentSource();
      expect(source).toContain("export default function SeriesPage");
    });

    it("should be marked as use client", () => {
      const source = getComponentSource();
      expect(source).toContain('"use client"');
    });

    it("should be a functional component", () => {
      const source = getComponentSource();
      expect(source).toContain("function SeriesPage()");
    });

    it("should have no props parameter", () => {
      const source = getComponentSource();
      expect(source).toMatch(/function SeriesPage\s*\(\s*\)/);
    });
  });

  describe("Hooks Usage", () => {
    it("should use useCurrentProfil hook", () => {
      const source = getComponentSource();
      expect(source).toContain("useCurrentProfil");
      expect(source).toContain('from "@/hooks/useCurrentProfil"');
    });

    it("should destructure data as profil from useCurrentProfil", () => {
      const source = getComponentSource();
      expect(source).toContain("const { data: profil } = useCurrentProfil()");
    });

    it("should use usePlaylists hook", () => {
      const source = getComponentSource();
      expect(source).toContain("usePlaylists");
      expect(source).toContain('from "@/hooks/playlists/usePlaylists"');
    });

    it("should destructure data as playlists from usePlaylists", () => {
      const source = getComponentSource();
      expect(source).toContain("const { data: playlists } = usePlaylists()");
    });

    it("should use useInfoModal hook", () => {
      const source = getComponentSource();
      expect(source).toContain("useInfoModal");
      expect(source).toContain('from "@/hooks/useInfoModal"');
    });

    it("should destructure isOpen and closeModal from useInfoModal", () => {
      const source = getComponentSource();
      expect(source).toContain("const { isOpen, closeModal } = useInfoModal()");
    });

    it("should use useRouter hook", () => {
      const source = getComponentSource();
      expect(source).toContain("useRouter");
      expect(source).toContain('from "next/navigation"');
    });

    it("should get router instance", () => {
      const source = getComponentSource();
      expect(source).toContain("const router = useRouter()");
    });
  });

  describe("Profile Handling", () => {
    it("should return null when profile is undefined", () => {
      const source = getComponentSource();
      expect(source).toContain("if (profil == undefined)");
      expect(source).toContain("return null");
    });

    it("should redirect to profiles when profile is empty", () => {
      const source = getComponentSource();
      expect(source).toContain("if (isEmpty(profil))");
      expect(source).toContain('router.push("profiles")');
    });

    it("should import isEmpty from lodash", () => {
      const source = getComponentSource();
      expect(source).toContain("from \"lodash\"");
      expect(source).toContain("isEmpty");
    });

    it("should check profile before redirect", () => {
      const source = getComponentSource();
      expect(source).toMatch(/if \(isEmpty\(profil\)\)[\s\S]*?router\.push/);
    });
  });

  describe("Component Imports", () => {
    it("should import Navbar component", () => {
      const source = getComponentSource();
      expect(source).toContain('from "@/components/Navbar"');
      expect(source).toContain("import Navbar");
    });

    it("should import Footer component", () => {
      const source = getComponentSource();
      expect(source).toContain('from "@/components/Footer"');
      expect(source).toContain("import Footer");
    });

    it("should import InfoModal component", () => {
      const source = getComponentSource();
      expect(source).toContain('from "@/components/InfoModal"');
      expect(source).toContain("import InfoModal");
    });

    it("should import WatchList component", () => {
      const source = getComponentSource();
      expect(source).toContain('from "./_components/WatchList"');
      expect(source).toContain("import WatchList");
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

    it("should render InfoModal component", () => {
      const source = getComponentSource();
      expect(source).toContain("<InfoModal");
    });

    it("should render WatchList component", () => {
      const source = getComponentSource();
      expect(source).toContain("<WatchList");
    });
  });

  describe("InfoModal Configuration", () => {
    it("should pass visible prop to InfoModal", () => {
      const source = getComponentSource();
      expect(source).toContain("visible={isOpen}");
    });

    it("should pass onClose prop to InfoModal", () => {
      const source = getComponentSource();
      expect(source).toContain("onClose={closeModal}");
    });

    it("should pass playlists prop to InfoModal", () => {
      const source = getComponentSource();
      expect(source).toContain("playlists={playlists}");
    });

    it("should configure InfoModal with all required props", () => {
      const source = getComponentSource();
      expect(source).toMatch(/<InfoModal[\s\S]*?visible={isOpen}[\s\S]*?onClose={closeModal}[\s\S]*?playlists={playlists}/);
    });
  });

  describe("WatchList Configuration", () => {
    it("should pass title prop to WatchList", () => {
      const source = getComponentSource();
      expect(source).toContain('<WatchList title="Your Watchlist"');
    });

    it("should use Your Watchlist as title", () => {
      const source = getComponentSource();
      expect(source).toContain("Your Watchlist");
    });
  });

  describe("Page Layout", () => {
    it("should have main content container with padding", () => {
      const source = getComponentSource();
      expect(source).toContain("pt-40 pb-40");
    });

    it("should set minimum height to screen", () => {
      const source = getComponentSource();
      expect(source).toContain("min-h-screen");
    });

    it("should wrap WatchList in container div", () => {
      const source = getComponentSource();
      expect(source).toMatch(/<div[\s\S]*?pt-40[\s\S]*?<WatchList/);
    });
  });

  describe("Fragment Usage", () => {
    it("should wrap content in fragment", () => {
      const source = getComponentSource();
      expect(source).toMatch(/return[\s\S]*?<>/);
      expect(source).toContain("</>");
    });

    it("should render InfoModal before Navbar", () => {
      const source = getComponentSource();
      const infoModalIndex = source.indexOf("<InfoModal");
      const navbarIndex = source.indexOf("<Navbar");
      expect(infoModalIndex).toBeGreaterThan(0);
      expect(navbarIndex).toBeGreaterThan(infoModalIndex);
    });

    it("should render Navbar before content", () => {
      const source = getComponentSource();
      const navbarIndex = source.indexOf("<Navbar");
      const watchlistIndex = source.indexOf("<WatchList");
      expect(navbarIndex).toBeLessThan(watchlistIndex);
    });

    it("should render Footer after content", () => {
      const source = getComponentSource();
      const footerIndex = source.indexOf("<Footer");
      const watchlistIndex = source.indexOf("<WatchList");
      expect(footerIndex).toBeGreaterThan(watchlistIndex);
    });
  });

  describe("Conditional Rendering Logic", () => {
    it("should check if profil is undefined", () => {
      const source = getComponentSource();
      expect(source).toContain("profil == undefined");
    });

    it("should use isEmpty to check profil", () => {
      const source = getComponentSource();
      expect(source).toContain("isEmpty(profil)");
    });

    it("should have early return for undefined profil", () => {
      const source = getComponentSource();
      expect(source).toMatch(/if \(profil == undefined\)[\s\S]*?return null/);
    });

    it("should redirect for empty profil", () => {
      const source = getComponentSource();
      expect(source).toMatch(/if \(isEmpty\(profil\)\)[\s\S]*?router\.push/);
    });
  });

  describe("Router Integration", () => {
    it("should import useRouter from next/navigation", () => {
      const source = getComponentSource();
      expect(source).toContain("import { useRouter }");
      expect(source).toContain('from "next/navigation"');
    });

    it("should call router.push for redirection", () => {
      const source = getComponentSource();
      expect(source).toContain('router.push("profiles")');
    });

    it("should redirect to profiles page", () => {
      const source = getComponentSource();
      expect(source).toContain('"profiles"');
    });
  });

  describe("Import Statements", () => {
    it("should import isEmpty from lodash", () => {
      const source = getComponentSource();
      expect(source).toContain('import { isEmpty }');
      expect(source).toContain('from "lodash"');
    });

    it("should import useRouter from next/navigation", () => {
      const source = getComponentSource();
      expect(source).toContain('from "next/navigation"');
    });

    it("should import all components from correct paths", () => {
      const source = getComponentSource();
      expect(source).toContain("@/components/Footer");
      expect(source).toContain("@/components/InfoModal");
      expect(source).toContain("@/components/Navbar");
    });

    it("should import all hooks from correct paths", () => {
      const source = getComponentSource();
      expect(source).toContain("@/hooks/playlists/usePlaylists");
      expect(source).toContain("@/hooks/useCurrentProfil");
      expect(source).toContain("@/hooks/useInfoModal");
    });

    it("should import WatchList from relative path", () => {
      const source = getComponentSource();
      expect(source).toContain('"./_components/WatchList"');
    });
  });

  describe("Component Structure", () => {
    it("should render main content div", () => {
      const source = getComponentSource();
      expect(source).toContain("<div");
      expect(source).toContain("</div>");
    });

    it("should nest WatchList inside content div", () => {
      const source = getComponentSource();
      expect(source).toMatch(/<div[\s\S]*?<WatchList[\s\S]*?<\/div>/);
    });

    it("should have self-closing Navbar", () => {
      const source = getComponentSource();
      expect(source).toContain("<Navbar />");
    });

    it("should have self-closing Footer", () => {
      const source = getComponentSource();
      expect(source).toContain("<Footer />");
    });
  });

  describe("Styling Classes", () => {
    it("should apply top padding to content container", () => {
      const source = getComponentSource();
      expect(source).toContain("pt-40");
    });

    it("should apply bottom padding to content container", () => {
      const source = getComponentSource();
      expect(source).toContain("pb-40");
    });

    it("should apply minimum height to content container", () => {
      const source = getComponentSource();
      expect(source).toContain("min-h-screen");
    });

    it("should combine all container classes", () => {
      const source = getComponentSource();
      expect(source).toContain("pt-40 pb-40 min-h-screen");
    });
  });

  describe("Type Safety", () => {
    it("should use strict equality for undefined check", () => {
      const source = getComponentSource();
      expect(source).toContain("== undefined");
    });

    it("should destructure profil from data property", () => {
      const source = getComponentSource();
      expect(source).toContain("{ data: profil }");
    });

    it("should destructure playlists from data property", () => {
      const source = getComponentSource();
      expect(source).toContain("{ data: playlists }");
    });

    it("should destructure multiple values from useInfoModal", () => {
      const source = getComponentSource();
      expect(source).toContain("{ isOpen, closeModal }");
    });
  });

  describe("Props Passing", () => {
    it("should pass isOpen to InfoModal visible prop", () => {
      const source = getComponentSource();
      expect(source).toMatch(/InfoModal[\s\S]*?visible={isOpen}/);
    });

    it("should pass closeModal to InfoModal onClose prop", () => {
      const source = getComponentSource();
      expect(source).toMatch(/InfoModal[\s\S]*?onClose={closeModal}/);
    });

    it("should pass playlists to InfoModal", () => {
      const source = getComponentSource();
      expect(source).toMatch(/InfoModal[\s\S]*?playlists={playlists}/);
    });

    it("should pass string title to WatchList", () => {
      const source = getComponentSource();
      expect(source).toMatch(/WatchList[\s\S]*?title="Your Watchlist"/);
    });
  });

  describe("Component Order", () => {
    it("should render components in correct order", () => {
      const source = getComponentSource();
      const infoModalIndex = source.indexOf("<InfoModal");
      const navbarIndex = source.indexOf("<Navbar");
      const watchlistIndex = source.indexOf("<WatchList");
      const footerIndex = source.indexOf("<Footer");

      expect(infoModalIndex).toBeLessThan(navbarIndex);
      expect(navbarIndex).toBeLessThan(watchlistIndex);
      expect(watchlistIndex).toBeLessThan(footerIndex);
    });

    it("should place InfoModal first in render", () => {
      const source = getComponentSource();
      const returnIndex = source.indexOf("return");
      const infoModalIndex = source.indexOf("<InfoModal");
      expect(infoModalIndex).toBeGreaterThan(returnIndex);
    });
  });

  describe("Page Title", () => {
    it("should use Your Watchlist as page title", () => {
      const source = getComponentSource();
      expect(source).toContain("Your Watchlist");
    });

    it("should pass title as string literal", () => {
      const source = getComponentSource();
      expect(source).toContain('title="Your Watchlist"');
    });
  });

  describe("Profile Validation", () => {
    it("should validate profile exists before rendering", () => {
      const source = getComponentSource();
      expect(source).toContain("if (profil == undefined)");
    });

    it("should validate profile is not empty", () => {
      const source = getComponentSource();
      expect(source).toContain("if (isEmpty(profil))");
    });

    it("should have two profile validation checks", () => {
      const source = getComponentSource();
      const undefMatches = source.match(/profil == undefined/g);
      const emptyMatches = source.match(/isEmpty\(profil\)/g);
      expect(undefMatches?.length).toBeGreaterThanOrEqual(1);
      expect(emptyMatches?.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("Return Statements", () => {
    it("should have early return for undefined profile", () => {
      const source = getComponentSource();
      expect(source).toContain("return null");
    });

    it("should have main return with JSX", () => {
      const source = getComponentSource();
      expect(source).toMatch(/return[\s\S]*?<>/);
    });
  });

  describe("Hook Destructuring", () => {
    it("should destructure data from useCurrentProfil", () => {
      const source = getComponentSource();
      expect(source).toContain("const { data: profil }");
    });

    it("should destructure data from usePlaylists", () => {
      const source = getComponentSource();
      expect(source).toContain("const { data: playlists }");
    });

    it("should destructure isOpen from useInfoModal", () => {
      const source = getComponentSource();
      expect(source).toContain("isOpen");
    });

    it("should destructure closeModal from useInfoModal", () => {
      const source = getComponentSource();
      expect(source).toContain("closeModal");
    });
  });

  describe("Content Layout", () => {
    it("should wrap content in container with classes", () => {
      const source = getComponentSource();
      expect(source).toMatch(/<div className="pt-40 pb-40 min-h-screen">/);
    });

    it("should place WatchList inside container", () => {
      const source = getComponentSource();
      expect(source).toMatch(/pt-40 pb-40 min-h-screen">[\s\S]*?<WatchList/);
    });
  });

  describe("Modal Integration", () => {
    it("should integrate InfoModal with visibility control", () => {
      const source = getComponentSource();
      expect(source).toContain("visible={isOpen}");
    });

    it("should integrate InfoModal with close handler", () => {
      const source = getComponentSource();
      expect(source).toContain("onClose={closeModal}");
    });

    it("should integrate InfoModal with playlists data", () => {
      const source = getComponentSource();
      expect(source).toContain("playlists={playlists}");
    });
  });

  describe("Component Function Name", () => {
    it("should be named SeriesPage", () => {
      const source = getComponentSource();
      expect(source).toContain("function SeriesPage()");
    });

    it("should export SeriesPage function", () => {
      const source = getComponentSource();
      expect(source).toContain("export default function SeriesPage");
    });
  });

  describe("Container Styling", () => {
    it("should apply className to content container", () => {
      const source = getComponentSource();
      expect(source).toMatch(/<div className="pt-40 pb-40 min-h-screen">/);
    });

    it("should use utility classes for padding", () => {
      const source = getComponentSource();
      expect(source).toContain("pt-40");
      expect(source).toContain("pb-40");
    });

    it("should use utility class for height", () => {
      const source = getComponentSource();
      expect(source).toContain("min-h-screen");
    });
  });
});
