import React, { useState, useCallback } from 'react';

import Link from '@mui/material/Link';

import { nid } from 'awayto/core';
import { IPrompts } from '@keybittech/wizapp/dist/lib';
import { sh } from './store';

type SuggestFn = (props: { id: IPrompts, prompt: string }) => Promise<void>;
type SuggestionsComp = IProps & { handleSuggestion: (val: string) => void};

export function useSuggestions(): {
  suggestions: string[];
  suggest: SuggestFn;
  comp(props: SuggestionsComp): React.JSX.Element;
} {

  const [suggestions, setSuggestions] = useState([] as string[]);

  const [getPrompt] = sh.useLazyGetPromptQuery();

  const suggest: SuggestFn = useCallback(async ({ id, prompt }: { id: IPrompts, prompt: string }) => {
    try {
      const { promptResult } = await getPrompt({ id, prompt }).unwrap();
      setSuggestions(promptResult);
    } catch (error) {
      console.log(error);
    }
  }, []);

  const comp = useCallback(({ handleSuggestion }: SuggestionsComp) => {
    const compId = nid('v4');
    return <>
      AI: {suggestions.filter(s => s.toLowerCase() !== 'admin').map((suggestion, i) => {
        return <span key={`${compId}-selection-${i}`}>
          <Link sx={{ cursor: 'pointer' }} onClick={() => {
            handleSuggestion(suggestion);
          }}>
            {suggestion}
          </Link>{i !== suggestions.length - 1 ? ',' : ''}&nbsp;
        </span>
      })}
    </>;
  }, [suggestions]);

  return { suggestions, suggest, comp };
}

export default useSuggestions;
