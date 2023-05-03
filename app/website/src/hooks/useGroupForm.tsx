import React, { useState } from 'react';

import { IForm } from 'awayto/core';
import { IBaseComponent, useComponents } from './useComponents';
import { useAccordion } from './useAccordion';
import { sh } from './store';

export function useGroupForm(label: string, id: string): [IForm, React.LazyExoticComponent<IBaseComponent> | (() => JSX.Element)] {
  console.log({ label, id })

  const { FormDisplay } = useComponents();

  const [form, setForm] = useState({} as IForm);

  const { data: formTemplate } = sh.useGetFormByIdQuery({ id }, { skip: !id });

  if (formTemplate && !Object.keys(form).length) {
    setForm(formTemplate);
  }
  
  return [form, !label || !id || !formTemplate ? (() => <></>) : useAccordion(label, <FormDisplay form={form} setForm={setForm} />)];
}