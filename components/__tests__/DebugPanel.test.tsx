import { render, screen, waitFor } from '@testing-library/react';

import DebugPanel from '@/components/DebugPanel';
import { initializeDebugAccess } from '@/lib/debug';

describe('DebugPanel', () => {
  const originalFetch = window.fetch;

  beforeEach(() => {
    sessionStorage.clear();
    window.history.replaceState({}, '', '/series?debug=1');
    window.fetch = jest.fn();
    initializeDebugAccess(false);
  });

  afterEach(() => {
    window.fetch = originalFetch;
  });

  test('does not expose debug mode to a non-admin user', () => {
    render(<DebugPanel adminAllowed={false} />);

    expect(screen.queryByText('Debug · Admin')).not.toBeInTheDocument();
  });

  test('shows the global debug panel to an admin using debug=1', async () => {
    render(<DebugPanel adminAllowed />);

    expect(await screen.findByText('Debug · Admin')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText(/debug_started/)).toBeInTheDocument();
    });
  });
});
