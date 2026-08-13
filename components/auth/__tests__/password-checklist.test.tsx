import { render, screen } from '@testing-library/react';

import { PasswordChecklist } from '../password-checklist';

describe('PasswordChecklist', () => {
  it('announces the required length and confirmation progress', () => {
    const { rerender } = render(
      <PasswordChecklist
        password="short"
        confirmation="different"
        lengthLabel="At least 12 characters"
        matchLabel="Passwords match"
        ariaLabel="Password requirements"
      />,
    );
    expect(screen.getByText('At least 12 characters')).toHaveAttribute('data-complete', 'false');
    expect(screen.getByText('Passwords match')).toHaveAttribute('data-complete', 'false');

    rerender(
      <PasswordChecklist
        password="long-enough-password"
        confirmation="long-enough-password"
        lengthLabel="At least 12 characters"
        matchLabel="Passwords match"
        ariaLabel="Password requirements"
      />,
    );
    expect(screen.getByText('At least 12 characters')).toHaveAttribute('data-complete', 'true');
    expect(screen.getByText('Passwords match')).toHaveAttribute('data-complete', 'true');
  });
});
