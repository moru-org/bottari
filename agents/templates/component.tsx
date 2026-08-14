"use client";

import { useState, useCallback } from "react";

export function [COMPONENT_NAME](
  props: { [PROP_NAME]: [PROP_TYPE] } & { children?: React.ReactNode }
) {
  const [state, setState] = useState<[STATE_TYPE]>(null);

  const handleClick = useCallback(async () => {
    // TODO: implement handler
  }, []);

  return (
    <div className="rounded-xl bg-bottari-surface p-4">
      <button
        className="w-full rounded-lg bg-bottari-yellow px-4 py-3 text-sm font-bold text-bottari-dark"
        onClick={handleClick}
      >
        [BUTTON_TEXT]
      </button>
    </div>
  );
}
