import React, { createContext, useContext, useState, useMemo } from 'react';

interface UnreadContextType {
  unreadConvCount: number;
  setUnreadConvCount: (n: number) => void;
}

const UnreadContext = createContext<UnreadContextType>({
  unreadConvCount: 0,
  setUnreadConvCount: () => {},
});

export function UnreadProvider({ children }: { children: React.ReactNode }) {
  const [unreadConvCount, setUnreadConvCount] = useState(0);
  const ctxValue = useMemo(() => ({ unreadConvCount, setUnreadConvCount }), [unreadConvCount, setUnreadConvCount]);
  return (
    <UnreadContext.Provider value={ctxValue}>
      {children}
    </UnreadContext.Provider>
  );
}

export const useUnread = () => useContext(UnreadContext);
