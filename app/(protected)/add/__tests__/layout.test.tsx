import React from "react";
import { render, screen } from "@testing-library/react";
import Layout, { metadata } from "../layout";

describe("Add Layout (add/layout.tsx)", () => {

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

    it("should render text content", () => {
      render(<Layout>Test Text</Layout>);
      expect(screen.getByText("Test Text")).toBeInTheDocument();
    });

    it("should accept React.ReactNode children", () => {
      const { container } = render(
        <Layout>
          <span>Text</span>
        </Layout>
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

    it('should have title "Netflix - Add Movie"', () => {
      expect(metadata.title).toBe("Netflix - Add Movie");
    });

    it("should be of type Metadata", () => {
      expect(typeof metadata).toBe("object");
    });

    it("should have correct title type", () => {
      expect(typeof metadata.title).toBe("string");
    });

    it("should not have description", () => {
      expect(metadata.description).toBeUndefined();
    });

    it("should not have icons", () => {
      expect(metadata.icons).toBeUndefined();
    });
  });

  describe("Component Props", () => {
    it("should accept children prop", () => {
      const { container } = render(
        <Layout>
          <div>Child</div>
        </Layout>
      );
      expect(container.querySelector("div")).toBeInTheDocument();
    });

    it("should render empty children", () => {
      const { container } = render(<Layout>{null}</Layout>);
      expect(container).toBeTruthy();
    });

    it("should render undefined children", () => {
      const { container } = render(<Layout>{undefined}</Layout>);
      expect(container).toBeTruthy();
    });

    it("should render string children", () => {
      render(<Layout>Hello World</Layout>);
      expect(screen.getByText("Hello World")).toBeInTheDocument();
    });

    it("should render number children", () => {
      render(<Layout>{42}</Layout>);
      expect(screen.getByText("42")).toBeInTheDocument();
    });
  });

  describe("Component Return", () => {
    it("should return fragment wrapper", () => {
      render(
        <Layout>
          <div data-testid="content">Content</div>
        </Layout>
      );
      expect(screen.getByTestId("content")).toBeInTheDocument();
    });

    it("should not wrap in div", () => {
      const { container } = render(
        <Layout>
          <span data-testid="span">Content</span>
        </Layout>
      );
      const span = screen.getByTestId("span");
      expect(span.parentElement).toBe(container);
    });

    it("should not wrap in section", () => {
      const { container } = render(
        <Layout>
          <p data-testid="para">Content</p>
        </Layout>
      );
      const para = screen.getByTestId("para");
      expect(para.parentElement).toBe(container);
    });

    it("should render children directly", () => {
      const { container } = render(
        <Layout>
          <div>Direct Child</div>
        </Layout>
      );
      expect(container.children.length).toBe(1);
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

    it("should preserve child order", () => {
      const { container } = render(
        <Layout>
          <div data-testid="first">First</div>
          <div data-testid="second">Second</div>
          <div data-testid="third">Third</div>
        </Layout>
      );
      const children = Array.from(container.children);
      expect(children[0].getAttribute("data-testid")).toBe("first");
      expect(children[1].getAttribute("data-testid")).toBe("second");
      expect(children[2].getAttribute("data-testid")).toBe("third");
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
  });

  describe("Fragment Usage", () => {
    it("should use fragment as wrapper", () => {
      const { container } = render(
        <Layout>
          <div data-testid="child">Content</div>
        </Layout>
      );
      expect(container.firstChild).toBe(screen.getByTestId("child"));
    });

    it("should not add extra DOM nodes", () => {
      const { container } = render(
        <Layout>
          <div>Only Child</div>
        </Layout>
      );
      expect(container.children.length).toBe(1);
    });

    it("should handle multiple direct children", () => {
      const { container } = render(
        <Layout>
          <div>First</div>
          <div>Second</div>
        </Layout>
      );
      expect(container.children.length).toBe(2);
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

    it("should render with boolean true", () => {
      const { container } = render(<Layout>{true}</Layout>);
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
      render(
        <Layout>
          {true && <div>Shown</div>}
          {false && <div>Hidden</div>}
        </Layout>
      );
      expect(screen.getByText("Shown")).toBeInTheDocument();
      expect(screen.queryByText("Hidden")).not.toBeInTheDocument();
    });

    it("should render nested fragments", () => {
      render(
        <Layout>
          <>
            <div>Nested Fragment</div>
          </>
        </Layout>
      );
      expect(screen.getByText("Nested Fragment")).toBeInTheDocument();
    });
  });

  describe("Metadata Title", () => {
    it("should have Netflix prefix", () => {
      expect(metadata.title).toContain("Netflix");
    });

    it("should have Add Movie text", () => {
      expect(metadata.title).toContain("Add Movie");
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

  describe("Component Passthrough", () => {
    it("should be a passthrough component", () => {
      const CustomComponent = () => <div data-testid="custom">Custom</div>;
      render(
        <Layout>
          <CustomComponent />
        </Layout>
      );
      expect(screen.getByTestId("custom")).toBeInTheDocument();
    });

    it("should not interfere with child styling", () => {
      render(
        <Layout>
          <div data-testid="styled" style={{ color: "red" }}>
            Styled
          </div>
        </Layout>
      );
      const styled = screen.getByTestId("styled");
      expect(styled.style.color).toBe("red");
    });

    it("should not add className to children", () => {
      render(
        <Layout>
          <div data-testid="no-class">Content</div>
        </Layout>
      );
      const element = screen.getByTestId("no-class");
      expect(element.className).toBe("");
    });
  });

  describe("Rendering Scenarios", () => {
    it("should render with single child", () => {
      const { container } = render(
        <Layout>
          <div>Single</div>
        </Layout>
      );
      expect(container.children.length).toBe(1);
    });

    it("should render with nested layout", () => {
      render(
        <Layout>
          <Layout>
            <div>Nested</div>
          </Layout>
        </Layout>
      );
      expect(screen.getByText("Nested")).toBeInTheDocument();
    });

    it("should render form elements", () => {
      render(
        <Layout>
          <form data-testid="form">
            <input data-testid="input" />
          </form>
        </Layout>
      );
      expect(screen.getByTestId("form")).toBeInTheDocument();
      expect(screen.getByTestId("input")).toBeInTheDocument();
    });

    it("should render semantic HTML", () => {
      render(
        <Layout>
          <main data-testid="main">
            <article data-testid="article">Content</article>
          </main>
        </Layout>
      );
      expect(screen.getByTestId("main")).toBeInTheDocument();
      expect(screen.getByTestId("article")).toBeInTheDocument();
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

    it("should have title as only property", () => {
      const keys = Object.keys(metadata);
      expect(keys).toEqual(["title"]);
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
          <>Fragment</>
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
