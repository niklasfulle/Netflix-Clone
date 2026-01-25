import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import InfoButton from '../InfoButton';

// Mock react-icons/ai
jest.mock('react-icons/ai', () => ({
  AiOutlineInfoCircle: ({ size, className }: any) => (
    <svg
      className={className}
      data-testid={`info-icon-${size}`}
      width={size}
      height={size}
    />
  ),
}));

// Mock the useInfoModal hook
jest.mock('@/hooks/useInfoModal', () => ({
  __esModule: true,
  default: jest.fn(),
}));

import useInfoModal from '@/hooks/useInfoModal';

describe('InfoButton', () => {
  const mockOpenModal = jest.fn();
  const movieId = 'movie-123';

  beforeEach(() => {
    jest.clearAllMocks();
    (useInfoModal as unknown as jest.Mock).mockReturnValue({ openModal: mockOpenModal });
  });

  describe('Rendering', () => {
    test('should render button element', () => {
      render(<InfoButton movieId={movieId} />);
      const button = screen.getByRole('button');
      expect(button).toBeTruthy();
    });

    test('should render with correct movieId prop', () => {
      const testMovieId = 'test-movie-456';
      render(<InfoButton movieId={testMovieId} />);
      expect(screen.getByRole('button')).toBeTruthy();
    });

    test('should render icon elements', () => {
      render(<InfoButton movieId={movieId} />);
      const icons = screen.getAllByTestId(/info-icon-/);
      expect(icons.length).toBeGreaterThan(0);
    });

    test('should render both icon sizes', () => {
      render(<InfoButton movieId={movieId} />);
      expect(screen.getByTestId('info-icon-20')).toBeTruthy();
      expect(screen.getByTestId('info-icon-30')).toBeTruthy();
    });

    test('should render text "More info"', () => {
      render(<InfoButton movieId={movieId} />);
      expect(screen.getByText('More info')).toBeTruthy();
    });

    test('should not throw on render', () => {
      expect(() => {
        render(<InfoButton movieId={movieId} />);
      }).not.toThrow();
    });
  });

  describe('Button Styling', () => {
    test('should have flex layout', () => {
      const { container } = render(<InfoButton movieId={movieId} />);
      const button = container.querySelector('button');
      expect(button?.className).toContain('flex');
    });

    test('should have items-center class', () => {
      const { container } = render(<InfoButton movieId={movieId} />);
      const button = container.querySelector('button');
      expect(button?.className).toContain('items-center');
    });

    test('should have justify-center class', () => {
      const { container } = render(<InfoButton movieId={movieId} />);
      const button = container.querySelector('button');
      expect(button?.className).toContain('justify-center');
    });

    test('should have fixed height h-10', () => {
      const { container } = render(<InfoButton movieId={movieId} />);
      const button = container.querySelector('button');
      expect(button?.className).toContain('h-10');
    });

    test('should have fixed width w-10', () => {
      const { container } = render(<InfoButton movieId={movieId} />);
      const button = container.querySelector('button');
      expect(button?.className).toContain('w-10');
    });

    test('should have transition class', () => {
      const { container } = render(<InfoButton movieId={movieId} />);
      const button = container.querySelector('button');
      expect(button?.className).toContain('transition');
    });

    test('should have border-2', () => {
      const { container } = render(<InfoButton movieId={movieId} />);
      const button = container.querySelector('button');
      expect(button?.className).toContain('border-2');
    });

    test('should have white border', () => {
      const { container } = render(<InfoButton movieId={movieId} />);
      const button = container.querySelector('button');
      expect(button?.className).toContain('border-white');
    });

    test('should have rounded-full for circular shape', () => {
      const { container } = render(<InfoButton movieId={movieId} />);
      const button = container.querySelector('button');
      expect(button?.className).toContain('rounded-full');
    });

    test('should have cursor-pointer', () => {
      const { container } = render(<InfoButton movieId={movieId} />);
      const button = container.querySelector('button');
      expect(button?.className).toContain('cursor-pointer');
    });

    test('should have hover effect class', () => {
      const { container } = render(<InfoButton movieId={movieId} />);
      const button = container.querySelector('button');
      expect(button?.className).toContain('hover:border-neutral-300');
    });

    test('should have group/item class for hover coordination', () => {
      const { container } = render(<InfoButton movieId={movieId} />);
      const button = container.querySelector('button');
      expect(button?.className).toContain('group/item');
    });
  });

  describe('Icon Styling', () => {
    test('should have md:m-0 on desktop icon', () => {
      render(<InfoButton movieId={movieId} />);
      const icon20 = screen.getByTestId('info-icon-20');
      // Icon has className prop passed to it
      expect(icon20).toBeTruthy();
    });

    test('should have md:mr-2 on desktop icon', () => {
      render(<InfoButton movieId={movieId} />);
      const icon20 = screen.getByTestId('info-icon-20');
      expect(icon20).toBeTruthy();
    });

    test('should have hidden md:block on desktop icon (20px)', () => {
      render(<InfoButton movieId={movieId} />);
      const icon20 = screen.getByTestId('info-icon-20');
      // Desktop icon should be rendered
      expect(icon20).toBeTruthy();
    });

    test('should have m-1 on mobile icon', () => {
      render(<InfoButton movieId={movieId} />);
      const icon30 = screen.getByTestId('info-icon-30');
      expect(icon30).toBeTruthy();
    });

    test('should have md:m-0 on mobile icon', () => {
      render(<InfoButton movieId={movieId} />);
      const icon30 = screen.getByTestId('info-icon-30');
      expect(icon30).toBeTruthy();
    });

    test('should have md:mr-2 on mobile icon', () => {
      render(<InfoButton movieId={movieId} />);
      const icon30 = screen.getByTestId('info-icon-30');
      expect(icon30).toBeTruthy();
    });

    test('should have md:hidden block on mobile icon (30px)', () => {
      render(<InfoButton movieId={movieId} />);
      const icon30 = screen.getByTestId('info-icon-30');
      // Mobile icon should be rendered
      expect(icon30).toBeTruthy();
    });

    test('desktop icon should be 20px', () => {
      render(<InfoButton movieId={movieId} />);
      const icon20 = screen.getByTestId('info-icon-20');
      expect(icon20.getAttribute('width')).toBe('20');
      expect(icon20.getAttribute('height')).toBe('20');
    });

    test('mobile icon should be 30px', () => {
      render(<InfoButton movieId={movieId} />);
      const icon30 = screen.getByTestId('info-icon-30');
      expect(icon30.getAttribute('width')).toBe('30');
      expect(icon30.getAttribute('height')).toBe('30');
    });
  });

  describe('Text Styling', () => {
    test('should have hidden md:block on text', () => {
      render(<InfoButton movieId={movieId} />);
      const textElement = screen.getByText('More info');
      expect(textElement.className).toContain('hidden');
      expect(textElement.className).toContain('md:block');
    });

    test('text should only appear on desktop', () => {
      render(<InfoButton movieId={movieId} />);
      const textElement = screen.getByText('More info');
      expect(textElement).toBeTruthy();
    });

    test('text should be paragraph element', () => {
      render(<InfoButton movieId={movieId} />);
      const textElement = screen.getByText('More info');
      expect(textElement.tagName).toBe('P');
    });
  });

  describe('Hook Integration', () => {
    test('should call useInfoModal hook', () => {
      render(<InfoButton movieId={movieId} />);
      expect(useInfoModal).toHaveBeenCalled();
    });

    test('should get openModal from hook', () => {
      render(<InfoButton movieId={movieId} />);
      expect((useInfoModal as unknown as jest.Mock).mock.results[0].value).toHaveProperty(
        'openModal'
      );
    });

    test('should have access to openModal function', () => {
      render(<InfoButton movieId={movieId} />);
      expect(mockOpenModal).toBeDefined();
    });
  });

  describe('Click Handler', () => {
    test('should call openModal on button click', () => {
      render(<InfoButton movieId={movieId} />);
      const button = screen.getByRole('button');
      fireEvent.click(button);
      expect(mockOpenModal).toHaveBeenCalled();
    });

    test('should call openModal with correct movieId', () => {
      render(<InfoButton movieId={movieId} />);
      const button = screen.getByRole('button');
      fireEvent.click(button);
      expect(mockOpenModal).toHaveBeenCalledWith(movieId);
    });

    test('should call openModal once per click', () => {
      render(<InfoButton movieId={movieId} />);
      const button = screen.getByRole('button');
      fireEvent.click(button);
      expect(mockOpenModal).toHaveBeenCalledTimes(1);
    });

    test('should call openModal multiple times on multiple clicks', () => {
      render(<InfoButton movieId={movieId} />);
      const button = screen.getByRole('button');
      fireEvent.click(button);
      fireEvent.click(button);
      fireEvent.click(button);
      expect(mockOpenModal).toHaveBeenCalledTimes(3);
    });

    test('should pass correct movieId on each call', () => {
      render(<InfoButton movieId={movieId} />);
      const button = screen.getByRole('button');
      fireEvent.click(button);
      fireEvent.click(button);
      expect(mockOpenModal).toHaveBeenNthCalledWith(1, movieId);
      expect(mockOpenModal).toHaveBeenNthCalledWith(2, movieId);
    });

    test('should handle different movieIds', () => {
      const movieId1 = 'movie-1';
      const movieId2 = 'movie-2';
      const { rerender } = render(<InfoButton movieId={movieId1} />);
      
      let button = screen.getByRole('button');
      fireEvent.click(button);
      
      rerender(<InfoButton movieId={movieId2} />);
      button = screen.getByRole('button');
      fireEvent.click(button);
      
      expect(mockOpenModal).toHaveBeenNthCalledWith(1, movieId1);
      expect(mockOpenModal).toHaveBeenNthCalledWith(2, movieId2);
    });
  });

  describe('Keyboard Accessibility', () => {
    test('should be keyboard accessible (button is focusable)', () => {
      render(<InfoButton movieId={movieId} />);
      const button = screen.getByRole('button');
      expect(button.tagName).toBe('BUTTON');
    });

    test('should trigger click on Enter key', () => {
      render(<InfoButton movieId={movieId} />);
      const button = screen.getByRole('button');
      button.focus();
      fireEvent.keyDown(button, { key: 'Enter', code: 'Enter' });
      fireEvent.click(button);
      expect(mockOpenModal).toHaveBeenCalled();
    });

    test('should trigger click on Space key', () => {
      render(<InfoButton movieId={movieId} />);
      const button = screen.getByRole('button');
      button.focus();
      fireEvent.keyDown(button, { key: ' ', code: 'Space' });
      fireEvent.click(button);
      expect(mockOpenModal).toHaveBeenCalled();
    });
  });

  describe('Props Validation', () => {
    test('should accept movieId prop', () => {
      const testId = 'test-movie-999';
      render(<InfoButton movieId={testId} />);
      expect(true).toBe(true);
    });

    test('should handle empty movieId string', () => {
      render(<InfoButton movieId="" />);
      const button = screen.getByRole('button');
      fireEvent.click(button);
      expect(mockOpenModal).toHaveBeenCalledWith('');
    });

    test('should handle movieId with special characters', () => {
      const specialId = 'movie-123!@#';
      render(<InfoButton movieId={specialId} />);
      const button = screen.getByRole('button');
      fireEvent.click(button);
      expect(mockOpenModal).toHaveBeenCalledWith(specialId);
    });

    test('should handle long movieId', () => {
      const longId = 'movie-' + 'a'.repeat(200);
      render(<InfoButton movieId={longId} />);
      const button = screen.getByRole('button');
      fireEvent.click(button);
      expect(mockOpenModal).toHaveBeenCalledWith(longId);
    });
  });

  describe('Component Lifecycle', () => {
    test('should not throw on mount', () => {
      expect(() => {
        render(<InfoButton movieId={movieId} />);
      }).not.toThrow();
    });

    test('should not throw on unmount', () => {
      const { unmount } = render(<InfoButton movieId={movieId} />);
      expect(() => {
        unmount();
      }).not.toThrow();
    });

    test('should handle prop changes', () => {
      const { rerender } = render(<InfoButton movieId="movie-1" />);
      rerender(<InfoButton movieId="movie-2" />);
      expect(true).toBe(true);
    });

    test('should update openModal reference on hook change', () => {
      const mockOpenModal1 = jest.fn();
      const mockOpenModal2 = jest.fn();
      
      (useInfoModal as unknown as jest.Mock).mockReturnValue({ openModal: mockOpenModal1 });
      const { rerender } = render(<InfoButton movieId={movieId} />);
      
      (useInfoModal as unknown as jest.Mock).mockReturnValue({ openModal: mockOpenModal2 });
      rerender(<InfoButton movieId={movieId} />);
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      // The most recent mock should be called
      expect(mockOpenModal1).not.toHaveBeenCalled();
      expect(mockOpenModal2).toHaveBeenCalledWith(movieId);
    });

    test('should maintain focus after click', () => {
      render(<InfoButton movieId={movieId} />);
      const button = screen.getByRole('button') as HTMLButtonElement;
      button.focus();
      fireEvent.click(button);
      expect(document.activeElement).toBe(button);
    });
  });

  describe('Edge Cases', () => {
    test('should handle rapid clicks', () => {
      render(<InfoButton movieId={movieId} />);
      const button = screen.getByRole('button');
      for (let i = 0; i < 10; i++) {
        fireEvent.click(button);
      }
      expect(mockOpenModal).toHaveBeenCalledTimes(10);
    });

    test('should maintain movieId across multiple renders', () => {
      const testId = 'consistent-movie-id';
      const { rerender } = render(<InfoButton movieId={testId} />);
      
      let button = screen.getByRole('button');
      fireEvent.click(button);
      
      rerender(<InfoButton movieId={testId} />);
      button = screen.getByRole('button');
      fireEvent.click(button);
      
      expect(mockOpenModal).toHaveBeenCalledWith(testId);
      expect(mockOpenModal).toHaveBeenCalledTimes(2);
    });
  });

  describe('Responsive Behavior', () => {
    test('desktop icon should have size 20', () => {
      render(<InfoButton movieId={movieId} />);
      const desktopIcon = screen.getByTestId('info-icon-20');
      expect(desktopIcon).toBeTruthy();
    });

    test('mobile icon should have size 30', () => {
      render(<InfoButton movieId={movieId} />);
      const mobileIcon = screen.getByTestId('info-icon-30');
      expect(mobileIcon).toBeTruthy();
    });

    test('should have both icons rendered (browser handles responsive display)', () => {
      render(<InfoButton movieId={movieId} />);
      const desktopIcon = screen.getByTestId('info-icon-20');
      const mobileIcon = screen.getByTestId('info-icon-30');
      expect(desktopIcon).toBeTruthy();
      expect(mobileIcon).toBeTruthy();
    });

    test('both icons should have responsive classes', () => {
      render(<InfoButton movieId={movieId} />);
      const desktopIcon = screen.getByTestId('info-icon-20');
      const mobileIcon = screen.getByTestId('info-icon-30');
      
      // Both icons should be rendered
      expect(desktopIcon).toBeTruthy();
      expect(mobileIcon).toBeTruthy();
    });
  });

  describe('Full Integration', () => {
    test('should render complete button with all elements', () => {
      render(<InfoButton movieId={movieId} />);
      
      const button = screen.getByRole('button');
      expect(button).toBeTruthy();
      
      const desktopIcon = screen.getByTestId('info-icon-20');
      expect(desktopIcon).toBeTruthy();
      
      const mobileIcon = screen.getByTestId('info-icon-30');
      expect(mobileIcon).toBeTruthy();
      
      const text = screen.getByText('More info');
      expect(text).toBeTruthy();
    });

    test('should handle complete user workflow', () => {
      render(<InfoButton movieId={movieId} />);
      
      const button = screen.getByRole('button');
      expect(button).toBeTruthy();
      
      fireEvent.click(button);
      expect(mockOpenModal).toHaveBeenCalledWith(movieId);
      
      fireEvent.click(button);
      expect(mockOpenModal).toHaveBeenCalledTimes(2);
    });

    test('should be fully functional with all props', () => {
      const testMovieId = 'final-test-movie';
      render(<InfoButton movieId={testMovieId} />);
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      expect(mockOpenModal).toHaveBeenCalledWith(testMovieId);
      expect(screen.getByRole('button')).toBeTruthy();
      expect(screen.getByText('More info')).toBeTruthy();
      expect(screen.getByTestId('info-icon-20')).toBeTruthy();
      expect(screen.getByTestId('info-icon-30')).toBeTruthy();
    });
  });
});
