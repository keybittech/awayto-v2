import React, { useState, useCallback } from 'react';

import Link from '@mui/material/Link';

import { nid, obfuscate } from 'awayto/core';
import { IPrompts } from '@keybittech/wizapp/dist/lib';
import { sh } from './store';

type SuggestFn = (props: { id: IPrompts, prompt: string }) => void;
type SuggestionsComp = IProps & { handleSuggestion: (val: string) => void};

export function useSuggestions(refName: string): {
  suggestions: string[];
  suggest: SuggestFn;
  comp(props: SuggestionsComp): React.JSX.Element;
} {

  const [suggestions, setSuggestions] = useState(JSON.parse(localStorage.getItem(refName + '_suggestions') || '[]') as string[]);
  const [history, setHistory] = useState(JSON.parse(localStorage.getItem(refName + '_suggestion_history') || '{}') as Record<string, string[]>);

  const [getPrompt] = sh.useLazyGetPromptQuery();

  const suggest: SuggestFn = useCallback(({ id, prompt }) => {
    try {

      const promptKey = obfuscate(prompt);
      
      if (history.hasOwnProperty(promptKey)) {
        setSuggestions(history[promptKey]);
        localStorage.setItem(refName + '_suggestions', JSON.stringify(history[promptKey]));
        return;
      }

      getPrompt({ id, prompt }).unwrap().then(({ promptResult }) => {
        setSuggestions(promptResult);
        const newHistory = { ...history, [promptKey]: promptResult };
        setHistory(newHistory);
        localStorage.setItem(refName + '_suggestions', JSON.stringify(promptResult));
        localStorage.setItem(refName + '_suggestion_history', JSON.stringify(newHistory));
      }).catch(console.error);
    } catch (error) {
      console.log(error);
    }
  } , [history]);

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
