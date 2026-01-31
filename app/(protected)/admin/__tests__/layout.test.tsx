import React from "react";
import { render, screen } from "@testing-library/react";

// Mock AdminNav and Footer components
jest.mock("@/components/AdminNav", () => {
  return function MockAdminNav() {
    return <nav data-testid="admin-nav">AdminNav</nav>;
  };
});

jest.mock("@/components/Footer", () => {
  return function MockFooter() {
    return <footer data-testid="footer">Footer</footer>;
  };
});

import AdminLayout, { metadata } from "../layout";

describe("Admin Layout (admin/layout.tsx)", () => {

  describe("Basic Component Structure", () => {
    it("should render AdminLayout component", () => {
      const { container } = render(
        <AdminLayout>
          <div data-testid="test-child">Test Content</div>
        </AdminLayout>
      );
      expect(container).toBeTruthy();
    });

    it("should render children", () => {
      render(
        <AdminLayout>
          <div data-testid="test-child">Test Content</div>
        </AdminLayout>
      );
      expect(screen.getByTestId("test-child")).toBeInTheDocument();
    });

    it("should render AdminNav", () => {
      render(
        <AdminLayout>
          <div>Content</div>
        </AdminLayout>
      );
      expect(screen.getByTestId("admin-nav")).toBeInTheDocument();
    });

    it("should render Footer", () => {
      render(
        <AdminLayout>
          <div>Content</div>
        </AdminLayout>
      );
      expect(screen.getByTestId("footer")).toBeInTheDocument();
    });

    it("should accept React.ReactNode children", () => {
      const { container } = render(
        <AdminLayout>
          <span>Text</span>
        </AdminLayout>
      );
      expect(container.querySelector("span")).toBeInTheDocument();
    });
  });

  describe("Metadata Configuration", () => {
    it("should export metadata", () => {
      expect(metadata).toBeDefined();
    });

    it("should have title property", () => {
      expect(metadata.title).toBeDefined();
    });

    it('should have title "Netflix - Admin"', () => {
      expect(metadata.title).toBe("Netflix - Admin");
    });

    it("should be of type Metadata", () => {
      expect(typeof metadata).toBe("object");
    });

    it("should have correct title type", () => {
      expect(typeof metadata.title).toBe("string");
    });

    it("should have icons", () => {
      expect(metadata.icons).toBeDefined();
    });

    it("should have icon path", () => {
      expect(metadata.icons).toEqual({ icon: "/icon.ico" });
    });
  });

  describe("Layout Structure", () => {
    it("should have main container with min-h-screen", () => {
      const { container } = render(
        <AdminLayout>
          <div>Content</div>
        </AdminLayout>
      );
      const mainDiv = container.querySelector(".min-h-screen");
      expect(mainDiv).toBeInTheDocument();
    });

    it("should have flex container", () => {
      const { container } = render(
        <AdminLayout>
          <div>Content</div>
        </AdminLayout>
      );
      const flexDiv = container.querySelector(".flex");
      expect(flexDiv).toBeInTheDocument();
    });

    it("should have bg-zinc-900 background", () => {
      const { container } = render(
        <AdminLayout>
          <div>Content</div>
        </AdminLayout>
      );
      const bgDiv = container.querySelector(".bg-zinc-900");
      expect(bgDiv).toBeInTheDocument();
    });

    it("should have main element", () => {
      render(
        <AdminLayout>
          <div>Content</div>
        </AdminLayout>
      );
      const main = document.querySelector("main");
      expect(main).toBeInTheDocument();
    });

    it("should render children inside main", () => {
      render(
        <AdminLayout>
          <div data-testid="main-content">Main Content</div>
        </AdminLayout>
      );
      const main = document.querySelector("main");
      const content = screen.getByTestId("main-content");
      expect(main).toContainElement(content);
    });
  });

  describe("Component Props", () => {
    it("should accept children prop", () => {
      render(
        <AdminLayout>
          <div>Child</div>
        </AdminLayout>
      );
      expect(screen.getByText("Child")).toBeInTheDocument();
    });

    it("should render string children", () => {
      render(<AdminLayout>Hello World</AdminLayout>);
      expect(screen.getByText("Hello World")).toBeInTheDocument();
    });

    it("should render multiple children", () => {
      render(
        <AdminLayout>
          <div data-testid="child-1">First</div>
          <div data-testid="child-2">Second</div>
        </AdminLayout>
      );
      expect(screen.getByTestId("child-1")).toBeInTheDocument();
      expect(screen.getByTestId("child-2")).toBeInTheDocument();
    });
  });

  describe("Component Definition", () => {
    it("should be a function", () => {
      expect(typeof AdminLayout).toBe("function");
    });

    it("should return JSX", () => {
      const result = render(
        <AdminLayout>
          <div>Test</div>
        </AdminLayout>
      );
      expect(result.container).toBeTruthy();
    });

    it("should be default export", () => {
      expect(AdminLayout).toBeDefined();
    });

    it("should have name AdminLayout", () => {
      expect(AdminLayout.name).toBe("AdminLayout");
    });
  });

  describe("Component Behavior", () => {
    it("should render complex children", () => {
      render(
        <AdminLayout>
          <div>
            <span>Nested</span>
            <p>Content</p>
          </div>
        </AdminLayout>
      );
      expect(screen.getByText("Nested")).toBeInTheDocument();
      expect(screen.getByText("Content")).toBeInTheDocument();
    });

    it("should not modify children", () => {
      const testContent = "Original Content";
      render(<AdminLayout>{testContent}</AdminLayout>);
      expect(screen.getByText(testContent)).toBeInTheDocument();
    });

    it("should pass through all child props", () => {
      render(
        <AdminLayout>
          <button data-testid="btn" className="test-class">
            Click
          </button>
        </AdminLayout>
      );
      const button = screen.getByTestId("btn");
      expect(button).toHaveClass("test-class");
    });
  });

  describe("Navigation and Footer", () => {
    it("should render AdminNav before children", () => {
      const { container } = render(
        <AdminLayout>
          <div data-testid="content">Content</div>
        </AdminLayout>
      );
      const nav = screen.getByTestId("admin-nav");
      const content = screen.getByTestId("content");
      const navPosition = Array.from(container.querySelectorAll("*")).indexOf(nav);
      const contentPosition = Array.from(container.querySelectorAll("*")).indexOf(content);
      expect(navPosition).toBeLessThan(contentPosition);
    });

    it("should render Footer after children", () => {
      const { container } = render(
        <AdminLayout>
          <div data-testid="content">Content</div>
        </AdminLayout>
      );
      const footer = screen.getByTestId("footer");
      const content = screen.getByTestId("content");
      const footerPosition = Array.from(container.querySelectorAll("*")).indexOf(footer);
      const contentPosition = Array.from(container.querySelectorAll("*")).indexOf(content);
      expect(footerPosition).toBeGreaterThan(contentPosition);
    });
  });

  describe("Edge Cases", () => {
    it("should render with empty string", () => {
      const { container } = render(<AdminLayout>{""}</AdminLayout>);
      expect(container).toBeTruthy();
    });

    it("should render with boolean false", () => {
      const { container } = render(<AdminLayout>{false}</AdminLayout>);
      expect(container).toBeTruthy();
    });

    it("should render with array of children", () => {
      render(
        <AdminLayout>
          {[
            <div key="1">Item 1</div>,
            <div key="2">Item 2</div>,
            <div key="3">Item 3</div>,
          ]}
        </AdminLayout>
      );
      expect(screen.getByText("Item 1")).toBeInTheDocument();
      expect(screen.getByText("Item 2")).toBeInTheDocument();
      expect(screen.getByText("Item 3")).toBeInTheDocument();
    });

    it("should render with conditional children", () => {
      render(
        <AdminLayout>
          {true && <div>Shown</div>}
          {false && <div>Hidden</div>}
        </AdminLayout>
      );
      expect(screen.getByText("Shown")).toBeInTheDocument();
      expect(screen.queryByText("Hidden")).not.toBeInTheDocument();
    });
  });

  describe("Styling Classes", () => {
    it("should have pt-20 padding", () => {
      const { container } = render(
        <AdminLayout>
          <div>Content</div>
        </AdminLayout>
      );
      const ptDiv = container.querySelector(".pt-20");
      expect(ptDiv).toBeInTheDocument();
    });

    it("should have max-w-6xl container", () => {
      const { container } = render(
        <AdminLayout>
          <div>Content</div>
        </AdminLayout>
      );
      const maxWDiv = container.querySelector(".max-w-6xl");
      expect(maxWDiv).toBeInTheDocument();
    });

    it("should have mx-auto centering", () => {
      const { container } = render(
        <AdminLayout>
          <div>Content</div>
        </AdminLayout>
      );
      const mxDiv = container.querySelector(".mx-auto");
      expect(mxDiv).toBeInTheDocument();
    });

    it("should have py-4 on main", () => {
      const { container } = render(
        <AdminLayout>
          <div>Content</div>
        </AdminLayout>
      );
      const main = container.querySelector("main");
      expect(main).toHaveClass("py-4");
    });
  });

  describe("Metadata Title", () => {
    it("should have Netflix prefix", () => {
      expect(metadata.title).toContain("Netflix");
    });

    it("should have Admin text", () => {
      expect(metadata.title).toContain("Admin");
    });

    it("should have dash separator", () => {
      expect(metadata.title).toContain(" - ");
    });

    it("should not be empty", () => {
      expect(metadata.title).not.toBe("");
    });

    it("should be properly formatted", () => {
      expect(metadata.title).toMatch(/^Netflix - .+$/);
    });
  });

  describe("Component Integration", () => {
    it("should work with data attributes", () => {
      render(
        <AdminLayout>
          <div data-testid="data-attr" data-custom="value">
            Content
          </div>
        </AdminLayout>
      );
      const element = screen.getByTestId("data-attr");
      expect(element.getAttribute("data-custom")).toBe("value");
    });

    it("should work with aria attributes", () => {
      render(
        <AdminLayout>
          <button aria-label="Close">X</button>
        </AdminLayout>
      );
      expect(screen.getByLabelText("Close")).toBeInTheDocument();
    });

    it("should work with event handlers", () => {
      const handleClick = jest.fn();
      render(
        <AdminLayout>
          <button onClick={handleClick}>Click Me</button>
        </AdminLayout>
      );
      const button = screen.getByText("Click Me");
      button.click();
      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });

  describe("Metadata Object", () => {
    it("should be an object", () => {
      expect(typeof metadata).toBe("object");
    });

    it("should not be null", () => {
      expect(metadata).not.toBeNull();
    });

    it("should have title and icons properties", () => {
      const keys = Object.keys(metadata);
      expect(keys).toContain("title");
      expect(keys).toContain("icons");
    });

    it("should be serializable", () => {
      expect(() => JSON.stringify(metadata)).not.toThrow();
    });
  });

  describe("Component Immutability", () => {
    it("should not mutate children", () => {
      const child = <div data-testid="immutable">Original</div>;
      render(<AdminLayout>{child}</AdminLayout>);
      expect(screen.getByTestId("immutable")).toHaveTextContent("Original");
    });

    it("should render consistently", () => {
      const { rerender } = render(
        <AdminLayout>
          <div>Content</div>
        </AdminLayout>
      );
      expect(screen.getByText("Content")).toBeInTheDocument();
      rerender(
        <AdminLayout>
          <div>Content</div>
        </AdminLayout>
      );
      expect(screen.getByText("Content")).toBeInTheDocument();
    });
  });

  describe("TypeScript Compatibility", () => {
    it("should accept ReactNode children", () => {
      const { container } = render(
        <AdminLayout>
          <>Fragment</>
        </AdminLayout>
      );
      expect(container).toBeTruthy();
    });

    it("should render with JSX.Element", () => {
      const element = <div>Element</div>;
      render(<AdminLayout>{element}</AdminLayout>);
      expect(screen.getByText("Element")).toBeInTheDocument();
    });
  });
});
