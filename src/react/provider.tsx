import React, { useRef } from 'react';
import { createContext, FC } from 'react';
import { Stores } from './createStore';

export const OpticsStoresContext = createContext<Stores>(new Map());

const Provider: FC = ({ children }) => {
    return <OpticsStoresContext.Provider value={useRef(new Map()).current}>{children}</OpticsStoresContext.Provider>;
};

export default Provider;
