import React, { useMemo } from 'react';

import TextField, { TextFieldProps } from '@mui/material/TextField';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import CardContent from '@mui/material/CardContent';

import { dayjs, IField } from 'awayto/core';

type FieldProps = {
  field?: IField;
  defaultDisplay?: boolean;
  editable?: boolean;
  endAdornment?: React.JSX.Element;
};

declare global {
  interface IProps extends FieldProps {}
}

function Field ({ endAdornment, defaultDisplay, field, editable = false }: IProps): React.JSX.Element {
  if (!field) return <></>;

  const FieldElement: (props: TextFieldProps) => JSX.Element = useMemo(() => {
    switch (field.t) {
      case 'date':
      case 'time':
      case 'text':
        return TextField;
      case 'labelntext':
        return () => <Card sx={{ flex: 1 }}>
          <CardHeader title={field.l || 'Label'} variant="h6" />
          <CardContent>{field.x || 'Text'}</CardContent>
        </Card>
      default:
        return () => <></>;
    }
  }, [field]);

  const defaultValue = useMemo(() => {
    switch (field.t) {
      case 'date':
      case 'time':
        return dayjs().format('YYYY-MM-DD');
      default:
        return defaultDisplay ? ' ' : '';
    }
  }, [field]);

  return <FieldElement
    fullWidth
    disabled={!editable}
    label={field.l}
    type={field.t}
    helperText={`${field.r ? 'Required. ' : ''}${field.h || ''}`}
    value={field.v ? field.v : defaultValue}
    InputProps={{
      endAdornment
    }}
  />;
}

export default Field;
