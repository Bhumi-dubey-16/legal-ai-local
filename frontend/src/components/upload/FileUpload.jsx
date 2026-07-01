import { useState } from 'react';
import { uploadDocument } from '../../api/client';
import { UploadCloud } from 'lucide-react';

export default function FileUpload({ onUploaded }) {
  const [uploading, setUploading] = useState(false);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const doc = await uploadDocument(file);
      onUploaded(doc);
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="relative border border-dashed border-line rounded-lg p-4 text-center hover:bg-line/20 transition-colors">
      <input
        type="file"
        onChange={handleFileChange}
        disabled={uploading}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
      />
      <div className="flex flex-col items-center justify-center gap-1.5">
        <UploadCloud size={18} className="text-slate" />
        <p className="text-xs text-ink-soft">
          {uploading ? 'Ingesting document...' : 'Click or drag files here'}
        </p>
      </div>
    </div>
  );
}