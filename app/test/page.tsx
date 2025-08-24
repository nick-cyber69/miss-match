'use client';

import { useState } from 'react';

export default function TestPage() {
  const [message, setMessage] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setMessage('Uploading...');
    setImageUrl('');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/test-upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      
      if (data.success) {
        setMessage('✅ Upload successful!');
        setImageUrl(data.url);
      } else {
        setMessage('❌ Error: ' + data.error);
      }
    } catch (error) {
      setMessage('❌ Upload failed');
    }
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Test Image Upload</h1>
      
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="mb-4"
        />
        
        <p className="text-sm text-gray-600">Choose an image to upload</p>
      </div>
      
      {message && (
        <div className={`mt-4 p-4 rounded ${message.includes('✅') ? 'bg-green-100' : 'bg-red-100'}`}>
          {message}
        </div>
      )}
      
      {imageUrl && (
        <div className="mt-4">
          <p className="font-semibold mb-2">Uploaded Image:</p>
          <img src={imageUrl} alt="Uploaded" className="max-w-full h-auto rounded" />
        </div>
      )}
    </div>
  );
}
