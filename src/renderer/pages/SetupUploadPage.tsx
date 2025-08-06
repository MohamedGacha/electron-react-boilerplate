import React, { useEffect, useRef, useState } from 'react';
import './SetupUploadPage.css';
import validateSetupJson from '../utils/validateSetup';

function SetupUploadPage() {
  const [fileName, setFileName] = useState<string | null>(null);
  const [renameFileName, setRenameFileName] = useState<string>('');
  const [trackName, setTrackName] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [trackSuggestions, setTrackSuggestions] = useState<string[]>([]);
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    window.electron.ipcRenderer.sendMessage('ipc-example', ['get-track-names']);
    window.electron.ipcRenderer.once('ipc-example', (...args: unknown[]) => {
      const tracks = Array.isArray(args[0]) ? args[0] : [];
      setTrackSuggestions(tracks);
    });
  }, []);

  const handleTrackNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMessage(null);
    setSuccessMessage(null);
    const value = e.target.value.replace(/\s/g, '');
    setTrackName(value);

    if (value.length > 0) {
      const filtered = trackSuggestions.filter((track) =>
        track.toLowerCase().includes(value.toLowerCase()),
      );
      setFilteredSuggestions(filtered);
      setShowSuggestions(true);
    } else {
      setFilteredSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setTrackName(suggestion);
    setShowSuggestions(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMessage(null);
    setSuccessMessage(null);
    const file = e.target.files?.[0];
    if (file) {
      if (file.name.toLowerCase().endsWith('.json')) {
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const json = JSON.parse(event.target?.result as string);
            const validationError = validateSetupJson(json);
            if (validationError) {
              setErrorMessage('Not a valid setup');
              setFileName(null);
              setRenameFileName('');
              e.target.value = '';
            } else {
              setFileName(file.name);
              // Remove .json extension for rename field
              const baseName = file.name.replace(/\.json$/i, '');
              setRenameFileName(baseName);
            }
          } catch {
            setErrorMessage('Not a valid setup');
            setFileName(null);
            setRenameFileName('');
            e.target.value = '';
          }
        };
        reader.readAsText(file);
      } else {
        setErrorMessage('Please upload a JSON file.');
        setRenameFileName('');
        e.target.value = '';
      }
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      if (file.name.toLowerCase().endsWith('.json')) {
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const json = JSON.parse(event.target?.result as string);
            const validationError = validateSetupJson(json);
            if (validationError) {
              setErrorMessage('Not a valid setup');
              setFileName(null);
              setRenameFileName('');
              if (fileInputRef.current) fileInputRef.current.value = '';
            } else {
              setFileName(file.name);
              // Remove .json extension for rename field
              const baseName = file.name.replace(/\.json$/i, '');
              setRenameFileName(baseName);
              if (fileInputRef.current) fileInputRef.current.value = '';
            }
          } catch {
            setErrorMessage('Not a valid setup');
            setFileName(null);
            setRenameFileName('');
            if (fileInputRef.current) fileInputRef.current.value = '';
          }
        };
        reader.readAsText(file);
      } else {
        setErrorMessage('Please upload a JSON file.');
        setRenameFileName('');
      }
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleBoxClick = () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    fileInputRef.current?.click();
  };

  const handleRenameFileNameChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setRenameFileName(e.target.value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    if (!fileName) {
      setErrorMessage('Please upload a JSON file.');
      return;
    }
    if (!trackName) {
      setErrorMessage('Please enter a track name.');
      return;
    }
    if (!renameFileName || /[\\/:*?"<>|]/.test(renameFileName)) {
      setErrorMessage(
        'Renamed file must not be empty or contain invalid characters',
      );
      return;
    }

    // Read the uploaded file again to get car name
    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      setErrorMessage('File not found.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        const carName =
          json.CarName || json.carName || json.car || 'UnknownCar';
        const finalFileName = `${renameFileName}.json`;

        // Send IPC message to main process to save the file
        window.electron.ipcRenderer.sendMessage('save-setup-file', {
          carName,
          trackName,
          fileName: finalFileName,
          fileContent: event.target?.result as string,
        });

        // Listen for the saved file path from main process
        window.electron.ipcRenderer.once(
          'setup-file-saved',
          (savedPath: string) => {
            console.log('Setup file saved at:', savedPath);
            setSuccessMessage(
              `Submitted: ${finalFileName} with track name "${trackName}" for car "${carName}". Saved at: ${savedPath}`,
            );
          },
        );
      } catch {
        setErrorMessage('Not a valid setup');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="main-container">
      <h1>GoatSetups</h1>
      <div style={{ marginBottom: '1em', textAlign: 'center' }}>
        <p>
          Easily organize and save your ACC car setups.
          <br />
          Upload, rename, and sort setups by car and track.
        </p>
      </div>
      <div
        className="upload-box"
        role="button"
        tabIndex={0}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onClick={handleBoxClick}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            handleBoxClick();
          }
        }}
        aria-label="Upload JSON file"
      >
        {fileName ? (
          <span className="upload-info">
            Uploaded: {fileName}
            <button
              type="button"
              aria-label="Cancel upload"
              className="cancel-upload-btn"
              onClick={(e) => {
                e.stopPropagation();
                setFileName(null);
                setRenameFileName('');
                if (fileInputRef.current) fileInputRef.current.value = '';
              }}
            >
              ×
            </button>
          </span>
        ) : (
          <span>Import your car setup</span>
        )}
        <input
          type="file"
          accept=".json,application/json"
          ref={fileInputRef}
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
      </div>
      {/* Rename input shown only if a file is uploaded */}
      {fileName && (
        <div style={{ margin: '1em 0' }}>
          <label htmlFor="renameFileName" style={{ width: '100%' }}>
            Rename file (no extension):
            <input
              id="renameFileName"
              type="text"
              value={renameFileName}
              onChange={handleRenameFileNameChange}
              pattern={'^[^\\/:*?"<>|]+$'}
              title="Filename must not contain invalid characters"
              className="track-input"
              autoComplete="off"
              style={{ marginLeft: '0.5em', width: '60%' }}
            />
            <span style={{ marginLeft: '0.5em' }}>.json</span>
          </label>
        </div>
      )}
      {errorMessage && (
        <div
          className="error-message"
          role="alert"
          style={{ color: 'red', marginBottom: '1em' }}
        >
          {errorMessage}
        </div>
      )}
      {successMessage && (
        <div
          className="success-message"
          role="status"
          style={{ color: 'green', marginBottom: '1em' }}
        >
          {successMessage}
        </div>
      )}
      <form onSubmit={handleSubmit} style={{ width: '100%' }}>
        <label htmlFor="trackName" style={{ width: '100%' }}>
          Track Name (no spaces):
          <input
            id="trackName"
            type="text"
            value={trackName}
            onChange={handleTrackNameChange}
            pattern="^\S+$"
            title="No spaces allowed"
            className="track-input"
            autoComplete="off"
            onBlur={() => setTimeout(() => setShowSuggestions(false), 100)}
            onFocus={() => {
              if (trackName.length > 0 && filteredSuggestions.length > 0)
                setShowSuggestions(true);
            }}
          />
          {showSuggestions && filteredSuggestions.length > 0 && (
            <ul className="suggestions-list">
              {filteredSuggestions.map((suggestion) => (
                <button
                  type="button"
                  key={suggestion}
                  onMouseDown={() => handleSuggestionClick(suggestion)}
                  className="suggestion-item"
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    background: 'none',
                    border: 'none',
                    padding: '8px',
                    cursor: 'pointer',
                  }}
                >
                  {suggestion}
                </button>
              ))}
            </ul>
          )}
        </label>
        <button type="submit" className="submit-btn">
          Submit
        </button>
      </form>
    </div>
  );
}

export default SetupUploadPage;
