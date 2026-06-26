// src/helmet-helper.ts
import React from 'react';

// Simple wrapper without complex TypeScript
export const HelmetProvider = ({ children }: any) => {
    if (typeof window === 'undefined') {
        return React.createElement(React.Fragment, null, children);
    }
    // Dynamic import to avoid build-time errors
    const { HelmetProvider: RealHelmetProvider } = require('react-helmet-async');
    return React.createElement(RealHelmetProvider, null, children);
};

export const Helmet = (props: any) => {
    if (typeof window === 'undefined') {
        return null;
    }
    const { Helmet: RealHelmet } = require('react-helmet-async');
    return React.createElement(RealHelmet, props);
};