import type { DeleteObjectResponse, ListObjectsResponse, ListObjectsParams } from '../types';

export interface DeleteObjectParams {
  apiEndpoint: string;
  apiKey: string;
  key: string;
}

export async function deleteObject(params: DeleteObjectParams): Promise<DeleteObjectResponse> {
  const { apiEndpoint, apiKey, key } = params;

  const response = await fetch(`${apiEndpoint}/objects`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      'X-Api-Key': apiKey,
    },
    body: JSON.stringify({ key }),
  });

  if (!response.ok) {
    throw new Error(`Failed to delete object: ${response.status}`);
  }

  return response.json();
}

export async function listObjects(params: ListObjectsParams): Promise<ListObjectsResponse> {
  const { apiEndpoint, apiKey, projectCode, ownerKey, folder, limit, cursor, includeTags } = params;

  const searchParams = new URLSearchParams();
  searchParams.set('projectCode', projectCode);
  if (ownerKey) searchParams.set('ownerKey', ownerKey);
  if (folder) searchParams.set('folder', folder);
  if (limit) searchParams.set('limit', String(limit));
  if (cursor) searchParams.set('cursor', cursor);
  if (includeTags) searchParams.set('includeTags', 'true');

  const response = await fetch(`${apiEndpoint}/objects?${searchParams.toString()}`, {
    method: 'GET',
    headers: {
      'X-Api-Key': apiKey,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to list objects: ${response.status}`);
  }

  return response.json();
}
