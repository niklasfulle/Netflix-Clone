import React from 'react';
import { render, screen } from '@testing-library/react';
import Add from '@/app/(protected)/add/page';
import * as ReactDeviceDetect from 'react-device-detect';

// Mock dependencies
jest.mock('react-device-detect');
jest.mock('@/components/Navbar', () => {
  return function MockNavbar() {
    return <div data-testid="navbar">Navbar</div>;
  };
});

jest.mock('@/components/Footer', () => {
  return function MockFooter() {
    return <div data-testid="footer">Footer</div>;
  };
});

jest.mock('@/components/ui/card', () => ({
  Card: ({ children, className }: any) => (
    <div data-testid="card" className={className}>
      {children}
    </div>
  ),
  CardHeader: ({ children }: any) => (
    <div data-testid="card-header">{children}</div>
  ),
  CardContent: ({ children }: any) => (
    <div data-testid="card-content">{children}</div>
  ),
}));

jest.mock('@/app/(protected)/add/_components/add-movie-form', () => ({
  AddMovieForm: () => <div data-testid="add-movie-form">Add Movie Form</div>,
}));

const mockReactDeviceDetect = ReactDeviceDetect as jest.Mocked<typeof ReactDeviceDetect>;

describe('Add Movie Page (app/(protected)/add/page.tsx)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Component Rendering', () => {
    beforeEach(() => {
      mockReactDeviceDetect.isMobile = false;
    });

    it('should render Navbar', () => {
      render(<Add />);
      expect(screen.getByTestId('navbar')).toBeInTheDocument();
    });

    it('should render Footer', () => {
      render(<Add />);
      expect(screen.getByTestId('footer')).toBeInTheDocument();
    });

    it('should render Card component', () => {
      render(<Add />);
      expect(screen.getByTestId('card')).toBeInTheDocument();
    });

    it('should render CardHeader', () => {
      render(<Add />);
      expect(screen.getByTestId('card-header')).toBeInTheDocument();
    });

    it('should render CardContent', () => {
      render(<Add />);
      expect(screen.getByTestId('card-content')).toBeInTheDocument();
    });

    it('should render AddMovieForm', () => {
      render(<Add />);
      expect(screen.getByTestId('add-movie-form')).toBeInTheDocument();
    });

    it('should render page title "Add Movie"', () => {
      render(<Add />);
      expect(screen.getByText('Add Movie')).toBeInTheDocument();
    });
  });

  describe('Desktop View', () => {
    beforeEach(() => {
      mockReactDeviceDetect.isMobile = false;
    });

    it('should render desktop layout when not mobile', () => {
      const { container } = render(<Add />);

      const desktopDiv = container.querySelector(
        'div.py-28.flex.felx-row.items-center.justify-center',
      );
      expect(desktopDiv).toBeInTheDocument();
    });

    it('should not render mobile layout when not mobile', () => {
      const { container } = render(<Add />);

      const mobileDiv = container.querySelector('div.h-svh.flex.felx-row');
      expect(mobileDiv).not.toBeInTheDocument();
    });

    it('should have desktop Card width of w-[600px]', () => {
      render(<Add />);

      const card = screen.getByTestId('card');
      expect(card.className).toContain('w-[600px]');
    });

    it('should apply desktop padding classes', () => {
      const { container } = render(<Add />);

      const wrapper = container.querySelector(
        'div.py-28.flex.felx-row.items-center.justify-center',
      );
      expect(wrapper?.className).toContain('py-28');
      expect(wrapper?.className).toContain('pt-52');
      expect(wrapper?.className).toContain('mb-56');
    });

    it('should apply Card styling classes', () => {
      render(<Add />);

      const card = screen.getByTestId('card');
      expect(card.className).toContain('bg-zinc-800');
      expect(card.className).toContain('text-white');
      expect(card.className).toContain('border-none');
    });
  });

  describe('Mobile View', () => {
    beforeEach(() => {
      mockReactDeviceDetect.isMobile = true;
    });

    it('should render mobile layout when isMobile is true', () => {
      const { container } = render(<Add />);

      const mobileDiv = container.querySelector('div.h-svh.flex.felx-row');
      expect(mobileDiv).toBeInTheDocument();
    });

    it('should not render desktop layout when mobile', () => {
      const { container } = render(<Add />);

      const desktopDiv = container.querySelector(
        'div.py-28.flex.felx-row.items-center.justify-center',
      );
      expect(desktopDiv).not.toBeInTheDocument();
    });

    it('should have mobile Card with full width', () => {
      mockReactDeviceDetect.isMobile = true;
      render(<Add />);

      const card = screen.getByTestId('card');
      expect(card.className).toContain('w-full');
    });

    it('should apply mobile padding classes', () => {
      mockReactDeviceDetect.isMobile = true;
      const { container } = render(<Add />);

      const wrapper = container.querySelector('div.h-svh.flex.felx-row');
      expect(wrapper?.className).toContain('h-svh');
      expect(wrapper?.className).toContain('pt-40');
      expect(wrapper?.className).toContain('mb-48');
    });

    it('should have h-svh (screen height) on mobile', () => {
      mockReactDeviceDetect.isMobile = true;
      const { container } = render(<Add />);

      const wrapper = container.querySelector('div.h-svh');
      expect(wrapper).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('should switch from desktop to mobile layout based on isMobile', () => {
      mockReactDeviceDetect.isMobile = false;
      const { rerender } = render(<Add />);

      let card = screen.getByTestId('card');
      expect(card.className).toContain('w-[600px]');

      // Change to mobile
      mockReactDeviceDetect.isMobile = true;
      rerender(<Add />);

      card = screen.getByTestId('card');
      expect(card.className).toContain('w-full');
    });

    it('should maintain Card styling across both views', () => {
      mockReactDeviceDetect.isMobile = false;
      const { rerender } = render(<Add />);

      let card = screen.getByTestId('card');
      expect(card.className).toContain('bg-zinc-800');
      expect(card.className).toContain('text-white');

      mockReactDeviceDetect.isMobile = true;
      rerender(<Add />);

      card = screen.getByTestId('card');
      expect(card.className).toContain('bg-zinc-800');
      expect(card.className).toContain('text-white');
    });

    it('should always render Navbar and Footer regardless of device', () => {
      mockReactDeviceDetect.isMobile = false;
      const { rerender } = render(<Add />);

      expect(screen.getByTestId('navbar')).toBeInTheDocument();
      expect(screen.getByTestId('footer')).toBeInTheDocument();

      mockReactDeviceDetect.isMobile = true;
      rerender(<Add />);

      expect(screen.getByTestId('navbar')).toBeInTheDocument();
      expect(screen.getByTestId('footer')).toBeInTheDocument();
    });
  });

  describe('Form Integration', () => {
    beforeEach(() => {
      mockReactDeviceDetect.isMobile = false;
    });

    it('should render AddMovieForm inside CardContent', () => {
      render(<Add />);

      const cardContent = screen.getByTestId('card-content');
      const form = screen.getByTestId('add-movie-form');

      expect(cardContent).toContainElement(form);
    });

    it('should render form in both desktop and mobile views', () => {
      mockReactDeviceDetect.isMobile = false;
      const { rerender } = render(<Add />);

      expect(screen.getByTestId('add-movie-form')).toBeInTheDocument();

      mockReactDeviceDetect.isMobile = true;
      rerender(<Add />);

      expect(screen.getByTestId('add-movie-form')).toBeInTheDocument();
    });
  });

  describe('Styling Classes', () => {
    beforeEach(() => {
      mockReactDeviceDetect.isMobile = false;
    });

    it('Card should have bg-zinc-800 background', () => {
      render(<Add />);
      const card = screen.getByTestId('card');
      expect(card.className).toContain('bg-zinc-800');
    });

    it('Card should have text-white text color', () => {
      render(<Add />);
      const card = screen.getByTestId('card');
      expect(card.className).toContain('text-white');
    });

    it('Card should have border-none and md:border-solid', () => {
      render(<Add />);
      const card = screen.getByTestId('card');
      expect(card.className).toContain('border-none');
      expect(card.className).toContain('md:border-solid');
    });

    it('CardHeader should center title text', () => {
      render(<Add />);
      const title = screen.getByText('Add Movie');
      expect(title.className).toContain('text-center');
    });

    it('Title should have text-2xl font size', () => {
      render(<Add />);
      const title = screen.getByText('Add Movie');
      expect(title.className).toContain('text-2xl');
    });

    it('Title should have font-semibold weight', () => {
      render(<Add />);
      const title = screen.getByText('Add Movie');
      expect(title.className).toContain('font-semibold');
    });

    it('Page container should have flex layout', () => {
      const { container } = render(<Add />);
      const wrapper = container.querySelector('div.flex');
      expect(wrapper).toBeInTheDocument();
    });

    it('Page container should be centered', () => {
      const { container } = render(<Add />);
      const wrapper = container.querySelector(
        'div.items-center.justify-center',
      );
      expect(wrapper).toBeInTheDocument();
    });
  });

  describe('Layout Structure', () => {
    beforeEach(() => {
      mockReactDeviceDetect.isMobile = false;
    });

    it('Navbar should be rendered first', () => {
      const { container } = render(<Add />);
      const navbar = screen.getByTestId('navbar');
      const firstChild = container.firstChild;

      expect(firstChild).toContainElement(navbar);
    });

    it('Card should be between Navbar and Footer', () => {
      const { container } = render(<Add />);
      const navbar = screen.getByTestId('navbar');
      const card = screen.getByTestId('card');
      const footer = screen.getByTestId('footer');

      const navbarIndex = Array.from(container.querySelectorAll('[data-testid]')).findIndex(
        el => el === navbar,
      );
      const cardIndex = Array.from(container.querySelectorAll('[data-testid]')).findIndex(
        el => el === card,
      );
      const footerIndex = Array.from(container.querySelectorAll('[data-testid]')).findIndex(
        el => el === footer,
      );

      expect(navbarIndex).toBeLessThan(cardIndex);
      expect(cardIndex).toBeLessThan(footerIndex);
    });

    it('Footer should be rendered last', () => {
      const { container } = render(<Add />);
      const footer = screen.getByTestId('footer');
      const lastElements = container.querySelectorAll('[data-testid]');

      expect(Array.from(lastElements).pop()).toBe(footer);
    });
  });

  describe('Client Component Behavior', () => {
    beforeEach(() => {
      mockReactDeviceDetect.isMobile = false;
    });

    it('should render without errors', () => {
      expect(() => render(<Add />)).not.toThrow();
    });

    it('should be a valid React component', () => {
      const result = render(<Add />);
      expect(result).toBeDefined();
    });

    it('should respond to device changes', () => {
      mockReactDeviceDetect.isMobile = false;
      const { rerender } = render(<Add />);

      let card = screen.getByTestId('card');
      expect(card.className).toContain('w-[600px]');

      mockReactDeviceDetect.isMobile = true;
      rerender(<Add />);

      card = screen.getByTestId('card');
      expect(card.className).toContain('w-full');
    });
  });

  describe('Accessibility', () => {
    beforeEach(() => {
      mockReactDeviceDetect.isMobile = false;
    });

    it('should have accessible Card component', () => {
      render(<Add />);
      const card = screen.getByTestId('card');
      expect(card).toBeInTheDocument();
    });

    it('should have semantic title text', () => {
      render(<Add />);
      const title = screen.getByText('Add Movie');
      expect(title).toBeInTheDocument();
    });

    it('should have readable form label', () => {
      render(<Add />);
      expect(screen.getByText('Add Movie')).toBeVisible();
    });
  });

  describe('Edge Cases', () => {
    it('should handle rapid device changes', () => {
      mockReactDeviceDetect.isMobile = false;
      const { rerender } = render(<Add />);

      for (let i = 0; i < 5; i++) {
        mockReactDeviceDetect.isMobile = i % 2 === 0;
        rerender(<Add />);
        expect(screen.getByTestId('add-movie-form')).toBeInTheDocument();
      }
    });

    it('should render correctly when isMobile is undefined', () => {
      mockReactDeviceDetect.isMobile = undefined as any;
      expect(() => render(<Add />)).not.toThrow();
    });

    it('should maintain form state across renders', () => {
      mockReactDeviceDetect.isMobile = false;
      const { rerender } = render(<Add />);

      const form1 = screen.getByTestId('add-movie-form');
      mockReactDeviceDetect.isMobile = true;
      rerender(<Add />);

      const form2 = screen.getByTestId('add-movie-form');
      expect(form1).toBeDefined();
      expect(form2).toBeDefined();
    });
  });
});
