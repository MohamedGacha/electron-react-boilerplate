import React, { useEffect, useMemo, useState } from 'react';
import './BrowseSetupsPage.css';

// Extend the ipcRenderer type to include getSetupFiles
declare global {
  interface Window {
    electron: {
      ipcRenderer?: {
        getSetupFiles?: () => Promise<string[]>;
        copySetupFile?: (
          relativePath: string,
        ) => Promise<{ ok: boolean; error?: string }>;
        deleteSetupFile?: (
          relativePath: string,
        ) => Promise<{ ok: boolean; error?: string }>;
        readSetupFile?: (
          relativePath: string,
        ) => Promise<{ ok: boolean; content?: string; error?: string }>;
        updateSetupFile?: (
          relativePath: string,
          newContent: string,
        ) => Promise<{ ok: boolean; error?: string }>;
        createSetupFile?: (
          // NEW
          relativePath: string,
          content: string,
        ) => Promise<{ ok: boolean; error?: string }>;
        revealSetupFile?: (
          relativePath: string,
        ) => Promise<{ ok: boolean; error?: string }>;
      };
    };
  }
}

type SetupMap = Record<string, Record<string, string[]>>; // car -> track -> [relative setup file path]

export default function BrowseSetupsPage() {
  const [setupFiles, setSetupFiles] = useState<string[]>([]);
  const [setupMap, setSetupMap] = useState<SetupMap>({});
  const [cars, setCars] = useState<string[]>([]);
  const [tracks, setTracks] = useState<string[]>([]);
  const [selectedCar, setSelectedCar] = useState<string>('');
  const [selectedTrack, setSelectedTrack] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>(''); // <-- add
  const [selectedRelFile, setSelectedRelFile] = useState<string>('');
  const [preview, setPreview] = useState<string>('');
  const [editorValue, setEditorValue] = useState<string>('');
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [loadingPreview, setLoadingPreview] = useState<boolean>(false);
  const [editFilename, setEditFilename] = useState<string>(''); // NEW

  const isJsonValid = useMemo(() => {
    try {
      if (!isEditing) return true;
      JSON.parse(editorValue);
      return true;
    } catch {
      return false;
    }
  }, [isEditing, editorValue]);

  // Pretty JSON for read-only preview
  const previewPretty = useMemo(() => {
    try {
      return JSON.stringify(JSON.parse(preview || ''), null, 2);
    } catch {
      return preview || '';
    }
  }, [preview]);

  // Load files from main
  useEffect(() => {
    setLoading(true);
    setError(null);
    if (window.electron?.ipcRenderer?.getSetupFiles) {
      window.electron.ipcRenderer
        .getSetupFiles()
        .then((files: string[]) => {
          setSetupFiles(files);
          setLoading(false);
          return undefined;
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

  // Build map car -> track -> [files]
  useEffect(() => {
    const map: SetupMap = {};
    setupFiles.forEach((f) => {
      // Expect at least: Car/Track/File.json (ignore malformed)
      const parts = f.split(/[/\\]+/).filter(Boolean);
      if (parts.length < 3) return;
      const car = parts[0];
      const track = parts[1];
      const relFile = parts.slice(2).join('/'); // keep rest as display
      if (!map[car]) map[car] = {};
      if (!map[car][track]) map[car][track] = [];
      map[car][track].push(relFile);
    });

    // Sort cars/tracks alphabetically for stable UI
    const carList = Object.keys(map).sort((a, b) => a.localeCompare(b));
    setSetupMap(map);
    setCars(carList);

    // Auto-select first car/track if available, else clear
    if (carList.length > 0) {
      const firstCar = carList.includes(selectedCar) ? selectedCar : carList[0];
      const trackList = Object.keys(map[firstCar] ?? {}).sort((a, b) =>
        a.localeCompare(b),
      );
      setTracks(trackList);
      const nextTrack = trackList.includes(selectedTrack)
        ? selectedTrack
        : (trackList[0] ?? '');
      setSelectedCar(firstCar);
      setSelectedTrack(nextTrack ?? '');
    } else {
      setTracks([]);
      setSelectedCar('');
      setSelectedTrack('');
    }
  }, [setupFiles, selectedCar, selectedTrack]);

  // When car changes, refresh track list and default track
  useEffect(() => {
    if (!selectedCar || !setupMap[selectedCar]) {
      setTracks([]);
      setSelectedTrack('');
      return;
    }
    const trackList = Object.keys(setupMap[selectedCar]).sort((a, b) =>
      a.localeCompare(b),
    );
    setTracks(trackList);
    if (!trackList.includes(selectedTrack)) {
      setSelectedTrack(trackList[0] ?? '');
    }
  }, [selectedCar, setupMap, selectedTrack]);

  const visibleSetups = useMemo(() => {
    if (!selectedCar || !selectedTrack) return [];
    return setupMap[selectedCar]?.[selectedTrack] ?? [];
  }, [setupMap, selectedCar, selectedTrack]);

  // Filter by search query (case-insensitive)
  const filteredSetups = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return visibleSetups;
    return visibleSetups.filter((name) => name.toLowerCase().includes(q));
  }, [visibleSetups, searchQuery]);

  // Clear search when switching car/track
  useEffect(() => {
    setSearchQuery('');
  }, [selectedCar, selectedTrack]);

  // Remove a file from setupFiles by matching its path parts
  const removeFromSetupFiles = (fullRel: string) => {
    setSetupFiles((prev) =>
      prev.filter((p) => {
        const a = p.split(/[/\\]+/).filter(Boolean);
        const b = fullRel.split(/[/\\]+/).filter(Boolean);
        if (a.length < 3 || b.length < 3) return true;
        const aKey = [a[0], a[1], a.slice(2).join('/')].join('|');
        const bKey = [b[0], b[1], b.slice(2).join('/')].join('|');
        return aKey !== bKey;
      }),
    );
  };

  // Build full relative path from current selection
  const toFullRelative = (relFile: string) =>
    `${selectedCar}/${selectedTrack}/${relFile}`;

  const onCopy = async (relFile: string) => {
    const fullRel = toFullRelative(relFile);
    try {
      if (window.electron?.ipcRenderer?.copySetupFile) {
        const res = await window.electron.ipcRenderer.copySetupFile(fullRel);
        if (!res.ok) throw new Error(res.error || 'Copy failed');
        // Optional: small user feedback (console or toast)
        console.log('Setup copied to clipboard');
      }
    } catch (e) {
      console.error(e);
      alert('Failed to copy setup to clipboard.');
    }
  };

  // Add this
  const onReveal = async (relFile: string) => {
    const fullRel = toFullRelative(relFile);
    try {
      const res =
        await window.electron?.ipcRenderer?.revealSetupFile?.(fullRel);
      if (!res?.ok) throw new Error(res?.error || 'Reveal failed');
    } catch (e) {
      console.error(e);
      alert('Failed to reveal in Explorer.');
    }
  };

  const onDelete = async (relFile: string) => {
    const fullRel = toFullRelative(relFile);
    const ok = window.confirm(
      `Delete setup?\n\nCar: ${selectedCar}\nTrack: ${selectedTrack}\nFile: ${relFile}`,
    );
    if (!ok) return;
    try {
      if (window.electron?.ipcRenderer?.deleteSetupFile) {
        const res = await window.electron.ipcRenderer.deleteSetupFile(fullRel);
        if (!res.ok) throw new Error(res.error || 'Delete failed');
        removeFromSetupFiles(fullRel);
        // If we were previewing this file, clear the editor
        if (selectedRelFile === relFile) {
          setSelectedRelFile('');
          setPreview('');
          setEditorValue('');
          setIsEditing(false);
        }
      }
    } catch (e) {
      console.error(e);
      alert('Failed to delete setup.');
    }
  };

  // helpers for filename handling
  const getBaseName = (rel: string) => rel.split('/').pop() || rel;
  const getDir = (rel: string) => {
    const i = rel.lastIndexOf('/');
    return i >= 0 ? rel.slice(0, i) : '';
  };
  const sanitizeFilename = (name: string) =>
    name.replace(/[/\\:*?"<>|]/g, '').trim(); // remove invalid chars for Windows
  const ensureJsonExt = (name: string) =>
    name.toLowerCase().endsWith('.json') ? name : `${name}.json`;

  const openPreview = async (relFile: string) => {
    if (!selectedCar || !selectedTrack) return;
    setSelectedRelFile(relFile);
    setLoadingPreview(true);
    const fullRel = toFullRelative(relFile);
    try {
      const res = await window.electron?.ipcRenderer?.readSetupFile?.(fullRel);
      if (res?.ok) {
        setPreview(res.content || '');
        setEditorValue(res.content || '');
        setIsEditing(false);
        setEditFilename(getBaseName(relFile)); // NEW: seed filename editor
      } else {
        alert(res?.error || 'Failed to read file.');
      }
    } catch {
      alert('Failed to read file.');
    } finally {
      setLoadingPreview(false);
    }
  };

  const enableEdit = () => {
    setEditFilename(getBaseName(selectedRelFile || '')); // NEW
    setIsEditing(true);
  };
  const cancelEdit = () => {
    setEditorValue(preview);
    setIsEditing(false);
  };

  const saveEdit = async () => {
    if (!selectedRelFile) return;
    // validate JSON
    try {
      JSON.parse(editorValue);
    } catch {
      alert('JSON is invalid. Please fix errors before saving.');
      return;
    }

    // resolve filenames
    const currentRel = selectedRelFile;
    const dir = getDir(currentRel);
    const baseSanitized = ensureJsonExt(sanitizeFilename(editFilename || ''));
    if (!baseSanitized) {
      alert('Please enter a file name.');
      return;
    }
    const nextRel = dir ? `${dir}/${baseSanitized}` : baseSanitized;

    try {
      if (nextRel === currentRel) {
        const ok = window.confirm(
          'Are you sure you want to override this setup?',
        );
        if (!ok) return;
        const fullRel = toFullRelative(currentRel);
        const res = await window.electron?.ipcRenderer?.updateSetupFile?.(
          fullRel,
          editorValue,
        );
        if (!res?.ok) throw new Error(res?.error || 'Save failed');
        setPreview(editorValue);
        setIsEditing(false);
      } else {
        // Save as new file, keep old one
        const fullRelNew = toFullRelative(nextRel);
        if (!window.electron?.ipcRenderer?.createSetupFile) {
          alert(
            'Create operation is not available. Please implement createSetupFile in main/preload.',
          );
          return;
        }
        const res = await window.electron.ipcRenderer.createSetupFile(
          fullRelNew,
          editorValue,
        );
        if (!res.ok) throw new Error(res.error || 'Save as new failed');

        // add new file to list if missing
        setSetupFiles((prev) =>
          prev.includes(fullRelNew) ? prev : [...prev, fullRelNew],
        );
        // select the new file and update state
        setSelectedRelFile(nextRel);
        setEditFilename(getBaseName(nextRel));
        setPreview(editorValue);
        setIsEditing(false);
      }
    } catch (e) {
      console.error(e);
      alert('Failed to save setup.');
    }
  };

  // Deselect editor when car/track changes
  useEffect(() => {
    setSelectedRelFile('');
    setPreview('');
    setEditorValue('');
    setIsEditing(false);
  }, [selectedCar, selectedTrack]);

  return (
    <div className="browse-page">
      <h2 className="section-title">Browse ACC Setups</h2>

      {/* Filters */}
      <div className="filters">
        <div className="filter-card">
          <label htmlFor="car-select" className="filter-label">
            Car
          </label>
          <select
            id="car-select"
            className="form-select"
            value={selectedCar}
            onChange={(e) => setSelectedCar(e.target.value)}
            disabled={loading || cars.length === 0}
            aria-label="Car"
          >
            {cars.length === 0 && <option value="">No cars found</option>}
            {cars.map((car) => (
              <option key={car} value={car}>
                {car}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-card">
          <label htmlFor="track-select" className="filter-label">
            Track
          </label>
          <select
            id="track-select"
            className="form-select"
            value={selectedTrack}
            onChange={(e) => setSelectedTrack(e.target.value)}
            disabled={loading || !selectedCar || tracks.length === 0}
            aria-labelledby="track-select-label"
          >
            {tracks.length === 0 && <option value="">No tracks found</option>}
            {tracks.map((track) => (
              <option key={track} value={track}>
                {track}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading && <p className="muted-text">Loading setups...</p>}
      {error && <p className="error-text">{error}</p>}

      {!loading && !error && (
        <div className="results-card">
          <div className="results-header">
            <strong>
              {selectedCar || 'No car'}{' '}
              {selectedTrack ? `• ${selectedTrack}` : ''}
            </strong>
            <span className="muted-text">
              {filteredSetups.length}
              {filteredSetups.length !== visibleSetups.length
                ? ` of ${visibleSetups.length}`
                : ''}{' '}
              setup{filteredSetups.length === 1 ? '' : 's'}
            </span>
          </div>

          {/* Search */}
          <div className="search-row">
            <div className="search-input-wrap">
              <input
                type="text"
                className="search-input"
                placeholder="Search setups..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Search setups"
              />
              {searchQuery && (
                <button
                  type="button"
                  className="icon-button clear"
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear search"
                  title="Clear search"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Empty states */}
          {(!selectedCar || !selectedTrack) && (
            <p className="muted-text">Select a car and track to view setups.</p>
          )}
          {selectedCar && selectedTrack && filteredSetups.length === 0 && (
            <p className="muted-text">No setups found for this selection.</p>
          )}

          {/* Content: list (left) + preview/editor (right) inside results-card */}
          {selectedCar && selectedTrack && filteredSetups.length > 0 && (
            <div className="results-content">
              <div className={`list-pane${!selectedRelFile ? ' full' : ''}`}>
                <div className="setup-scroll">
                  <ul className="setup-list">
                    {filteredSetups.map((relPath) => (
                      <li
                        key={relPath}
                        className={
                          'setup-item' +
                          (selectedRelFile === relPath ? ' selected' : '')
                        }
                        title={relPath}
                      >
                        <span className="setup-name">{relPath}</span>
                        <div className="setup-item-actions">
                          <button
                            type="button"
                            className="icon-button"
                            onClick={() => onCopy(relPath)}
                            title="Copy JSON to clipboard"
                            aria-label={`Copy ${relPath}`}
                          >
                            <svg
                              viewBox="0 0 24 24"
                              fill="currentColor"
                              aria-hidden="true"
                            >
                              <path d="M16 1H4c-1.1 0-2 .9-2 2v12h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z" />
                            </svg>
                          </button>

                          {/* Reveal in Explorer */}
                          <button
                            type="button"
                            className="icon-button"
                            onClick={() => onReveal(relPath)}
                            title="Reveal in Explorer"
                            aria-label={`Reveal ${relPath} in Explorer`}
                          >
                            {/* folder icon */}
                            <svg
                              viewBox="0 0 24 24"
                              fill="currentColor"
                              aria-hidden="true"
                            >
                              <path d="M10 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-8l-2-2z" />
                            </svg>
                          </button>

                          <button
                            type="button"
                            className="icon-button delete"
                            onClick={() => onDelete(relPath)}
                            title="Delete setup"
                            aria-label={`Delete ${relPath}`}
                          >
                            <svg
                              viewBox="0 0 24 24"
                              fill="currentColor"
                              aria-hidden="true"
                            >
                              <path d="M6 7h12v14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V7zm3-4h6l1 2h4v2H2V5h4l1-2zm1 8h2v8h-2v-8zm4 0h2v8h-2v-8z" />
                            </svg>
                          </button>
                          <button
                            type="button"
                            className="icon-button"
                            onClick={() => openPreview(relPath)}
                            title="Preview setup"
                            aria-label={`Preview ${relPath}`}
                          >
                            <svg
                              viewBox="0 0 24 24"
                              fill="currentColor"
                              aria-hidden="true"
                            >
                              <path d="M12 5c-7 0-11 7-11 7s4 7 11 7 11-7 11-7-4-7-11-7zm0 12a5 5 0 1 1 0-10 5 5 0 0 1 0 10zm0-8a3 3 0 1 0 .001 6.001A3 3 0 0 0 12 9z" />
                            </svg>
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {selectedRelFile && (
                <div className="editor-pane in-card">
                  <div className="editor-header">
                    <div className="editor-filename">
                      {isEditing ? (
                        <>
                          <input
                            type="text"
                            className="filename-input"
                            value={editFilename}
                            onChange={(e) => setEditFilename(e.target.value)}
                            onKeyDown={(e) => {
                              if (
                                e.key === 'Enter' &&
                                isJsonValid &&
                                sanitizeFilename(editFilename || '')
                              ) {
                                saveEdit();
                              }
                            }}
                            placeholder="filename.json"
                            aria-label="Setup filename"
                          />
                          <div className="filename-hint">
                            {ensureJsonExt(
                              sanitizeFilename(editFilename || ''),
                            ) === getBaseName(selectedRelFile)
                              ? 'Saving will override this setup (confirmation required).'
                              : `Saving will create a new file: ${
                                  getDir(selectedRelFile)
                                    ? `${getDir(selectedRelFile)}/`
                                    : ''
                                }${ensureJsonExt(sanitizeFilename(editFilename || ''))}`}
                          </div>
                        </>
                      ) : (
                        `${selectedCar}/${selectedTrack}/${selectedRelFile}`
                      )}
                    </div>
                    <div className="editor-actions">
                      {isEditing ? (
                        <>
                          <button
                            type="button"
                            className="icon-button primary"
                            onClick={saveEdit}
                            disabled={
                              !isJsonValid ||
                              !sanitizeFilename(editFilename || '')
                            }
                            title="Save"
                            aria-label="Save"
                          >
                            <svg
                              viewBox="0 0 24 24"
                              fill="currentColor"
                              aria-hidden="true"
                            >
                              <path d="M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                            </svg>
                          </button>
                          <button
                            type="button"
                            className="icon-button"
                            onClick={cancelEdit}
                            title="Cancel editing"
                            aria-label="Cancel editing"
                          >
                            <svg
                              viewBox="0 0 24 24"
                              fill="currentColor"
                              aria-hidden="true"
                            >
                              <path d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z" />
                            </svg>
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          className="icon-button"
                          onClick={enableEdit}
                          disabled={!selectedRelFile}
                          title={
                            selectedRelFile
                              ? 'Enable editing'
                              : 'Preview a setup first'
                          }
                          aria-label="Enable editing"
                        >
                          <svg
                            viewBox="0 0 24 24"
                            fill="currentColor"
                            aria-hidden="true"
                          >
                            <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1.003 1.003 0 0 0 0-1.42l-2.34-2.34a1.003 1.003 0 0 0-1.42 0l-1.83 1.83 3.75 3.75 1.84-1.82z" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="editor-container">
                    {loadingPreview ? (
                      <p className="muted-text">Loading preview...</p>
                    ) : isEditing ? (
                      <textarea
                        className="editor-textarea"
                        value={editorValue}
                        onChange={(e) => setEditorValue(e.target.value)}
                        readOnly={!isEditing}
                        spellCheck={false}
                        aria-label="Setup JSON editor"
                      />
                    ) : (
                      <div
                        className="editor-preview"
                        role="region"
                        aria-label="Setup JSON preview"
                      >
                        {previewPretty}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
