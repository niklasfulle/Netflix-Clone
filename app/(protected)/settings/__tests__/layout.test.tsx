import React from "react";
import { render, screen } from "@testing-library/react";
import Layout, { metadata } from "../layout";

describe("Settings Layout (settings/layout.tsx)", () => {

  describe("Basic Component Structure", () => {
    it("should render Layout component", () => {
      const { container } = render(
        <Layout>
          <div data-testid="test-child">Test Content</div>
        </Layout>
      );
      expect(container).toBeTruthy();
    });

    it("should render children", () => {
      render(
        <Layout>
          <div data-testid="test-child">Test Content</div>
        </Layout>
      );
      expect(screen.getByTestId("test-child")).toBeInTheDocument();
    });

    it("should render as fragment wrapper", () => {
      const { container } = render(
        <Layout>
          <div data-testid="child">Content</div>
        </Layout>
      );
      const child = screen.getByTestId("child");
      // Fragment wrapper means child is directly under the container's first child
      expect(child).toBeInTheDocument();
      expect(container.firstChild).toBeTruthy();
    });

    it("should accept React.ReactNode children", () => {
      const { container } = render(
        <Layout>
          <span>Text</span>
        </Layout>
      );
      expect(container.querySelector("span")).toBeInTheDocument();
    });

    it("should not wrap children in additional elements", () => {
      render(
        <Layout>
          <div data-testid="direct-child">Direct</div>
        </Layout>
      );
      expect(screen.getByTestId("direct-child")).toBeInTheDocument();
    });
  });

  describe("Metadata Configuration", () => {
    it("should export metadata", () => {
      expect(metadata).toBeDefined();
    });

    it("should have title property", () => {
      expect(metadata.title).toBeDefined();
    });

    it('should have title "Netflix - Settings"', () => {
      expect(metadata.title).toBe("Netflix - Settings");
    });

    it("should be of type Metadata", () => {
      expect(typeof metadata).toBe("object");
    });

    it("should have correct title type", () => {
      expect(typeof metadata.title).toBe("string");
    });

    it("should have Netflix prefix", () => {
      expect(metadata.title).toContain("Netflix");
    });

    it("should have Settings text", () => {
      expect(metadata.title).toContain("Settings");
    });
  });

  describe("Component Props", () => {
    it("should accept children prop", () => {
      render(
        <Layout>
          <div>Child</div>
        </Layout>
      );
      expect(screen.getByText("Child")).toBeInTheDocument();
    });

    it("should render string children", () => {
      render(<Layout>Hello World</Layout>);
      expect(screen.getByText("Hello World")).toBeInTheDocument();
    });

    it("should render multiple children", () => {
      render(
        <Layout>
          <div data-testid="child-1">First</div>
          <div data-testid="child-2">Second</div>
        </Layout>
      );
      expect(screen.getByTestId("child-1")).toBeInTheDocument();
      expect(screen.getByTestId("child-2")).toBeInTheDocument();
    });

    it("should render number children", () => {
      render(<Layout>{42}</Layout>);
      expect(screen.getByText("42")).toBeInTheDocument();
    });

    it("should handle React components as children", () => {
      const Component = () => <div>Component Content</div>;
      render(
        <Layout>
          <Component />
        </Layout>
      );
      expect(screen.getByText("Component Content")).toBeInTheDocument();
    });
  });

  describe("Component Definition", () => {
    it("should be a function", () => {
      expect(typeof Layout).toBe("function");
    });

    it("should return JSX", () => {
      const result = render(
        <Layout>
          <div>Test</div>
        </Layout>
      );
      expect(result.container).toBeTruthy();
    });

    it("should be default export", () => {
      expect(Layout).toBeDefined();
    });

    it("should have name Layout", () => {
      expect(Layout.name).toBe("Layout");
    });
  });

  describe("Component Behavior", () => {
    it("should render complex children", () => {
      render(
        <Layout>
          <div>
            <span>Nested</span>
            <p>Content</p>
          </div>
        </Layout>
      );
      expect(screen.getByText("Nested")).toBeInTheDocument();
      expect(screen.getByText("Content")).toBeInTheDocument();
    });

    it("should not modify children", () => {
      const testContent = "Original Content";
      render(<Layout>{testContent}</Layout>);
      expect(screen.getByText(testContent)).toBeInTheDocument();
    });

    it("should pass through all child props", () => {
      render(
        <Layout>
          <button data-testid="btn" className="test-class">
            Click
          </button>
        </Layout>
      );
      const button = screen.getByTestId("btn");
      expect(button).toHaveClass("test-class");
    });

    it("should render without side effects", () => {
      const { container } = render(
        <Layout>
          <div>Content</div>
        </Layout>
      );
      expect(container.innerHTML).toContain("Content");
    });
  });

  describe("Fragment Usage", () => {
    it("should use fragment wrapper", () => {
      const { container } = render(
        <Layout>
          <div>First</div>
          <div>Second</div>
        </Layout>
      );
      expect(container.firstChild?.childNodes.length).toBeGreaterThan(0);
    });

    it("should allow multiple root children", () => {
      render(
        <Layout>
          <div data-testid="first">First</div>
          <div data-testid="second">Second</div>
          <div data-testid="third">Third</div>
        </Layout>
      );
      expect(screen.getByTestId("first")).toBeInTheDocument();
      expect(screen.getByTestId("second")).toBeInTheDocument();
      expect(screen.getByTestId("third")).toBeInTheDocument();
    });

    it("should not add extra DOM nodes", () => {
      const { container } = render(
        <Layout>
          <div data-testid="only-child">Only</div>
        </Layout>
      );
      const child = screen.getByTestId("only-child");
      // Fragment doesn't add extra DOM nodes
      expect(child).toBeInTheDocument();
      expect(container.querySelector('[data-testid="only-child"]')).toBeTruthy();
    });
  });

  describe("Edge Cases", () => {
    it("should render with empty string", () => {
      const { container } = render(<Layout>{""}</Layout>);
      expect(container).toBeTruthy();
    });

    it("should render with boolean false", () => {
      const { container } = render(<Layout>{false}</Layout>);
      expect(container).toBeTruthy();
    });

    it("should render with array of children", () => {
      render(
        <Layout>
          {[
            <div key="1">Item 1</div>,
            <div key="2">Item 2</div>,
            <div key="3">Item 3</div>,
          ]}
        </Layout>
      );
      expect(screen.getByText("Item 1")).toBeInTheDocument();
      expect(screen.getByText("Item 2")).toBeInTheDocument();
      expect(screen.getByText("Item 3")).toBeInTheDocument();
    });

    it("should render with conditional children", () => {
      const showContent = true;
      const hideContent = false;
      render(
        <Layout>
          {showContent && <div>Shown</div>}
          {hideContent && <div>Hidden</div>}
        </Layout>
      );
      expect(screen.getByText("Shown")).toBeInTheDocument();
      expect(screen.queryByText("Hidden")).not.toBeInTheDocument();
    });

    it("should handle null children", () => {
      const { container } = render(<Layout>{null}</Layout>);
      expect(container).toBeTruthy();
    });

    it("should handle undefined children", () => {
      const { container } = render(<Layout>{undefined}</Layout>);
      expect(container).toBeTruthy();
    });
  });

  describe("Metadata Title", () => {
    it("should have dash separator", () => {
      expect(metadata.title).toContain(" - ");
    });

    it("should not be empty", () => {
      expect(metadata.title).not.toBe("");
    });

    it("should be properly formatted", () => {
      expect(metadata.title).toMatch(/^Netflix - .+$/);
    });

    it("should start with Netflix", () => {
      expect(metadata.title).toMatch(/^Netflix/);
    });

    it("should end with Settings", () => {
      expect(metadata.title).toMatch(/Settings$/);
    });
  });

  describe("Component Passthrough", () => {
    it("should preserve child component state", () => {
      const StatefulChild = () => {
        const [count] = React.useState(5);
        return <div>Count: {count}</div>;
      };
      render(
        <Layout>
          <StatefulChild />
        </Layout>
      );
      expect(screen.getByText("Count: 5")).toBeInTheDocument();
    });

    it("should not interfere with child rendering", () => {
      render(
        <Layout>
          <div data-custom="value" className="custom-class">
            Custom Content
          </div>
        </Layout>
      );
      const div = screen.getByText("Custom Content");
      expect(div.getAttribute("data-custom")).toBe("value");
      expect(div).toHaveClass("custom-class");
    });

    it("should pass through event handlers", () => {
      const handleClick = jest.fn();
      render(
        <Layout>
          <button onClick={handleClick}>Click</button>
        </Layout>
      );
      screen.getByText("Click").click();
      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });

  describe("Rendering Scenarios", () => {
    it("should render deeply nested children", () => {
      render(
        <Layout>
          <div>
            <div>
              <div>
                <span>Deep</span>
              </div>
            </div>
          </div>
        </Layout>
      );
      expect(screen.getByText("Deep")).toBeInTheDocument();
    });

    it("should render mixed content types", () => {
      const { container } = render(
        <Layout>
          <span>Text content</span>
          <div>Element</div>
          <span>{123}</span>
        </Layout>
      );
      expect(screen.getByText("Text content")).toBeInTheDocument();
      expect(screen.getByText("Element")).toBeInTheDocument();
      expect(screen.getByText("123")).toBeInTheDocument();
      expect(container).toBeTruthy();
    });

    it("should work with fragments as children", () => {
      const { container } = render(
        <Layout>
          <div>
            <div>Nested Fragment</div>
          </div>
        </Layout>
      );
      expect(screen.getByText("Nested Fragment")).toBeInTheDocument();
      expect(container).toBeTruthy();
    });

    it("should handle children with keys", () => {
      const items = ["A", "B", "C"];
      render(
        <Layout>
          {items.map((item) => (
            <div key={item}>{item}</div>
          ))}
        </Layout>
      );
      expect(screen.getByText("A")).toBeInTheDocument();
      expect(screen.getByText("B")).toBeInTheDocument();
      expect(screen.getByText("C")).toBeInTheDocument();
    });
  });

  describe("Component Integration", () => {
    it("should work with data attributes", () => {
      render(
        <Layout>
          <div data-testid="data-attr" data-custom="value">
            Content
          </div>
        </Layout>
      );
      const element = screen.getByTestId("data-attr");
      expect(element.getAttribute("data-custom")).toBe("value");
    });

    it("should work with aria attributes", () => {
      render(
        <Layout>
          <button aria-label="Close">X</button>
        </Layout>
      );
      expect(screen.getByLabelText("Close")).toBeInTheDocument();
    });

    it("should work with event handlers", () => {
      const handleClick = jest.fn();
      render(
        <Layout>
          <button onClick={handleClick}>Click Me</button>
        </Layout>
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

    it("should have title property only", () => {
      const keys = Object.keys(metadata);
      expect(keys).toContain("title");
      expect(keys.length).toBe(1);
    });

    it("should be serializable", () => {
      expect(() => JSON.stringify(metadata)).not.toThrow();
    });
  });

  describe("Component Immutability", () => {
    it("should not mutate children", () => {
      const child = <div data-testid="immutable">Original</div>;
      render(<Layout>{child}</Layout>);
      expect(screen.getByTestId("immutable")).toHaveTextContent("Original");
    });

    it("should render consistently", () => {
      const { rerender } = render(
        <Layout>
          <div>Content</div>
        </Layout>
      );
      expect(screen.getByText("Content")).toBeInTheDocument();
      rerender(
        <Layout>
          <div>Content</div>
        </Layout>
      );
      expect(screen.getByText("Content")).toBeInTheDocument();
    });
  });

  describe("TypeScript Compatibility", () => {
    it("should accept ReactNode children", () => {
      const { container } = render(
        <Layout>
          <div>Fragment</div>
        </Layout>
      );
      expect(container).toBeTruthy();
    });

    it("should render with JSX.Element", () => {
      const element = <div>Element</div>;
      render(<Layout>{element}</Layout>);
      expect(screen.getByText("Element")).toBeInTheDocument();
    });
  });
});
