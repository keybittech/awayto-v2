import React from 'react';

import TextField, { TextFieldProps } from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import CardContent from '@mui/material/CardContent';

import { IField } from 'awayto/core';

type FieldProps = {
  field?: IField;
  editable?: boolean;
  endAdornment?: React.JSX.Element;
};

declare global {
  interface IProps extends FieldProps {}
}

function Field ({ endAdornment, field, editable = false }: IProps): React.JSX.Element {
  if (!field) return <></>;
  let FieldElement: (props: TextFieldProps) => JSX.Element;

  switch (field.t) {
    case 'date':
      FieldElement = TextField;
      break;
    case 'time':
      FieldElement = TextField;
      break;
    case 'text':
      FieldElement = TextField;
      break;
    case 'labelntext':
      FieldElement = () => <Card sx={{ flex: 1 }}>
        <CardHeader title={field.l || 'Label'} variant="h6" />
        <CardContent>{field.x || 'Text'}</CardContent>
      </Card>
      break;
    default:
      FieldElement = () => <></>;
      break;
  }

  return <FieldElement
    fullWidth
    disabled={!editable}
    label={field.l}
    type={field.t}
    helperText={`${field.r ? 'Required. ' : ''}${field.h || ''}`}
    value={String(field.v || '')}
    InputProps={{
      endAdornment
    }}
  />;
}

export default Field;