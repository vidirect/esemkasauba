/**
 * Service to handle Google Drive API operations
 */

export interface DriveUploadResponse {
  id: string;
  name: string;
  webViewLink: string;
}

export async function uploadToDrive(file: File): Promise<DriveUploadResponse> {
  const token = localStorage.getItem('google_drive_token');
  
  if (!token) {
    throw new Error('Google Drive access token not found. Please sign in again.');
  }

  // 1. Metadata for the file
  const metadata = {
    name: file.name,
    mimeType: file.type,
  };

  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  form.append('file', file);

  // 2. Upload file to Google Drive
  const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: form,
  });

  if (!response.ok) {
    const errorData = await response.json();
    if (response.status === 401) {
      localStorage.removeItem('google_drive_token');
      throw new Error('Sesi Google Drive telah berakhir. Silakan login ulang.');
    }
    throw new Error(errorData.error?.message || 'Gagal mengunggah ke Google Drive');
  }

  const result = await response.json();

  // 3. Set permissions to "anyone with the link" (view only)
  // Note: This requires another API call
  try {
    await fetch(`https://www.googleapis.com/drive/v3/files/${result.id}/permissions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        role: 'reader',
        type: 'anyone',
      }),
    });
  } catch (e) {
    console.warn('Could not set file permissions, the link might not be public:', e);
  }

  return result;
}
