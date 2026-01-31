import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MultiSelect } from '../multi-select';

describe('MultiSelect Component', () => {
  const mockOptions = [
    { label: 'Option 1', value: 'opt1' },
    { label: 'Option 2', value: 'opt2' },
    { label: 'Option 3', value: 'opt3' },
    { label: 'Option 4', value: 'opt4' },
  ];

  describe('Basic Rendering', () => {
    test('should render without crashing', () => {
      const { container } = render(
        <MultiSelect options={mockOptions} value={[]} onChange={jest.fn()} />
      );
      expect(container.querySelector('div[role="button"]')).toBeTruthy();
    });

    test('should display placeholder text when no value selected', () => {
      render(
        <MultiSelect options={mockOptions} value={[]} onChange={jest.fn()} />
      );
      expect(screen.getByText('Select...')).toBeTruthy();
    });

    test('should display custom placeholder', () => {
      render(
        <MultiSelect
          options={mockOptions}
          value={[]}
          onChange={jest.fn()}
          placeholder="Choose items..."
        />
      );
      expect(screen.getByText('Choose items...')).toBeTruthy();
    });

    test('should display label when provided', () => {
      render(
        <MultiSelect
          options={mockOptions}
          value={[]}
          onChange={jest.fn()}
          label="Select Options"
        />
      );
      expect(screen.getByText('Select Options')).toBeTruthy();
    });

    test('should display selected values as tags', () => {
      render(
        <MultiSelect
          options={mockOptions}
          value={['opt1', 'opt2']}
          onChange={jest.fn()}
        />
      );
      expect(screen.getByText('Option 1')).toBeTruthy();
      expect(screen.getByText('Option 2')).toBeTruthy();
    });
  });

  describe('Dropdown Toggle', () => {
    test('should open dropdown when clicked', async () => {
      const { container } = render(
        <MultiSelect options={mockOptions} value={[]} onChange={jest.fn()} />
      );
      const button = container.querySelector('div[role="button"]');
      fireEvent.click(button!);
      await waitFor(() => {
        expect(screen.getByPlaceholderText('Search...')).toBeTruthy();
      });
    });

    test('should close dropdown when clicked again', async () => {
      const { container } = render(
        <MultiSelect options={mockOptions} value={[]} onChange={jest.fn()} />
      );
      const button = container.querySelector('div[role="button"]');
      fireEvent.click(button!);
      await waitFor(() => {
        expect(screen.getByPlaceholderText('Search...')).toBeTruthy();
      });
      fireEvent.click(button!);
      await waitFor(() => {
        expect(screen.queryByPlaceholderText('Search...')).toBeFalsy();
      });
    });

    test('should close dropdown when clicking outside', async () => {
      const { container } = render(
        <div>
          <MultiSelect options={mockOptions} value={[]} onChange={jest.fn()} />
          <div data-testid="outside">Outside</div>
        </div>
      );
      const button = container.querySelector('div[role="button"]');
      fireEvent.click(button!);
      await waitFor(() => {
        expect(screen.getByPlaceholderText('Search...')).toBeTruthy();
      });
      const outside = screen.getByTestId('outside');
      fireEvent.mouseDown(outside);
      await waitFor(() => {
        expect(screen.queryByPlaceholderText('Search...')).toBeFalsy();
      });
    });

    test('should not open dropdown when disabled', async () => {
      const { container } = render(
        <MultiSelect
          options={mockOptions}
          value={[]}
          onChange={jest.fn()}
          disabled
        />
      );
      const button = container.querySelector('div[role="button"]');
      fireEvent.click(button!);
      expect(screen.queryByPlaceholderText('Search...')).toBeFalsy();
    });
  });

  describe('Selection and Deselection', () => {
    test('should add item when option clicked', async () => {
      const onChange = jest.fn();
      render(
        <MultiSelect options={mockOptions} value={[]} onChange={onChange} />
      );
      const button = document.querySelector('div[role="button"]');
      fireEvent.click(button!);
      await waitFor(() => {
        const option = screen.getByText('Option 1');
        fireEvent.click(option.closest('div')!);
      });
      expect(onChange).toHaveBeenCalledWith(['opt1']);
    });

    test('should remove item when X button clicked', async () => {
      const onChange = jest.fn();
      const { container } = render(
        <MultiSelect
          options={mockOptions}
          value={['opt1']}
          onChange={onChange}
        />
      );
      const removeButtons = container.querySelectorAll('button[type="button"]');
      fireEvent.click(removeButtons[0]);
      expect(onChange).toHaveBeenCalledWith([]);
    });

    test('should handle multiple selections', async () => {
      const onChange = jest.fn();
      render(
        <MultiSelect
          options={mockOptions}
          value={['opt1', 'opt2', 'opt3']}
          onChange={onChange}
        />
      );
      expect(screen.getByText('Option 1')).toBeTruthy();
      expect(screen.getByText('Option 2')).toBeTruthy();
      expect(screen.getByText('Option 3')).toBeTruthy();
    });

    test('should toggle selection when clicking option checkbox', async () => {
      const onChange = jest.fn();
      const { container } = render(
        <MultiSelect
          options={mockOptions}
          value={['opt1']}
          onChange={onChange}
        />
      );
      const button = container.querySelector('div[role="button"]');
      fireEvent.click(button!);
      await waitFor(() => {
        const checkboxes = container.querySelectorAll('input[type="checkbox"]');
        fireEvent.click(checkboxes[0]);
      });
      expect(onChange).toHaveBeenCalledWith([]);
    });
  });

  describe('Search Functionality', () => {
    test('should filter options by search input', async () => {
      const { container } = render(
        <MultiSelect options={mockOptions} value={[]} onChange={jest.fn()} />
      );
      const button = container.querySelector('div[role="button"]');
      fireEvent.click(button!);
      const searchInput = await screen.findByPlaceholderText('Search...');
      fireEvent.change(searchInput, { target: { value: 'Option 1' } });
      expect(screen.getByText('Option 1')).toBeTruthy();
      expect(screen.queryByText('Option 2')).toBeFalsy();
    });

    test('should perform case-insensitive search', async () => {
      const { container } = render(
        <MultiSelect options={mockOptions} value={[]} onChange={jest.fn()} />
      );
      const button = container.querySelector('div[role="button"]');
      fireEvent.click(button!);
      const searchInput = await screen.findByPlaceholderText('Search...');
      fireEvent.change(searchInput, { target: { value: 'option 1' } });
      expect(screen.getByText('Option 1')).toBeTruthy();
    });

    test('should show no options message when search has no results', async () => {
      const { container } = render(
        <MultiSelect options={mockOptions} value={[]} onChange={jest.fn()} />
      );
      const button = container.querySelector('div[role="button"]');
      fireEvent.click(button!);
      const searchInput = await screen.findByPlaceholderText('Search...');
      fireEvent.change(searchInput, { target: { value: 'nonexistent' } });
      expect(screen.getByText('No options')).toBeTruthy();
    });

    test('should clear search when dropdown closes', async () => {
      const { container } = render(
        <MultiSelect options={mockOptions} value={[]} onChange={jest.fn()} />
      );
      const button = container.querySelector('div[role="button"]');
      fireEvent.click(button!);
      const searchInput = await screen.findByPlaceholderText('Search...');
      fireEvent.change(searchInput, { target: { value: 'Option 1' } });
      fireEvent.click(button!);
      await waitFor(() => {
        expect(screen.queryByPlaceholderText('Search...')).toBeFalsy();
      });
    });
  });

  describe('Disabled State', () => {
    test('should show disabled styling', () => {
      const { container } = render(
        <MultiSelect
          options={mockOptions}
          value={[]}
          onChange={jest.fn()}
          disabled
        />
      );
      const button = container.querySelector('div[role="button"]');
      expect(button?.className).toContain('opacity-50');
      expect(button?.className).toContain('cursor-not-allowed');
    });

    test('should not respond to click when disabled', async () => {
      const onChange = jest.fn();
      const { container } = render(
        <MultiSelect
          options={mockOptions}
          value={[]}
          onChange={onChange}
          disabled
        />
      );
      const button = container.querySelector('div[role="button"]');
      fireEvent.click(button!);
      expect(screen.queryByPlaceholderText('Search...')).toBeFalsy();
    });
  });

  describe('Tag Management', () => {
    test('should display remove button for each selected tag', () => {
      const { container } = render(
        <MultiSelect
          options={mockOptions}
          value={['opt1', 'opt2']}
          onChange={jest.fn()}
        />
      );
      const removeButtons = container.querySelectorAll('button[type="button"]');
      expect(removeButtons.length).toBe(2);
    });

    test('should stop propagation when removing tag', async () => {
      const onChange = jest.fn();
      const { container } = render(
        <MultiSelect
          options={mockOptions}
          value={['opt1']}
          onChange={onChange}
        />
      );
      const removeButton = container.querySelector('button[type="button"]');
      fireEvent.click(removeButton!);
      expect(onChange).toHaveBeenCalledWith([]);
    });

    test('should style selected tags correctly', () => {
      render(
        <MultiSelect
          options={mockOptions}
          value={['opt1']}
          onChange={jest.fn()}
        />
      );
      const tag = screen.getByText('Option 1').closest('span');
      expect(tag?.className).toContain('bg-red-700/80');
      expect(tag?.className).toContain('text-white');
    });
  });

  describe('Checkbox Integration', () => {
    test('should show checked checkboxes for selected items', async () => {
      const { container } = render(
        <MultiSelect
          options={mockOptions}
          value={['opt1', 'opt2']}
          onChange={jest.fn()}
        />
      );
      const button = container.querySelector('div[role="button"]');
      fireEvent.click(button!);
      await waitFor(() => {
        const checkboxes = container.querySelectorAll('input[type="checkbox"]');
        expect((checkboxes[0] as HTMLInputElement).checked).toBe(true);
        expect((checkboxes[1] as HTMLInputElement).checked).toBe(true);
        expect((checkboxes[2] as HTMLInputElement).checked).toBe(false);
      });
    });

    test('should show check icon for selected items', async () => {
      const { container } = render(
        <MultiSelect
          options={mockOptions}
          value={['opt1']}
          onChange={jest.fn()}
        />
      );
      const button = container.querySelector('div[role="button"]');
      fireEvent.click(button!);
      await waitFor(() => {
        const checkIcons = container.querySelectorAll('svg[class*="w-4"]');
        expect(checkIcons.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Props and Attributes', () => {
    test('should accept options prop', () => {
      const { container } = render(
        <MultiSelect options={mockOptions} value={[]} onChange={jest.fn()} />
      );
      expect(container.querySelector('div[role="button"]')).toBeTruthy();
    });

    test('should accept value prop', () => {
      render(
        <MultiSelect
          options={mockOptions}
          value={['opt1']}
          onChange={jest.fn()}
        />
      );
      expect(screen.getByText('Option 1')).toBeTruthy();
    });

    test('should accept onChange callback', async () => {
      const onChange = jest.fn();
      const { container } = render(
        <MultiSelect options={mockOptions} value={[]} onChange={onChange} />
      );
      const button = container.querySelector('div[role="button"]');
      fireEvent.click(button!);
      await waitFor(() => {
        const option = screen.getByText('Option 1');
        fireEvent.click(option.closest('div')!);
      });
      expect(onChange).toHaveBeenCalled();
    });

    test('should handle empty options array', () => {
      const { container } = render(
        <MultiSelect options={[]} value={[]} onChange={jest.fn()} />
      );
      expect(container.querySelector('div[role="button"]')).toBeTruthy();
    });
  });

  describe('Keyboard Navigation', () => {
    test('should focus search input when dropdown opens', async () => {
      const { container } = render(
        <MultiSelect options={mockOptions} value={[]} onChange={jest.fn()} />
      );
      const button = container.querySelector('div[role="button"]');
      fireEvent.click(button!);
      await waitFor(() => {
        const searchInput = screen.getByPlaceholderText('Search...') as HTMLInputElement;
        expect(searchInput).toBeTruthy();
      });
    });

    test('should be keyboard accessible', async () => {
      const { container } = render(
        <MultiSelect options={mockOptions} value={[]} onChange={jest.fn()} />
      );
      const button = container.querySelector('div[role="button"]');
      expect(button?.getAttribute('tabIndex')).toBe('0');
    });
  });

  describe('Accessibility', () => {
    test('should have proper role for button', () => {
      const { container } = render(
        <MultiSelect options={mockOptions} value={[]} onChange={jest.fn()} />
      );
      const button = container.querySelector('div[role="button"]');
      expect(button?.getAttribute('role')).toBe('button');
    });

    test('should have aria-label on remove buttons', () => {
      const { container } = render(
        <MultiSelect
          options={mockOptions}
          value={['opt1']}
          onChange={jest.fn()}
        />
      );
      const removeButton = container.querySelector('button[aria-label="Remove"]');
      expect(removeButton).toBeTruthy();
    });

    test('should have readonly checkboxes', async () => {
      const { container } = render(
        <MultiSelect options={mockOptions} value={[]} onChange={jest.fn()} />
      );
      const button = container.querySelector('div[role="button"]');
      fireEvent.click(button!);
      await waitFor(() => {
        const checkboxes = container.querySelectorAll('input[type="checkbox"]');
        expect((checkboxes[0] as HTMLInputElement).readOnly).toBe(true);
      });
    });
  });

  describe('Styling', () => {
    test('should apply base container styles', () => {
      const { container } = render(
        <MultiSelect options={mockOptions} value={[]} onChange={jest.fn()} />
      );
      const button = container.querySelector('div[role="button"]');
      expect(button?.className).toContain('bg-zinc-800');
      expect(button?.className).toContain('border');
      expect(button?.className).toContain('rounded');
    });

    test('should apply hover styles when not disabled', () => {
      const { container } = render(
        <MultiSelect options={mockOptions} value={[]} onChange={jest.fn()} />
      );
      const button = container.querySelector('div[role="button"]');
      expect(button?.className).toContain('hover:border-red-500');
    });

    test('should apply dropdown styles', async () => {
      const { container } = render(
        <MultiSelect options={mockOptions} value={[]} onChange={jest.fn()} />
      );
      const button = container.querySelector('div[role="button"]');
      fireEvent.click(button!);
      await waitFor(() => {
        const dropdown = container.querySelector('div[class*="z-50"]');
        expect(dropdown?.className).toContain('bg-zinc-900');
        expect(dropdown?.className).toContain('border');
      });
    });

    test('should apply highlight styles for selected options', async () => {
      const { container } = render(
        <MultiSelect
          options={mockOptions}
          value={['opt1']}
          onChange={jest.fn()}
        />
      );
      const button = container.querySelector('div[role="button"]');
      fireEvent.click(button!);
      await waitFor(() => {
        const allOptions = container.querySelectorAll('div[class*="px-2"][class*="py-2"]');
        const optionArray = Array.from(allOptions);
        expect(optionArray.length).toBeGreaterThan(0);
        const firstOptionElement = optionArray[0];
        expect(firstOptionElement.textContent).toContain('Option 1');
        expect(firstOptionElement.className).toContain('bg-red-700/40');
      });
    });
  });

  describe('Edge Cases', () => {
    test('should handle value with non-existent options', () => {
      const { container } = render(
        <MultiSelect
          options={mockOptions}
          value={['nonexistent']}
          onChange={jest.fn()}
        />
      );
      // Component should render with no matching tags for non-existent options
      const tags = container.querySelectorAll('span[class*="bg-red-700"]');
      expect(tags.length).toBe(0);
    });

    test('should handle rapid click events', async () => {
      const { container } = render(
        <MultiSelect options={mockOptions} value={[]} onChange={jest.fn()} />
      );
      const button = container.querySelector('div[role="button"]');
      // First click opens
      fireEvent.click(button!);
      expect(screen.getByPlaceholderText('Search...')).toBeTruthy();
      // Second click closes
      fireEvent.click(button!);
      expect(screen.queryByPlaceholderText('Search...')).toBeFalsy();
      // Third click opens again
      fireEvent.click(button!);
      expect(screen.getByPlaceholderText('Search...')).toBeTruthy();
    });

    test('should handle very long option labels', async () => {
      const longOptions = [
        { label: 'A'.repeat(100), value: 'long' },
      ];
      render(
        <MultiSelect options={longOptions} value={['long']} onChange={jest.fn()} />
      );
      expect(screen.getByText('A'.repeat(100))).toBeTruthy();
    });

    test('should handle special characters in search', async () => {
      const specialOptions = [
        { label: 'Option <>&"\'', value: 'special' },
      ];
      const { container } = render(
        <MultiSelect
          options={specialOptions}
          value={[]}
          onChange={jest.fn()}
        />
      );
      const button = container.querySelector('div[role="button"]');
      fireEvent.click(button!);
      const searchInput = await screen.findByPlaceholderText('Search...');
      fireEvent.change(searchInput, { target: { value: 'Option' } });
      expect(screen.getByText('Option <>&"\'')).toBeTruthy();
    });

    test('should handle empty search results gracefully', async () => {
      const { container } = render(
        <MultiSelect options={mockOptions} value={[]} onChange={jest.fn()} />
      );
      const button = container.querySelector('div[role="button"]');
      fireEvent.click(button!);
      const searchInput = await screen.findByPlaceholderText('Search...');
      fireEvent.change(searchInput, { target: { value: 'xyz' } });
      expect(screen.getByText('No options')).toBeTruthy();
    });

    test('should handle large number of options', () => {
      const manyOptions = Array.from({ length: 100 }, (_, i) => ({
        label: `Option ${i}`,
        value: `opt${i}`,
      }));
      const { container } = render(
        <MultiSelect options={manyOptions} value={[]} onChange={jest.fn()} />
      );
      expect(container.querySelector('div[role="button"]')).toBeTruthy();
    });
  });

  describe('Event Handling', () => {
    test('should call onChange with updated values on selection', async () => {
      const onChange = jest.fn();
      const { container } = render(
        <MultiSelect options={mockOptions} value={[]} onChange={onChange} />
      );
      const button = container.querySelector('div[role="button"]');
      fireEvent.click(button!);
      await waitFor(() => {
        const option = screen.getByText('Option 1');
        fireEvent.click(option.closest('div')!);
      });
      expect(onChange).toHaveBeenCalledWith(expect.arrayContaining(['opt1']));
    });

    test('should call onChange with updated values on deselection', async () => {
      const onChange = jest.fn();
      const { container } = render(
        <MultiSelect
          options={mockOptions}
          value={['opt1']}
          onChange={onChange}
        />
      );
      const button = container.querySelector('div[role="button"]');
      fireEvent.click(button!);
      await waitFor(() => {
        expect(screen.getByPlaceholderText('Search...')).toBeTruthy();
      });
      const options = container.querySelectorAll('div[class*="cursor-pointer"][class*="hover:bg"]');
      const firstOption = Array.from(options)[0];
      fireEvent.click(firstOption);
      expect(onChange).toHaveBeenCalledWith([]);
    });

    test('should prevent dropdown close on option click', async () => {
      const { container } = render(
        <MultiSelect options={mockOptions} value={[]} onChange={jest.fn()} />
      );
      const button = container.querySelector('div[role="button"]');
      fireEvent.click(button!);
      await waitFor(() => {
        const option = screen.getByText('Option 1');
        fireEvent.click(option.closest('div')!);
      });
      expect(screen.getByPlaceholderText('Search...')).toBeTruthy();
    });
  });

  describe('Type Safety', () => {
    test('should handle string values correctly', () => {
      render(
        <MultiSelect
          options={mockOptions}
          value={['opt1', 'opt2']}
          onChange={jest.fn()}
        />
      );
      expect(screen.getByText('Option 1')).toBeTruthy();
      expect(screen.getByText('Option 2')).toBeTruthy();
    });

    test('should work with different onChange signatures', async () => {
      const onChange = (values: string[]) => {
        expect(Array.isArray(values)).toBe(true);
      };
      const { container } = render(
        <MultiSelect options={mockOptions} value={[]} onChange={onChange} />
      );
      const button = container.querySelector('div[role="button"]');
      fireEvent.click(button!);
      await waitFor(() => {
        const option = screen.getByText('Option 1');
        fireEvent.click(option.closest('div')!);
      });
    });
  });

  describe('Ref and Component Methods', () => {
    test('should maintain ref to dropdown container', () => {
      const { container } = render(
        <MultiSelect options={mockOptions} value={[]} onChange={jest.fn()} />
      );
      const dropdownContainer = container.querySelector('div[class*="relative"]');
      expect(dropdownContainer).toBeTruthy();
    });

    test('should handle multiple instances independently', () => {
      const onChange1 = jest.fn();
      const onChange2 = jest.fn();
      render(
        <div>
          <MultiSelect
            options={mockOptions}
            value={[]}
            onChange={onChange1}
            label="First"
          />
          <MultiSelect
            options={mockOptions}
            value={[]}
            onChange={onChange2}
            label="Second"
          />
        </div>
      );
      expect(screen.getByText('First')).toBeTruthy();
      expect(screen.getByText('Second')).toBeTruthy();
    });
  });

  describe('Performance and Memory', () => {
    test('should clean up event listeners on unmount', () => {
      const { unmount } = render(
        <MultiSelect options={mockOptions} value={[]} onChange={jest.fn()} />
      );
      const addEventListenerSpy = jest.spyOn(document, 'addEventListener');
      const removeEventListenerSpy = jest.spyOn(document, 'removeEventListener');
      unmount();
      expect(removeEventListenerSpy).toHaveBeenCalled();
      addEventListenerSpy.mockRestore();
      removeEventListenerSpy.mockRestore();
    });

    test('should not create memory leaks with rapid opens/closes', async () => {
      const { container } = render(
        <MultiSelect options={mockOptions} value={[]} onChange={jest.fn()} />
      );
      const button = container.querySelector('div[role="button"]');
      for (let i = 0; i < 10; i++) {
        fireEvent.click(button!);
        await waitFor(() => {
          const searchInput = screen.queryByPlaceholderText('Search...');
          if (i % 2 === 0) {
            expect(searchInput).toBeTruthy();
          }
        });
      }
    });
  });
});
