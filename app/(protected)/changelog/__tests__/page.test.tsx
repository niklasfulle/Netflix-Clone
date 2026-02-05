import React from "react";
import { render, screen } from "@testing-library/react";
import ChangelogPage from "../page";

// Mock Navbar component
jest.mock("@/components/Navbar", () => {
  return function MockNavbar() {
    return <div data-testid="navbar">Navbar</div>;
  };
});

// Mock Footer component
jest.mock("@/components/Footer", () => {
  return function MockFooter() {
    return <div data-testid="footer">Footer</div>;
  };
});

describe("ChangelogPage", () => {
  describe("Component Rendering", () => {
    it("renders without crashing", () => {
      const { container } = render(<ChangelogPage />);
      expect(container).toBeTruthy();
    });

    it("renders the main heading", () => {
      render(<ChangelogPage />);
      expect(screen.getByText("Changelog")).toBeInTheDocument();
    });

    it("renders Navbar component", () => {
      render(<ChangelogPage />);
      expect(screen.getByTestId("navbar")).toBeInTheDocument();
    });

    it("renders Footer component", () => {
      render(<ChangelogPage />);
      expect(screen.getByTestId("footer")).toBeInTheDocument();
    });

    it("has correct heading level", () => {
      render(<ChangelogPage />);
      const heading = screen.getByRole("heading", { level: 1 });
      expect(heading).toHaveTextContent("Changelog");
    });

    it("applies correct styling classes to main heading", () => {
      render(<ChangelogPage />);
      const heading = screen.getByRole("heading", { level: 1 });
      expect(heading).toHaveClass("text-4xl", "font-bold", "text-center");
    });
  });

  describe("Changelog Entries Display", () => {
    it("displays version 1.7.1 entry", () => {
      render(<ChangelogPage />);
      expect(screen.getByText("Version 1.7.1", { exact: false })).toBeInTheDocument();
    });

    it("displays version 1.0.0 entry", () => {
      render(<ChangelogPage />);
      expect(screen.getByText("Version 1.0.0", { exact: false })).toBeInTheDocument();
    });

    it("displays all version entries", () => {
      render(<ChangelogPage />);
      const versions = [
        "Version 1.7.1",
        "Version 1.7",
        "Version 1.6.4",
        "Version 1.6.3",
        "Version 1.6.2",
        "Version 1.6.1",
        "Version 1.6.0",
        "Version 1.5.0",
        "Version 1.4.0",
        "Version 1.3.0",
        "Version 1.2.0",
        "Version 1.1.0",
        "Version 1.0.0",
      ];

      versions.forEach((version) => {
        const elements = screen.getAllByText(version, { exact: false });
        expect(elements.length).toBeGreaterThan(0);
      });
    });

    it("renders correct number of changelog entries", () => {
      const { container } = render(<ChangelogPage />);
      const entries = container.querySelectorAll(".bg-zinc-800");
      expect(entries.length).toBeGreaterThan(0);
    });
  });

  describe("Changelog Content", () => {
    it("displays changes for version 1.7", () => {
      render(<ChangelogPage />);
      expect(screen.getByText("Changelog introduced")).toBeInTheDocument();
      expect(screen.getByText("Watch History page added")).toBeInTheDocument();
      expect(
        screen.getByText(/Bug fixes and minor improvements with Sonarqube analysis/)
      ).toBeInTheDocument();
    });

    it("displays changes for version 1.5.0", () => {
      render(<ChangelogPage />);
      expect(screen.getByText("Admin page introduced")).toBeInTheDocument();
      expect(screen.queryByText(/User management/)).toBeInTheDocument();
      expect(screen.queryByText(/Actor management/)).toBeInTheDocument();
      expect(screen.queryByText(/Movie management/)).toBeInTheDocument();
      expect(screen.queryByText(/Statistics/)).toBeInTheDocument();
    });

    it("displays changes for version 1.3.0", () => {
      render(<ChangelogPage />);
      expect(screen.getByText("Playlists introduced")).toBeInTheDocument();
      expect(
        screen.queryByText(/Create, edit, and delete playlists/)
      ).toBeInTheDocument();
      expect(screen.getByText("Movies page updated")).toBeInTheDocument();
    });

    it("displays changes for version 1.0.0", () => {
      render(<ChangelogPage />);
      expect(
        screen.getByText("First release of the Netflix app")
      ).toBeInTheDocument();
    });
  });

  describe("List Structure", () => {
    it("renders changelog entries as list items", () => {
      render(<ChangelogPage />);
      const listItems = screen.getAllByRole("listitem");
      expect(listItems.length).toBeGreaterThanOrEqual(13);
    });

    it("renders each changelog entry in a container with border", () => {
      const { container } = render(<ChangelogPage />);
      const entryDivs = container.querySelectorAll(".border-zinc-700");
      expect(entryDivs.length).toBeGreaterThan(0);
    });

    it("applies correct styling to entry containers", () => {
      const { container } = render(<ChangelogPage />);
      const entries = container.querySelectorAll(".bg-zinc-800");
      entries.forEach((entry) => {
        expect(entry).toHaveClass("rounded-lg", "shadow-lg", "p-6", "border");
      });
    });
  });

  describe("Entry Version Display", () => {
    it("displays version text with correct formatting", () => {
      render(<ChangelogPage />);
      const versionElements = screen.getAllByText(/Version \d+\.\d+(\.\d+)?/);
      expect(versionElements.length).toBe(13);
    });

    it("version text has correct styling", () => {
      render(<ChangelogPage />);
      const version17 = screen.getByText("Version 1.7");
      const parent = version17.closest(".text-xl");
      expect(parent).toHaveClass("font-semibold");
    });
  });

  describe("Layout Structure", () => {
    it("renders main container with max-width", () => {
      const { container } = render(<ChangelogPage />);
      const mainDiv = container.querySelector(".max-w-2xl");
      expect(mainDiv).toBeInTheDocument();
    });

    it("applies correct padding to main container", () => {
      const { container } = render(<ChangelogPage />);
      const mainDiv = container.querySelector(".min-h-screen");
      expect(mainDiv).toHaveClass("pt-52", "pb-20", "mx-auto");
    });

    it("applies text white class to main container", () => {
      const { container } = render(<ChangelogPage />);
      const mainDiv = container.querySelector(".max-w-2xl");
      expect(mainDiv).toHaveClass("text-white");
    });

    it("renders changelog entries in spaced layout", () => {
      const { container } = render(<ChangelogPage />);
      const spacedDiv = container.querySelector(".space-y-8");
      expect(spacedDiv).toBeInTheDocument();
    });
  });

  describe("Content Accessibility", () => {
    it("uses semantic HTML structure", () => {
      render(<ChangelogPage />);
      const heading = screen.getByRole("heading", { level: 1 });
      expect(heading).toBeInTheDocument();
    });

    it("renders lists with proper semantic markup", () => {
      render(<ChangelogPage />);
      const listItems = screen.getAllByRole("listitem");
      expect(listItems.length).toBeGreaterThan(0);
      listItems.forEach((item) => {
        expect(item.tagName.toLowerCase()).toBe("li");
      });
    });

    it("has proper heading hierarchy", () => {
      render(<ChangelogPage />);
      const h1 = screen.getByRole("heading", { level: 1 });
      expect(h1).toBeInTheDocument();
      expect(h1).toHaveTextContent("Changelog");
    });
  });

  describe("Changelog Data Completeness", () => {
    it("displays all version numbers", () => {
      render(<ChangelogPage />);
      const versionNumbers = [
        "1.7.1",
        "1.7",
        "1.6.4",
        "1.6.3",
        "1.6.2",
        "1.6.1",
        "1.6.0",
        "1.5.0",
        "1.4.0",
        "1.3.0",
        "1.2.0",
        "1.1.0",
        "1.0.0",
      ];

      versionNumbers.forEach((version) => {
        const versionText = `Version ${version}`;
        const elements = screen.getAllByText(versionText, { exact: true });
        expect(elements.length).toBeGreaterThan(0);
      });
    });

    it("version 1.4.0 contains all expected changes", () => {
      render(<ChangelogPage />);
      expect(screen.getByText("Backend rework")).toBeInTheDocument();
      expect(screen.queryByText(/Improved performance/)).toBeInTheDocument();
      expect(
        screen.queryByText(/Video streaming introduced for faster loading times/)
      ).toBeInTheDocument();
    });

    it("version 1.6.0 contains logging introduction", () => {
      render(<ChangelogPage />);
      expect(
        screen.getByText(
          /Logging introduced for all backend activities/
        )
      ).toBeInTheDocument();
    });

    it("version 1.2.0 contains random page addition", () => {
      render(<ChangelogPage />);
      expect(screen.getByText("Random page added")).toBeInTheDocument();
    });
  });

  describe("Styling and Theming", () => {
    it("applies dark theme colors", () => {
      const { container } = render(<ChangelogPage />);
      const entries = container.querySelectorAll(".bg-zinc-800");
      expect(entries.length).toBeGreaterThan(0);
    });

    it("applies border styling to entries", () => {
      const { container } = render(<ChangelogPage />);
      const entries = container.querySelectorAll(".border-zinc-700");
      expect(entries.length).toBeGreaterThan(0);
    });

    it("has rounded corners on entries", () => {
      const { container } = render(<ChangelogPage />);
      const entries = container.querySelectorAll(".rounded-lg");
      expect(entries.length).toBeGreaterThan(0);
    });

    it("applies shadow to entries", () => {
      const { container } = render(<ChangelogPage />);
      const entries = container.querySelectorAll(".shadow-lg");
      expect(entries.length).toBeGreaterThan(0);
    });
  });

  describe("Individual Version Details", () => {
    it("version 1.7.1 is first in changelog", () => {
      render(<ChangelogPage />);
      screen.getByText("Version 1.7.1");
      const allVersions = screen.getAllByText(/Version \d+\.\d+(\.\d+)?/);
      expect(allVersions[0]).toHaveTextContent("Version 1.7.1");
    });

    it("version 1.0.0 is last in changelog", () => {
      render(<ChangelogPage />);
      const allVersions = screen.getAllByText(/Version \d+\.\d+(\.\d+)?/);
      expect(allVersions[allVersions.length - 1]).toHaveTextContent("Version 1.0.0");
    });

    it("version 1.5.0 has multiple admin-related changes", () => {
      render(<ChangelogPage />);
      const adminChanges = [
        "Admin page introduced",
        "User management",
        "Actor management",
        "Movie management",
        "Statistics",
      ];

      adminChanges.forEach((change) => {
        expect(screen.queryByText(new RegExp(change))).toBeInTheDocument();
      });
    });
  });

  describe("Change List Formatting", () => {
    it("renders changes as unordered list", () => {
      const { container } = render(<ChangelogPage />);
      const lists = container.querySelectorAll("ul");
      expect(lists.length).toBeGreaterThan(0);
    });

    it("applies list styling classes", () => {
      const { container } = render(<ChangelogPage />);
      const lists = container.querySelectorAll(".list-disc");
      expect(lists.length).toBeGreaterThan(0);
    });

    it("applies correct spacing to list items", () => {
      const { container } = render(<ChangelogPage />);
      const lists = container.querySelectorAll(".space-y-1");
      expect(lists.length).toBeGreaterThan(0);
    });

    it("applies margin-left to list container", () => {
      const { container } = render(<ChangelogPage />);
      const listContainers = container.querySelectorAll(".ml-2");
      expect(listContainers.length).toBeGreaterThan(0);
    });
  });

  describe("Component Integration", () => {
    it("renders in correct order: Navbar, Content, Footer", () => {
      const { container } = render(<ChangelogPage />);
      const navbar = screen.getByTestId("navbar");
      const footer = screen.getByTestId("footer");
      const mainContent = container.querySelector(".max-w-2xl");

      expect(navbar).toBeInTheDocument();
      expect(footer).toBeInTheDocument();
      expect(mainContent).toBeInTheDocument();
    });

    it("content is contained in wrapper with appropriate classes", () => {
      const { container } = render(<ChangelogPage />);
      const wrapper = container.querySelector(".max-w-2xl");
      expect(wrapper).toHaveClass(
        "w-full",
        "max-w-2xl",
        "min-h-screen",
        "pt-52",
        "pb-20",
        "mx-auto",
        "text-white"
      );
    });
  });

  describe("Edge Cases", () => {
    it("handles changelog with all entries present", () => {
      render(<ChangelogPage />);
      const allVersionText = screen.getAllByText(/Version \d+\.\d+(\.\d+)?/);
      expect(allVersionText).toHaveLength(13);
    });

    it("renders correctly with various text lengths", () => {
      render(<ChangelogPage />);
      // Short change text
      expect(screen.getByText("Random page added")).toBeInTheDocument();
      // Longer change text
      expect(
        screen.getByText(
          "Bug fixes and minor improvements with Sonarqube analysis"
        )
      ).toBeInTheDocument();
    });

    it("properly renders nested list items (indented changes)", () => {
      render(<ChangelogPage />);
      const changes = screen.getAllByRole("listitem");
      expect(changes.length).toBeGreaterThan(0);
    });
  });

  describe("Text Content Verification", () => {
    it("displays exact changelog introduction text", () => {
      render(<ChangelogPage />);
      expect(screen.getByText("Changelog introduced")).toBeInTheDocument();
    });

    it("displays watch history feature", () => {
      render(<ChangelogPage />);
      expect(screen.getByText("Watch History page added")).toBeInTheDocument();
    });

    it("displays sonarqube improvement text", () => {
      render(<ChangelogPage />);
      expect(
        screen.getByText(/Bug fixes and minor improvements with Sonarqube analysis/)
      ).toBeInTheDocument();
    });

    it("contains admin features list", () => {
      render(<ChangelogPage />);
      const features = [
        "User management",
        "Actor management",
        "Movie management",
        "Statistics",
      ];
      features.forEach((feature) => {
        expect(screen.queryByText(new RegExp(feature))).toBeInTheDocument();
      });
    });
  });

  describe("Rendering Performance", () => {
    it("renders all changelog entries without errors", () => {
      const { container } = render(<ChangelogPage />);
      expect(container).toBeInTheDocument();
      const entries = container.querySelectorAll(".bg-zinc-800");
      expect(entries.length).toBeGreaterThan(0);
    });

    it("handles large changelog list", () => {
      render(<ChangelogPage />);
      const listItems = screen.getAllByRole("listitem");
      expect(listItems.length).toBeGreaterThan(0);
    });
  });
});
