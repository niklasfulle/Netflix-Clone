import { createEvent, fireEvent, render, screen } from '@testing-library/react';

import { AuthPasswordInput } from '../auth-password-input';

describe('AuthPasswordInput', () => {
  it('toggles visibility without submitting the surrounding form', () => {
    render(
      <form onSubmit={(event) => event.preventDefault()}>
        <AuthPasswordInput
          aria-label="Password"
          showPasswordLabel="Show password"
          hidePasswordLabel="Hide password"
          capsLockMessage="Caps Lock is on"
        />
      </form>,
    );

    const input = screen.getByLabelText('Password');
    expect(input).toHaveAttribute('type', 'password');
    fireEvent.click(screen.getByRole('button', { name: 'Show password' }));
    expect(input).toHaveAttribute('type', 'text');
    expect(screen.getByRole('button', { name: 'Hide password' })).toHaveAttribute('type', 'button');
  });

  it('announces Caps Lock while typing and clears the warning afterwards', () => {
    render(
      <AuthPasswordInput
        aria-label="Password"
        showPasswordLabel="Show password"
        hidePasswordLabel="Hide password"
        capsLockMessage="Caps Lock is on"
      />,
    );

    const input = screen.getByLabelText('Password');
    const capsLockEvent = createEvent.keyDown(input, { key: 'A' });
    Object.defineProperty(capsLockEvent, 'getModifierState', { value: () => true });
    fireEvent(input, capsLockEvent);
    expect(screen.getByRole('status')).toHaveTextContent('Caps Lock is on');
    const normalEvent = createEvent.keyUp(input, { key: 'a' });
    Object.defineProperty(normalEvent, 'getModifierState', { value: () => false });
    fireEvent(input, normalEvent);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });
});
