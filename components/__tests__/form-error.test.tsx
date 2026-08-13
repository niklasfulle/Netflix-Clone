import { render, screen } from '@testing-library/react';

import { FormError } from '../form-error';

describe('FormError', () => {
  it('does not render without a message', () => {
    const { container } = render(<FormError />);
    expect(container).toBeEmptyDOMElement();
  });

  it('announces errors immediately and keeps long messages readable', () => {
    render(<FormError message="The credentials are invalid." />);
    const alert = screen.getByRole('alert');

    expect(alert).toHaveAttribute('aria-live', 'assertive');
    expect(alert).toHaveTextContent('The credentials are invalid.');
    expect(alert.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
    expect(screen.getByText('The credentials are invalid.')).toHaveClass('break-words');
  });
});
