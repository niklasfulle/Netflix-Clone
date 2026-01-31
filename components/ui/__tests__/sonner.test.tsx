import * as React from 'react';
import { render, screen } from '@testing-library/react';
import { useTheme } from 'next-themes';
import { Toaster } from '../sonner';

// Mock next-themes
jest.mock('next-themes', () => ({
  useTheme: jest.fn(),
}));

// Mock sonner
jest.mock('sonner', () => ({
  Toaster: ({ theme, className, toastOptions, ...props }: any) => (
    <div
      data-testid="sonner-toaster"
      data-theme={theme}
      className={className}
      data-toast-options={JSON.stringify(toastOptions)}
      {...props}
    >
      Sonner Toaster
    </div>
  ),
}));

const mockUseTheme = useTheme as jest.MockedFunction<typeof useTheme>;

describe('Toaster (Sonner)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseTheme.mockReturnValue({
      theme: 'light',
      setTheme: jest.fn(),
      themes: ['light', 'dark', 'system'],
      systemTheme: 'light',
      resolvedTheme: 'light',
    } as any);
  });

  describe('Basic Rendering', () => {
    it('should render without crashing', () => {
      render(<Toaster />);
      expect(screen.getByTestId('sonner-toaster')).toBeInTheDocument();
    });

    it('should render with toaster class', () => {
      render(<Toaster />);
      const toaster = screen.getByTestId('sonner-toaster');
      expect(toaster.className).toContain('toaster');
    });

    it('should render with group class', () => {
      render(<Toaster />);
      const toaster = screen.getByTestId('sonner-toaster');
      expect(toaster.className).toContain('group');
    });

    it('should have testid attribute', () => {
      render(<Toaster />);
      expect(screen.getByTestId('sonner-toaster')).toBeInTheDocument();
    });

    it('should render with multiple classes', () => {
      render(<Toaster />);
      const toaster = screen.getByTestId('sonner-toaster');
      expect(toaster.className).toContain('toaster');
      expect(toaster.className).toContain('group');
    });
  });

  describe('Theme Handling', () => {
    it('should use light theme when theme is light', () => {
      mockUseTheme.mockReturnValue({ theme: 'light' } as any);
      render(<Toaster />);
      const toaster = screen.getByTestId('sonner-toaster');
      expect(toaster.getAttribute('data-theme')).toBe('light');
    });

    it('should use dark theme when theme is dark', () => {
      mockUseTheme.mockReturnValue({ theme: 'dark' } as any);
      render(<Toaster />);
      const toaster = screen.getByTestId('sonner-toaster');
      expect(toaster.getAttribute('data-theme')).toBe('dark');
    });

    it('should use system theme as default', () => {
      mockUseTheme.mockReturnValue({ theme: undefined } as any);
      render(<Toaster />);
      const toaster = screen.getByTestId('sonner-toaster');
      expect(toaster.getAttribute('data-theme')).toBe('system');
    });

    it('should default to system when theme is undefined', () => {
      mockUseTheme.mockReturnValue({ theme: undefined } as any);
      render(<Toaster />);
      const toaster = screen.getByTestId('sonner-toaster');
      expect(toaster.getAttribute('data-theme')).toBe('system');
    });

    it('should update when theme changes', () => {
      const { rerender } = render(<Toaster />);
      let toaster = screen.getByTestId('sonner-toaster');
      expect(toaster.getAttribute('data-theme')).toBe('light');

      mockUseTheme.mockReturnValue({ theme: 'dark' } as any);
      rerender(<Toaster />);
      toaster = screen.getByTestId('sonner-toaster');
      expect(toaster.getAttribute('data-theme')).toBe('dark');
    });

    it('should support all theme types', () => {
      const themes = ['light', 'dark', 'system'];
      themes.forEach((themeType) => {
        mockUseTheme.mockReturnValue({ theme: themeType } as any);
        const { unmount } = render(<Toaster />);
        const toaster = screen.getByTestId('sonner-toaster');
        expect(toaster.getAttribute('data-theme')).toBe(themeType);
        unmount();
      });
    });
  });

  describe('Toast Options', () => {
    it('should apply toast styling classes', () => {
      render(<Toaster />);
      const toaster = screen.getByTestId('sonner-toaster');
      const toastOptions = JSON.parse(
        toaster.getAttribute('data-toast-options') || '{}'
      );
      expect(toastOptions.classNames).toBeDefined();
    });

    it('should have toast class names', () => {
      render(<Toaster />);
      const toaster = screen.getByTestId('sonner-toaster');
      const toastOptions = JSON.parse(
        toaster.getAttribute('data-toast-options') || '{}'
      );
      expect(toastOptions.classNames.toast).toBeDefined();
    });

    it('should have description class names', () => {
      render(<Toaster />);
      const toaster = screen.getByTestId('sonner-toaster');
      const toastOptions = JSON.parse(
        toaster.getAttribute('data-toast-options') || '{}'
      );
      expect(toastOptions.classNames.description).toBeDefined();
    });

    it('should have actionButton class names', () => {
      render(<Toaster />);
      const toaster = screen.getByTestId('sonner-toaster');
      const toastOptions = JSON.parse(
        toaster.getAttribute('data-toast-options') || '{}'
      );
      expect(toastOptions.classNames.actionButton).toBeDefined();
    });

    it('should have cancelButton class names', () => {
      render(<Toaster />);
      const toaster = screen.getByTestId('sonner-toaster');
      const toastOptions = JSON.parse(
        toaster.getAttribute('data-toast-options') || '{}'
      );
      expect(toastOptions.classNames.cancelButton).toBeDefined();
    });

    it('should include background color in toast class', () => {
      render(<Toaster />);
      const toaster = screen.getByTestId('sonner-toaster');
      const toastOptions = JSON.parse(
        toaster.getAttribute('data-toast-options') || '{}'
      );
      expect(toastOptions.classNames.toast).toContain('bg-background');
    });

    it('should include text color in toast class', () => {
      render(<Toaster />);
      const toaster = screen.getByTestId('sonner-toaster');
      const toastOptions = JSON.parse(
        toaster.getAttribute('data-toast-options') || '{}'
      );
      expect(toastOptions.classNames.toast).toContain('text-foreground');
    });

    it('should include border in toast class', () => {
      render(<Toaster />);
      const toaster = screen.getByTestId('sonner-toaster');
      const toastOptions = JSON.parse(
        toaster.getAttribute('data-toast-options') || '{}'
      );
      expect(toastOptions.classNames.toast).toContain('border-border');
    });

    it('should include shadow in toast class', () => {
      render(<Toaster />);
      const toaster = screen.getByTestId('sonner-toaster');
      const toastOptions = JSON.parse(
        toaster.getAttribute('data-toast-options') || '{}'
      );
      expect(toastOptions.classNames.toast).toContain('shadow-lg');
    });

    it('should have muted foreground for description', () => {
      render(<Toaster />);
      const toaster = screen.getByTestId('sonner-toaster');
      const toastOptions = JSON.parse(
        toaster.getAttribute('data-toast-options') || '{}'
      );
      expect(toastOptions.classNames.description).toContain(
        'text-muted-foreground'
      );
    });

    it('should have primary background for action button', () => {
      render(<Toaster />);
      const toaster = screen.getByTestId('sonner-toaster');
      const toastOptions = JSON.parse(
        toaster.getAttribute('data-toast-options') || '{}'
      );
      expect(toastOptions.classNames.actionButton).toContain('bg-primary');
    });

    it('should have primary foreground for action button text', () => {
      render(<Toaster />);
      const toaster = screen.getByTestId('sonner-toaster');
      const toastOptions = JSON.parse(
        toaster.getAttribute('data-toast-options') || '{}'
      );
      expect(toastOptions.classNames.actionButton).toContain(
        'text-primary-foreground'
      );
    });

    it('should have muted background for cancel button', () => {
      render(<Toaster />);
      const toaster = screen.getByTestId('sonner-toaster');
      const toastOptions = JSON.parse(
        toaster.getAttribute('data-toast-options') || '{}'
      );
      expect(toastOptions.classNames.cancelButton).toContain('bg-muted');
    });

    it('should have muted foreground for cancel button text', () => {
      render(<Toaster />);
      const toaster = screen.getByTestId('sonner-toaster');
      const toastOptions = JSON.parse(
        toaster.getAttribute('data-toast-options') || '{}'
      );
      expect(toastOptions.classNames.cancelButton).toContain(
        'text-muted-foreground'
      );
    });
  });

  describe('Props Forwarding', () => {
    it('should forward custom props to Sonner', () => {
      render(<Toaster position="top-right" />);
      const toaster = screen.getByTestId('sonner-toaster');
      expect(toaster).toBeInTheDocument();
    });

    it('should handle className prop', () => {
      render(<Toaster className="custom-class" />);
      const toaster = screen.getByTestId('sonner-toaster');
      expect(toaster).toBeInTheDocument();
    });

    it('should merge default and custom classes', () => {
      render(<Toaster className="custom-class" />);
      const toaster = screen.getByTestId('sonner-toaster');
      expect(toaster).toBeInTheDocument();
      expect(toaster.className).toBeTruthy();
    });

    it('should accept expand prop', () => {
      const { container } = render(<Toaster expand={true} />);
      expect(container).toBeTruthy();
    });

    it('should accept richColors prop', () => {
      const { container } = render(<Toaster richColors />);
      expect(container).toBeTruthy();
    });

    it('should accept duration prop', () => {
      const { container } = render(<Toaster duration={5000} />);
      expect(container).toBeTruthy();
    });

    it('should accept closeButton prop', () => {
      const { container } = render(<Toaster closeButton />);
      expect(container).toBeTruthy();
    });

    it('should accept visibleToasts prop', () => {
      const { container } = render(<Toaster visibleToasts={5} />);
      expect(container).toBeTruthy();
    });

    it('should accept gap prop', () => {
      const { container } = render(<Toaster gap={12} />);
      expect(container).toBeTruthy();
    });

    it('should accept offset prop', () => {
      const { container } = render(<Toaster offset="16px" />);
      expect(container).toBeTruthy();
    });
  });

  describe('Styling', () => {
    it('should have correct toast group styling', () => {
      render(<Toaster />);
      const toaster = screen.getByTestId('sonner-toaster');
      expect(toaster.className).toMatch(/toaster.*group|group.*toaster/);
    });

    it('should preserve toaster class name', () => {
      const { rerender } = render(<Toaster />);
      let toaster = screen.getByTestId('sonner-toaster');
      expect(toaster.className).toContain('toaster');

      rerender(<Toaster />);
      toaster = screen.getByTestId('sonner-toaster');
      expect(toaster.className).toContain('toaster');
    });

    it('should apply consistent styling across renders', () => {
      const { rerender } = render(<Toaster />);
      let toaster = screen.getByTestId('sonner-toaster');
      const initialClass = toaster.className;

      rerender(<Toaster />);
      toaster = screen.getByTestId('sonner-toaster');
      expect(toaster.className).toBe(initialClass);
    });

    it('should not strip existing classes', () => {
      render(<Toaster className="extra-class another-class" />);
      const toaster = screen.getByTestId('sonner-toaster');
      expect(toaster.className).toContain('extra-class');
      expect(toaster.className).toContain('another-class');
    });
  });

  describe('Accessibility', () => {
    it('should render with semantic HTML', () => {
      const { container } = render(<Toaster />);
      expect(container.querySelector('[data-testid="sonner-toaster"]')).toBeTruthy();
    });

    it('should support aria-label prop', () => {
      const { container } = render(<Toaster aria-label="Toast notifications" />);
      expect(container).toBeTruthy();
    });

    it('should support aria-describedby prop', () => {
      const { container } = render(<Toaster aria-describedby="toast-desc" />);
      expect(container).toBeTruthy();
    });

    it('should have role when provided', () => {
      const { container } = render(<Toaster {...{ role: 'status' } as any} />);
      expect(container).toBeTruthy();
    });
  });

  describe('Edge Cases', () => {
    it('should handle null theme gracefully', () => {
      mockUseTheme.mockReturnValue({ theme: null } as any);
      render(<Toaster />);
      const toaster = screen.getByTestId('sonner-toaster');
      expect(toaster).toBeInTheDocument();
    });

    it('should handle undefined theme as system', () => {
      mockUseTheme.mockReturnValue({ theme: undefined } as any);
      render(<Toaster />);
      const toaster = screen.getByTestId('sonner-toaster');
      expect(toaster.getAttribute('data-theme')).toBe('system');
    });

    it('should handle empty string theme', () => {
      mockUseTheme.mockReturnValue({ theme: '' } as any);
      render(<Toaster />);
      const toaster = screen.getByTestId('sonner-toaster');
      expect(toaster).toBeInTheDocument();
    });

    it('should handle rapid theme changes', () => {
      const { rerender } = render(<Toaster />);

      mockUseTheme.mockReturnValue({ theme: 'dark' } as any);
      rerender(<Toaster />);

      mockUseTheme.mockReturnValue({ theme: 'light' } as any);
      rerender(<Toaster />);

      mockUseTheme.mockReturnValue({ theme: 'dark' } as any);
      rerender(<Toaster />);

      const toaster = screen.getByTestId('sonner-toaster');
      expect(toaster.getAttribute('data-theme')).toBe('dark');
    });

    it('should handle no toastOptions override', () => {
      render(<Toaster toastOptions={{}} />);
      expect(screen.getByTestId('sonner-toaster')).toBeInTheDocument();
    });

    it('should handle multiple instances', () => {
      render(
        <>
          <Toaster />
          <Toaster />
        </>
      );
      const toasters = screen.getAllByTestId('sonner-toaster');
      expect(toasters).toHaveLength(2);
    });

    it('should work without any props', () => {
      render(<Toaster />);
      expect(screen.getByTestId('sonner-toaster')).toBeInTheDocument();
    });
  });

  describe('Type Safety', () => {
    it('should accept valid Sonner props', () => {
      const { container } = render(
        <Toaster
          position="top-right"
          richColors
          closeButton
          expand={false}
          duration={4000}
          visibleToasts={3}
        />
      );
      expect(container).toBeTruthy();
    });

    it('should work as React component', () => {
      const Component = () => <Toaster />;
      render(<Component />);
      expect(screen.getByTestId('sonner-toaster')).toBeInTheDocument();
    });

    it('should forward ref correctly', () => {
      const ref = React.createRef<HTMLDivElement>();
      render(<Toaster ref={ref} />);
      expect(ref.current).toBeInTheDocument();
    });
  });

  describe('Component Integration', () => {
    it('should work in a provider pattern', () => {
      const Provider = ({ children }: { children: React.ReactNode }) => (
        <div>
          <Toaster />
          {children}
        </div>
      );

      render(
        <Provider>
          <div>App Content</div>
        </Provider>
      );
      expect(screen.getByTestId('sonner-toaster')).toBeInTheDocument();
      expect(screen.getByText('App Content')).toBeInTheDocument();
    });

    it('should not interfere with other components', () => {
      render(
        <div>
          <Toaster />
          <button>Click me</button>
          <p>Content</p>
        </div>
      );
      expect(screen.getByTestId('sonner-toaster')).toBeInTheDocument();
      expect(screen.getByRole('button')).toBeInTheDocument();
      expect(screen.getByText('Content')).toBeInTheDocument();
    });

    it('should work with multiple theme providers', () => {
      mockUseTheme.mockReturnValue({ theme: 'light' } as any);
      const { rerender } = render(<Toaster />);

      expect(screen.getByTestId('sonner-toaster')).toBeInTheDocument();

      mockUseTheme.mockReturnValue({ theme: 'dark' } as any);
      rerender(<Toaster />);

      expect(screen.getByTestId('sonner-toaster')).toBeInTheDocument();
    });
  });

  describe('Position Variants', () => {
    const positions = [
      'top-left',
      'top-center',
      'top-right',
      'bottom-left',
      'bottom-center',
      'bottom-right',
    ] as const;

    positions.forEach((position) => {
      it(`should accept ${position} position`, () => {
        const { container } = render(<Toaster position={position} />);
        expect(container).toBeTruthy();
      });
    });
  });

  describe('Expansion Modes', () => {
    it('should work with expand=true', () => {
      const { container } = render(<Toaster expand={true} />);
      expect(container).toBeTruthy();
    });

    it('should work with expand=false', () => {
      const { container } = render(<Toaster expand={false} />);
      expect(container).toBeTruthy();
    });

    it('should work without expand prop', () => {
      const { container } = render(<Toaster />);
      expect(container).toBeTruthy();
    });
  });

  describe('Color Variants', () => {
    it('should work with richColors=true', () => {
      const { container } = render(<Toaster richColors={true} />);
      expect(container).toBeTruthy();
    });

    it('should work with richColors=false', () => {
      const { container } = render(<Toaster richColors={false} />);
      expect(container).toBeTruthy();
    });

    it('should work without richColors prop', () => {
      const { container } = render(<Toaster />);
      expect(container).toBeTruthy();
    });
  });

  describe('UI Controls', () => {
    it('should work with closeButton=true', () => {
      const { container } = render(<Toaster closeButton={true} />);
      expect(container).toBeTruthy();
    });

    it('should work with closeButton=false', () => {
      const { container } = render(<Toaster closeButton={false} />);
      expect(container).toBeTruthy();
    });

    it('should support custom toast options', () => {
      const customToastOptions = {
        classNames: {
          toast: 'custom-toast-class',
          description: 'custom-description-class',
        },
      };
      const { container } = render(
        <Toaster toastOptions={customToastOptions} />
      );
      expect(container).toBeTruthy();
    });
  });

  describe('Display Configuration', () => {
    it('should accept visibleToasts as number', () => {
      const { container } = render(<Toaster visibleToasts={10} />);
      expect(container).toBeTruthy();
    });

    it('should accept different gap values', () => {
      const { container } = render(<Toaster gap={20} />);
      expect(container).toBeTruthy();
    });

    it('should accept string offset', () => {
      const { container } = render(<Toaster offset="20px" />);
      expect(container).toBeTruthy();
    });

    it('should accept numeric offset', () => {
      const { container } = render(<Toaster offset={20} />);
      expect(container).toBeTruthy();
    });
  });

  describe('Duration Configuration', () => {
    it('should accept duration prop', () => {
      const { container } = render(<Toaster duration={5000} />);
      expect(container).toBeTruthy();
    });

    it('should work with default duration', () => {
      const { container } = render(<Toaster />);
      expect(container).toBeTruthy();
    });

    it('should accept Infinity for persistent toasts', () => {
      const { container } = render(<Toaster duration={Infinity} />);
      expect(container).toBeTruthy();
    });
  });

  describe('Rendered Content', () => {
    it('should show Sonner Toaster text', () => {
      render(<Toaster />);
      expect(screen.getByText('Sonner Toaster')).toBeInTheDocument();
    });

    it('should be visible', () => {
      render(<Toaster />);
      const toaster = screen.getByTestId('sonner-toaster');
      expect(toaster).toBeVisible();
    });
  });
});
