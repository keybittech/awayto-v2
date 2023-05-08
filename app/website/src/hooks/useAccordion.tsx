import React from 'react';

export function useAccordion(
  label: string,
  invalidSubmission = false,
  expanded = false,
  onChange?: (event: React.SyntheticEvent<Element, Event>, expanded: boolean) => void
) {
  return {
    label,
    invalidSubmission,
    expanded,
    onChange,
  };
}