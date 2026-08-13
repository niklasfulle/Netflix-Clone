import { render, screen } from '@testing-library/react';

import EnvironmentBadge from '@/components/EnvironmentBadge';

describe('EnvironmentBadge', () => {
  it('identifies staging visibly and accessibly', () => {
    render(<EnvironmentBadge environment="staging" />);

    expect(screen.getByRole('status', { name: 'Staging environment' })).toBeInTheDocument();
    expect(screen.getByText('STAGING')).toBeVisible();
  });

  it.each([undefined, 'development', 'production'])(
    'renders nothing outside staging (%s)',
    (environment) => {
      const { container } = render(<EnvironmentBadge environment={environment} />);

      expect(container).toBeEmptyDOMElement();
    },
  );
});
