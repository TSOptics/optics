import React, { useRef } from 'react';
import { createContext, FC } from 'react';
import { Stores } from './createStore';

export const OptixStoresContext = createContext<Stores>(new Map());

const Provider: FC = ({ children }) => {
    return <OptixStoresContext.Provider value={useRef(new Map()).current}>{children}</OptixStoresContext.Provider>;
};

export default Provider;
