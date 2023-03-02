import React from 'react';
import { IField } from 'awayto';
import TextField, { TextFieldProps } from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { DateTimeFormatter, LocalDate, LocalTime } from '@js-joda/core';

type FieldProps = {
  field?: IField;
  editable?: boolean;
};

declare global {
  interface IProps extends FieldProps {}
}

function Field ({ field, editable = false }: IProps): JSX.Element {
  if (!field) return <></>;
  let FieldElement: (props: TextFieldProps) => JSX.Element;
  let value = String(field.v || '');

  switch (field.t) {
    case 'date':
      value = (value ? LocalDate.parse(value) : LocalDate.now()).format(DateTimeFormatter.ofPattern("yyyy-MM-dd"));
      FieldElement = TextField;
      break;
    case 'time':
      value = (value ? LocalTime.parse(value) : LocalTime.now()).format(DateTimeFormatter.ofPattern("HH:mm"));
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
    value={value}
  />;
}

export default Field;