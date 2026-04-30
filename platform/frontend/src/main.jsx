import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from 'styled-components';
import App from './App';
import { lightTokens, darkTokens } from './styles/tokens';
import useBuilderStore from './store/builderStore';
import './styles/global.css';

function ThemeWrapper({ children }) {
  const isDarkMode = useBuilderStore(s => s.isDarkMode);
  return (
    <ThemeProvider theme={isDarkMode ? darkTokens : lightTokens}>
      {children}
    </ThemeProvider>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeWrapper>
        <App />
      </ThemeWrapper>
    </BrowserRouter>
  </React.StrictMode>
);
