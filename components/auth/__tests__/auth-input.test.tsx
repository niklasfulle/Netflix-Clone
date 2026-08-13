import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import { Mail } from 'lucide-react';

import { AuthInput } from '../auth-input';

describe('AuthInput', () => {
  it('forwards native input attributes and its ref', () => {
    const ref = createRef<HTMLInputElement>();
    render(
      <AuthInput
        ref={ref}
        icon={Mail}
        aria-label="Email"
        type="email"
        autoComplete="email"
        inputMode="email"
      />,
    );

    const input = screen.getByRole('textbox', { name: 'Email' });
    expect(input).toHaveAttribute('type', 'email');
    expect(input).toHaveAttribute('autocomplete', 'email');
    expect(input).toHaveAttribute('inputmode', 'email');
    expect(ref.current).toBe(input);
  });

  it('keeps its icon decorative and supports custom classes', () => {
    const { container } = render(
      <AuthInput icon={Mail} aria-label="Email" className="custom-input" />,
    );

    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
    expect(screen.getByRole('textbox', { name: 'Email' })).toHaveClass(
      'h-12',
      'custom-input',
    );
  });
});
