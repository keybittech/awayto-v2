import fetch from 'node-fetch';
import dayjs from 'dayjs';

const {
  FS_HOST,
  FS_PORT
} = process.env;

export async function saveFile(body: ArrayBuffer, expiration: dayjs.Dayjs): Promise<string | undefined> {

  try {
    const response = await fetch(`http://${FS_HOST}:${FS_PORT}/file`, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain',
        'Content-Length': body.byteLength.toString(),
        'Expires-At': expiration.format('YYYY-MM-DD HH:mm:ss')
      },
      body: Buffer.from(body)
    });
  
    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }
  
    const id = await response.text();
    return id;
  } catch (error) {
    console.error('Error during saveFile:', error);
  }
}

export async function getFile(id: string): Promise<string> {
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
