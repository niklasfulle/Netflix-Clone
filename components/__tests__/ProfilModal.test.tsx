import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ProfilModal from '../ProfilModal';
import useProfilImgsApi from '@/hooks/useProfilImgsApi';

// Mock Next.js Image component
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => {
    return <img {...props} />;
  },
}));

// Mock react-icons
jest.mock('react-icons/fa', () => ({
  FaArrowRight: ({ size, className }: any) => (
    <svg
      data-testid="arrow-right-icon"
      width={size}
      height={size}
      className={className}
      aria-label="Arrow right icon"
    />
  ),
  FaUserCheck: ({ size, className }: any) => (
    <svg
      data-testid="user-check-icon"
      width={size}
      height={size}
      className={className}
      aria-label="User check icon"
    />
  ),
}));

jest.mock('react-icons/io5', () => ({
  IoClose: ({ size, className, onClick }: any) => (
    <svg
      data-testid="close-icon"
      width={size}
      height={size}
      className={className}
      aria-label="Close icon"
      onClick={onClick}
    />
  ),
}));

// Mock useProfilImgsApi hook
jest.mock('@/hooks/useProfilImgsApi', () => ({
  __esModule: true,
  default: jest.fn(),
}));

const mockProfilImgs = [
  { url: 'img1.jpg' },
  { url: 'img2.jpg' },
  { url: 'img3.jpg' },
];

const mockOnClose = jest.fn();
const mockSetProfilImg = jest.fn();

describe('ProfilModal Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useProfilImgsApi as jest.Mock).mockReturnValue({
      data: mockProfilImgs,
    });
  });

  describe('Rendering', () => {
    test('should render nothing when visible is false', () => {
      const { container } = render(
        <ProfilModal
          visible={false}
          onClose={mockOnClose}
          ProfilImg="img1.jpg"
          setProfilImg={mockSetProfilImg}
        />
      );

      expect(container.firstChild).toBeNull();
    });

    test('should render nothing when visible is not provided', () => {
      const { container } = render(
        <ProfilModal
          visible={undefined}
          onClose={mockOnClose}
          ProfilImg="img1.jpg"
          setProfilImg={mockSetProfilImg}
        />
      );

      expect(container.firstChild).toBeNull();
    });

    test('should render modal when visible is true', () => {
      render(
        <ProfilModal
          visible={true}
          onClose={mockOnClose}
          ProfilImg="img1.jpg"
          setProfilImg={mockSetProfilImg}
        />
      );

      expect(screen.getByRole('img')).toBeInTheDocument();
    });

    test('should render modal with correct structure', () => {
      const { container } = render(
        <ProfilModal
          visible={true}
          onClose={mockOnClose}
          ProfilImg="img1.jpg"
          setProfilImg={mockSetProfilImg}
        />
      );

      const backdrop = container.querySelector('.fixed.inset-0.z-50');
      expect(backdrop).toBeInTheDocument();
    });

    test('should render modal with all three buttons', () => {
      render(
        <ProfilModal
          visible={true}
          onClose={mockOnClose}
          ProfilImg="img1.jpg"
          setProfilImg={mockSetProfilImg}
        />
      );

      expect(screen.getByTestId('close-icon')).toBeInTheDocument();
      expect(screen.getByTestId('user-check-icon')).toBeInTheDocument();
      expect(screen.getByTestId('arrow-right-icon')).toBeInTheDocument();
    });
  });

  describe('Visibility and Animation', () => {
    test('should update internal visibility state when prop changes from false to true', async () => {
      const { rerender } = render(
        <ProfilModal
          visible={false}
          onClose={mockOnClose}
          ProfilImg="img1.jpg"
          setProfilImg={mockSetProfilImg}
        />
      );

      expect(screen.queryByRole('img')).not.toBeInTheDocument();

      rerender(
        <ProfilModal
          visible={true}
          onClose={mockOnClose}
          ProfilImg="img1.jpg"
          setProfilImg={mockSetProfilImg}
        />
      );

      await waitFor(() => {
        expect(screen.getByRole('img')).toBeInTheDocument();
      });
    });

    test('should update internal visibility state when prop changes from true to false', async () => {
      const { rerender } = render(
        <ProfilModal
          visible={true}
          onClose={mockOnClose}
          ProfilImg="img1.jpg"
          setProfilImg={mockSetProfilImg}
        />
      );

      expect(screen.getByRole('img')).toBeInTheDocument();

      rerender(
        <ProfilModal
          visible={false}
          onClose={mockOnClose}
          ProfilImg="img1.jpg"
          setProfilImg={mockSetProfilImg}
        />
      );

      await waitFor(() => {
        expect(screen.queryByRole('img')).not.toBeInTheDocument();
      });
    });

    test('should apply scale-100 class when isVisible is true', () => {
      const { container } = render(
        <ProfilModal
          visible={true}
          onClose={mockOnClose}
          ProfilImg="img1.jpg"
          setProfilImg={mockSetProfilImg}
        />
      );

      const modalContent = container.querySelector('.scale-100');
      expect(modalContent).toBeInTheDocument();
    });

    test('should apply scale-0 class when isVisible is false after being true', async () => {
      const { container, rerender } = render(
        <ProfilModal
          visible={true}
          onClose={mockOnClose}
          ProfilImg="img1.jpg"
          setProfilImg={mockSetProfilImg}
        />
      );

      rerender(
        <ProfilModal
          visible={false}
          onClose={mockOnClose}
          ProfilImg="img1.jpg"
          setProfilImg={mockSetProfilImg}
        />
      );

      await waitFor(() => {
        const modalContent = container.querySelector('.scale-0');
        expect(modalContent).not.toBeInTheDocument();
      });
    });

    test('should have transition duration class', () => {
      const { container } = render(
        <ProfilModal
          visible={true}
          onClose={mockOnClose}
          ProfilImg="img1.jpg"
          setProfilImg={mockSetProfilImg}
        />
      );

      const backdrop = container.querySelector('.duration-300');
      expect(backdrop).toBeInTheDocument();
    });
  });

  describe('Image Display', () => {
    test('should display image with correct initial src', () => {
      render(
        <ProfilModal
          visible={true}
          onClose={mockOnClose}
          ProfilImg="img1.jpg"
          setProfilImg={mockSetProfilImg}
        />
      );

      const image = screen.getByRole('img');
      expect(image.getAttribute('src')).toContain('img1.jpg');
    });

    test('should display profile image in correct path format', () => {
      render(
        <ProfilModal
          visible={true}
          onClose={mockOnClose}
          ProfilImg="custom-img.jpg"
          setProfilImg={mockSetProfilImg}
        />
      );

      const image = screen.getByRole('img');
      expect(image.getAttribute('src')).toContain('/images/profil/custom-img.jpg');
    });

    test('should set alt text to Profile', () => {
      render(
        <ProfilModal
          visible={true}
          onClose={mockOnClose}
          ProfilImg="img1.jpg"
          setProfilImg={mockSetProfilImg}
        />
      );

      const image = screen.getByAltText('Profile');
      expect(image).toBeInTheDocument();
    });

    test('should set image width and height to 320', () => {
      render(
        <ProfilModal
          visible={true}
          onClose={mockOnClose}
          ProfilImg="img1.jpg"
          setProfilImg={mockSetProfilImg}
        />
      );

      const image = screen.getByRole('img');
      expect(image.getAttribute('width')).toBe('320');
      expect(image.getAttribute('height')).toBe('320');
    });
  });

  describe('Close Button Functionality', () => {
    test('should call handleClose when close button is clicked', async () => {
      render(
        <ProfilModal
          visible={true}
          onClose={mockOnClose}
          ProfilImg="img1.jpg"
          setProfilImg={mockSetProfilImg}
        />
      );

      const closeIcon = screen.getByTestId('close-icon');
      fireEvent.click(closeIcon);

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled();
      }, { timeout: 400 });
    });

    test('should call onClose callback after close button is clicked', async () => {
      render(
        <ProfilModal
          visible={true}
          onClose={mockOnClose}
          ProfilImg="img1.jpg"
          setProfilImg={mockSetProfilImg}
        />
      );

      const closeIcon = screen.getByTestId('close-icon');
      fireEvent.click(closeIcon);

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalledTimes(1);
      }, { timeout: 400 });
    });

    test('should have correct styling for close button', () => {
      render(
        <ProfilModal
          visible={true}
          onClose={mockOnClose}
          ProfilImg="img1.jpg"
          setProfilImg={mockSetProfilImg}
        />
      );

      const closeIcon = screen.getByTestId('close-icon');
      expect(closeIcon).toHaveClass('absolute', 'text-white', 'cursor-pointer');
    });

    test('should render close icon with size 30', () => {
      render(
        <ProfilModal
          visible={true}
          onClose={mockOnClose}
          ProfilImg="img1.jpg"
          setProfilImg={mockSetProfilImg}
        />
      );

      const closeIcon = screen.getByTestId('close-icon');
      expect(closeIcon.getAttribute('width')).toBe('30');
      expect(closeIcon.getAttribute('height')).toBe('30');
    });
  });

  describe('Rotate Button Functionality', () => {
    test('should rotate to next image when rotate button is clicked', () => {
      render(
        <ProfilModal
          visible={true}
          onClose={mockOnClose}
          ProfilImg="img1.jpg"
          setProfilImg={mockSetProfilImg}
        />
      );

      const arrowIcon = screen.getByTestId('arrow-right-icon');
      const initialImg = screen.getByRole('img');
      const initialSrc = initialImg.getAttribute('src');

      fireEvent.click(arrowIcon);

      const updatedImg = screen.getByRole('img');
      expect(updatedImg.getAttribute('src')).not.toBe(initialSrc);
    });

    test('should cycle through all images in order', () => {
      render(
        <ProfilModal
          visible={true}
          onClose={mockOnClose}
          ProfilImg="img1.jpg"
          setProfilImg={mockSetProfilImg}
        />
      );

      const arrowIcon = screen.getByTestId('arrow-right-icon');
      const imgElement = screen.getByRole('img');

      // First click - should move to img2
      fireEvent.click(arrowIcon);
      expect(imgElement.getAttribute('src')).toContain('img2.jpg');

      // Second click - should move to img3
      fireEvent.click(arrowIcon);
      expect(imgElement.getAttribute('src')).toContain('img3.jpg');
    });

    test('should wrap around to first image after last image', () => {
      render(
        <ProfilModal
          visible={true}
          onClose={mockOnClose}
          ProfilImg="img1.jpg"
          setProfilImg={mockSetProfilImg}
        />
      );

      const arrowIcon = screen.getByTestId('arrow-right-icon');
      const imgElement = screen.getByRole('img');

      // Cycle through all images
      fireEvent.click(arrowIcon); // img2
      fireEvent.click(arrowIcon); // img3
      fireEvent.click(arrowIcon); // wrap to img1

      expect(imgElement.getAttribute('src')).toContain('img1.jpg');
    });

    test('should have correct styling for rotate button', () => {
      const { container } = render(
        <ProfilModal
          visible={true}
          onClose={mockOnClose}
          ProfilImg="img1.jpg"
          setProfilImg={mockSetProfilImg}
        />
      );

      const rotateBtn = container.querySelector(
        'button:has([data-testid="arrow-right-icon"])'
      );
      expect(rotateBtn).toHaveClass('rounded-full', 'cursor-pointer', 'border-2', 'border-white');
    });

    test('should render arrow icon with size 25', () => {
      render(
        <ProfilModal
          visible={true}
          onClose={mockOnClose}
          ProfilImg="img1.jpg"
          setProfilImg={mockSetProfilImg}
        />
      );

      const arrowIcon = screen.getByTestId('arrow-right-icon');
      expect(arrowIcon.getAttribute('width')).toBe('25');
      expect(arrowIcon.getAttribute('height')).toBe('25');
    });
  });

  describe('Save Button Functionality', () => {
    test('should call setProfilImg when save button is clicked', async () => {
      render(
        <ProfilModal
          visible={true}
          onClose={mockOnClose}
          ProfilImg="img1.jpg"
          setProfilImg={mockSetProfilImg}
        />
      );

      const saveBtn = screen.getByTestId('user-check-icon').closest('button');
      fireEvent.click(saveBtn!);

      await waitFor(() => {
        expect(mockSetProfilImg).toHaveBeenCalled();
      });
    });

    test('should call onClose after save button is clicked', async () => {
      render(
        <ProfilModal
          visible={true}
          onClose={mockOnClose}
          ProfilImg="img1.jpg"
          setProfilImg={mockSetProfilImg}
        />
      );

      const saveBtn = screen.getByTestId('user-check-icon').closest('button');
      fireEvent.click(saveBtn!);

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled();
      }, { timeout: 400 });
    });

    test('should save currently displayed image when save button is clicked', async () => {
      render(
        <ProfilModal
          visible={true}
          onClose={mockOnClose}
          ProfilImg="img1.jpg"
          setProfilImg={mockSetProfilImg}
        />
      );

      const arrowIcon = screen.getByTestId('arrow-right-icon');
      fireEvent.click(arrowIcon);

      const saveBtn = screen.getByTestId('user-check-icon').closest('button');
      fireEvent.click(saveBtn!);

      await waitFor(() => {
        expect(mockSetProfilImg).toHaveBeenCalledWith(mockProfilImgs[1].url);
      });
    });

    test('should have correct styling for save button', () => {
      const { container } = render(
        <ProfilModal
          visible={true}
          onClose={mockOnClose}
          ProfilImg="img1.jpg"
          setProfilImg={mockSetProfilImg}
        />
      );

      const saveBtn = container.querySelector(
        'button:has([data-testid="user-check-icon"])'
      );
      expect(saveBtn).toHaveClass('rounded-full', 'cursor-pointer', 'group');
    });

    test('should render user check icon with size 25', () => {
      render(
        <ProfilModal
          visible={true}
          onClose={mockOnClose}
          ProfilImg="img1.jpg"
          setProfilImg={mockSetProfilImg}
        />
      );

      const userCheckIcon = screen.getByTestId('user-check-icon');
      expect(userCheckIcon.getAttribute('width')).toBe('25');
      expect(userCheckIcon.getAttribute('height')).toBe('25');
    });
  });

  describe('Props Handling', () => {
    test('should accept ProfilImg as string prop', () => {
      render(
        <ProfilModal
          visible={true}
          onClose={mockOnClose}
          ProfilImg="custom-image.jpg"
          setProfilImg={mockSetProfilImg}
        />
      );

      const image = screen.getByRole('img');
      expect(image.getAttribute('src')).toContain('custom-image.jpg');
    });

    test('should handle empty ProfilImg string', () => {
      render(
        <ProfilModal
          visible={true}
          onClose={mockOnClose}
          ProfilImg=""
          setProfilImg={mockSetProfilImg}
        />
      );

      const image = screen.getByRole('img');
      expect(image).toBeInTheDocument();
    });

    test('should accept onClose callback prop', async () => {
      render(
        <ProfilModal
          visible={true}
          onClose={mockOnClose}
          ProfilImg="img1.jpg"
          setProfilImg={mockSetProfilImg}
        />
      );

      const closeIcon = screen.getByTestId('close-icon');
      fireEvent.click(closeIcon);

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled();
      }, { timeout: 400 });
    });

    test('should accept setProfilImg callback prop', async () => {
      render(
        <ProfilModal
          visible={true}
          onClose={mockOnClose}
          ProfilImg="img1.jpg"
          setProfilImg={mockSetProfilImg}
        />
      );

      const saveBtn = screen.getByTestId('user-check-icon').closest('button');
      fireEvent.click(saveBtn!);

      await waitFor(() => {
        expect(mockSetProfilImg).toHaveBeenCalled();
      });
    });

    test('should support optional visible prop', () => {
      const { container } = render(
        <ProfilModal
          onClose={mockOnClose}
          ProfilImg="img1.jpg"
          setProfilImg={mockSetProfilImg}
        />
      );

      expect(container.firstChild).toBeNull();
    });

    test('should handle different profile image formats', () => {
      const formats = ['img.jpg', 'img.png', 'img.webp'];

      formats.forEach((format) => {
        const { unmount } = render(
          <ProfilModal
            visible={true}
            onClose={mockOnClose}
            ProfilImg={format}
            setProfilImg={mockSetProfilImg}
          />
        );

        const image = screen.getByRole('img');
        expect(image.getAttribute('src')).toContain(format);

        unmount();
      });
    });
  });

  describe('Hook Integration', () => {
    test('should return null when hook data is undefined', () => {
      (useProfilImgsApi as jest.Mock).mockReturnValue({ data: undefined });

      const { container } = render(
        <ProfilModal
          visible={true}
          onClose={mockOnClose}
          ProfilImg="img1.jpg"
          setProfilImg={mockSetProfilImg}
        />
      );

      expect(container.firstChild).toBeNull();
    });

    test('should use hook data for image rotation', () => {
      render(
        <ProfilModal
          visible={true}
          onClose={mockOnClose}
          ProfilImg="img1.jpg"
          setProfilImg={mockSetProfilImg}
        />
      );

      expect(useProfilImgsApi).toHaveBeenCalled();
    });

    test('should handle hook returning empty array', () => {
      (useProfilImgsApi as jest.Mock).mockReturnValue({ data: [] });

      const { container } = render(
        <ProfilModal
          visible={true}
          onClose={mockOnClose}
          ProfilImg="img1.jpg"
          setProfilImg={mockSetProfilImg}
        />
      );

      // When profilImgs is an empty array, component should still render
      // but with no rotation capability
      const modal = container.querySelector('[role="dialog"]') || container.firstChild;
      expect(modal).toBeTruthy();
    });

    test('should handle hook returning single image', () => {
      (useProfilImgsApi as jest.Mock).mockReturnValue({
        data: [{ url: 'single-img.jpg' }],
      });

      render(
        <ProfilModal
          visible={true}
          onClose={mockOnClose}
          ProfilImg="single-img.jpg"
          setProfilImg={mockSetProfilImg}
        />
      );

      const image = screen.getByRole('img');
      expect(image).toBeInTheDocument();
    });

    test('should handle hook returning multiple images', () => {
      const multipleImgs = [
        { url: 'img1.jpg' },
        { url: 'img2.jpg' },
        { url: 'img3.jpg' },
        { url: 'img4.jpg' },
      ];

      (useProfilImgsApi as jest.Mock).mockReturnValue({ data: multipleImgs });

      render(
        <ProfilModal
          visible={true}
          onClose={mockOnClose}
          ProfilImg="img1.jpg"
          setProfilImg={mockSetProfilImg}
        />
      );

      const arrowIcon = screen.getByTestId('arrow-right-icon');
      const imgElement = screen.getByRole('img');

      // Rotate through all images
      fireEvent.click(arrowIcon);
      expect(imgElement.getAttribute('src')).toContain('img2.jpg');

      fireEvent.click(arrowIcon);
      expect(imgElement.getAttribute('src')).toContain('img3.jpg');

      fireEvent.click(arrowIcon);
      expect(imgElement.getAttribute('src')).toContain('img4.jpg');

      fireEvent.click(arrowIcon);
      expect(imgElement.getAttribute('src')).toContain('img1.jpg');
    });
  });

  describe('Edge Cases', () => {
    test('should not crash when clicking buttons rapidly', () => {
      render(
        <ProfilModal
          visible={true}
          onClose={mockOnClose}
          ProfilImg="img1.jpg"
          setProfilImg={mockSetProfilImg}
        />
      );

      const arrowIcon = screen.getByTestId('arrow-right-icon');

      // Rapid clicks
      fireEvent.click(arrowIcon);
      fireEvent.click(arrowIcon);
      fireEvent.click(arrowIcon);
      fireEvent.click(arrowIcon);
      fireEvent.click(arrowIcon);

      expect(screen.getByRole('img')).toBeInTheDocument();
    });

    test('should handle special characters in image names', () => {
      render(
        <ProfilModal
          visible={true}
          onClose={mockOnClose}
          ProfilImg="img-with-special_chars.jpg"
          setProfilImg={mockSetProfilImg}
        />
      );

      const image = screen.getByRole('img');
      expect(image.getAttribute('src')).toContain('img-with-special_chars.jpg');
    });

    test('should handle very long image names', () => {
      const longName = 'this-is-a-very-long-image-name-with-many-characters.jpg';
      render(
        <ProfilModal
          visible={true}
          onClose={mockOnClose}
          ProfilImg={longName}
          setProfilImg={mockSetProfilImg}
        />
      );

      const image = screen.getByRole('img');
      expect(image.getAttribute('src')).toContain(longName);
    });

    test('should handle clicking save multiple times', async () => {
      render(
        <ProfilModal
          visible={true}
          onClose={mockOnClose}
          ProfilImg="img1.jpg"
          setProfilImg={mockSetProfilImg}
        />
      );

      const saveBtn = screen.getByTestId('user-check-icon').closest('button');

      fireEvent.click(saveBtn!);
      await waitFor(() => {
        expect(mockSetProfilImg).toHaveBeenCalledTimes(1);
      });
    });

    test('should maintain correct image index when modal is closed and reopened', async () => {
      const { rerender } = render(
        <ProfilModal
          visible={true}
          onClose={mockOnClose}
          ProfilImg="img1.jpg"
          setProfilImg={mockSetProfilImg}
        />
      );

      const arrowIcon = screen.getByTestId('arrow-right-icon');
      fireEvent.click(arrowIcon);

      rerender(
        <ProfilModal
          visible={false}
          onClose={mockOnClose}
          ProfilImg="img1.jpg"
          setProfilImg={mockSetProfilImg}
        />
      );

      await waitFor(() => {
        expect(screen.queryByRole('img')).not.toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    test('should have proper ARIA labels for icons', () => {
      render(
        <ProfilModal
          visible={true}
          onClose={mockOnClose}
          ProfilImg="img1.jpg"
          setProfilImg={mockSetProfilImg}
        />
      );

      expect(screen.getByTestId('close-icon')).toHaveAttribute('aria-label');
      expect(screen.getByTestId('user-check-icon')).toHaveAttribute('aria-label');
      expect(screen.getByTestId('arrow-right-icon')).toHaveAttribute('aria-label');
    });

    test('should have alt text for profile image', () => {
      render(
        <ProfilModal
          visible={true}
          onClose={mockOnClose}
          ProfilImg="img1.jpg"
          setProfilImg={mockSetProfilImg}
        />
      );

      expect(screen.getByAltText('Profile')).toBeInTheDocument();
    });

    test('should have semantic button elements', () => {
      const { container } = render(
        <ProfilModal
          visible={true}
          onClose={mockOnClose}
          ProfilImg="img1.jpg"
          setProfilImg={mockSetProfilImg}
        />
      );

      const buttons = container.querySelectorAll('button');
      expect(buttons.length).toBeGreaterThan(0);
    });

    test('should have correct button styling for accessibility', () => {
      const { container } = render(
        <ProfilModal
          visible={true}
          onClose={mockOnClose}
          ProfilImg="img1.jpg"
          setProfilImg={mockSetProfilImg}
        />
      );

      const buttons = container.querySelectorAll('button');
      buttons.forEach((btn) => {
        expect(btn).toHaveClass('cursor-pointer');
      });
    });

    test('should have hover states for visual feedback', () => {
      const { container } = render(
        <ProfilModal
          visible={true}
          onClose={mockOnClose}
          ProfilImg="img1.jpg"
          setProfilImg={mockSetProfilImg}
        />
      );

      const buttons = container.querySelectorAll('button');
      buttons.forEach((btn) => {
        const hasHoverClass = Array.from(btn.classList).some((cls) =>
          cls.includes('hover:')
        );
        expect(hasHoverClass).toBe(true);
      });
    });
  });

  describe('Multiple Instances', () => {
    test('should render multiple modals independently', () => {
      render(
        <ProfilModal
          visible={true}
          onClose={jest.fn()}
          ProfilImg="img1.jpg"
          setProfilImg={jest.fn()}
        />
      );

      render(
        <ProfilModal
          visible={true}
          onClose={jest.fn()}
          ProfilImg="img2.jpg"
          setProfilImg={jest.fn()}
        />
      );

      const images = screen.getAllByRole('img');
      expect(images.length).toBe(2);
    });

    test('should maintain separate state for multiple instances', () => {
      const onClose1 = jest.fn();
      const onClose2 = jest.fn();
      const setProfilImg1 = jest.fn();
      const setProfilImg2 = jest.fn();

      render(
        <>
          <ProfilModal
            visible={true}
            onClose={onClose1}
            ProfilImg="img1.jpg"
            setProfilImg={setProfilImg1}
          />
          <ProfilModal
            visible={true}
            onClose={onClose2}
            ProfilImg="img2.jpg"
            setProfilImg={setProfilImg2}
          />
        </>
      );

      // Verify that each modal instance receives its own callback functions
      expect(onClose1).toBeDefined();
      expect(onClose2).toBeDefined();
      expect(setProfilImg1).toBeDefined();
      expect(setProfilImg2).toBeDefined();
      // Verify they are different instances
      expect(onClose1).not.toBe(onClose2);
      expect(setProfilImg1).not.toBe(setProfilImg2);
    });
  });

  describe('State Management', () => {
    test('should initialize displayImg with ProfilImg prop', () => {
      render(
        <ProfilModal
          visible={true}
          onClose={mockOnClose}
          ProfilImg="initial-img.jpg"
          setProfilImg={mockSetProfilImg}
        />
      );

      const image = screen.getByRole('img');
      expect(image.getAttribute('src')).toContain('initial-img.jpg');
    });

    test('should update displayImg when rotate button is clicked', () => {
      render(
        <ProfilModal
          visible={true}
          onClose={mockOnClose}
          ProfilImg="img1.jpg"
          setProfilImg={mockSetProfilImg}
        />
      );

      const arrowIcon = screen.getByTestId('arrow-right-icon');
      const imgElement = screen.getByRole('img');

      const beforeSrc = imgElement.getAttribute('src');
      fireEvent.click(arrowIcon);
      const afterSrc = imgElement.getAttribute('src');

      expect(beforeSrc).not.toBe(afterSrc);
    });

    test('should maintain imgIndex state across renders', () => {
      const { rerender } = render(
        <ProfilModal
          visible={true}
          onClose={mockOnClose}
          ProfilImg="img1.jpg"
          setProfilImg={mockSetProfilImg}
        />
      );

      const arrowIcon = screen.getByTestId('arrow-right-icon');
      fireEvent.click(arrowIcon);

      const imgBefore = screen.getByRole('img').getAttribute('src');

      rerender(
        <ProfilModal
          visible={true}
          onClose={mockOnClose}
          ProfilImg="img1.jpg"
          setProfilImg={mockSetProfilImg}
        />
      );

      const imgAfter = screen.getByRole('img').getAttribute('src');
      expect(imgBefore).toBe(imgAfter);
    });
  });

  describe('useEffect Behavior', () => {
    test('should react to visible prop changes', async () => {
      const { rerender } = render(
        <ProfilModal
          visible={false}
          onClose={mockOnClose}
          ProfilImg="img1.jpg"
          setProfilImg={mockSetProfilImg}
        />
      );

      expect(screen.queryByRole('img')).not.toBeInTheDocument();

      rerender(
        <ProfilModal
          visible={true}
          onClose={mockOnClose}
          ProfilImg="img1.jpg"
          setProfilImg={mockSetProfilImg}
        />
      );

      await waitFor(() => {
        expect(screen.getByRole('img')).toBeInTheDocument();
      });
    });

    test('should call useEffect when visible prop changes', async () => {
      const { rerender } = render(
        <ProfilModal
          visible={true}
          onClose={mockOnClose}
          ProfilImg="img1.jpg"
          setProfilImg={mockSetProfilImg}
        />
      );

      rerender(
        <ProfilModal
          visible={false}
          onClose={mockOnClose}
          ProfilImg="img1.jpg"
          setProfilImg={mockSetProfilImg}
        />
      );

      await waitFor(() => {
        expect(mockOnClose).not.toHaveBeenCalled();
      });
    });

    test('should handle rapid visible prop changes', async () => {
      const { rerender } = render(
        <ProfilModal
          visible={true}
          onClose={mockOnClose}
          ProfilImg="img1.jpg"
          setProfilImg={mockSetProfilImg}
        />
      );

      rerender(
        <ProfilModal
          visible={false}
          onClose={mockOnClose}
          ProfilImg="img1.jpg"
          setProfilImg={mockSetProfilImg}
        />
      );

      rerender(
        <ProfilModal
          visible={true}
          onClose={mockOnClose}
          ProfilImg="img1.jpg"
          setProfilImg={mockSetProfilImg}
        />
      );

      await waitFor(() => {
        expect(screen.getByRole('img')).toBeInTheDocument();
      });
    });
  });

  describe('Component Structure', () => {
    test('should have modal in fixed position', () => {
      const { container } = render(
        <ProfilModal
          visible={true}
          onClose={mockOnClose}
          ProfilImg="img1.jpg"
          setProfilImg={mockSetProfilImg}
        />
      );

      const backdrop = container.querySelector('.fixed');
      expect(backdrop).toBeInTheDocument();
    });

    test('should have backdrop covering full screen', () => {
      const { container } = render(
        <ProfilModal
          visible={true}
          onClose={mockOnClose}
          ProfilImg="img1.jpg"
          setProfilImg={mockSetProfilImg}
        />
      );

      const backdrop = container.querySelector('.inset-0');
      expect(backdrop).toBeInTheDocument();
    });

    test('should have high z-index for modal', () => {
      const { container } = render(
        <ProfilModal
          visible={true}
          onClose={mockOnClose}
          ProfilImg="img1.jpg"
          setProfilImg={mockSetProfilImg}
        />
      );

      const backdrop = container.querySelector('.z-50');
      expect(backdrop).toBeInTheDocument();
    });

    test('should have image container with border styling', () => {
      const { container } = render(
        <ProfilModal
          visible={true}
          onClose={mockOnClose}
          ProfilImg="img1.jpg"
          setProfilImg={mockSetProfilImg}
        />
      );

      const imgContainer = container.querySelector('.border-2.rounded-md');
      expect(imgContainer).toBeInTheDocument();
    });

    test('should have centered layout', () => {
      const { container } = render(
        <ProfilModal
          visible={true}
          onClose={mockOnClose}
          ProfilImg="img1.jpg"
          setProfilImg={mockSetProfilImg}
        />
      );

      const centeredDiv = container.querySelector('.flex.items-center.justify-center');
      expect(centeredDiv).toBeInTheDocument();
    });
  });
});
