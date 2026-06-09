"use client";

import { useEffect, useState, type ReactNode } from "react";

type DebouncedSearchDraftProps = {
  urlSearch: string;
  onDebouncedChange: (search: string) => void;
  children: (
    draft: string,
    setDraft: (value: string) => void,
  ) => ReactNode;
};

export function DebouncedSearchDraft({
  urlSearch,
  onDebouncedChange,
  children,
}: DebouncedSearchDraftProps) {
  const [draft, setDraft] = useState(urlSearch);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (urlSearch === draft) {
        return;
      }

      onDebouncedChange(draft);
    }, 350);

    return () => window.clearTimeout(timer);
  }, [draft, onDebouncedChange, urlSearch]);

  return children(draft, setDraft);
}
