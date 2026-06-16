"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

type DebouncedSearchDraftProps = {
  urlSearch: string;
  onDebouncedChange: (search: string) => void;
  children: (draft: string, setDraft: (value: string) => void) => ReactNode;
};

function DebouncedSearchDraftInner({
  urlSearch,
  onDebouncedChange,
  children,
}: DebouncedSearchDraftProps) {
  const [draft, setDraft] = useState(urlSearch);
  const onDebouncedChangeRef = useRef(onDebouncedChange);

  useEffect(() => {
    onDebouncedChangeRef.current = onDebouncedChange;
  }, [onDebouncedChange]);

  useEffect(() => {
    setDraft(urlSearch);
  }, [urlSearch]);

  useEffect(() => {
    if (urlSearch === draft) {
      return;
    }

    const timer = window.setTimeout(() => {
      if (urlSearch === draft) {
        return;
      }

      onDebouncedChangeRef.current(draft);
    }, 350);

    return () => window.clearTimeout(timer);
  }, [draft, urlSearch]);

  return children(draft, setDraft);
}

export function DebouncedSearchDraft(props: DebouncedSearchDraftProps) {
  return <DebouncedSearchDraftInner {...props} />;
}
