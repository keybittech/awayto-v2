import fetch from 'node-fetch';
import { FsFunctionalities } from 'awayto/core';

const {
  FS_HOST,
  FS_PORT
} = process.env;

export const saveFile: FsFunctionalities['saveFile'] = async buffer => {
  try {
    const response = await fetch(`http://${FS_HOST}:${FS_PORT}/file`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Length': buffer.byteLength.toString()
      },
      body: Buffer.from(buffer)
    });
  
    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }
  
    const id = await response.text();
    return id;
  } catch (error) {
    console.error('Error during saveFile:', error);
  }
};

export const putFile: FsFunctionalities['putFile'] = async ({ id, expiration, name }) => {
  try {
    const response = await fetch(`http://${FS_HOST}:${FS_PORT}/file/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Disposition': `attachment; filename="${name}"`,
        'Expires-At': expiration.format('YYYY-MM-DD HH:mm:ss')
      }
    });
  
    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }
  } catch (error) {
    console.error('Error during putFile:', error);
  }
}

export const getFile: FsFunctionalities['getFile'] = async id => {
  const response = await fetch(`http://${FS_HOST}:${FS_PORT}/file/${id}`);
  const buffer = await response.arrayBuffer();
  const contentDisposition = response.headers.get('Content-Disposition');
  return { buffer, name: contentDisposition ? contentDisposition.split(';')[1].split('=')[1].replace(/"/g, '') : '' };
}
