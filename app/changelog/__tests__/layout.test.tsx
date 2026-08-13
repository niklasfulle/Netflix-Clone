import { render, screen } from '@testing-library/react';

import Layout, { metadata } from '../layout';

describe('Changelog layout', () => {
  it('renders children without an unnecessary wrapper', () => {
    const { container } = render(
      <Layout>
        <div data-testid="first-child">First</div>
        <div data-testid="second-child">Second</div>
      </Layout>,
    );

    expect(screen.getByTestId('first-child')).toBeInTheDocument();
    expect(screen.getByTestId('second-child')).toBeInTheDocument();
    expect(container.childElementCount).toBe(2);
  });

  it('provides descriptive metadata for the page', () => {
    expect(metadata).toEqual({
      title: 'Netflix - Changelog',
      description: 'Discover the latest Netflix Clone features, improvements, and fixes.',
    });
  });
});
