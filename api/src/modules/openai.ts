
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
        { role: 'user', content: 'Generate API definition: type IDigitalWhiteboard = { manufacturer: string;  model: string;  screenSize: number;  resolution: string;  touchSensitive: boolean;  connectivity: string[];  interface: string;}' },
        { role: 'assistant', content: `const digitalWhiteboardApi = {\n  postDigitalWhiteboard: {\n    kind: EndpointType.MUTATION,\n    url: 'digitalwhiteboards',\n    method: 'POST',\n    opts: {} as ApiOptions,\n    queryArg: { manufacturer: string;  model: string; },\n    resultType: {} as IDigitalWhiteboard }\n  },\n  putDigitalWhiteboard: {\n    kind: EndpointType.MUTATION,\n    url: 'digitalwhiteboards',\n    method: 'PUT',\n    opts: {} as ApiOptions,\n    queryArg: {} as IDigitalWhiteboard,\n    resultType: {} as IDigitalWhiteboard\n  },\n  getDigitalWhiteboards: {\n    kind: EndpointType.QUERY,\n    url: 'digitalwhiteboards',\n    method: 'GET',\n    opts: {} as ApiOptions,\n    queryArg: {} as Void,\n    resultType: [] as IDigitalWhiteboard[]\n  },\n  getDigitalWhiteboardById: {\n    kind: EndpointType.QUERY,\n    url: 'digitalwhiteboards/:id',\n    method: 'GET',\n    opts: {} as ApiOptions,\n    queryArg: { id: '' as string },\n    resultType: {} as IDigitalWhiteboard\n  },\n  deleteDigitalWhiteboard: {\n    kind: EndpointType.MUTATION,\n    url: 'digitalwhiteboards/:id',\n    method: 'DELETE',\n    opts: {} as ApiOptions,\n    queryArg: { id: '' as string },\n    resultType: { id : '' as string }\n  },\n  disableDigitalWhiteboard: {\n    kind: EndpointType.MUTATION,\n    url: 'digitalwhiteboards/:id/disable',\n    method: 'PUT',\n    opts: {} as ApiOptions,\n    queryArg: { id: '' as string },\n    resultType: { id: '' as string }\n  }\n} as const;\n`},
        { role: "user", content: 'Generate API definition: ' + prompt1 }
      ]);
      break;
    }
    case IPrompts.CREATE_API_BACKEND: {
      history = history.concat([
        { role: 'system', content: codeGPTPrecursor },
        { role: 'user', content: 'Generate API method functionality: type IUuidFiles = { id: string; parentUuid: string; fileId: string; } postUuidFile, putUuidFile, getUuidFiles, getUuidFileById, deleteUuidFile, disableUuidFile' },
        { role: 'assistant', content: 'const uuidFilesApiHandlers: ApiHandler<typeof uuidFilesApi> = {\n  postUuidFile: async props => {\n    const { parentUuid: parent_uuid, fileId: file_id } = props.event.body;\n    const { id } = await props.tx.one<IUuidFiles>(`\n      INSERT INTO dbtable_schema.uuid_files (parent_uuid, file_id, created_on, created_sub)\n      VALUES ($1, $2, $3, $4::uuid)\n      RETURNING id\n    `, [parent_uuid, file_id, utcNowString(), props.event.userSub]);\n    \n    return { id };\n  },\n  putUuidFile: async props => {\n    const { id, parentUuid: parent_uuid, fileId: file_id } = props.event.body;\n    const updateProps = buildUpdate({\n      id,\n      parent_uuid,\n      file_id,\n      updated_on: utcNowString(),\n      updated_sub: props.event.userSub\n    });\n    await props.tx.none(`\n      UPDATE dbtable_schema.uuid_files\n      SET ${updateProps.string}\n      WHERE id = $1\n    `, updateProps.array);\n    return { id };\n  },\n  getUuidFiles: async props => {\n    const uuidFiles = await props.db.manyOrNone<IUuidFiles>(`\n      SELECT * FROM dbview_schema.enabled_uuid_files\n    `);\n    \n    return uuidFiles;\n  },\n  getUuidFileById: async props => {\n    const { id } = props.event.pathParameters;\n    const response = await props.db.one<IUuidFiles>(`\n      SELECT * FROM dbview_schema.enabled_uuid_files\n      WHERE id = $1\n    `, [id]);\n    \n    return response;\n  },\n  deleteUuidFile: async props => {\n    const { id } = props.event.pathParameters;\n    await props.tx.none(`\n      DELETE FROM dbtable_schema.uuid_files\n      WHERE id = $1\n    `, [id]);\n    \n    return { id };\n  },\n  disableUuidFile: async props => {\n    const { id, parentUuid: parent_uuid, fileId: file_id } = props.event.body;\n    await props.tx.none(`\n      UPDATE dbtable_schema.uuid_files\n      SET enabled = false, updated_on = $3, updated_sub = $4\n      WHERE parent_uuid = $1 AND file_id = $2\n    `, [parent_uuid, file_id, utcNowString(), props.event.userSub]);\n    return { id };\n  },\n} as const;'},
        { role: "user", content: 'Generate API method functionality: ' + prompt1 }
      ]);
      break;
    }
    case IPrompts.EDIT_FILE: {
      history = history.concat([
        { role: 'system', content: codeGPTPrecursor },
        { role: 'user', content: 'Generate a code block containing the complete file with the following modifications: handle input validation and display error messages\n\n###\n\n```import { useState } from "react";\n const FormComponent: React.FC = () => {\n   const [email, setEmail] = useState("");\n   const handleSubmit = (e: React.FormEvent) => {\n     e.preventDefault();\n     console.log(email);\n   };\n   return (\n     <form onSubmit={handleSubmit}>\n       <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />\n       <button type="submit">Submit</button>\n     </form>\n   );\n };```' },
        { role: 'assistant', content: '```import { useState } from "react";\n const FormComponent: React.FC = () => {\n   const [email, setEmail] = useState(");\n   const [error, setError] = useState(");\n   const handleSubmit = (e: React.FormEvent) => {\n     e.preventDefault();\n     if (email.match(/^\S+@\S+\.\S+$/)) {\n       setError(");\n       console.log(email);\n     } else {\n       setError("Invalid email address");\n     }\n   };\n   return (\n     <form onSubmit={handleSubmit}>\n       <input\n         type="email"\n         value={email}\n         onChange={(e) => setEmail(e.target.value)}\n         className={error ? "error" : "}\n       />\n       {error && <div className="error-message">{error}</div>}\n       <button type="submit">Submit</button>\n     </form>\n   );\n };```'},
        { role: 'user', content: 'Generate a code block containing the complete file with the following modifications: filter and sort the items\n\n###\n\n```const ItemList: React.FC<ItemListProps> = ({ items }) => (\n   <ul>\n     {items.map((item) => (\n       <li key={item.id}>{item.name} - ${item.price}</li>\n     ))}\n   </ul>\n );```' },
        { role: 'assistant', content: '```import { useState } from "react";\n const ItemList: React.FC<ItemListProps> = ({ items }) => {\n   const [filter, setFilter] = useState(");\n   const [sortBy, setSortBy] = useState<"name" | "price">("name");\n   const filteredItems = items\n     .filter((item) => item.name.toLowerCase().includes(filter.toLowerCase()))\n     .sort((a, b) => a[sortBy] > b[sortBy] ? 1 : -1);\n   return (\n     <>\n       <input value={filter} onChange={(e) => setFilter(e.target.value)} />\n       <select value={sortBy} onChange={(e) => setSortBy(e.target.value as "name" | "price")}>\n         <option value="name">Name</option>\n         <option value="price">Price</option>\n       </select>\n       <ul>\n         {filteredItems.map((item) => (\n           <li key={item.id}>{item.name} - ${item.price}</li>\n         ))}\n       </ul>\n     </>\n   );\n };```'},
        { role: "user", content: 'Generate a code block containing the complete file with the following modifications: ' + prompt1 + '\n\n###\n\n```' + prompt2.replaceAll('\n', '/*n*/') + '```' }
      ]);
      break; 
    }
    case IPrompts.MORPH_FILE: {
      history = history.concat([
        { role: 'system', content: 'You generate valid JSON change sets templated from the exact naming and nesting specifications of the following schemas: [ { "type": "renameType", "payload": { "oldName": "OldTypeName", "newName": "NewTypeName" } }, { "type": "modifyType", "payload": { "typeName": "TypeName", "changes": [ { "type": "addProperty", "payload": { "propertyName": "newProperty", "propertyType": "string" } }, { "type": "removeProperty", "payload": { "propertyName": "propertyToRemove" } }, { "type": "renameProperty", "payload": { "oldName": "oldPropertyName", "newName": "newPropertyName" } } ] } }, { "type": "addApiEndpoint", "payload": { "apiObjectName": "apiObjectName", "endpointName": "newEndpoint", "endpointDefinition": "const paymentApi = { postPayment:   kind: EndpointType.MUTATION  url: \"payments\"  method: \"POST\"  opts: {} as ApiOptions  queryArg: {} as IPayment  resultType: {} as IPayment }, ... more endpoints here ... }" } }, { "type": "modifyApiEndpoint", "payload": { "apiObjectName": "apiObjectName", "endpointName": "existingEndpoint", "changes": [ { "type": "changeProperty", "payload": { "propertyName": "propertyToChange", "newValue": "newValue" } }, { "type": "addProperty", "payload": { "propertyName": "newProperty", "initializer": "value" } }, { "type": "removeProperty", "payload": { "propertyName": "propertyToRemove" } } ] } }, { "type": "addApiHandler", "payload": { "handlersObjectName": "handlersObjectName", "handlerName": "newHandler", "handlerDefinition": "async props => { const { contactId, details } = props.event.body; const payment = await props.tx.one<IPayment>(  INSERT INTO dbtable_schema.payments (contact_id, details, created_sub  VALUES ($1, $2, $3::uuid  RETURNING id, contact_id as \\\"contactId\\\", details `, [contactId, details, props.event.userSub]); return payment; }" } }, { "type": "modifyApiHandler", "payload": { "handlersObjectName": "handlersObjectName", "handlerName": "existingHandler", "changes": [ { "type": "changeImplementation", "payload": { "newImplementation": "async (props) => { ... }" } }, { "type": "addArgument", "payload": { "newArgument": { "name": "argName", "type": "argType" } } }, { "type": "removeArgument", "payload": { "argumentName": "argToRemove" } } ] } }, { "type": "addReactComponent", "payload": { "componentName": "NewComponent", "componentBody": "function NewComponent(props) { return <>...</>; }" } }, { "type": "modifyReactComponent", "payload": { "componentName": "ExistingComponent", "changes": [ { "type": "addHook", "payload": { "hookDeclaration": "const [state, setState] = useState(initialState);" } }, { "type": "removeHook", "payload": { "hookName": "hookToRemove" } }, { "type": "modifyHook", "payload": { "hookName": "hookToModify", "newInitializer": "useState(newValue);" } }, { "type": "addProp", "payload": { "elementName": "Element", "propName": "newProp", "propValue": "{value}" } }, { "type": "removeProp", "payload": { "elementName": "Element", "propName": "propToRemove" } } ] } }, { "type": "addImport", "payload": { "importName": "ImportName", "importSource": "ImportSource" } } ].' },
        { role: 'user', content: 'handle input validation and display error messages\n\n###\n\nimport { useState } from "react";\n const FormComponent: React.FC = () => {\n   const [email, setEmail] = useState("");\n   const handleSubmit = (e: React.FormEvent) => {\n     e.preventDefault();\n     console.log(email);\n   };\n   return (\n     <form onSubmit={handleSubmit}>\n       <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />\n       <button type="submit">Submit</button>\n     </form>\n   );\n };' },
        { role: 'assistant', content: '[ { "type": "modifyReactComponent", "payload": { "componentName": "FormComponent", "changes": [ { "type": "addHook", "payload": { "hookDeclaration": "const [error, setError] = useState(\"\");" } }, { "type": "modifyHook", "payload": { "hookName": "setEmail", "newInitializer": "useState(\"\");" } }, { "type": "modifyFunction", "payload": { "functionName": "handleSubmit", "changes": [ { "type": "changeImplementation", "payload": { "newImplementation": "e.preventDefault();\nif (email.match(/^\\S+@\\S+\\.\\S+$/)) {\ setError(\"\");\ console.log(email);\n} else {\ setError(\"Invalid email address\");\n}" } } ] } }, { "type": "modifyJsx", "payload": { "changes": [ { "type": "addProp", "payload": { "elementName": "input", "propName": "className", "propValue": "{error ? \"error\" : \"\"}" } }, { "type": "addJsxElement", "payload": { "parentElementName": "form", "newElement": "{error && <div className=\"error-message\">{error}</div>}", "position": "insertBefore", "siblingElementName": "<button" } } ] } } ] } } ]' },
        { role: 'user', content: 'filter and sort the items\n\n###\n\nconst ItemList: React.FC<ItemListProps> = ({ items }) => (\n   <ul>\n     {items.map((item) => (\n       <li key={item.id}>{item.name} - ${item.price}</li>\n     ))}\n   </ul>\n );' },
        { role: 'assistant', content: '[ { "type": "addImport", "payload": { "importName": "useState", "importSource": "react" } }, { "type": "modifyReactComponent", "payload": { "componentName": "ItemList", "changes": [ { "type": "addHook", "payload": { "hookDeclaration": "const [filter, setFilter] = useState(\"\");" } }, { "type": "addHook", "payload": { "hookDeclaration": "const [sortBy, setSortBy] = useState<\"name\" | \"price\">(\"name\");" } }, { "type": "addVariable", "payload": { "variableDeclaration": "const filteredItems = items\n.filter((item) => item.name.toLowerCase().includes(filter.toLowerCase()))\n.sort((a, b) => a[sortBy] > b[sortBy] ? 1 : -1);" } }, { "type": "modifyJsx", "payload": { "changes": [ { "type": "wrapJsxElement", "payload": { "elementName": "<ul>", "wrapper": "<>", "closingWrapper": "</>" } }, { "type": "addJsxElement", "payload": { "parentElementName": "<>", "newElement": "<input value={filter} onChange={(e) => setFilter(e.target.value)} />", "position": "insertBefore", "siblingElementName": "<ul>" } }, { "type": "addJsxElement", "payload": { "parentElementName": "<>", "newElement": "<select value={sortBy} onChange={(e) => setSortBy(e.target.value as \"name\" | \"price\")}><option value=\"name\">Name</option><option value=\"price\">Price</option></select>", "position": "insertBefore", "siblingElementName": "<ul>" } }, { "type": "modifyJsxAttribute", "type": { "elementName": "li", "attributeName": "key", "newValue": "{item.id}" } }, { "type": "modifyJsx", "payload": { "changes": [ { "type": "replaceJsxElement", "payload": { "oldElement": "{items.map((item) => (\  <li key={item.id}>{item.name} - ${item.price}</li>\  ))}", "newElement": "{filteredItems.map((item) => (\  <li key={item.id}>{item.name} - ${item.price}</li>\  ))}" } } ] } } ] } } ] } } ]'},
        { role: "user", content: prompt1 + '\n\n###\n\n' + prompt2 + '' }
      ]);
      break;
    }
    case IPrompts.MORPH_2: {
      history = history.concat([
        { role: 'system', content: `You respond only with JSON as you are instructed to add to during the prompt.` },
        { role: 'user', content: `
          Please perform the following changeset generation step by step, using the "change request prompt" and the contents of "file".
          Available Changeset Objects: [ { "type": "renameType", "payload": { "oldName": "OldTypeName", "newName": "NewTypeName" } }, { "type": "modifyType", "payload": { "typeName": "TypeName", "changes": [ { "type": "addProperty", "payload": { "propertyName": "newProperty", "propertyType": "string" } }, { "type": "removeProperty", "payload": { "propertyName": "propertyToRemove" } }, { "type": "renameProperty", "payload": { "oldName": "oldPropertyName", "newName": "newPropertyName" } } ] } }, { "type": "addApiEndpoint", "payload": { "apiObjectName": "apiObjectName", "endpointName": "newEndpoint", "endpointDefinition": "const paymentApi = { postPayment:   kind: EndpointType.MUTATION  url: 'payments'  method: 'POST'  opts: {} as ApiOptions  queryArg: {} as IPayment  resultType: {} as IPayment }, ... more endpoints here ... }" } }, { "type": "modifyApiEndpoint", "payload": { "apiObjectName": "apiObjectName", "endpointName": "existingEndpoint", "changes": [ { "type": "changeProperty", "payload": { "propertyName": "propertyToChange", "newValue": "newValue" } }, { "type": "addProperty", "payload": { "propertyName": "newProperty", "initializer": "value" } }, { "type": "removeProperty", "payload": { "propertyName": "propertyToRemove" } } ] } }, { "type": "addApiHandler", "payload": { "handlersObjectName": "handlersObjectName", "handlerName": "newHandler", "handlerDefinition": "async props => { const { contactId, details } = props.event.body; const payment = await props.tx.one<IPayment>(\` INSERT INTO dbtable_schema.payments (contact_id, details, created_sub) VALUES ($1, $2, $3::uuid) RETURNING id, contact_id as "contactId", details \`, [contactId, details, props.event.userSub]); return payment; }" } }, { "type": "modifyApiHandler", "payload": { "handlersObjectName": "handlersObjectName", "handlerName": "existingHandler", "changes": [ { "type": "changeImplementation", "payload": { "newImplementation": "async (props) => { ... }" } }, { "type": "addArgument", "payload": { "newArgument": { "name": "argName", "type": "argType" } } }, { "type": "removeArgument", "payload": { "argumentName": "argToRemove" } } ] } }, { "type": "addReactComponent", "payload": { "componentName": "NewComponent", "componentBody": "function NewComponent(props) { const { data: profile, isLoading } = sh.useGetUserDetailsQuery(); if (isLoading) return <></>; return <>this is just an example component body</>; }" } }, { "type": "modifyReactComponent", "payload": { "componentName": "ExistingComponent", "changes": [ { "type": "addHook", "payload": { "hookDeclaration": "const [state, setState] = useState(initialState);" } }, { "type": "removeHook", "payload": { "hookName": "hookToRemove" } }, { "type": "modifyHook", "payload": { "hookName": "hookToModify", "newInitializer": "useState(newValue);" } }, { "type": "addProp", "payload": { "elementName": "Element", "propName": "newProp", "propValue": "{value}" } }, { "type": "removeProp", "payload": { "elementName": "Element", "propName": "propToRemove" } } ] } }, { "type": "addImport", "payload": { "importName": "ImportName", "importSource": "ImportSource" } }, { "type": "removeImport", "payload": { "importName": "ImportName", "importSource": "ImportSource" } } ]
          1. Interpret the text of "change request prompt" as a series of "Available Changeset Objects". Do not create new changeset object types. Do not use "type" names other than any "type" listed in "Available Changeset Objects" array.
          2. Add to your response: [
          3. Add to your response: the series of "Available Changeset Objects" from Step 1 to the array, with the necessray modifications to the changeset objects
          4. Add to your response: ]` },
        { role: 'user', content: `Generate a valid JSON response for changeset request prompt: "${prompt1}"\nfile: \n\`\`\`${prompt2}\`\`\`` },
      ]);
      break;
    }
    case IPrompts.MORPH_3: {
      history = history.concat([
        { role: 'user', content: `This message contains the description of an issue with a typescript file, and the instructions for how to address the issue; issues are resolved by generating an array of JSON objects containing line numbers, columns and the text to add, remove or replace. The next message contains the full text of the file. Read about the issue and follow the instructions. 
        
        Issue: ${prompt1}

        Instructions:
          1. Generate the minimal list of changes required to fix the issue.
          2. Avoid providing redundant or conflicting suggestions.
          3. Provide the suggested changes as an array of valid JSON objects.
          4. Each object should have the following properties:
            - "action": string, either "add", "remove", or "replace"
            - "code": string, the code snippet to be added, removed, or replaced
            - "startLine": number, the starting line number of the code range (1-based index)
            - "startColumn": number, the starting column number of the code range (1-based index)
            - "endLine": number, the ending line number of the code range (only applicable for "remove" or "replace" actions, 1-based index)
            - "endColumn": number, the ending column number of the code range (only applicable for "remove" or "replace" actions, 1-based index)
          5. The first line of the next message is line 1.
          6. Contain your response in a code block. `},
        { role: 'user', content: `${prompt2}`}
      ])
      break;
    }
    case IPrompts.CREATE_COMPONENT: {
      history = history.concat([
        { role: 'system', content: 'You are Decompress2ComponentGPT, able to decompress any compressed text and convert its concepts to React TSX components.' },
        { role: 'user', content: `Review these compressed Typescript types then create a TSX Functional Component based on their names, attributes, and the Component Description:
        
        Compressed Types: U2Iκ⇒V|N)↔(κ:I)⇒V?I:N.VdNΔV:T.RmNΔK]:T[K].ApiEvt{rId,mth,url,🔓,uSub,srcIp,usrGrpRoles,pp,qp,Tbody}.ApiP{evt,db,lggr,rd,rdP,kcl,cmpl,tx}.AuthP{evt&{body:AuthB},db,rd,rdP,kcl,cmpl,tx}.IWh{prop}↔(AuthP)⇒P<void>.AuthB{id,cId,rId,ip,ssId,uId,tm,typ,det}.DbErr{schm,tbl,clmn,dType,cnstrnt}.ApiErRsp{prop}:uknw,rId.ApiIntEr{rsp{st:num},data{emsg}}.PrxKy{aSub,apClnt,grpRlAct,grpAdRls,apRls,rlCall}.RdPrx{args}⇒P<PrxKy>.IAsst{id,prompt,promptR}.KcSO{regroup}.StrUsr{sub}.ITrMsg{wrds,dur,ts,unm}.IBookTr{unm,msg}.IBooking{qId,qSub,trns}.ICont{id,nm,eml,phn}.ScRspMsgAttr{sdp,ice,fmt,prop}:str.Sndr{prRsp}.IExch{booking}.IFdbck{id,msg,grpNm,crOn,unm}.IFileTp{id,nm}.IFile{id,ftId,ftNm,nm,loc}.IField{l}.IFormTpl=Rec<IField[]>.IFormSubm=Rec<str[]>.IFormVrSnSubm{fVId,subm}.IFormVr{id,fId,fTpl,subm,crOn,crSub}.IForm{id,nm,vr,crOn,crSub}.IGrpForm{id,grpId,fId,grpNm}.IGrpRole{grpId,rlId,extId}.IGrpSchedDateSlot{ws,stT,sDate,schBrSlotId,hr,mn,tm}.IGrpSched{mstr,grpId,schId,grpNm}.IGrpSvcAdn{grpId}.IGrpSvc{grpId,grpNm,svcId,ids}.IGrpUsrSchedStubRepl{unm,slotD,stT,schBrSlotId,sTId,grpNm,qId}.IGrpUsrSchedStub{grpSchId,usrSchId,qId,slotD,stT,svcNm,tierNm,repl}.IGrpUsrSched{id,grpSchId,usrSchId,svcs,grpNm}.IGrpUsr{grpId,usrId,usrSub,extId,grpExtId,rlId,rlNm,grpNm}.IGrpUsrs=Rec<IGrpUsr>.IGrpRlAuthAct{act{id?,nm}}.IGrpRlActState{asgnmnts}.IGrp{id,extId,crSub,crOn,defRlId,alwdDmns,nm,prps,cde,usrCnt,rls,usrs,avGrpAsgnmnts,valid,ndChkNm,chkNm,chckedNm,err}.ILkp{id,nm}.IManageGrps=Rec<IGrp>.

        Component Description: ${prompt1}
        
        Instructions:
        1. You compressed this text in a previous conversation; decompress it to learn about the Typescript types; use information about the types to construct a novel react component.
        2. Infer type attribute symbols as full-length titleized or camel-case English names (e.g., IGroupUsers, groupAssignmentUsers). 
        3. Do not include references to any decompressed types or attributes unless they are required in the react component.
        4. Do not use any type references or attributes that do not exist in the decompressed text, and include correct typings for all signatures.
        5. Import decompressed types, like ISampleType, from 'awayto/core'.
        6. Import from these packages as needed: @date-io/dayjs, @mui/icons-material, @mui/material, @mui/material-next, @mui/styles, @mui/x-data-grid, @mui/x-date-pickers, @react-keycloak/web, @reduxjs/toolkit, dayjs, history, keycloak-js, react, react-dom, react-dropzone, react-redux, react-router, react-router-dom, react-window, uuid.
        7. Use Reduxjs/toolkit auto generated react hooks with the "sh" variable; import sh from 'awayto/hooks' then use sh in the component, for example
          - const { data } = sh.useTypeQuery()
          - const [postType] = sh.usePostTypeMutation()
        8. Utilize Material-UI components for all design related aspects.
        9. Export the component as the default export and reply with the TSX surrounded in a code block. Do not use a named code block like "\`\`\`tsx" and do not include any text other than the code block and TSX component.`}
      ])
      break;
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