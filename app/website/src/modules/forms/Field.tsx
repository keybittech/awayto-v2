import React from 'react';
import { IField } from 'awayto/core';
import TextField, { TextFieldProps } from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

type FieldProps = {
  field?: IField;
  editable?: boolean;
};

declare global {
  interface IProps extends FieldProps {}
}

function Field ({ field, editable = false }: IProps): React.JSX.Element {
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
      FieldElement = () => <>
        <Typography variant="h6">{field.l || 'Label'}</Typography>
        <Typography variant="caption">{field.x || 'Text'}</Typography>
      </>
      break;
    default:
      FieldElement = () => <></>;
      break;
  }

  return <FieldElement
    fullWidth
    disabled={!editable}
    label={field.l || 'Click to edit.'}
    type={field.t}
    helperText={`${field.r ? 'Required. ' : ''}${field.h || ''}`}
    value={String(field.v || '')}
  />;
}

export default Field;