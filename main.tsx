import { ViteReactSSG } from 'vite-react-ssg';
import App from './App';
import './index.css';

// Routes are handled inside App.tsx to keep providers in scope
export const createApp = ViteReactSSG({ routes: [] });