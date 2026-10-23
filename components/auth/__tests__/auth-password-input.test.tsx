import { createEvent, fireEvent, render, screen } from '@testing-library/react';

import { AuthPasswordInput } from '../auth-password-input';

describe('AuthPasswordInput', () => {
  it('clears Caps Lock feedback on blur and preserves caller keyboard and blur handlers', () => {
    const onKeyDown = jest.fn(); const onKeyUp = jest.fn(); const onBlur = jest.fn();
    render(<AuthPasswordInput aria-label="Password" showPasswordLabel="Show password" hidePasswordLabel="Hide password" capsLockMessage="Caps Lock is on" onKeyDown={onKeyDown} onKeyUp={onKeyUp} onBlur={onBlur} />);
    const input = screen.getByLabelText('Password');
    const event = createEvent.keyDown(input, { key: 'A' });
    Object.defineProperty(event, 'getModifierState', { value: () => true });
    fireEvent(input, event);
    expect(screen.getByRole('status')).toBeInTheDocument();
    fireEvent.blur(input);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    fireEvent.keyUp(input, { key: 'a' });
    expect(onKeyDown).toHaveBeenCalledTimes(1); expect(onKeyUp).toHaveBeenCalledTimes(1); expect(onBlur).toHaveBeenCalledTimes(1);
  });
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
