import Footer from '@/components/Footer';
import Navbar from '@/components/Navbar';
import { getChangelog } from '@/lib/changelog';

export default function ChangelogPage() {
  const changelog = getChangelog();

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
                {entry.changes.map((change) => (
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
