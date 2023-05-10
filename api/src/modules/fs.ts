import fetch from 'node-fetch';
import { FsFunctionalities } from 'awayto/core';

const {
  FS_HOST,
  FS_PORT
} = process.env;

export const saveFile: FsFunctionalities['saveFile'] = async function (buffer) {
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

export const putFile: FsFunctionalities['putFile'] = async function ({ id, expiration, mimeType, name }) {
  try {
    const response = await fetch(`http://${FS_HOST}:${FS_PORT}/file/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Disposition': `attachment; filename="${name}"`,
        'Content-Type': mimeType,
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

export const getFile: FsFunctionalities['getFile'] = async function (id) {
  const response = await fetch(`http://${FS_HOST}:${FS_PORT}/file/${id}`);
  const file = await response.text();
  return file;
}




// console.log('saving file');
// const fileId = await saveFile('this_file_is_deleted_30_seconds_later', dayjs().add(dayjs.duration({ seconds: 30 })))

// console.log({ FILEID: fileId })

// if (fileId) {
//   const fileBody = await getFile(fileId);
//   console.log({ FILEBODY: fileBody })

//   setTimeout(() => {
//     async function go() {
//       if (fileId) {
//         const newFileBody = await getFile(fileId);
//         console.log({ LATERONFILE: newFileBody })
//       }
//     }
//     void go();
//   }, 90000)
// }
