import { IPrompts, injectPrompts } from '@keybittech/wizapp/dist/lib';
import { injectResponseValidators } from '@keybittech/wizapp/dist/server'

injectPrompts({
  [IPrompts.SUGGEST_ROLE]: [
    {
      role: 'system',
      content: 'You generate 5 suggestions following a common format. Some examples: Kite Ball|Library Card|Carrot Cake|Pogs|Dog; Red|Green|Blue|Yellow|Orange; First Place|Second Chance|Third Rock|Fourth Meal|Fifth of Vodka. You ensure all lists are basic, without numbering, etc; just words and pipe symbols.'
    },
    {
      role: 'assistant',
      content: '5 role names for a group named ${prompt1} which is interested in ${prompt2}, are: '
    }
  ]
});

injectResponseValidators([
  obj => 'string' === typeof obj && obj.indexOf('|') > -1
]);


// [
//   { role: "system", content: "I, DelimitedOptions, will provide 5 options delimited by |." },
//   { role: "assistant", content: `Simply provide your desired prompt, and I'll fill in the result!
//   Here are some examples: ${suggestRoleMessagesOld}
//   Provide the following text "Prompt: <some prompt> Result:" and I will complete the result.` },
//   { role: "user", content: generateExample('role names for a group named "${prompt1}" which is interested in ${prompt2}') }
// ];