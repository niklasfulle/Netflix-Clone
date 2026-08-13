import { render, screen } from '@testing-library/react';

import { FormSuccess } from '../form-success';

describe('FormSuccess', () => {
  it('does not render without a message', () => {
    const { container } = render(<FormSuccess />);
    expect(container).toBeEmptyDOMElement();
  });

  it('announces a successful result without interrupting the user', () => {
    render(<FormSuccess message="Your account is ready." />);
    const status = screen.getByRole('status');

    expect(status).toHaveAttribute('aria-live', 'polite');
    expect(status).toHaveTextContent('Your account is ready.');
    expect(status.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
  });
});
