import React, { useEffect, useState } from 'react';

// Extend the ipcRenderer type to include getSetupFiles
declare global {
  interface Window {
    electron?: {
      ipcRenderer?: {
        getSetupFiles?: () => Promise<string[]>;
      };
    };
  }
}

export default function BrowseSetupsPage() {
  const [setupFiles, setSetupFiles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    // Use Electron IPC to get setup files from main process
    if (window.electron?.ipcRenderer?.getSetupFiles) {
      window.electron.ipcRenderer
        .getSetupFiles()
        .then((files: string[]) => {
          setSetupFiles(files);
          setLoading(false);
        })
        .catch(() => {
          setError('Failed to load setups');
          setLoading(false);
        });
    } else {
      setSetupFiles([]);
      setLoading(false);
    }
  }, []);

  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <h2>Browse ACC Setups</h2>
      {loading && <p>Loading setups...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {!loading && !error && (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {setupFiles.length === 0 ? (
            <li>No setups found.</li>
          ) : (
            setupFiles.map((file) => (
              <li key={file} style={{ margin: '0.5em 0', textAlign: 'left' }}>
                {file}
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
