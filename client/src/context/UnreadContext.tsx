import React, { createContext, useContext, useState } from 'react';

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
  return (
    <UnreadContext.Provider value={{ unreadConvCount, setUnreadConvCount }}>
      {children}
    </UnreadContext.Provider>
  );
}

export const useUnread = () => useContext(UnreadContext);
