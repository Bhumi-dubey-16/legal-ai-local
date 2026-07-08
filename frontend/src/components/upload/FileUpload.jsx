import { useState, useRef } from 'react';
import { Upload, File, Loader2, AlertCircle } from 'lucide-react';

export default function FileUpload({ onUploaded }) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileProcess = async (file) => {
    if (!file) return;

    const validExtensions = /\.(pdf|docx|png|jpe?g)$/i;
    if (!validExtensions.test(file.name)) {
      setError('Only PDF, DOCX, PNG, and JPG files are supported in this local offline build.');
      return;
    }

    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('http://127.0.0.1:8000/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed with status code ${response.status}`);
      }

      const data = await response.json();

      if (onUploaded) {
        onUploaded({
          doc_id: data.doc_id,
          name: data.filename
        });
      }
    } catch (err) {
      console.error(err);
      setError('Could not connect to local AI backend. Is the Python server running?');
    } finally {
      setUploading(false);
    }
  };

  const onDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const onDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    handleFileProcess(file);
  };

  return (
    <div className="space-y-2">
      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
          isDragging
            ? 'border-brass bg-brass-soft/20'
            : 'border-line hover:bg-line/20 bg-paper'
        }`}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={(e) => handleFileProcess(e.target.files[0])}
          className="hidden"
          accept=".pdf,.docx,.png,.jpg,.jpeg"
        />

        {uploading ? (
          <div className="flex flex-col items-center justify-center space-y-2 py-2">
            <Loader2 size={20} className="text-brass animate-spin" />
            <p className="text-xs font-medium text-ink">Extracting & indexing text locally...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center space-y-1.5 py-1">
            <Upload size={18} className={isDragging ? 'text-brass' : 'text-slate'} />
            <p className="text-xs text-ink font-medium">Click or drag document here</p>
            <p className="text-[10px] text-slate">PDF, DOCX, PNG, JPG</p>
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-start gap-1.5 p-2.5 bg-risk-high/10 border border-risk-high/20 rounded text-[11px] text-risk-high">
          <AlertCircle size={13} className="mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}