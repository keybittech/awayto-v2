import React, { useMemo, useState } from 'react';

import { IForm } from 'awayto/core';
import { IBaseComponent, useComponents } from './useComponents';
import { useAccordion } from './useAccordion';
import { sh } from './store';

type UseGroupFormResponse = {
  form: IForm,
  comp: React.LazyExoticComponent<IBaseComponent> | (() => JSX.Element),
  valid: boolean
};

export function useGroupForm(label: string, id: string): UseGroupFormResponse {

  const { FormDisplay } = useComponents();

  const [form, setForm] = useState({} as IForm);

  const valid = useMemo(() => {
    let v = true;
    for (const rowId of Object.keys(form.version?.form || {})) {
      for (const i in form.version.form[rowId]) {
        const field = form.version.form[rowId][i];
        if (field.r && [undefined, ''].includes(form.version.submission[rowId][i])) {
          v = false;
          break;
        }
      }
    }
    return v;
  }, [form]);

  const { data: formTemplate } = sh.useGetFormByIdQuery({ id }, { skip: !id });

  if (formTemplate && !Object.keys(form).length) {
    setForm(formTemplate);
  }
  
  return {
    form,
    comp: !label || !id || !formTemplate ? (() => <></>) : useAccordion(label, <FormDisplay form={form} setForm={setForm} />),
    valid
  }
}