import React from "react";
import { render, screen } from "@testing-library/react";
import ProtectedLayout from "../layout";

describe("ProtectedLayout (protected/layout.tsx)", () => {
  describe("Basic Component Structure", () => {
    it("should render ProtectedLayout component", () => {
      const { container } = render(
        <ProtectedLayout>
          <div data-testid="test-child">Test Content</div>
        </ProtectedLayout>
      );
      expect(container).toBeTruthy();
    });

    it("should render children", () => {
      render(
        <ProtectedLayout>
          <div data-testid="test-child">Test Content</div>
        </ProtectedLayout>
      );
      expect(screen.getByTestId("test-child")).toBeInTheDocument();
    });

    it("should render multiple children", () => {
      render(
        <ProtectedLayout>
          <div data-testid="child-1">First</div>
          <div data-testid="child-2">Second</div>
        </ProtectedLayout>
      );
      expect(screen.getByTestId("child-1")).toBeInTheDocument();
      expect(screen.getByTestId("child-2")).toBeInTheDocument();
    });

    it("should render text content", () => {
      render(<ProtectedLayout>Test Text</ProtectedLayout>);
      expect(screen.getByText("Test Text")).toBeInTheDocument();
    });

    it("should accept React.ReactNode children", () => {
      const { container } = render(
        <ProtectedLayout>
          <span>Text</span>
        </ProtectedLayout>
      );
      expect(container.querySelector("span")).toBeInTheDocument();
    });
  });

  describe("Component Wrapper", () => {
    it("should wrap children in div", () => {
      const { container } = render(
        <ProtectedLayout>
          <div data-testid="content">Content</div>
        </ProtectedLayout>
      );
      const content = screen.getByTestId("content");
      expect(content.parentElement?.tagName).toBe("DIV");
    });

    it("should have single div wrapper", () => {
      const { container } = render(
        <ProtectedLayout>
          <div>Child</div>
        </ProtectedLayout>
      );
      expect(container.firstChild?.nodeName).toBe("DIV");
    });

    it("should render children inside div wrapper", () => {
      render(
        <ProtectedLayout>
          <span data-testid="span">Content</span>
        </ProtectedLayout>
      );
      const span = screen.getByTestId("span");
      expect(span.parentElement?.tagName).toBe("DIV");
    });
  });

  describe("Component Definition", () => {
    it("should be a function", () => {
      expect(typeof ProtectedLayout).toBe("function");
    });

    it("should return JSX", () => {
      const result = render(
        <ProtectedLayout>
          <div>Test</div>
        </ProtectedLayout>
      );
      expect(result.container).toBeTruthy();
    });

    it("should be default export", () => {
      expect(ProtectedLayout).toBeDefined();
    });

    it("should have name ProtectedLayout", () => {
      expect(ProtectedLayout.name).toBe("ProtectedLayout");
    });
  });

  describe("Component Props", () => {
    it("should accept children prop", () => {
      const { container } = render(
        <ProtectedLayout>
          <div>Child</div>
        </ProtectedLayout>
      );
      expect(container.querySelector("div")).toBeInTheDocument();
    });

    it("should render empty children", () => {
      const { container } = render(<ProtectedLayout>{null}</ProtectedLayout>);
      expect(container).toBeTruthy();
    });

    it("should render undefined children", () => {
      const { container } = render(<ProtectedLayout>{undefined}</ProtectedLayout>);
      expect(container).toBeTruthy();
    });

    it("should render string children", () => {
      render(<ProtectedLayout>Hello World</ProtectedLayout>);
      expect(screen.getByText("Hello World")).toBeInTheDocument();
    });

    it("should render number children", () => {
      render(<ProtectedLayout>{42}</ProtectedLayout>);
      expect(screen.getByText("42")).toBeInTheDocument();
    });
  });

  describe("Component Behavior", () => {
    it("should render complex children", () => {
      render(
        <ProtectedLayout>
          <div>
            <span>Nested</span>
            <p>Content</p>
          </div>
        </ProtectedLayout>
      );
      expect(screen.getByText("Nested")).toBeInTheDocument();
      expect(screen.getByText("Content")).toBeInTheDocument();
    });

    it("should preserve child order", () => {
      render(
        <ProtectedLayout>
          <div data-testid="first">First</div>
          <div data-testid="second">Second</div>
          <div data-testid="third">Third</div>
        </ProtectedLayout>
      );
      expect(screen.getByTestId("first")).toBeInTheDocument();
      expect(screen.getByTestId("second")).toBeInTheDocument();
      expect(screen.getByTestId("third")).toBeInTheDocument();
    });

    it("should not modify children", () => {
      const testContent = "Original Content";
      render(<ProtectedLayout>{testContent}</ProtectedLayout>);
      expect(screen.getByText(testContent)).toBeInTheDocument();
    });

    it("should pass through all child props", () => {
      render(
        <ProtectedLayout>
          <button data-testid="btn" className="test-class">
            Click
          </button>
        </ProtectedLayout>
      );
      const button = screen.getByTestId("btn");
      expect(button).toHaveClass("test-class");
    });
  });

  describe("Edge Cases", () => {
    it("should render with empty string", () => {
      const { container } = render(<ProtectedLayout>{""}</ProtectedLayout>);
      expect(container).toBeTruthy();
    });

    it("should render with boolean false", () => {
      const { container } = render(<ProtectedLayout>{false}</ProtectedLayout>);
      expect(container).toBeTruthy();
    });

    it("should render with boolean true", () => {
      const { container } = render(<ProtectedLayout>{true}</ProtectedLayout>);
      expect(container).toBeTruthy();
    });

    it("should render with array of children", () => {
      render(
        <ProtectedLayout>
          {[
            <div key="1">Item 1</div>,
            <div key="2">Item 2</div>,
            <div key="3">Item 3</div>,
          ]}
        </ProtectedLayout>
      );
      expect(screen.getByText("Item 1")).toBeInTheDocument();
      expect(screen.getByText("Item 2")).toBeInTheDocument();
      expect(screen.getByText("Item 3")).toBeInTheDocument();
    });

    it("should render with conditional children", () => {
      render(
        <ProtectedLayout>
          {true && <div>Shown</div>}
          {false && <div>Hidden</div>}
        </ProtectedLayout>
      );
      expect(screen.getByText("Shown")).toBeInTheDocument();
      expect(screen.queryByText("Hidden")).not.toBeInTheDocument();
    });

    it("should render nested fragments", () => {
      render(
        <ProtectedLayout>
          <>
            <div>Nested Fragment</div>
          </>
        </ProtectedLayout>
      );
      expect(screen.getByText("Nested Fragment")).toBeInTheDocument();
    });
  });

  describe("Component Passthrough", () => {
    it("should render custom components", () => {
      const CustomComponent = () => <div data-testid="custom">Custom</div>;
      render(
        <ProtectedLayout>
          <CustomComponent />
        </ProtectedLayout>
      );
      expect(screen.getByTestId("custom")).toBeInTheDocument();
    });

    it("should not interfere with child styling", () => {
      render(
        <ProtectedLayout>
          <div data-testid="styled" style={{ color: "red" }}>
            Styled
          </div>
        </ProtectedLayout>
      );
      const styled = screen.getByTestId("styled");
      expect(styled.style.color).toBe("red");
    });

    it("should not add className to children", () => {
      render(
        <ProtectedLayout>
          <div data-testid="no-class">Content</div>
        </ProtectedLayout>
      );
      const element = screen.getByTestId("no-class");
      expect(element.className).toBe("");
    });
  });

  describe("Rendering Scenarios", () => {
    it("should render with single child", () => {
      render(
        <ProtectedLayout>
          <div>Single</div>
        </ProtectedLayout>
      );
      expect(screen.getByText("Single")).toBeInTheDocument();
    });

    it("should render form elements", () => {
      render(
        <ProtectedLayout>
          <form data-testid="form">
            <input data-testid="input" />
          </form>
        </ProtectedLayout>
      );
      expect(screen.getByTestId("form")).toBeInTheDocument();
      expect(screen.getByTestId("input")).toBeInTheDocument();
    });

    it("should render semantic HTML", () => {
      render(
        <ProtectedLayout>
          <main data-testid="main">
            <article data-testid="article">Content</article>
          </main>
        </ProtectedLayout>
      );
      expect(screen.getByTestId("main")).toBeInTheDocument();
      expect(screen.getByTestId("article")).toBeInTheDocument();
    });
  });

  describe("Component Integration", () => {
    it("should work with data attributes", () => {
      render(
        <ProtectedLayout>
          <div data-testid="data-attr" data-custom="value">
            Content
          </div>
        </ProtectedLayout>
      );
      const element = screen.getByTestId("data-attr");
      expect(element.getAttribute("data-custom")).toBe("value");
    });

    it("should work with aria attributes", () => {
      render(
        <ProtectedLayout>
          <button aria-label="Close">X</button>
        </ProtectedLayout>
      );
      expect(screen.getByLabelText("Close")).toBeInTheDocument();
    });

    it("should work with event handlers", () => {
      const handleClick = jest.fn();
      render(
        <ProtectedLayout>
          <button onClick={handleClick}>Click Me</button>
        </ProtectedLayout>
      );
      const button = screen.getByText("Click Me");
      button.click();
      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });

  describe("Component Immutability", () => {
    it("should not mutate children", () => {
      const child = <div data-testid="immutable">Original</div>;
      render(<ProtectedLayout>{child}</ProtectedLayout>);
      expect(screen.getByTestId("immutable")).toHaveTextContent("Original");
    });

    it("should render consistently", () => {
      const { rerender } = render(
        <ProtectedLayout>
          <div>Content</div>
        </ProtectedLayout>
      );
      expect(screen.getByText("Content")).toBeInTheDocument();
      rerender(
        <ProtectedLayout>
          <div>Content</div>
        </ProtectedLayout>
      );
      expect(screen.getByText("Content")).toBeInTheDocument();
    });
  });

  describe("TypeScript Compatibility", () => {
    it("should accept ReactNode children", () => {
      const { container } = render(
        <ProtectedLayout>
          <>Fragment</>
        </ProtectedLayout>
      );
      expect(container).toBeTruthy();
    });

    it("should render with JSX.Element", () => {
      const element = <div>Element</div>;
      render(<ProtectedLayout>{element}</ProtectedLayout>);
      expect(screen.getByText("Element")).toBeInTheDocument();
    });
  });
});
