import { Extend, Void } from '../util';
import { ApiHandler, ApiOptions, buildUpdate, EndpointType, siteApiHandlerRef, siteApiRef } from './api';
import { utcNowString } from './time_unit';

/**
 * @category Form
 * @purpose models the shape of a single field on a Form
 */
export type IField = Record<string, string | boolean> & {
  i?: string; // id
  l: string; // label
  v?: string; // value
  h?: string; // helperText
  x?: string; // text
  t?: string; // input type
  d?: string; // defaultValue
  r?: boolean; // required
};

/**
 * @category Form
 * @purpose contains all Fields in all rows of a Form
 */
export type IFormTemplate = Record<string, IField[]>;

/**
 * @category Form
 * @purpose used during Quote submission to record the actual values users typed into the Form
 */
export type IFormSubmission = Record<string, string[]>;

/**
 * @category Form
 * @purpose container for specific Form Versions that are submitting during a Quote request
 */
export type IFormVersionSubmission = {
  id?: string;
  formVersionId: string;
  submission: IFormSubmission;
};

/**
 * @category Form
 * @purpose tracks the different versions of Forms throughout their history
 */
export type IFormVersion = {
  id: string;
  formId: string;
  form: IFormTemplate;
  submission: IFormSubmission;
  createdOn: string;
  createdSub: string;
};

/**
 * @category Form
 * @purpose models the base container of a form that Group users create for Services
 */
export type IForm = {
  id: string;
  name: string;
  version: IFormVersion;
  createdOn: string;
  createdSub: string;
};

/**
 * @category Form
 */
const formApi = {
  postForm: {
    kind: EndpointType.MUTATION,
    url: 'forms',
    method: 'POST',
    opts: {} as ApiOptions,
    queryArg: { name: '' as string, version: {} as IFormVersion },
    resultType: {} as IForm
  },
  postFormVersion: {
    kind: EndpointType.MUTATION,
    url: 'forms/:formId/versions',
    method: 'POST',
    opts: {} as ApiOptions,
    queryArg: {  name: '' as string, version: {} as IFormVersion },
    resultType: {} as IFormVersion
  },
  putForm: {
    kind: EndpointType.MUTATION,
    url: 'forms',
    method: 'PUT',
    opts: {} as ApiOptions,
    queryArg: { id: '' as string, name: '' as string },
    resultType: { id: '' as string }
  },
  getForms: {
    kind: EndpointType.QUERY,
    url: 'forms',
    method: 'GET',
    opts: {} as ApiOptions,
    queryArg: {} as Void,
    resultType: [] as IForm[]
  },
  getFormById: {
    kind: EndpointType.QUERY,
    url: 'forms/:id',
    method: 'GET',
    opts: {} as ApiOptions,
    queryArg: { id: '' as string },
    resultType: {} as IForm
  },
  deleteForm: {
    kind: EndpointType.MUTATION,
    url: 'forms/:id',
    method: 'DELETE',
    opts: {} as ApiOptions,
    queryArg: { id: '' as string },
    resultType: {} as IForm
  },
  disableForm: {
    kind: EndpointType.MUTATION,
    url: 'forms/:id/disable',
    method: 'PUT',
    opts: {} as ApiOptions,
    queryArg: { id: '' as string },
    resultType: { id: '' as string }
  }
} as const;

/**
 * @category Form
 */
const formApiHandlers: ApiHandler<typeof formApi> = {
  postForm: async (props) => {
    const form = props.event.body;
    const { id: formId } = await props.tx.one<{ id: string }>(`
      INSERT INTO dbtable_schema.forms (name, created_on, created_sub)
      VALUES ($1, $2, $3::uuid)
      RETURNING id
    `, [form.name, utcNowString(), props.event.userSub]);

    return { ...form, id: formId };
  },

  postFormVersion: async (props) => {
    const { version, name } = props.event.body;
    const { formId } = props.event.pathParameters;
    const { id: versionId } = await props.tx.one<{ id: string }>(`
      INSERT INTO dbtable_schema.form_versions (form_id, form, created_on, created_sub)
      VALUES ($1::uuid, $2::jsonb, $3, $4::uuid)
      RETURNING id
    `, [formId, version.form, utcNowString(), props.event.userSub]);

    const updateProps = buildUpdate({
      id: formId,
      name,
      updated_on: utcNowString(),
      updated_sub: props.event.userSub
    });

    await props.tx.none(`
      UPDATE dbtable_schema.forms
      SET ${updateProps.string}
      WHERE id = $1
    `, updateProps.array);

    version.id = versionId;
    version.formId = formId;

    return version;
  },

  putForm: async (props) => {
    const { id, name } = props.event.body;

    const updateProps = buildUpdate({
      id,
      name,
      updated_on: utcNowString(),
      updated_sub: props.event.userSub
    });

    await props.tx.none(`
      UPDATE dbtable_schema.forms
      SET ${updateProps.string}
      WHERE id = $1
    `, updateProps.array);

    return { id };
  },

  getForms: async (props) => {
    const form = await props.db.manyOrNone<IForm>(`
      SELECT * FROM dbview_schema.enabled_forms
    `);
    return form;
  },

  getFormById: async (props) => {
    const { id } = props.event.pathParameters;
    const form = await props.db.one<IForm>(`
      SELECT * FROM dbview_schema.enabled_forms
      WHERE id = $1
    `, [id]);

    return form;
  },
  deleteForm: async (props) => {
    try {
      const { id } = props.event.pathParameters;
      await props.tx.none(`
        DELETE FROM dbtable_schema.forms
        WHERE id = $1
      `, [id]);

      return { id };

    } catch (error) {
      throw error;
    }
  },

  disableForm: async (props) => {
    try {
      const { id } = props.event.pathParameters;

      await props.tx.none(`
        UPDATE dbtable_schema.forms
        SET enabled = false, updated_on = $2, updated_sub = $3
        WHERE id = $1
      `, [id, utcNowString(), props.event.userSub]);

      return { id };
    } catch (error) {
      throw error;
    }
  }
} as const;

/**
 * @category Form
 */
type FormApi = typeof formApi;

/**
 * @category Form
 */
type FormApiHandler = typeof formApiHandlers;

declare module './api' {
  interface SiteApiRef extends Extend<FormApi> { }
  interface SiteApiHandlerRef extends Extend<FormApiHandler> { }
}

Object.assign(siteApiRef, formApi);
Object.assign(siteApiHandlerRef, formApiHandlers);