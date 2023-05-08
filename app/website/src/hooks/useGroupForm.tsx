import React, { useContext, useMemo, useState, useEffect } from 'react';

import { IForm, deepClone } from 'awayto/core';
import { useComponents } from './useComponents';
import { sh } from './store';
import { useContexts } from './useContexts';

type UseGroupFormResponse = {
  form?: IForm,
  comp: () => JSX.Element,
  valid: boolean
};

export function useGroupForm(id = ''): UseGroupFormResponse {

  const { group } = useContext(useContexts().GroupContext) as GroupContextType;
  const { FormDisplay } = useComponents();

  const [form, setForm] = useState<IForm | undefined>();
  const [forms, setForms] = useState<Map<string, IForm>>(new Map());

  const { data: formTemplate } = sh.useGetGroupFormByIdQuery({ groupName: group.name, formId: id }, { skip: !group.name || !id || forms.has(id) });

  useEffect(() => {
    if (formTemplate) {
      setForms(new Map([ ...forms, [id, deepClone(formTemplate) ] ]));
    }
  }, [formTemplate]);

  useEffect(() => {
    if (!id || !forms.has(id)) {
      setForm(undefined);
    } else if (id && !form) {
      setForm(forms.get(id));
    }
  }, [id, forms, form]);

  const valid = useMemo(() => {
    let v = true;
    if (form) {
      for (const rowId of Object.keys(form.version?.form || {})) {
        form.version.form[rowId].forEach((field, i, arr) => {
          if (field.r && form.version.submission && [undefined, ''].includes(form.version.submission[rowId][i])) {
            v = false;
            arr.length = i + 1;
          }
        })
      }
    }
    return v;
  }, [form]);

  return {
    form,
    comp: !form ? (() => <></>) : () => <FormDisplay form={form} setForm={setForm} />,
    valid
  }
}