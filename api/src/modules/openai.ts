
import { ChatCompletionRequestMessage, OpenAIApi } from 'openai';
import logger from './logger';

import { IPrompts } from 'awayto/core';

const openai = new OpenAIApi();
const opts = {
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${process.env.OPENAI_API_KEY as string}`
  }
};

function handleOpenAIError(error: unknown): void {
  const err = error as Error & { field: string };
  console.log('openai error', err.message + ' ' + err.field + ' ' + err.stack);
  logger.log('openai error', err.message);
}

function getSuggestionPrompt(prompt: string) {
  return `Generate 5 ${prompt}; Result is 1-3 words separated by |. Here are some examples: `;
}

function generateExample(prompt: string, result: string = '') {
  return `Phrase: ${prompt}\nResult: ${result}`;
}

const codeGPTPrecursor = 'You are BacktickGPT, providing only typescript code responses wrapped with 3 backticks before and after.';

export function generatePromptHistory(promptId: IPrompts, ...prompts: string[]): ChatCompletionRequestMessage[] {
  const [prompt1, prompt2] = prompts;
  let history: ChatCompletionRequestMessage[] = []

  switch (promptId) {
    case IPrompts.CREATE_API: {
      history = history.concat([
        { role: 'system', content: codeGPTPrecursor },
        { role: 'user', content: 'Generate API type: IDigitalWhiteboard' },
        { role: 'assistant', content: 'type IDigitalWhiteboard = {\n  manufacturer: string;\n  model: string;\n  screenSize: number;\n  resolution: string;\n  touchSensitive: boolean;\n  connectivity: string[];\n  interface: string;}'},
        { role: 'user', content: 'Generate API configuration from type attributes: type IDigitalWhiteboard = {  manufacturer: string;  model: string;  screenSize: number;  resolution: string;  touchSensitive: boolean;  connectivity: string[];  interface: string;}' },
        { role: 'assistant', content: `const digitalWhiteboardApi = {\n  postDigitalWhiteboard: {\n    kind: EndpointType.MUTATION,\n    url: 'digitalwhiteboards',\n    method: 'POST',\n    opts: {} as ApiOptions,\n    queryArg: { manufacturer: string;  model: string; },\n    resultType: {} as IDigitalWhiteboard }\n  },\n  putDigitalWhiteboard: {\n    kind: EndpointType.MUTATION,\n    url: 'digitalwhiteboards',\n    method: 'PUT',\n    opts: {} as ApiOptions,\n    queryArg: {} as IDigitalWhiteboard,\n    resultType: {} as IDigitalWhiteboard\n  },\n  getDigitalWhiteboards: {\n    kind: EndpointType.QUERY,\n    url: 'digitalwhiteboards',\n    method: 'GET',\n    opts: {} as ApiOptions,\n    queryArg: {} as Void,\n    resultType: [] as IDigitalWhiteboard[]\n  },\n  getDigitalWhiteboardById: {\n    kind: EndpointType.QUERY,\n    url: 'digitalwhiteboards/:id',\n    method: 'GET',\n    opts: {} as ApiOptions,\n    queryArg: { id: '' as string },\n    resultType: {} as IDigitalWhiteboard\n  },\n  deleteDigitalWhiteboard: {\n    kind: EndpointType.MUTATION,\n    url: 'digitalwhiteboards/:id',\n    method: 'DELETE',\n    opts: {} as ApiOptions,\n    queryArg: { id: '' as string },\n    resultType: { id : '' as string }\n  },\n  disableDigitalWhiteboard: {\n    kind: EndpointType.MUTATION,\n    url: 'digitalwhiteboards/:id/disable',\n    method: 'PUT',\n    opts: {} as ApiOptions,\n    queryArg: { id: '' as string },\n    resultType: { id: '' as string }\n  }\n} as const;\n`},
        { role: "user", content: 'Generate API configuration from type attributes: ' + prompt1 }
      ]);
      break;
    }
    case IPrompts.CREATE_API_BACKEND: {
      history = history.concat([
        { role: 'system', content: codeGPTPrecursor },
        { role: 'user', content: 'Generate API backend functionality: type IUuidFiles = { id: string; parentUuid: string; fileId: string; } postUuidFile, putUuidFile, getUuidFiles, getUuidFileById, deleteUuidFile, disableUuidFile' },
        { role: 'assistant', content: 'const uuidFilesApiHandlers: ApiHandler<typeof uuidFilesApi> = {\n  postUuidFile: async props => {\n    const { parentUuid: parent_uuid, fileId: file_id } = props.event.body;\n    const { id } = await props.tx.one<IUuidFiles>(`\n      INSERT INTO dbtable_schema.uuid_files (parent_uuid, file_id, created_on, created_sub)\n      VALUES ($1, $2, $3, $4::uuid)\n      RETURNING id\n    `, [parent_uuid, file_id, utcNowString(), props.event.userSub]);\n    \n    return { id };\n  },\n  putUuidFile: async props => {\n    const { id, parentUuid: parent_uuid, fileId: file_id } = props.event.body;\n    const updateProps = buildUpdate({\n      id,\n      parent_uuid,\n      file_id,\n      updated_on: utcNowString(),\n      updated_sub: props.event.userSub\n    });\n    await props.tx.none(`\n      UPDATE dbtable_schema.uuid_files\n      SET ${updateProps.string}\n      WHERE id = $1\n    `, updateProps.array);\n    return { id };\n  },\n  getUuidFiles: async props => {\n    const uuidFiles = await props.db.manyOrNone<IUuidFiles>(`\n      SELECT * FROM dbview_schema.enabled_uuid_files\n    `);\n    \n    return uuidFiles;\n  },\n  getUuidFileById: async props => {\n    const { id } = props.event.pathParameters;\n    const response = await props.db.one<IUuidFiles>(`\n      SELECT * FROM dbview_schema.enabled_uuid_files\n      WHERE id = $1\n    `, [id]);\n    \n    return response;\n  },\n  deleteUuidFile: async props => {\n    const { id } = props.event.pathParameters;\n    await props.tx.none(`\n      DELETE FROM dbtable_schema.uuid_files\n      WHERE id = $1\n    `, [id]);\n    \n    return { id };\n  },\n  disableUuidFile: async props => {\n    const { id, parentUuid: parent_uuid, fileId: file_id } = props.event.body;\n    await props.tx.none(`\n      UPDATE dbtable_schema.uuid_files\n      SET enabled = false, updated_on = $3, updated_sub = $4\n      WHERE parent_uuid = $1 AND file_id = $2\n    `, [parent_uuid, file_id, utcNowString(), props.event.userSub]);\n    return { id };\n  },\n} as const;'},
        { role: "user", content: 'Generate API backend functionality: ' + prompt1 }
      ]);
      break;
    }
    case IPrompts.EDIT_FILE: {
      history = history.concat([
        { role: 'system', content: codeGPTPrecursor },
        { role: 'user', content: 'Extend the given component, while addressing the request: handle input validation and display error messages \n\n###\n\n import { useState } from "react";\n const FormComponent: React.FC = () => {\n   const [email, setEmail] = useState("");\n   const handleSubmit = (e: React.FormEvent) => {\n     e.preventDefault();\n     console.log(email);\n   };\n   return (\n     <form onSubmit={handleSubmit}>\n       <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />\n       <button type="submit">Submit</button>\n     </form>\n   );\n };' },
        { role: 'assistant', content: 'import { useState } from "react";\n const FormComponent: React.FC = () => {\n   const [email, setEmail] = useState(");\n   const [error, setError] = useState(");\n   const handleSubmit = (e: React.FormEvent) => {\n     e.preventDefault();\n     if (email.match(/^\S+@\S+\.\S+$/)) {\n       setError(");\n       console.log(email);\n     } else {\n       setError("Invalid email address");\n     }\n   };\n   return (\n     <form onSubmit={handleSubmit}>\n       <input\n         type="email"\n         value={email}\n         onChange={(e) => setEmail(e.target.value)}\n         className={error ? "error" : "}\n       />\n       {error && <div className="error-message">{error}</div>}\n       <button type="submit">Submit</button>\n     </form>\n   );\n };'},
        { role: 'user', content: 'Extend the given component, while addressing the request: filter and sort the items \n\n###\n\n const ItemList: React.FC<ItemListProps> = ({ items }) => (\n   <ul>\n     {items.map((item) => (\n       <li key={item.id}>{item.name} - ${item.price}</li>\n     ))}\n   </ul>\n );' },
        { role: 'assistant', content: 'import { useState } from "react";\n const ItemList: React.FC<ItemListProps> = ({ items }) => {\n   const [filter, setFilter] = useState(");\n   const [sortBy, setSortBy] = useState<"name" | "price">("name");\n   const filteredItems = items\n     .filter((item) => item.name.toLowerCase().includes(filter.toLowerCase()))\n     .sort((a, b) => a[sortBy] > b[sortBy] ? 1 : -1);\n   return (\n     <>\n       <input value={filter} onChange={(e) => setFilter(e.target.value)} />\n       <select value={sortBy} onChange={(e) => setSortBy(e.target.value as "name" | "price")}>\n         <option value="name">Name</option>\n         <option value="price">Price</option>\n       </select>\n       <ul>\n         {filteredItems.map((item) => (\n           <li key={item.id}>{item.name} - ${item.price}</li>\n         ))}\n       </ul>\n     </>\n   );\n };'},
        { role: "user", content: 'Extend the given component, while addressing the request: ' + prompt1 }
      ]);
    }
  }

  return history;
}

export function generatePrompt(promptId: IPrompts, ...prompts: string[]): string {
  const [prompt1, prompt2] = prompts;
  let generatedPrompt = ``;
  switch (promptId) {
    case IPrompts.CREATE_TYPE:
      generatedPrompt += `
        Complete the following typescript type with 4-7 unconventionally named properties, using string, number or boolean, starting with its opening bracket, "type ${prompt1} =
      `;
      break;
    case IPrompts.CONVERT_PURPOSE:
      generatedPrompt += `
        Complete the following statement: A 50 character maximum passive gerund mission statement for a business named "${prompt1}" with the description of "${prompt2}", could be 
      `;
      break;
    case IPrompts.SUGGEST_ROLE:
      generatedPrompt += `
        ${getSuggestionPrompt(`role names for a group named ${prompt1} which is interested in ${prompt2}`)}
        ${generateExample('role names for a group named writing center which is interested in consulting on writing', 'Tutor|Student|Advisor|Administrator|Consultant')}
        ${generateExample('role names for a group named city maintenance department which is interested in maintaining the facilities in the city', 'Dispatcher|Engineer|Administrator|Technician|Manager')}
        ${generateExample(`role names for a group named "${prompt1}" which is interested in ${prompt2}`)}
      `;
      break;
    case IPrompts.SUGGEST_SERVICE:
      generatedPrompt += `
        ${getSuggestionPrompt(`gerund verbs performed for the purpose of ${prompt1}`)}
        ${generateExample('gerund verbs performed for the purpose of offering educational services to community college students', 'Tutoring|Advising|Consulting|Instruction|Mentoring')}
        ${generateExample('gerund verbs performed for the purpose of providing banking services to the local area', 'Accounting|Financing|Securities|Financial Planning|Investing')}
        ${generateExample(`gerund verbs performed for the purpose of ${prompt1}`)}`;
      break;
    case IPrompts.SUGGEST_TIER:
      generatedPrompt += `
        ${getSuggestionPrompt(`service level names for ${prompt1}`)}
        ${generateExample('service level names for a generic service', 'Small|Medium|Large')}
        ${generateExample('service level names for writing tutoring at a school writing center', 'WRI 1010|WRI 1020|WRI 2010|WRI 2020|WRI 3010')}
        ${generateExample('service level names for streaming at a web media platform', 'Basic|Standard|Premium')}
        ${generateExample('service level names for advising at a school learning center', 'ENG 1010|WRI 1010|MAT 1010|SCI 1010|HIS 1010')}
        ${generateExample('service level names for travelling on an airline service', 'Economy|Business|First Class')}
        ${generateExample('service level names for reading tutoring at a school reading center', 'ESL 900|ESL 990|ENG 1010|ENG 1020|ENG 2010')}
        ${generateExample(`service level names for ${prompt1}`)}`;
      break;
    case IPrompts.SUGGEST_FEATURE:
      generatedPrompt += `
        ${getSuggestionPrompt(`features of ${prompt1}`)}
        ${generateExample('features of ENGL 1010 writing tutoring', 'Feedback|Revisions|Brainstorming|Discussion')}
        ${generateExample('features of Standard gym membership', 'Full Gym Equipment|Limited Training|Half-Day Access')}
        ${generateExample('features of Pro web hosting service', 'Unlimited Sites|Unlimited Storage|1TB Bandwidth|Daily Backups')}
        ${generateExample('features of professional photography service', 'Next-Day Prints|High-quality digital photos|Retouching and editing|Choice of location|Choice of outfit changes')}
        ${generateExample(`features of ${prompt1}`)}`;
      break;
    default:
      break;
  }

  return generatedPrompt.replace(/\r?\n|\r-/g, ' ').trim();
}

export async function getChatCompletionPromptFromHistory(history: ChatCompletionRequestMessage[]): Promise<string> {
  try {

    const completion = await openai.createChatCompletion({
      model: 'gpt-3.5-turbo',
      messages: history
    }, opts);

    const result = completion.data.choices.at(0)?.message?.content.trim() || '';

    logger.log('openai chat completion prompt with history', { result });
    console.log('openai chat completion prompt with history', { result });

    return result;
  } catch (error) {
    handleOpenAIError(error);
    throw { reason: 'Could not complete prompt.' }
  }
}

export async function getChatCompletionPrompt(input: string): Promise<string> {
  try {
    const completion = await openai.createChatCompletion({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: "user", content: input }
      ]
    }, opts);

    const result = completion.data.choices.at(0)?.message?.content.trim() || '';
    const prompt = input.split(';')[0];

    logger.log('openai chat completion prompt', { prompt, result });
    console.log('openai chat completion prompt', { prompt, result });

    return result;
  } catch (error) {
    handleOpenAIError(error);
    throw { reason: 'Could not complete prompt.' }
  }
}

export async function getCompletionPrompt(input: string): Promise<string> {
  try {
    const completion = await openai.createCompletion({
      model: 'ada',
      prompt: input,
      max_tokens: 512
    }, opts);

    const result = completion.data.choices.at(0)?.text?.trim().replace(/\r?\n|\r/g, '') || ''
    const prompt = input.split(';')[0];

    logger.log('openai completion prompt', { prompt, result });
    console.log('openai completion prompt', { prompt, result });

    return result;
  } catch (error) {
    handleOpenAIError(error);
    throw { reason: 'Could not complete prompt.' }
  }
}

export async function getModerationCompletion(input: string): Promise<boolean | undefined> {
  try {
    const completion = await openai.createModeration({
      input
    }, opts);

    const result = completion.data.results.at(0)?.flagged;
    const prompt = input.split(';')[0];

    logger.log('openai moderation', { prompt, result });
    console.log('openai moderation', { prompt, result });

    return result;
  } catch (error) {
    handleOpenAIError(error);
    throw { reason: 'Could not complete prompt.' }
  }
}

export default {
  generatePrompt,
  getChatCompletionPrompt,
  getCompletionPrompt,
  getModerationCompletion
}