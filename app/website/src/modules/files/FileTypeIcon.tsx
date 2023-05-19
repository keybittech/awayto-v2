import React from 'react';

import Tooltip from '@mui/material/Tooltip';

import TextFieldsIcon from '@mui/icons-material/TextFields';
import HelpCenterIcon from '@mui/icons-material/HelpCenter';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';

import { MimeTypes } from 'awayto/core';

declare global {
  interface IProps {
    fileType?: string;
  }
}

export function FileTypeIcon({ fileType }: IProps): React.JSX.Element {
  switch (fileType) {
    case MimeTypes.PLAIN_TEXT:
      return <Tooltip title="Plain Text" children={<TextFieldsIcon />} />;
    case MimeTypes.PDF:
      return <Tooltip title="PDF" children={<PictureAsPdfIcon />} />;
    default:
      return <HelpCenterIcon />;
  }
}

export default FileTypeIcon;