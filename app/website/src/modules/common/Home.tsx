import React, { useState } from 'react';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';

import { useComponents, sh } from 'awayto/hooks';

export function Home(props: IProps): JSX.Element {
  const { BookingHome, GroupHome, QuoteHome, PendingQuotesProvider } = useComponents();

  const [postFileContents] = sh.usePostFileContentsMutation();
  const [file, setFile] = useState<File | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files && event.target.files[0];
    setFile(selectedFile);
  };

  const handleUpload = () => {
    if (file) {
      file.arrayBuffer().then(arrayBuffer => {
        postFileContents(arrayBuffer).then(id => {
          console.log({ someID: id });
        }).catch(console.error);
      }).catch(console.error);
    }
  };

  return (
    <>
      <Box mb={2}>
        <input type="file" onChange={handleFileChange} />
        <Button onClick={handleUpload} disabled={!file}>
          Upload File
        </Button>
      </Box>
      <Box mb={2}>
        <BookingHome {...props} />
      </Box>
      <Box mb={2}>
        <GroupHome {...props} />
      </Box>
      <Box mb={2}>
        <PendingQuotesProvider>
          <QuoteHome {...props} />
        </PendingQuotesProvider>
      </Box>
    </>
  );
}

export default Home;
