import Footer from '@/components/Footer';
import Navbar from '@/components/Navbar';

const changelog = [
  {
    version: '1.7',
    changes: [
      'Changelog introduced',
      'Watch History page added',
      'Bug fixes and minor improvements with Sonarqube analysis',
    ],
  },
  {
    version: '1.6.4',
    changes: [
      'Bug fixes and minor improvements',
    ],
  },
  {
    version: '1.6.3',
    changes: [
      'Bug fixes and minor improvements',
    ],
  },
  {
    version: '1.6.2',
    changes: [
      'Bug fixes and minor improvements',
    ],
  },
  {
    version: '1.6.1',
    changes: [
      'Bug fixes and minor improvements',
    ],
  },
  {
    version: '1.6.0',
    changes: [
      'Logging introduced for all backend activities',
    ],
  },
  {
    version: '1.5.0',
    changes: [
      'Admin page introduced',
      '- User management',
      '- Actor management',
      '- Movie management',
      '- Statistics',
    ],
  },
  {
    version: '1.4.0',
    changes: [
      'Backend rework',
      '- Improved performance',
      '- Video streaming introduced for faster loading times',
    ],
  },
  {
    version: '1.3.0',
    changes: [
      'Playlists introduced',
      '- Create, edit, and delete playlists',
      'Movies page updated',
    ],
  },
  {
    version: '1.2.0',
    changes: [
      'Random page added',
    ],
  },
  {
    version: '1.1.0',
    changes: [
      'Bug fixes and minor improvements',
    ],
  },
  {
    version: '1.0.0',
    changes: [
      'First release of the Netflix app',
    ],
  },
];

export default function ChangelogPage() {
  return (
    <>
      <Navbar />
      <div className="w-full max-w-2xl min-h-screen pt-52 pb-20 mx-auto text-white">
        <h1 className="text-4xl font-bold mb-8 text-center">Changelog</h1>
        <div className="space-y-8">
          {changelog.map((entry) => (
            <div key={entry.version} className="bg-zinc-800 rounded-lg shadow-lg p-6 border border-zinc-700">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xl font-semibold">Version {entry.version}</span>
              </div>
              <ul className="list-disc list-inside space-y-1 ml-2">
                {entry.changes.map((change, idx) => (
                  <li key={change}>{change}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
      <Footer />
    </>
  );
}
