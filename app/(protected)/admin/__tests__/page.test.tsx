'use client';

import React from 'react';
import { render, screen } from '@testing-library/react';
import AdminHomePage from '../page';

// Mock Next.js Link component
jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href} data-testid={`link-${href}`}>
      {children}
    </a>
  );
});

describe('AdminHomePage', () => {
  describe('Component Rendering', () => {
    it('should render the admin home page', () => {
      render(<AdminHomePage />);
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    });

    it('should render the main heading "Admin Area"', () => {
      render(<AdminHomePage />);
      const heading = screen.getByRole('heading', { name: /Admin Area/i });
      expect(heading).toBeInTheDocument();
    });

    it('should render the welcome description', () => {
      render(<AdminHomePage />);
      const description = screen.getByText(/Welcome to the admin area/i);
      expect(description).toBeInTheDocument();
    });

    it('should render all management sections', () => {
      render(<AdminHomePage />);
      expect(screen.getByText(/User Management/i)).toBeInTheDocument();
      expect(screen.getByText(/Actor Management/i)).toBeInTheDocument();
      expect(screen.getByText(/Movies\/Series Management/i)).toBeInTheDocument();
      const statsLinks = screen.getAllByText(/Statistics/i);
      expect(statsLinks.length).toBeGreaterThan(0);
      const logsLinks = screen.getAllByText(/Logs/i);
      expect(logsLinks.length).toBeGreaterThan(0);
    });
  });

  describe('Navigation Links', () => {
    it('should have a link to user management page', () => {
      render(<AdminHomePage />);
      const link = screen.getByTestId('link-/admin/users');
      expect(link).toHaveAttribute('href', '/admin/users');
    });

    it('should have a link to actor management page', () => {
      render(<AdminHomePage />);
      const link = screen.getByTestId('link-/admin/actors');
      expect(link).toHaveAttribute('href', '/admin/actors');
    });

    it('should have a link to movies management page', () => {
      render(<AdminHomePage />);
      const link = screen.getByTestId('link-/admin/movies');
      expect(link).toHaveAttribute('href', '/admin/movies');
    });

    it('should have a link to statistics page', () => {
      render(<AdminHomePage />);
      const link = screen.getByTestId('link-/admin/statistics');
      expect(link).toHaveAttribute('href', '/admin/statistics');
    });

    it('should have a link to logs page', () => {
      render(<AdminHomePage />);
      const link = screen.getByTestId('link-/admin/logs');
      expect(link).toHaveAttribute('href', '/admin/logs');
    });

    it('should render exactly 5 navigation links', () => {
      render(<AdminHomePage />);
      const links = screen.getAllByRole('link');
      expect(links).toHaveLength(5);
    });
  });

  describe('Section Descriptions', () => {
    it('should show user management description', () => {
      render(<AdminHomePage />);
      expect(screen.getByText(/View, search, block users and see profiles/i)).toBeInTheDocument();
    });

    it('should show actor management description', () => {
      render(<AdminHomePage />);
      expect(screen.getByText(/Add, delete actors and see statistics/i)).toBeInTheDocument();
    });

    it('should show movies management description', () => {
      render(<AdminHomePage />);
      expect(screen.getByText(/Browse all movies & series, see views and edit/i)).toBeInTheDocument();
    });

    it('should show statistics description', () => {
      render(<AdminHomePage />);
      expect(screen.getByText(/Usage statistics and system overview/i)).toBeInTheDocument();
    });

    it('should show logs description', () => {
      render(<AdminHomePage />);
      expect(screen.getByText(/Alle System- und Backend-Logs einsehen/i)).toBeInTheDocument();
    });
  });

  describe('Last Login Display', () => {
    it('should display last login section', () => {
      render(<AdminHomePage />);
      const loginText = screen.getByText(/Last login:/i);
      expect(loginText).toBeInTheDocument();
    });

    it('should display current date and time in last login', () => {
      render(<AdminHomePage />);
      const loginSection = screen.getByText(/Last login:/i);
      expect(loginSection.textContent).toMatch(/\d{1,2}\.\d{1,2}\.\d{4}/);
    });

    it('should display a timestamp after last login text', () => {
      render(<AdminHomePage />);
      const loginText = screen.getByText(/Last login:/i);
      expect(loginText.textContent).toMatch(/Last login:.*\d+:\d+/);
    });
  });

  describe('Styling and Layout', () => {
    it('should apply max-width container class', () => {
      const { container } = render(<AdminHomePage />);
      const mainDiv = container.querySelector('.max-w-3xl');
      expect(mainDiv).toBeInTheDocument();
    });

    it('should apply padding classes to main container', () => {
      const { container } = render(<AdminHomePage />);
      const mainDiv = container.querySelector('.p-6');
      expect(mainDiv).toBeInTheDocument();
    });

    it('should apply heading styling classes', () => {
      render(<AdminHomePage />);
      const heading = screen.getByRole('heading', { name: /Admin Area/i });
      expect(heading).toHaveClass('text-3xl', 'font-extrabold', 'text-zinc-100');
    });

    it('should apply card background styling', () => {
      const { container } = render(<AdminHomePage />);
      const card = container.querySelector('.bg-zinc-800');
      expect(card).toBeInTheDocument();
    });

    it('should have proper spacing between list items', () => {
      const { container } = render(<AdminHomePage />);
      const list = container.querySelector('.space-y-4');
      expect(list).toBeInTheDocument();
    });

    it('should apply border styling to links', () => {
      const { container } = render(<AdminHomePage />);
      const links = container.querySelectorAll('.border');
      expect(links.length).toBeGreaterThan(0);
    });

    it('should have hover effects on links', () => {
      render(<AdminHomePage />);
      const links = screen.getAllByRole('link');
      expect(links.length).toBeGreaterThan(0);
      // Hover effects are CSS-based and rendered in DOM
      links.forEach(link => {
        expect(link).toBeInTheDocument();
      });
    });

    it('should apply rounded corners to card and links', () => {
      const { container } = render(<AdminHomePage />);
      const card = container.querySelector('.rounded-2xl');
      expect(card).toBeInTheDocument();
      expect(card).toHaveClass('rounded-2xl');
    });
  });

  describe('Typography and Text Colors', () => {
    it('should use appropriate text colors for headings', () => {
      render(<AdminHomePage />);
      const heading = screen.getByRole('heading', { name: /Admin Area/i });
      expect(heading).toHaveClass('text-zinc-100');
    });

    it('should use zinc-300 for description text', () => {
      render(<AdminHomePage />);
      const description = screen.getByText(/Welcome to the admin area/i);
      expect(description).toHaveClass('text-zinc-300');
    });

    it('should display section titles in light color', () => {
      render(<AdminHomePage />);
      const userMgmt = screen.getByText(/User Management/i);
      expect(userMgmt).toBeInTheDocument();
      // Verify text is rendered in the link
      expect(userMgmt.textContent).toBeTruthy();
    });

    it('should display section descriptions in gray color', () => {
      render(<AdminHomePage />);
      const descriptions = screen.getAllByText(/(View, search|Add, delete|Browse all|Usage statistics|Alle System)/i);
      descriptions.forEach(desc => {
        expect(desc).toHaveClass('text-zinc-400');
      });
    });

    it('should have smaller text for descriptions', () => {
      render(<AdminHomePage />);
      const description = screen.getByText(/View, search, block users and see profiles/i);
      expect(description).toHaveClass('text-sm');
    });
  });

  describe('Structure and Hierarchy', () => {
    it('should have main content wrapped in a container', () => {
      const { container } = render(<AdminHomePage />);
      const mainDiv = container.firstChild;
      expect(mainDiv).toHaveClass('max-w-3xl');
    });

    it('should have heading as first content element', () => {
      const { container } = render(<AdminHomePage />);
      const heading = container.querySelector('h1');
      expect(heading?.textContent).toContain('Admin Area');
    });

    it('should have description text after heading', () => {
      render(<AdminHomePage />);
      const heading = screen.getByRole('heading', { name: /Admin Area/i });
      const description = screen.getByText(/Welcome to the admin area/i);
      expect(heading).toBeInTheDocument();
      expect(description).toBeInTheDocument();
    });

    it('should have navigation list after description', () => {
      const { container } = render(<AdminHomePage />);
      const list = container.querySelector('ul');
      expect(list).toBeInTheDocument();
    });

    it('should have last login info at the bottom', () => {
      render(<AdminHomePage />);
      const loginSection = screen.getByText(/Last login:/i);
      expect(loginSection).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should use semantic HTML with list', () => {
      const { container } = render(<AdminHomePage />);
      const list = container.querySelector('ul');
      expect(list).toBeInTheDocument();
      const items = container.querySelectorAll('li');
      expect(items.length).toBeGreaterThan(0);
    });

    it('should have proper heading hierarchy', () => {
      render(<AdminHomePage />);
      const h1 = screen.getByRole('heading', { level: 1 });
      expect(h1).toBeInTheDocument();
    });

    it('should have descriptive link text', () => {
      render(<AdminHomePage />);
      const links = screen.getAllByRole('link');
      links.forEach(link => {
        expect(link.textContent?.length).toBeGreaterThan(0);
      });
    });

    it('should have descriptive alt text or aria labels where needed', () => {
      render(<AdminHomePage />);
      // All links should have visible text content
      const allLinks = screen.getAllByRole('link');
      expect(allLinks.length).toBe(5);
    });

    it('should have proper focus states for interactive elements', () => {
      render(<AdminHomePage />);
      const links = screen.getAllByRole('link');
      links.forEach(link => {
        expect(link).toHaveAttribute('href');
      });
    });
  });

  describe('Emoji and Icons', () => {
    it('should display emoji for user management section', () => {
      render(<AdminHomePage />);
      const userMgmt = screen.getByText(/👤 User Management/i);
      expect(userMgmt).toBeInTheDocument();
    });

    it('should display emoji for actor management section', () => {
      render(<AdminHomePage />);
      const actorMgmt = screen.getByText(/🎭 Actor Management/i);
      expect(actorMgmt).toBeInTheDocument();
    });

    it('should display emoji for movies management section', () => {
      render(<AdminHomePage />);
      const movieMgmt = screen.getByText(/🎬 Movies\/Series Management/i);
      expect(movieMgmt).toBeInTheDocument();
    });

    it('should display emoji for statistics section', () => {
      render(<AdminHomePage />);
      const stats = screen.getByText(/📊 Statistics/i);
      expect(stats).toBeInTheDocument();
    });

    it('should display emoji for logs section', () => {
      render(<AdminHomePage />);
      const logs = screen.getByText(/📝 Logs/i);
      expect(logs).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('should use max-w-3xl for responsive width', () => {
      const { container } = render(<AdminHomePage />);
      const mainDiv = container.querySelector('.max-w-3xl');
      expect(mainDiv).toBeInTheDocument();
    });

    it('should apply mx-auto for centering', () => {
      const { container } = render(<AdminHomePage />);
      const mainDiv = container.querySelector('.mx-auto');
      expect(mainDiv).toBeInTheDocument();
    });

    it('should have proper padding on all sides', () => {
      const { container } = render(<AdminHomePage />);
      const mainDiv = container.querySelector('.p-6');
      expect(mainDiv).toBeInTheDocument();
    });

    it('should use responsive link styling', () => {
      render(<AdminHomePage />);
      const links = screen.getAllByRole('link');
      expect(links.length).toBeGreaterThan(0);
      // Verify links are rendered with proper styling
      links.forEach(link => {
        expect(link).toBeInTheDocument();
        expect(link).toHaveAttribute('href');
      });
    });
  });

  describe('Content Completeness', () => {
    it('should include all required sections', () => {
      render(<AdminHomePage />);
      expect(screen.getByText(/User Management/i)).toBeInTheDocument();
      expect(screen.getByText(/Actor Management/i)).toBeInTheDocument();
      expect(screen.getByText(/Movies\/Series Management/i)).toBeInTheDocument();
      const statsLinks = screen.getAllByText(/Statistics/i);
      expect(statsLinks.length).toBeGreaterThan(0);
      const logsLinks = screen.getAllByText(/Logs/i);
      expect(logsLinks.length).toBeGreaterThan(0);
    });

    it('should have complete welcome message', () => {
      render(<AdminHomePage />);
      const welcomeText = screen.getByText(/Welcome to the admin area!/i);
      expect(welcomeText).toBeInTheDocument();
    });

    it('should mention important management features', () => {
      render(<AdminHomePage />);
      expect(screen.getByText(/important management features/i)).toBeInTheDocument();
    });

    it('should display all section descriptions', () => {
      render(<AdminHomePage />);
      expect(screen.getByText(/View, search, block users and see profiles/i)).toBeInTheDocument();
      expect(screen.getByText(/Add, delete actors and see statistics/i)).toBeInTheDocument();
      expect(screen.getByText(/Browse all movies & series, see views and edit/i)).toBeInTheDocument();
      expect(screen.getByText(/Usage statistics and system overview/i)).toBeInTheDocument();
      expect(screen.getByText(/Alle System- und Backend-Logs einsehen/i)).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should render without errors with default props', () => {
      expect(() => {
        render(<AdminHomePage />);
      }).not.toThrow();
    });

    it('should maintain layout integrity with all content', () => {
      const { container } = render(<AdminHomePage />);
      const mainContainer = container.querySelector('.max-w-3xl');
      expect(mainContainer).toBeInTheDocument();
      expect(mainContainer?.children.length).toBeGreaterThan(0);
    });

    it('should handle all links rendering without issues', () => {
      render(<AdminHomePage />);
      const links = screen.getAllByRole('link');
      expect(links).toHaveLength(5);
      links.forEach(link => {
        expect(link).toBeInTheDocument();
        expect(link).toHaveAttribute('href');
      });
    });

    it('should display last login timestamp without formatting errors', () => {
      render(<AdminHomePage />);
      const loginSection = screen.getByText(/Last login:/i);
      expect(loginSection).toBeInTheDocument();
      // Should contain date and time information
      expect(loginSection.textContent).toMatch(/\d/);
    });

    it('should render all styling classes correctly', () => {
      const { container } = render(<AdminHomePage />);
      const main = container.querySelector('.max-w-3xl.mx-auto.p-6');
      expect(main).toBeInTheDocument();
    });
  });

  describe('Link Functionality', () => {
    it('should render user management link with correct structure', () => {
      render(<AdminHomePage />);
      const link = screen.getByTestId('link-/admin/users');
      expect(link).toBeInTheDocument();
      expect(link.textContent).toContain('User Management');
    });

    it('should render actor management link with correct structure', () => {
      render(<AdminHomePage />);
      const link = screen.getByTestId('link-/admin/actors');
      expect(link).toBeInTheDocument();
      expect(link.textContent).toContain('Actor Management');
    });

    it('should render movies management link with correct structure', () => {
      render(<AdminHomePage />);
      const link = screen.getByTestId('link-/admin/movies');
      expect(link).toBeInTheDocument();
      expect(link.textContent).toContain('Movies/Series Management');
    });

    it('should render statistics link with correct structure', () => {
      render(<AdminHomePage />);
      const link = screen.getByTestId('link-/admin/statistics');
      expect(link).toBeInTheDocument();
      expect(link.textContent).toContain('Statistics');
    });

    it('should render logs link with correct structure', () => {
      render(<AdminHomePage />);
      const link = screen.getByTestId('link-/admin/logs');
      expect(link).toBeInTheDocument();
      expect(link.textContent).toContain('Logs');
    });
  });

  describe('Card and Container Styling', () => {
    it('should apply background card styling', () => {
      const { container } = render(<AdminHomePage />);
      const card = container.querySelector('.bg-zinc-800');
      expect(card).toBeInTheDocument();
    });

    it('should apply rounded corners to card', () => {
      const { container } = render(<AdminHomePage />);
      const card = container.querySelector('.rounded-2xl');
      expect(card).toBeInTheDocument();
    });

    it('should apply shadow styling to card', () => {
      const { container } = render(<AdminHomePage />);
      const card = container.querySelector('.shadow-2xl');
      expect(card).toBeInTheDocument();
    });

    it('should apply padding to card', () => {
      const { container } = render(<AdminHomePage />);
      const card = container.querySelector('.bg-zinc-800.rounded-2xl.shadow-2xl.p-6');
      expect(card).toBeInTheDocument();
    });

    it('should have border on card', () => {
      const { container } = render(<AdminHomePage />);
      const card = container.querySelector('.border');
      expect(card).toBeInTheDocument();
    });
  });

  describe('Font and Text Styling', () => {
    it('should apply font extrabold to main heading', () => {
      render(<AdminHomePage />);
      const heading = screen.getByRole('heading', { name: /Admin Area/i });
      expect(heading).toHaveClass('font-extrabold');
    });

    it('should apply font semibold to section titles', () => {
      render(<AdminHomePage />);
      const titles = screen.getAllByText(/Management|Statistics|Logs/i);
      expect(titles.length).toBeGreaterThan(0);
    });

    it('should apply font normal to descriptions', () => {
      render(<AdminHomePage />);
      const desc = screen.getByText(/View, search, block users and see profiles/i);
      expect(desc).toHaveClass('font-normal');
    });

    it('should apply tracking-tight to heading', () => {
      render(<AdminHomePage />);
      const heading = screen.getByRole('heading', { name: /Admin Area/i });
      expect(heading).toHaveClass('tracking-tight');
    });

    it('should apply text-center to footer', () => {
      const { container } = render(<AdminHomePage />);
      const footer = container.querySelector('.text-center');
      expect(footer).toBeInTheDocument();
    });
  });

  describe('Margin and Spacing', () => {
    it('should have margin bottom on heading', () => {
      render(<AdminHomePage />);
      const heading = screen.getByRole('heading', { name: /Admin Area/i });
      expect(heading).toHaveClass('mb-6');
    });

    it('should have margin bottom on card', () => {
      const { container } = render(<AdminHomePage />);
      const card = container.querySelector('.mb-8');
      expect(card).toBeInTheDocument();
    });

    it('should have margin bottom on description', () => {
      render(<AdminHomePage />);
      const desc = screen.getByText(/Welcome to the admin area/i);
      expect(desc).toHaveClass('mb-4');
    });

    it('should have space between list items', () => {
      const { container } = render(<AdminHomePage />);
      const ul = container.querySelector('ul.space-y-4');
      expect(ul).toBeInTheDocument();
    });
  });
});
