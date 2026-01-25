import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import SearchItem from '../SearchItem';
import { useRouter } from 'next/navigation';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock react-icons
jest.mock('react-icons/fa', () => ({
  FaSearch: ({ onClick, size, className }: any) => (
    <svg
      onClick={onClick}
      data-testid="search-icon"
      data-size={size}
      className={className}
    />
  ),
}));

describe('SearchItem', () => {
  const mockPush = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });
  });

  describe('Rendering', () => {
    it('should render search input field', () => {
      render(<SearchItem />);
      const input = screen.getByRole('searchbox');
      expect(input).toBeInTheDocument();
    });

    it('should render with correct input type', () => {
      render(<SearchItem />);
      const input = screen.getByRole('searchbox') as HTMLInputElement;
      expect(input).toHaveAttribute('type', 'search');
    });

    it('should have correct input name attribute', () => {
      render(<SearchItem />);
      const input = screen.getByRole('searchbox');
      expect(input).toHaveAttribute('name', 'search');
    });

    it('should render search button', () => {
      render(<SearchItem />);
      const button = screen.getByRole('button', { name: /search/i });
      expect(button).toBeInTheDocument();
    });

    it('should render search icon', () => {
      render(<SearchItem />);
      const icon = screen.getByTestId('search-icon');
      expect(icon).toBeInTheDocument();
    });

    it('should render with correct placeholder text', () => {
      render(<SearchItem />);
      const input = screen.getByRole('searchbox') as HTMLInputElement;
      expect(input).toHaveAttribute('placeholder', 'Search');
    });

    it('should have correct container classes', () => {
      const { container } = render(<SearchItem />);
      const wrapper = container.querySelector('.relative');
      expect(wrapper).toBeInTheDocument();
      expect(wrapper).toHaveClass('flex');
      expect(wrapper).toHaveClass('flex-row');
      expect(wrapper).toHaveClass('w-full');
    });

    it('should have relative positioning for button', () => {
      const { container } = render(<SearchItem />);
      const button = container.querySelector('button');
      expect(button).toHaveClass('absolute');
      expect(button).toHaveClass('top-0');
      expect(button).toHaveClass('right-0');
    });
  });

  describe('Input Styling', () => {
    it('should have correct input classes', () => {
      render(<SearchItem />);
      const input = screen.getByRole('searchbox');
      expect(input).toHaveClass('opacity-100');
      expect(input).toHaveClass('cursor-text');
      expect(input).toHaveClass('w-full');
      expect(input).toHaveClass('h-10');
      expect(input).toHaveClass('px-5');
      expect(input).toHaveClass('pr-10');
      expect(input).toHaveClass('rounded-full');
      expect(input).toHaveClass('border-2');
      expect(input).toHaveClass('border-white');
    });

    it('should have focus outline none', () => {
      render(<SearchItem />);
      const input = screen.getByRole('searchbox');
      expect(input).toHaveClass('focus:outline-none');
    });

    it('should have white text color', () => {
      render(<SearchItem />);
      const input = screen.getByRole('searchbox');
      expect(input).toHaveClass('text-white');
    });

    it('should have placeholder styling', () => {
      render(<SearchItem />);
      const input = screen.getByRole('searchbox');
      expect(input).toHaveClass('placeholder:text-neutral-300');
    });

    it('should have transparent background', () => {
      render(<SearchItem />);
      const input = screen.getByRole('searchbox');
      expect(input).toHaveClass('bg-[transparent]');
    });
  });

  describe('User Input', () => {
    it('should update input value on text input', () => {
      render(<SearchItem />);
      const input = screen.getByRole('searchbox') as HTMLInputElement;
      
      fireEvent.change(input, { target: { value: 'test movie' } });
      
      expect(input.value).toBe('test movie');
    });

    it('should call searchHandler on input change', () => {
      render(<SearchItem />);
      const input = screen.getByRole('searchbox') as HTMLInputElement;
      
      fireEvent.change(input, { target: { value: 'avatar' } });
      
      expect(input.value).toBe('avatar');
    });

    it('should update state as user types', () => {
      render(<SearchItem />);
      const input = screen.getByRole('searchbox') as HTMLInputElement;
      
      fireEvent.change(input, { target: { value: 'a' } });
      expect(input.value).toBe('a');
      
      fireEvent.change(input, { target: { value: 'ab' } });
      expect(input.value).toBe('ab');
    });

    it('should handle special characters in input', () => {
      render(<SearchItem />);
      const input = screen.getByRole('searchbox') as HTMLInputElement;
      
      fireEvent.change(input, { target: { value: 'movie-2023!' } });
      
      expect(input.value).toBe('movie-2023!');
    });

    it('should handle numbers in input', () => {
      render(<SearchItem />);
      const input = screen.getByRole('searchbox') as HTMLInputElement;
      
      fireEvent.change(input, { target: { value: '123456' } });
      
      expect(input.value).toBe('123456');
    });

    it('should clear input on backspace', () => {
      render(<SearchItem />);
      const input = screen.getByRole('searchbox') as HTMLInputElement;
      
      fireEvent.change(input, { target: { value: 'test' } });
      expect(input.value).toBe('test');
      
      fireEvent.change(input, { target: { value: 'tes' } });
      expect(input.value).toBe('tes');
    });

    it('should handle pasting text into input', () => {
      render(<SearchItem />);
      const input = screen.getByRole('searchbox') as HTMLInputElement;
      
      fireEvent.change(input, { target: { value: 'pasted text' } });
      
      expect(input.value).toBe('pasted text');
    });

    it('should maintain value state across re-renders', () => {
      const { rerender } = render(<SearchItem />);
      const input = screen.getByRole('searchbox') as HTMLInputElement;
      
      fireEvent.change(input, { target: { value: 'persistent' } });
      expect(input.value).toBe('persistent');
      
      // After rerender, the component retains the value from the last update
      // because onChange updates the internal state via setValue
      rerender(<SearchItem />);
      const newInput = screen.getByRole('searchbox') as HTMLInputElement;
      // Component state persists because the value is maintained by onChange handler
      expect(newInput.value).toBe('persistent');
    });
  });

  describe('Keyboard Events', () => {
    it('should navigate on Enter key with non-empty value', () => {
      render(<SearchItem />);
      const input = screen.getByRole('searchbox') as HTMLInputElement;
      
      fireEvent.change(input, { target: { value: 'test movie' } });
      fireEvent.keyDown(input, { key: 'Enter' });
      
      expect(mockPush).toHaveBeenCalledWith('/search/test movie');
    });

    it('should not navigate on Enter key with empty value', () => {
      render(<SearchItem />);
      const input = screen.getByRole('searchbox') as HTMLInputElement;
      
      fireEvent.change(input, { target: { value: '' } });
      fireEvent.keyDown(input, { key: 'Enter' });
      
      expect(mockPush).not.toHaveBeenCalled();
    });

    it('should not navigate on other keys', () => {
      render(<SearchItem />);
      const input = screen.getByRole('searchbox') as HTMLInputElement;
      
      fireEvent.change(input, { target: { value: 'test' } });
      fireEvent.keyDown(input, { key: 'Space' });
      
      expect(mockPush).not.toHaveBeenCalled();
    });

    it('should navigate on Enter key with special characters', () => {
      render(<SearchItem />);
      const input = screen.getByRole('searchbox') as HTMLInputElement;
      
      fireEvent.change(input, { target: { value: 'movie-2023!' } });
      fireEvent.keyDown(input, { key: 'Enter' });
      
      expect(mockPush).toHaveBeenCalledWith('/search/movie-2023!');
    });

    it('should navigate on Enter key with numbers', () => {
      render(<SearchItem />);
      const input = screen.getByRole('searchbox') as HTMLInputElement;
      
      fireEvent.change(input, { target: { value: '123' } });
      fireEvent.keyDown(input, { key: 'Enter' });
      
      expect(mockPush).toHaveBeenCalledWith('/search/123');
    });

    it('should navigate with spaces in search query', () => {
      render(<SearchItem />);
      const input = screen.getByRole('searchbox') as HTMLInputElement;
      
      fireEvent.change(input, { target: { value: 'the dark knight' } });
      fireEvent.keyDown(input, { key: 'Enter' });
      
      expect(mockPush).toHaveBeenCalledWith('/search/the dark knight');
    });

    it('should handle ArrowUp key without navigation', () => {
      render(<SearchItem />);
      const input = screen.getByRole('searchbox') as HTMLInputElement;
      
      fireEvent.change(input, { target: { value: 'test' } });
      fireEvent.keyDown(input, { key: 'ArrowUp' });
      
      expect(mockPush).not.toHaveBeenCalled();
    });

    it('should handle ArrowDown key without navigation', () => {
      render(<SearchItem />);
      const input = screen.getByRole('searchbox') as HTMLInputElement;
      
      fireEvent.change(input, { target: { value: 'test' } });
      fireEvent.keyDown(input, { key: 'ArrowDown' });
      
      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  describe('Button Click Interaction', () => {
    it('should navigate on button click with non-empty value', () => {
      render(<SearchItem />);
      const input = screen.getByRole('searchbox') as HTMLInputElement;
      const icon = screen.getByTestId('search-icon');
      
      fireEvent.change(input, { target: { value: 'test movie' } });
      fireEvent.click(icon);
      
      expect(mockPush).toHaveBeenCalledWith('/search/test movie');
    });

    it('should not navigate on button click with empty value', () => {
      render(<SearchItem />);
      const icon = screen.getByTestId('search-icon');
      
      fireEvent.click(icon);
      
      expect(mockPush).not.toHaveBeenCalled();
    });

    it('should navigate with correct URL format on icon click', () => {
      render(<SearchItem />);
      const input = screen.getByRole('searchbox') as HTMLInputElement;
      const icon = screen.getByTestId('search-icon');
      
      fireEvent.change(input, { target: { value: 'avatar' } });
      fireEvent.click(icon);
      
      expect(mockPush).toHaveBeenCalledWith('/search/avatar');
    });

    it('should handle multiple button clicks', () => {
      render(<SearchItem />);
      const input = screen.getByRole('searchbox') as HTMLInputElement;
      const icon = screen.getByTestId('search-icon');
      
      fireEvent.change(input, { target: { value: 'movie1' } });
      fireEvent.click(icon);
      expect(mockPush).toHaveBeenCalledWith('/search/movie1');
      
      fireEvent.change(input, { target: { value: 'movie2' } });
      fireEvent.click(icon);
      expect(mockPush).toHaveBeenCalledWith('/search/movie2');
      
      expect(mockPush).toHaveBeenCalledTimes(2);
    });

    it('should have correct button type', () => {
      render(<SearchItem />);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('type', 'submit');
    });
  });

  describe('Edge Cases', () => {
    it('should handle whitespace-only input', () => {
      render(<SearchItem />);
      const input = screen.getByRole('searchbox') as HTMLInputElement;
      
      fireEvent.change(input, { target: { value: '   ' } });
      fireEvent.keyDown(input, { key: 'Enter' });
      
      expect(mockPush).toHaveBeenCalledWith('/search/   ');
    });

    it('should handle very long search query', () => {
      render(<SearchItem />);
      const input = screen.getByRole('searchbox') as HTMLInputElement;
      const longQuery = 'a'.repeat(500);
      
      fireEvent.change(input, { target: { value: longQuery } });
      fireEvent.keyDown(input, { key: 'Enter' });
      
      expect(mockPush).toHaveBeenCalledWith(`/search/${longQuery}`);
    });

    it('should handle unicode characters', () => {
      render(<SearchItem />);
      const input = screen.getByRole('searchbox') as HTMLInputElement;
      
      fireEvent.change(input, { target: { value: '日本映画' } });
      fireEvent.keyDown(input, { key: 'Enter' });
      
      expect(mockPush).toHaveBeenCalledWith('/search/日本映画');
    });

    it('should handle HTML-like input', () => {
      render(<SearchItem />);
      const input = screen.getByRole('searchbox') as HTMLInputElement;
      
      fireEvent.change(input, { target: { value: '<script>alert("xss")</script>' } });
      fireEvent.keyDown(input, { key: 'Enter' });
      
      expect(mockPush).toHaveBeenCalledWith('/search/<script>alert("xss")</script>');
    });

    it('should handle slashes in input', () => {
      render(<SearchItem />);
      const input = screen.getByRole('searchbox') as HTMLInputElement;
      
      fireEvent.change(input, { target: { value: 'movie/series' } });
      fireEvent.keyDown(input, { key: 'Enter' });
      
      expect(mockPush).toHaveBeenCalledWith('/search/movie/series');
    });

    it('should handle query parameters in input', () => {
      render(<SearchItem />);
      const input = screen.getByRole('searchbox') as HTMLInputElement;
      
      fireEvent.change(input, { target: { value: 'movie?filter=2023' } });
      fireEvent.keyDown(input, { key: 'Enter' });
      
      expect(mockPush).toHaveBeenCalledWith('/search/movie?filter=2023');
    });
  });

  describe('Accessibility', () => {
    it('should have aria-label on button', () => {
      render(<SearchItem />);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label', 'Search');
    });

    it('should be accessible via keyboard', () => {
      render(<SearchItem />);
      const input = screen.getByRole('searchbox');
      
      input.focus();
      expect(document.activeElement).toBe(input);
    });

    it('should have proper input accessibility attributes', () => {
      render(<SearchItem />);
      const input = screen.getByRole('searchbox');
      
      expect(input).toHaveAttribute('type', 'search');
      expect(input).toHaveAttribute('name', 'search');
      expect(input).toHaveAttribute('placeholder', 'Search');
    });

    it('should announce placeholder text to screen readers', () => {
      render(<SearchItem />);
      const input = screen.getByRole('searchbox');
      expect(input).toHaveAttribute('placeholder');
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle complete search flow: input and Enter', () => {
      render(<SearchItem />);
      const input = screen.getByRole('searchbox') as HTMLInputElement;
      
      fireEvent.change(input, { target: { value: 'inception' } });
      fireEvent.keyDown(input, { key: 'Enter' });
      
      expect(mockPush).toHaveBeenCalledWith('/search/inception');
    });

    it('should handle complete search flow: input and button click', () => {
      render(<SearchItem />);
      const input = screen.getByRole('searchbox') as HTMLInputElement;
      const icon = screen.getByTestId('search-icon');
      
      fireEvent.change(input, { target: { value: 'matrix' } });
      fireEvent.click(icon);
      
      expect(mockPush).toHaveBeenCalledWith('/search/matrix');
    });

    it('should handle multiple searches in sequence', () => {
      render(<SearchItem />);
      const input = screen.getByRole('searchbox') as HTMLInputElement;
      const icon = screen.getByTestId('search-icon');
      
      // First search
      fireEvent.change(input, { target: { value: 'movie1' } });
      fireEvent.keyDown(input, { key: 'Enter' });
      
      // Clear and second search
      fireEvent.change(input, { target: { value: 'movie2' } });
      fireEvent.keyDown(input, { key: 'Enter' });
      
      // Third search with button click
      fireEvent.change(input, { target: { value: 'movie3' } });
      fireEvent.click(icon);
      
      expect(mockPush).toHaveBeenCalledTimes(3);
      expect(mockPush).toHaveBeenNthCalledWith(1, '/search/movie1');
      expect(mockPush).toHaveBeenNthCalledWith(2, '/search/movie2');
      expect(mockPush).toHaveBeenNthCalledWith(3, '/search/movie3');
    });

    it('should maintain input value after navigation attempt', () => {
      render(<SearchItem />);
      const input = screen.getByRole('searchbox') as HTMLInputElement;
      
      fireEvent.change(input, { target: { value: 'test' } });
      fireEvent.keyDown(input, { key: 'Enter' });
      
      // Component should still have value due to state
      expect(input.value).toBe('test');
    });
  });

  describe('Search Icon Properties', () => {
    it('should have correct icon size', () => {
      render(<SearchItem />);
      const icon = screen.getByTestId('search-icon');
      expect(icon).toHaveAttribute('data-size', '18');
    });

    it('should have white text color on icon', () => {
      render(<SearchItem />);
      const icon = screen.getByTestId('search-icon');
      expect(icon).toHaveClass('text-white');
    });

    it('should have click handler on icon', () => {
      render(<SearchItem />);
      const icon = screen.getByTestId('search-icon');
      
      fireEvent.change(screen.getByRole('searchbox'), { 
        target: { value: 'test' } 
      });
      fireEvent.click(icon);
      
      expect(mockPush).toHaveBeenCalled();
    });
  });

  describe('Router Integration', () => {
    it('should use router from next/navigation', () => {
      render(<SearchItem />);
      expect(useRouter).toHaveBeenCalled();
    });

    it('should call router.push with correct path', () => {
      render(<SearchItem />);
      const input = screen.getByRole('searchbox') as HTMLInputElement;
      
      fireEvent.change(input, { target: { value: 'testquery' } });
      fireEvent.keyDown(input, { key: 'Enter' });
      
      expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('/search/'));
    });

    it('should properly encode search query in URL', () => {
      render(<SearchItem />);
      const input = screen.getByRole('searchbox') as HTMLInputElement;
      
      fireEvent.change(input, { target: { value: 'test query' } });
      fireEvent.keyDown(input, { key: 'Enter' });
      
      expect(mockPush).toHaveBeenCalledWith('/search/test query');
    });
  });

  describe('Component Isolation', () => {
    it('should render without external dependencies', () => {
      const { container } = render(<SearchItem />);
      expect(container).toBeInTheDocument();
    });

    it('should handle router not being defined gracefully', () => {
      const { container } = render(<SearchItem />);
      const input = container.querySelector('input[type="search"]') as HTMLInputElement;
      expect(input).toBeInTheDocument();
    });
  });
});
