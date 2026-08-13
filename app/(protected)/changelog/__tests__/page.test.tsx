import { render, screen, within } from '@testing-library/react';

import ChangelogPage from '../page';
import { getChangelog } from '@/lib/changelog';

jest.mock('@/components/Navbar', () => function MockNavbar() {
  return <nav aria-label="Primary">Navbar</nav>;
});

jest.mock('@/components/Footer', () => function MockFooter() {
  return <footer>Footer</footer>;
});

jest.mock('@/lib/changelog', () => ({
  getChangelog: jest.fn(),
}));

const mockedGetChangelog = jest.mocked(getChangelog);

const changelog = [
  {
    version: '1.11.0',
    changes: ['Redesigned authentication', 'Added multi-factor authentication'],
  },
  {
    version: '1.10.1',
    changes: ['Improved deployment reliability'],
  },
  {
    version: '1.10.0',
    changes: ['Added container logs', 'Improved the admin area'],
  },
];

describe('ChangelogPage', () => {
  beforeEach(() => {
    mockedGetChangelog.mockReturnValue(changelog);
  });

  it('renders the release overview between navigation and footer', () => {
    render(<ChangelogPage />);

    expect(screen.getByRole('navigation', { name: 'Primary' })).toBeInTheDocument();
    expect(screen.getByRole('main')).toHaveAttribute('id', 'main-content');
    expect(screen.getByRole('heading', {
      level: 1,
      name: 'What’s New in Netflix Clone',
    })).toBeInTheDocument();
    expect(screen.getByRole('contentinfo')).toHaveTextContent('Footer');
  });

  it('highlights the latest release and summarizes all entries', () => {
    render(<ChangelogPage />);

    const summary = screen.getByLabelText('Changelog summary');
    expect(within(summary).getByText('v1.11.0')).toBeInTheDocument();
    expect(within(summary).getByText('3')).toBeInTheDocument();
    expect(within(summary).getByText('5')).toBeInTheDocument();

    const latestRelease = screen.getByRole('region', { name: 'Version 1.11.0' });
    expect(within(latestRelease).getByText('Latest Release')).toBeInTheDocument();
    expect(within(latestRelease).getByText('Redesigned authentication')).toBeInTheDocument();
  });

  it('renders older versions as a semantic release timeline', () => {
    render(<ChangelogPage />);

    const history = screen.getByRole('list', { name: 'Release history' });
    expect(history.children).toHaveLength(2);
    expect(screen.getByRole('heading', { level: 3, name: 'Version 1.10.1' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3, name: 'Version 1.10.0' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { level: 3, name: 'Version 1.11.0' })).not.toBeInTheDocument();
  });

  it('renders every published change', () => {
    render(<ChangelogPage />);

    for (const entry of changelog) {
      for (const change of entry.changes) {
        expect(screen.getByText(change)).toBeInTheDocument();
      }
    }
  });

  it('shows a useful empty state when no releases are available', () => {
    mockedGetChangelog.mockReturnValue([]);

    render(<ChangelogPage />);

    expect(screen.getByRole('heading', { level: 2, name: 'No Releases Yet' })).toBeInTheDocument();
    expect(screen.queryByLabelText('Changelog summary')).not.toBeInTheDocument();
    expect(screen.queryByRole('list', { name: 'Release history' })).not.toBeInTheDocument();
  });
});
