import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock hook before importing component
jest.mock('@/hooks/useInfoModal');

// Mock icons first before importing component
jest.mock('react-icons/ai', () => ({
  AiOutlineInfoCircle: ({ size, className }: any) => (
    <svg data-testid="info-icon" data-size={size} data-classname={className}>
      {/* icon content */}
    </svg>
  ),
}));

import BillboardInfoButton from '../BillboardInfoButton';
import useInfoModal from '@/hooks/useInfoModal';

const mockUseInfoModal = useInfoModal as jest.MockedFunction<typeof useInfoModal>;

describe('BillboardInfoButton', () => {
  const defaultMockData = {
    openModal: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseInfoModal.mockReturnValue(defaultMockData as any);
  });

  describe('Rendering', () => {
    it('should render without crashing', () => {
      render(<BillboardInfoButton movieId="movie-1" />);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should render a button element', () => {
      render(<BillboardInfoButton movieId="movie-1" />);
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
      expect(button.tagName).toBe('BUTTON');
    });

    it('should render with proper button structure', () => {
      render(<BillboardInfoButton movieId="movie-1" />);
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
      expect(button.querySelectorAll('svg').length).toBeGreaterThan(0);
    });

    it('should render two icons', () => {
      const { container } = render(<BillboardInfoButton movieId="movie-1" />);
      const icons = container.querySelectorAll('[data-testid="info-icon"]');
      expect(icons).toHaveLength(2);
    });

    it('should render more info text', () => {
      render(<BillboardInfoButton movieId="movie-1" />);
      const text = screen.getByText('More info');
      expect(text).toBeInTheDocument();
    });

    it('should render all elements together', () => {
      render(<BillboardInfoButton movieId="movie-1" />);
      expect(screen.getByRole('button')).toBeInTheDocument();
      expect(screen.getAllByTestId('info-icon')).toHaveLength(2);
      expect(screen.getByText('More info')).toBeInTheDocument();
    });
  });

  describe('Icon Display', () => {
    it('should render info icons', () => {
      const { container } = render(<BillboardInfoButton movieId="movie-1" />);
      const icons = container.querySelectorAll('[data-testid="info-icon"]');
      expect(icons.length).toBe(2);
    });

    it('should render first icon with size 20 for medium screens', () => {
      const { container } = render(<BillboardInfoButton movieId="movie-1" />);
      const icons = container.querySelectorAll('[data-testid="info-icon"]');
      expect(icons[0].getAttribute('data-size')).toBe('20');
    });

    it('should render second icon with size 30 for small screens', () => {
      const { container } = render(<BillboardInfoButton movieId="movie-1" />);
      const icons = container.querySelectorAll('[data-testid="info-icon"]');
      expect(icons[1].getAttribute('data-size')).toBe('30');
    });

    it('should have responsive classes on first icon', () => {
      const { container } = render(<BillboardInfoButton movieId="movie-1" />);
      const icons = container.querySelectorAll('[data-testid="info-icon"]');
      const className = icons[0].getAttribute('data-classname');
      expect(className).toMatch(/hidden/);
      expect(className).toMatch(/md:block/);
    });

    it('should have responsive classes on second icon', () => {
      const { container } = render(<BillboardInfoButton movieId="movie-1" />);
      const icons = container.querySelectorAll('[data-testid="info-icon"]');
      const className = icons[1].getAttribute('data-classname');
      expect(className).toMatch(/md:hidden/);
      expect(className).toMatch(/block/);
    });

    it('should have margin classes on icons', () => {
      const { container } = render(<BillboardInfoButton movieId="movie-1" />);
      const icons = container.querySelectorAll('[data-testid="info-icon"]');
      icons.forEach((icon) => {
        const className = icon.getAttribute('data-classname');
        expect(className).toMatch(/m-1/);
        expect(className).toMatch(/md:m-0/);
        expect(className).toMatch(/md:mr-2/);
      });
    });
  });

  describe('Button Styling', () => {
    it('should have flex container styling', () => {
      render(<BillboardInfoButton movieId="movie-1" />);
      const button = screen.getByRole('button');
      expect(button.className).toMatch(/flex/);
      expect(button.className).toMatch(/flex-row/);
      expect(button.className).toMatch(/items-center/);
      expect(button.className).toMatch(/justify-center/);
    });

    it('should have responsive padding', () => {
      render(<BillboardInfoButton movieId="movie-1" />);
      const button = screen.getByRole('button');
      expect(button.className).toMatch(/p-0/);
      expect(button.className).toMatch(/md:p-2/);
    });

    it('should have responsive height', () => {
      render(<BillboardInfoButton movieId="movie-1" />);
      const button = screen.getByRole('button');
      expect(button.className).toMatch(/h-10/);
      expect(button.className).toMatch(/md:h-auto/);
    });

    it('should have responsive width', () => {
      render(<BillboardInfoButton movieId="movie-1" />);
      const button = screen.getByRole('button');
      expect(button.className).toMatch(/w-10/);
      expect(button.className).toMatch(/md:w-auto/);
    });

    it('should have text color styling', () => {
      render(<BillboardInfoButton movieId="movie-1" />);
      const button = screen.getByRole('button');
      expect(button.className).toMatch(/text-white/);
    });

    it('should have text size styling', () => {
      render(<BillboardInfoButton movieId="movie-1" />);
      const button = screen.getByRole('button');
      expect(button.className).toMatch(/text-md/);
      expect(button.className).toMatch(/lg:text-lg/);
    });

    it('should have font weight styling', () => {
      render(<BillboardInfoButton movieId="movie-1" />);
      const button = screen.getByRole('button');
      expect(button.className).toMatch(/font-semibold/);
    });

    it('should have background color styling', () => {
      render(<BillboardInfoButton movieId="movie-1" />);
      const button = screen.getByRole('button');
      expect(button.className).toMatch(/bg-white\/30/);
    });

    it('should have rounded styling', () => {
      render(<BillboardInfoButton movieId="movie-1" />);
      const button = screen.getByRole('button');
      expect(button.className).toMatch(/rounded-full/);
      expect(button.className).toMatch(/md:rounded-md/);
    });

    it('should have cursor pointer', () => {
      render(<BillboardInfoButton movieId="movie-1" />);
      const button = screen.getByRole('button');
      expect(button.className).toMatch(/cursor-pointer/);
    });

    it('should have transition effect', () => {
      render(<BillboardInfoButton movieId="movie-1" />);
      const button = screen.getByRole('button');
      expect(button.className).toMatch(/transition/);
    });

    it('should have hover state', () => {
      render(<BillboardInfoButton movieId="movie-1" />);
      const button = screen.getByRole('button');
      expect(button.className).toMatch(/hover:bg-neutral-400\/30/);
    });
  });

  describe('Text Content', () => {
    it('should display more info text', () => {
      render(<BillboardInfoButton movieId="movie-1" />);
      const text = screen.getByText('More info');
      expect(text).toBeInTheDocument();
    });

    it('should render text in paragraph element', () => {
      const { container } = render(<BillboardInfoButton movieId="movie-1" />);
      const paragraph = container.querySelector('p');
      expect(paragraph).toBeInTheDocument();
      expect(paragraph?.textContent).toBe('More info');
    });

    it('should have responsive visibility on text', () => {
      const { container } = render(<BillboardInfoButton movieId="movie-1" />);
      const paragraph = container.querySelector('p');
      expect(paragraph?.className).toMatch(/hidden/);
      expect(paragraph?.className).toMatch(/md:block/);
    });

    it('should only display text once', () => {
      render(<BillboardInfoButton movieId="movie-1" />);
      const texts = screen.getAllByText('More info');
      expect(texts).toHaveLength(1);
    });
  });

  describe('Props Handling', () => {
    it('should accept movieId prop', () => {
      render(<BillboardInfoButton movieId="movie-1" />);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should use movieId in click handler', async () => {
      render(<BillboardInfoButton movieId="movie-123" />);
      const button = screen.getByRole('button');

      fireEvent.click(button);

      await waitFor(() => {
        expect(defaultMockData.openModal).toHaveBeenCalledWith('movie-123');
      });
    });

    it('should update movieId when prop changes', async () => {
      const { rerender } = render(<BillboardInfoButton movieId="movie-1" />);
      let button = screen.getByRole('button');
      fireEvent.click(button);

      await waitFor(() => {
        expect(defaultMockData.openModal).toHaveBeenCalledWith('movie-1');
      });

      jest.clearAllMocks();
      rerender(<BillboardInfoButton movieId="movie-2" />);
      button = screen.getByRole('button');
      fireEvent.click(button);

      await waitFor(() => {
        expect(defaultMockData.openModal).toHaveBeenCalledWith('movie-2');
      });
    });

    it('should work with different movieIds', async () => {
      const { rerender } = render(<BillboardInfoButton movieId="abc-123" />);
      let button = screen.getByRole('button');
      fireEvent.click(button);

      await waitFor(() => {
        expect(defaultMockData.openModal).toHaveBeenCalledWith('abc-123');
      });

      jest.clearAllMocks();
      rerender(<BillboardInfoButton movieId="xyz-789" />);
      button = screen.getByRole('button');
      fireEvent.click(button);

      await waitFor(() => {
        expect(defaultMockData.openModal).toHaveBeenCalledWith('xyz-789');
      });
    });
  });

  describe('Click Handler', () => {
    it('should call openModal on button click', async () => {
      render(<BillboardInfoButton movieId="movie-1" />);
      const button = screen.getByRole('button');

      fireEvent.click(button);

      await waitFor(() => {
        expect(defaultMockData.openModal).toHaveBeenCalled();
      });
    });

    it('should call openModal with correct movieId', async () => {
      render(<BillboardInfoButton movieId="movie-456" />);
      const button = screen.getByRole('button');

      fireEvent.click(button);

      await waitFor(() => {
        expect(defaultMockData.openModal).toHaveBeenCalledWith('movie-456');
      });
    });

    it('should call openModal only once per click', async () => {
      render(<BillboardInfoButton movieId="movie-1" />);
      const button = screen.getByRole('button');

      fireEvent.click(button);

      await waitFor(() => {
        expect(defaultMockData.openModal).toHaveBeenCalledTimes(1);
      });
    });

    it('should call openModal multiple times on multiple clicks', async () => {
      render(<BillboardInfoButton movieId="movie-1" />);
      const button = screen.getByRole('button');

      fireEvent.click(button);
      fireEvent.click(button);
      fireEvent.click(button);

      await waitFor(() => {
        expect(defaultMockData.openModal).toHaveBeenCalledTimes(3);
      });
    });

    it('should handle click without error when openModal is available', async () => {
      render(<BillboardInfoButton movieId="movie-1" />);
      const button = screen.getByRole('button');

      expect(() => {
        fireEvent.click(button);
      }).not.toThrow();
    });
  });

  describe('Hook Integration', () => {
    it('should use useInfoModal hook', () => {
      render(<BillboardInfoButton movieId="movie-1" />);
      expect(mockUseInfoModal).toHaveBeenCalled();
    });

    it('should destructure openModal from hook', () => {
      render(<BillboardInfoButton movieId="movie-1" />);
      expect(mockUseInfoModal).toHaveBeenCalled();
    });

    it('should call openModal function from hook', async () => {
      render(<BillboardInfoButton movieId="movie-1" />);
      const button = screen.getByRole('button');

      fireEvent.click(button);

      await waitFor(() => {
        expect(defaultMockData.openModal).toHaveBeenCalled();
      });
    });
  });

  describe('Accessibility', () => {
    it('should be a clickable button', () => {
      render(<BillboardInfoButton movieId="movie-1" />);
      const button = screen.getByRole('button');
      expect(button).not.toBeDisabled();
    });

    it('should not have disabled attribute', () => {
      render(<BillboardInfoButton movieId="movie-1" />);
      const button = screen.getByRole('button');
      expect(button).not.toHaveAttribute('disabled');
    });

    it('should be focusable', () => {
      render(<BillboardInfoButton movieId="movie-1" />);
      const button = screen.getByRole('button');
      button.focus();
      expect(document.activeElement).toBe(button);
    });

    it('should have proper semantic meaning', () => {
      render(<BillboardInfoButton movieId="movie-1" />);
      const button = screen.getByRole('button');
      expect(button.tagName).toBe('BUTTON');
    });
  });

  describe('Button Container', () => {
    it('should have button-like appearance', () => {
      render(<BillboardInfoButton movieId="movie-1" />);
      const button = screen.getByRole('button');
      expect(button.className).toMatch(/cursor-pointer/);
      expect(button.className).toMatch(/transition/);
      expect(button.className).toMatch(/rounded/);
    });

    it('should be centered', () => {
      render(<BillboardInfoButton movieId="movie-1" />);
      const button = screen.getByRole('button');
      expect(button.className).toMatch(/flex/);
      expect(button.className).toMatch(/items-center/);
      expect(button.className).toMatch(/justify-center/);
    });

    it('should have responsive sizing', () => {
      render(<BillboardInfoButton movieId="movie-1" />);
      const button = screen.getByRole('button');
      expect(button.className).toMatch(/h-10/);
      expect(button.className).toMatch(/md:h-auto/);
      expect(button.className).toMatch(/w-10/);
      expect(button.className).toMatch(/md:w-auto/);
    });

    it('should have semi-transparent white background', () => {
      render(<BillboardInfoButton movieId="movie-1" />);
      const button = screen.getByRole('button');
      expect(button.className).toMatch(/bg-white\/30/);
    });
  });

  describe('Component Structure', () => {
    it('should be React FC component', () => {
      const component = BillboardInfoButton;
      expect(component).toBeDefined();
      expect(typeof component).toBe('function');
    });

    it('should be functional component', () => {
      const { container } = render(<BillboardInfoButton movieId="movie-1" />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should accept single movieId prop', () => {
      render(<BillboardInfoButton movieId="movie-1" />);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should render consistently', () => {
      const { rerender } = render(<BillboardInfoButton movieId="movie-1" />);
      const firstButton = screen.getByRole('button');
      const firstClass = firstButton.className;

      rerender(<BillboardInfoButton movieId="movie-1" />);
      const secondButton = screen.getByRole('button');
      const secondClass = secondButton.className;

      expect(firstClass).toBe(secondClass);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty movieId', () => {
      render(<BillboardInfoButton movieId="" />);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should handle movieId with spaces', async () => {
      render(<BillboardInfoButton movieId="movie with spaces" />);
      const button = screen.getByRole('button');

      fireEvent.click(button);

      await waitFor(() => {
        expect(defaultMockData.openModal).toHaveBeenCalledWith('movie with spaces');
      });
    });

    it('should handle movieId with special characters', async () => {
      render(<BillboardInfoButton movieId="movie-!@#$%^&*()" />);
      const button = screen.getByRole('button');

      fireEvent.click(button);

      await waitFor(() => {
        expect(defaultMockData.openModal).toHaveBeenCalledWith('movie-!@#$%^&*()');
      });
    });

    it('should handle very long movieId', async () => {
      const longId = 'a'.repeat(1000);
      render(<BillboardInfoButton movieId={longId} />);
      const button = screen.getByRole('button');

      fireEvent.click(button);

      await waitFor(() => {
        expect(defaultMockData.openModal).toHaveBeenCalledWith(longId);
      });
    });

    it('should handle numeric movieId', async () => {
      render(<BillboardInfoButton movieId="12345" />);
      const button = screen.getByRole('button');

      fireEvent.click(button);

      await waitFor(() => {
        expect(defaultMockData.openModal).toHaveBeenCalledWith('12345');
      });
    });

    it('should update correctly when movieId changes multiple times', async () => {
      const { rerender } = render(<BillboardInfoButton movieId="movie-1" />);
      let button = screen.getByRole('button');
      fireEvent.click(button);

      await waitFor(() => {
        expect(defaultMockData.openModal).toHaveBeenCalledWith('movie-1');
      });

      jest.clearAllMocks();
      rerender(<BillboardInfoButton movieId="movie-2" />);
      button = screen.getByRole('button');
      fireEvent.click(button);

      await waitFor(() => {
        expect(defaultMockData.openModal).toHaveBeenCalledWith('movie-2');
      });

      jest.clearAllMocks();
      rerender(<BillboardInfoButton movieId="movie-3" />);
      button = screen.getByRole('button');
      fireEvent.click(button);

      await waitFor(() => {
        expect(defaultMockData.openModal).toHaveBeenCalledWith('movie-3');
      });
    });
  });

  describe('DOM Structure', () => {
    it('should have button as root element', () => {
      const { container } = render(<BillboardInfoButton movieId="movie-1" />);
      expect(container.firstChild?.nodeName).toBe('BUTTON');
    });

    it('should have proper nesting', () => {
      const { container } = render(<BillboardInfoButton movieId="movie-1" />);
      const button = container.querySelector('button');
      const icons = button?.querySelectorAll('svg');
      const paragraph = button?.querySelector('p');
      expect(icons?.length).toBe(2);
      expect(paragraph).toBeInTheDocument();
    });

    it('should not have unnecessary nesting', () => {
      const { container } = render(<BillboardInfoButton movieId="movie-1" />);
      const divCount = container.querySelectorAll('div').length;
      // Should not have any extra divs
      expect(divCount).toBe(0);
    });

    it('should have button with direct children', () => {
      const { container } = render(<BillboardInfoButton movieId="movie-1" />);
      const button = container.querySelector('button');
      const children = button?.children;
      expect(children).toBeDefined();
      expect(children?.length).toBeGreaterThan(0);
    });
  });

  describe('Styling Consistency', () => {
    it('should maintain styling across rerenders', () => {
      const { rerender } = render(<BillboardInfoButton movieId="movie-1" />);
      const firstButton = screen.getByRole('button');
      const firstClasses = firstButton.className;

      rerender(<BillboardInfoButton movieId="movie-2" />);
      const secondButton = screen.getByRole('button');
      const secondClasses = secondButton.className;

      expect(firstClasses).toBe(secondClasses);
    });

    it('should preserve all styling classes', () => {
      render(<BillboardInfoButton movieId="movie-1" />);
      const button = screen.getByRole('button');
      const classString = button.className || '';

      expect(classString).toContain('flex');
      expect(classString).toContain('flex-row');
      expect(classString).toContain('items-center');
      expect(classString).toContain('justify-center');
      expect(classString).toContain('p-0');
      expect(classString).toContain('md:p-2');
      expect(classString).toContain('text-md');
      expect(classString).toContain('h-10');
      expect(classString).toContain('w-10');
      expect(classString).toContain('text-white');
      expect(classString).toContain('font-semibold');
      expect(classString).toContain('transition');
      expect(classString).toContain('bg-white/30');
      expect(classString).toContain('rounded-full');
      expect(classString).toContain('cursor-pointer');
    });
  });

  describe('Responsive Behavior', () => {
    it('should have mobile-first design', () => {
      render(<BillboardInfoButton movieId="movie-1" />);
      const button = screen.getByRole('button');
      expect(button.className).toMatch(/p-0/);
      expect(button.className).toMatch(/h-10/);
      expect(button.className).toMatch(/w-10/);
    });

    it('should have tablet breakpoints', () => {
      render(<BillboardInfoButton movieId="movie-1" />);
      const button = screen.getByRole('button');
      expect(button.className).toMatch(/md:p-2/);
      expect(button.className).toMatch(/md:h-auto/);
      expect(button.className).toMatch(/md:w-auto/);
    });

    it('should have large screen text size', () => {
      render(<BillboardInfoButton movieId="movie-1" />);
      const button = screen.getByRole('button');
      expect(button.className).toMatch(/lg:text-lg/);
    });

    it('should have different icons for different screen sizes', () => {
      const { container } = render(<BillboardInfoButton movieId="movie-1" />);
      const icons = container.querySelectorAll('[data-testid="info-icon"]');
      expect(icons[0].getAttribute('data-size')).toBe('20');
      expect(icons[1].getAttribute('data-size')).toBe('30');
    });
  });

  describe('Mocking Verification', () => {
    it('should use useInfoModal hook', () => {
      render(<BillboardInfoButton movieId="movie-1" />);
      expect(mockUseInfoModal).toHaveBeenCalled();
    });

    it('should use AiOutlineInfoCircle icon from react-icons', () => {
      const { container } = render(<BillboardInfoButton movieId="movie-1" />);
      const icons = container.querySelectorAll('[data-testid="info-icon"]');
      expect(icons.length).toBe(2);
    });
  });

  describe('Integration', () => {
    it('should be complete info button', () => {
      render(<BillboardInfoButton movieId="movie-1" />);
      expect(screen.getByRole('button')).toBeInTheDocument();
      expect(screen.getAllByTestId('info-icon')).toHaveLength(2);
      expect(screen.getByText('More info')).toBeInTheDocument();
    });

    it('should handle full workflow', async () => {
      render(<BillboardInfoButton movieId="movie-1" />);
      const button = screen.getByRole('button');

      expect(button).toBeInTheDocument();
      expect(screen.getAllByTestId('info-icon')).toHaveLength(2);
      expect(screen.getByText('More info')).toBeInTheDocument();

      fireEvent.click(button);

      await waitFor(() => {
        expect(defaultMockData.openModal).toHaveBeenCalledWith('movie-1');
      });
    });

    it('should maintain functionality across state changes', async () => {
      const { rerender } = render(<BillboardInfoButton movieId="initial" />);
      let button = screen.getByRole('button');
      fireEvent.click(button);

      await waitFor(() => {
        expect(defaultMockData.openModal).toHaveBeenCalledWith('initial');
      });

      jest.clearAllMocks();
      rerender(<BillboardInfoButton movieId="updated" />);
      button = screen.getByRole('button');
      fireEvent.click(button);

      await waitFor(() => {
        expect(defaultMockData.openModal).toHaveBeenCalledWith('updated');
      });
    });

    it('should be interactive element', () => {
      render(<BillboardInfoButton movieId="movie-1" />);
      const button = screen.getByRole('button');
      expect(button).not.toBeDisabled();
      expect(button).not.toHaveAttribute('disabled');
    });

    it('should handle multiple interactions', async () => {
      render(<BillboardInfoButton movieId="movie-1" />);
      const button = screen.getByRole('button');

      fireEvent.click(button);
      fireEvent.click(button);

      await waitFor(() => {
        expect(defaultMockData.openModal).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Content Display', () => {
    it('should display more info text', () => {
      render(<BillboardInfoButton movieId="movie-1" />);
      expect(screen.getByText('More info')).toBeInTheDocument();
    });

    it('should have correct text in paragraph', () => {
      const { container } = render(<BillboardInfoButton movieId="movie-1" />);
      const paragraph = container.querySelector('p');
      expect(paragraph?.textContent).toBe('More info');
    });

    it('should not have extra text content', () => {
      const { container } = render(<BillboardInfoButton movieId="movie-1" />);
      const button = container.querySelector('button');
      // Should only have the two icons and one paragraph as children
      expect(button?.children.length).toBe(3);
    });
  });
});
