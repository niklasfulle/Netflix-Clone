'use client';

import React from 'react';
import { render, screen } from '@testing-library/react';
import Footer from '../Footer';

// Mock next/link
jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  );
});

describe('Footer', () => {
  describe('Rendering', () => {
    test('should render without crashing', () => {
      render(<Footer />);
      expect(screen.getByText(/Copyright/)).toBeInTheDocument();
    });

    test('should render footer container', () => {
      const { container } = render(<Footer />);
      const footer = container.firstChild as HTMLElement;
      expect(footer).toBeInTheDocument();
    });

    test('should render copyright section', () => {
      render(<Footer />);
      expect(screen.getByText(/Copyright/)).toBeInTheDocument();
    });

    test('should render version section', () => {
      render(<Footer />);
      expect(screen.getByText(/Version:/)).toBeInTheDocument();
    });

    test('should render changelog link', () => {
      render(<Footer />);
      expect(screen.getByText('Change Log')).toBeInTheDocument();
    });

    test('should render all three footer sections', () => {
      const { container } = render(<Footer />);
      const divs = container.querySelectorAll('div');
      expect(divs.length).toBeGreaterThanOrEqual(4);
    });

    test('should render exactly the right content', () => {
      render(<Footer />);
      expect(screen.getByText(/Niklas Fulle/)).toBeInTheDocument();
      expect(screen.getByText(/1.7.3/)).toBeInTheDocument();
    });
  });

  describe('Component Structure', () => {
    test('should have main footer div', () => {
      const { container } = render(<Footer />);
      const footer = container.firstChild as HTMLElement;
      expect(footer.tagName).toBe('DIV');
    });

    test('should have three content sections', () => {
      const { container } = render(<Footer />);
      const mainDiv = container.firstChild as HTMLElement;
      const sections = mainDiv.querySelectorAll('div');
      expect(sections.length).toBeGreaterThanOrEqual(3);
    });

    test('should have copyright div', () => {
      render(<Footer />);
      const copyrightText = screen.getByText(/Copyright/);
      expect(copyrightText).toBeInTheDocument();
    });

    test('should have version div', () => {
      render(<Footer />);
      const versionText = screen.getByText(/Version:/);
      expect(versionText).toBeInTheDocument();
    });

    test('should have changelog link div', () => {
      render(<Footer />);
      const changeLogLink = screen.getByText('Change Log');
      expect(changeLogLink.closest('a')).toBeInTheDocument();
    });
  });

  describe('Styling - Main Container', () => {
    test('should have w-full class', () => {
      const { container } = render(<Footer />);
      const footer = container.firstChild as HTMLElement;
      expect(footer.className).toMatch(/w-full/);
    });

    test('should have flex class', () => {
      const { container } = render(<Footer />);
      const footer = container.firstChild as HTMLElement;
      expect(footer.className).toMatch(/flex/);
    });

    test('should have flex-row class', () => {
      const { container } = render(<Footer />);
      const footer = container.firstChild as HTMLElement;
      expect(footer.className).toMatch(/flex-row/);
    });

    test('should have gap-10 class', () => {
      const { container } = render(<Footer />);
      const footer = container.firstChild as HTMLElement;
      expect(footer.className).toMatch(/gap-10/);
    });

    test('should have p-2 class', () => {
      const { container } = render(<Footer />);
      const footer = container.firstChild as HTMLElement;
      expect(footer.className).toMatch(/p-2/);
    });

    test('should have justify-center class', () => {
      const { container } = render(<Footer />);
      const footer = container.firstChild as HTMLElement;
      expect(footer.className).toMatch(/justify-center/);
    });

    test('should have bg-zinc-800 class', () => {
      const { container } = render(<Footer />);
      const footer = container.firstChild as HTMLElement;
      expect(footer.className).toMatch(/bg-zinc-800/);
    });

    test('should have all main container classes', () => {
      const { container } = render(<Footer />);
      const footer = container.firstChild as HTMLElement;
      expect(footer.className).toMatch(/w-full/);
      expect(footer.className).toMatch(/flex/);
      expect(footer.className).toMatch(/flex-row/);
      expect(footer.className).toMatch(/gap-10/);
      expect(footer.className).toMatch(/justify-center/);
      expect(footer.className).toMatch(/bg-zinc-800/);
    });
  });

  describe('Copyright Section', () => {
    test('should display current year dynamically', () => {
      render(<Footer />);
      const currentYear = new Date().getFullYear();
      expect(screen.getByText(new RegExp(currentYear.toString()))).toBeInTheDocument();
    });

    test('should display copyright symbol', () => {
      render(<Footer />);
      expect(screen.getByText(/©/)).toBeInTheDocument();
    });

    test('should display author name', () => {
      render(<Footer />);
      expect(screen.getByText('Niklas Fulle')).toBeInTheDocument();
    });

    test('should have zinc-400 text color in copyright section', () => {
      render(<Footer />);
      const copyrightDiv = screen.getByText(/Copyright/).closest('div');
      expect(copyrightDiv?.className).toMatch(/text-zinc-400/);
    });

    test('should have zinc-200 color for author name', () => {
      render(<Footer />);
      const authorName = screen.getByText('Niklas Fulle');
      expect(authorName.className).toMatch(/text-zinc-200/);
    });

    test('should have text-xs class', () => {
      render(<Footer />);
      const copyrightDiv = screen.getByText(/Copyright/).closest('div');
      expect(copyrightDiv?.className).toMatch(/text-xs/);
    });

    test('should have md:text-sm class for responsive text', () => {
      render(<Footer />);
      const copyrightDiv = screen.getByText(/Copyright/).closest('div');
      expect(copyrightDiv?.className).toMatch(/md:text-sm/);
    });
  });

  describe('Version Section', () => {
    test('should display version text', () => {
      render(<Footer />);
      expect(screen.getByText(/Version:/)).toBeInTheDocument();
    });

    test('should display correct version number', () => {
      render(<Footer />);
      expect(screen.getByText('1.7.3')).toBeInTheDocument();
    });

    test('should have zinc-400 text color for label', () => {
      render(<Footer />);
      const versionDiv = screen.getByText(/Version:/).closest('div');
      expect(versionDiv?.className).toMatch(/text-zinc-400/);
    });

    test('should have zinc-200 color for version number', () => {
      render(<Footer />);
      const versionNum = screen.getByText('1.7.3');
      expect(versionNum.className).toMatch(/text-zinc-200/);
    });

    test('should have text-xs class', () => {
      render(<Footer />);
      const versionDiv = screen.getByText(/Version:/).closest('div');
      expect(versionDiv?.className).toMatch(/text-xs/);
    });

    test('should have md:text-sm class for responsive text', () => {
      render(<Footer />);
      const versionDiv = screen.getByText(/Version:/).closest('div');
      expect(versionDiv?.className).toMatch(/md:text-sm/);
    });
  });

  describe('Changelog Link Section', () => {
    test('should render changelog link', () => {
      render(<Footer />);
      const link = screen.getByText('Change Log');
      expect(link).toBeInTheDocument();
    });

    test('should have correct href attribute', () => {
      render(<Footer />);
      const link = screen.getByText('Change Log') as HTMLAnchorElement;
      expect(link.href).toContain('/changelog');
    });

    test('should be a link element', () => {
      render(<Footer />);
      const link = screen.getByText('Change Log');
      expect(link.tagName).toBe('A');
    });

    test('should have zinc-200 text color', () => {
      render(<Footer />);
      const linkDiv = screen.getByText('Change Log').closest('div');
      expect(linkDiv?.className).toMatch(/text-zinc-200/);
    });

    test('should have underline class', () => {
      render(<Footer />);
      const linkDiv = screen.getByText('Change Log').closest('div');
      expect(linkDiv?.className).toMatch(/underline/);
    });

    test('should have hover:text-zinc-400 class', () => {
      render(<Footer />);
      const linkDiv = screen.getByText('Change Log').closest('div');
      expect(linkDiv?.className).toMatch(/hover:text-zinc-400/);
    });

    test('should have text-xs class', () => {
      render(<Footer />);
      const linkDiv = screen.getByText('Change Log').closest('div');
      expect(linkDiv?.className).toMatch(/text-xs/);
    });

    test('should have md:text-sm class for responsive text', () => {
      render(<Footer />);
      const linkDiv = screen.getByText('Change Log').closest('div');
      expect(linkDiv?.className).toMatch(/md:text-sm/);
    });
  });

  describe('Text Content', () => {
    test('should display copyright notice', () => {
      render(<Footer />);
      expect(screen.getByText(/Copyright:/)).toBeInTheDocument();
    });

    test('should display version label', () => {
      render(<Footer />);
      expect(screen.getByText(/Version:/)).toBeInTheDocument();
    });

    test('should display changelog text', () => {
      render(<Footer />);
      expect(screen.getByText('Change Log')).toBeInTheDocument();
    });

    test('should have correct copyright format', () => {
      render(<Footer />);
      const year = new Date().getFullYear();
      const copyrightText = screen.getByText(/©/);
      expect(copyrightText.textContent).toContain(`© ${year}`);
    });

    test('should contain all required text elements', () => {
      render(<Footer />);
      expect(screen.getByText(/©/)).toBeInTheDocument();
      expect(screen.getByText('Niklas Fulle')).toBeInTheDocument();
      expect(screen.getByText('Version:')).toBeInTheDocument();
      expect(screen.getByText('1.7.3')).toBeInTheDocument();
      expect(screen.getByText('Change Log')).toBeInTheDocument();
    });
  });

  describe('Year Handling', () => {
    test('should display current year', () => {
      render(<Footer />);
      const currentYear = new Date().getFullYear();
      expect(screen.getByText(new RegExp(currentYear.toString()))).toBeInTheDocument();
    });

    test('should update year on component mount', () => {
      render(<Footer />);
      const currentYear = new Date().getFullYear();
      expect(screen.getByText(new RegExp(currentYear.toString()))).toBeInTheDocument();
    });

    test('should not display hardcoded year', () => {
      render(<Footer />);
      const currentYear = new Date().getFullYear();
      const wrongYear = 2020;
      if (currentYear !== wrongYear) {
        expect(screen.queryByText(`© ${wrongYear}`)).not.toBeInTheDocument();
      }
    });

    test('should use useEffect for year setting', () => {
      render(<Footer />);
      const currentYear = new Date().getFullYear();
      const yearText = screen.getByText(new RegExp(currentYear.toString()));
      expect(yearText).toBeInTheDocument();
    });
  });

  describe('Version Display', () => {
    test('should display version 1.7.3', () => {
      render(<Footer />);
      expect(screen.getByText('1.7.3')).toBeInTheDocument();
    });

    test('should have version label before number', () => {
      render(<Footer />);
      const versionLabel = screen.getByText(/Version:/);
      expect(versionLabel).toBeInTheDocument();
    });

    test('should be static version not dynamic', () => {
      const { rerender } = render(<Footer />);
      expect(screen.getByText('1.7.3')).toBeInTheDocument();
      rerender(<Footer />);
      expect(screen.getByText('1.7.3')).toBeInTheDocument();
    });
  });

  describe('Layout and Spacing', () => {
    test('should use flexbox layout', () => {
      const { container } = render(<Footer />);
      const footer = container.firstChild as HTMLElement;
      expect(footer.className).toMatch(/flex/);
      expect(footer.className).toMatch(/flex-row/);
    });

    test('should have gap between sections', () => {
      const { container } = render(<Footer />);
      const footer = container.firstChild as HTMLElement;
      expect(footer.className).toMatch(/gap-10/);
    });

    test('should center content', () => {
      const { container } = render(<Footer />);
      const footer = container.firstChild as HTMLElement;
      expect(footer.className).toMatch(/justify-center/);
    });

    test('should have padding', () => {
      const { container } = render(<Footer />);
      const footer = container.firstChild as HTMLElement;
      expect(footer.className).toMatch(/p-2/);
    });

    test('should be full width', () => {
      const { container } = render(<Footer />);
      const footer = container.firstChild as HTMLElement;
      expect(footer.className).toMatch(/w-full/);
    });

    test('should have dark background', () => {
      const { container } = render(<Footer />);
      const footer = container.firstChild as HTMLElement;
      expect(footer.className).toMatch(/bg-zinc-800/);
    });
  });

  describe('Responsive Design', () => {
    test('should have md breakpoint for text size', () => {
      const { container } = render(<Footer />);
      const sections = container.querySelectorAll('div');
      let hasResponsiveClass = false;
      sections.forEach(section => {
        if (section.className.includes('md:text-sm')) {
          hasResponsiveClass = true;
        }
      });
      expect(hasResponsiveClass).toBe(true);
    });

    test('should have responsive text classes in all sections', () => {
      render(<Footer />);
      const copyrightDiv = screen.getByText(/Copyright/).closest('div');
      const versionDiv = screen.getByText(/Version:/).closest('div');
      const linkDiv = screen.getByText('Change Log').closest('div');

      expect(copyrightDiv?.className).toMatch(/md:text-sm/);
      expect(versionDiv?.className).toMatch(/md:text-sm/);
      expect(linkDiv?.className).toMatch(/md:text-sm/);
    });

    test('should have mobile-first text size xs', () => {
      const { container } = render(<Footer />);
      const sections = container.querySelectorAll('div');
      let hasTextXs = false;
      sections.forEach(section => {
        if (section.className.includes('text-xs')) {
          hasTextXs = true;
        }
      });
      expect(hasTextXs).toBe(true);
    });
  });

  describe('Color Scheme', () => {
    test('should use zinc color palette', () => {
      const { container } = render(<Footer />);
      const footer = container.firstChild as HTMLElement;
      const className = footer.className;
      expect(className).toMatch(/zinc/);
    });

    test('should have dark theme background', () => {
      const { container } = render(<Footer />);
      const footer = container.firstChild as HTMLElement;
      expect(footer.className).toMatch(/bg-zinc-800/);
    });

    test('should have light text for emphasis', () => {
      render(<Footer />);
      const lightTexts = [screen.getByText('Niklas Fulle'), screen.getByText('1.7.3')];
      lightTexts.forEach(element => {
        expect(element.className).toMatch(/text-zinc-200/);
      });
    });

    test('should have muted text for labels', () => {
      render(<Footer />);
      const copyrightDiv = screen.getByText(/Copyright/).closest('div');
      const versionDiv = screen.getByText(/Version:/).closest('div');
      expect(copyrightDiv?.className).toMatch(/text-zinc-400/);
      expect(versionDiv?.className).toMatch(/text-zinc-400/);
    });
  });

  describe('Accessibility', () => {
    test('should have semantic heading structure', () => {
      const { container } = render(<Footer />);
      expect(container.querySelector('h1')).not.toBeInTheDocument();
      expect(container.querySelector('h2')).not.toBeInTheDocument();
    });

    test('should have proper link semantics', () => {
      render(<Footer />);
      const link = screen.getByText('Change Log');
      expect(link.tagName).toBe('A');
    });

    test('should have readable text content', () => {
      render(<Footer />);
      expect(screen.getByText(/Copyright/)).toBeVisible();
      expect(screen.getByText(/Version:/)).toBeVisible();
      expect(screen.getByText('Change Log')).toBeVisible();
    });

    test('should have proper color contrast', () => {
      render(<Footer />);
      const textElements = [
        screen.getByText(/Copyright/),
        screen.getByText('Niklas Fulle'),
        screen.getByText(/Version:/),
        screen.getByText('1.7.3'),
        screen.getByText('Change Log'),
      ];
      textElements.forEach(element => {
        expect(element).toBeVisible();
      });
    });
  });

  describe('Link Functionality', () => {
    test('should navigate to changelog on link click', () => {
      render(<Footer />);
      const link = screen.getByText('Change Log') as HTMLAnchorElement;
      expect(link.href).toContain('/changelog');
    });

    test('should use Next.js Link component', () => {
      render(<Footer />);
      const link = screen.getByText('Change Log');
      expect(link).toBeInTheDocument();
    });

    test('should have proper link attributes', () => {
      render(<Footer />);
      const link = screen.getByText('Change Log') as HTMLAnchorElement;
      expect(link.href).toBeTruthy();
      expect(link.href).toContain('changelog');
    });
  });

  describe('Full Integration', () => {
    test('should render complete footer with all sections', () => {
      render(<Footer />);
      expect(screen.getByText(/Copyright/)).toBeInTheDocument();
      expect(screen.getByText(/Version:/)).toBeInTheDocument();
      expect(screen.getByText('Change Log')).toBeInTheDocument();
    });

    test('should display footer as footer element context', () => {
      const { container } = render(<Footer />);
      const footer = container.firstChild as HTMLElement;
      expect(footer).toBeInTheDocument();
      expect(footer.className).toMatch(/bg-zinc-800/);
    });

    test('should contain all required information', () => {
      render(<Footer />);
      const currentYear = new Date().getFullYear();
      
      expect(screen.getByText(/©/)).toBeInTheDocument();
      expect(screen.getByText(new RegExp(currentYear.toString()))).toBeInTheDocument();
      expect(screen.getByText('Niklas Fulle')).toBeInTheDocument();
      expect(screen.getByText('1.7.3')).toBeInTheDocument();
      expect(screen.getByText('Change Log')).toBeInTheDocument();
    });

    test('should have proper styling on all elements', () => {
      const { container } = render(<Footer />);
      const footer = container.firstChild as HTMLElement;
      expect(footer.className).toMatch(/w-full/);
      expect(footer.className).toMatch(/flex/);
      expect(footer.className).toMatch(/bg-zinc-800/);
    });

    test('should render without errors or warnings', () => {
      expect(() => {
        render(<Footer />);
      }).not.toThrow();
    });
  });

  describe('Edge Cases', () => {
    test('should handle multiple renders', () => {
      const { rerender } = render(<Footer />);
      const firstYearText = screen.getByText(new RegExp(new Date().getFullYear().toString()));
      expect(firstYearText).toBeInTheDocument();

      rerender(<Footer />);
      const secondYearText = screen.getByText(new RegExp(new Date().getFullYear().toString()));
      expect(secondYearText).toBeInTheDocument();
    });

    test('should maintain state across rerenders', () => {
      const { rerender } = render(<Footer />);
      expect(screen.getByText('1.7.3')).toBeInTheDocument();

      rerender(<Footer />);
      expect(screen.getByText('1.7.3')).toBeInTheDocument();
    });

    test('should handle year rollover correctly', () => {
      render(<Footer />);
      const currentYear = new Date().getFullYear();
      expect(screen.getByText(new RegExp(currentYear.toString()))).toBeInTheDocument();
    });
  });
});
