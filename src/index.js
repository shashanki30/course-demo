import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { UserProvider } from './context/UserContext';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { HashRouter  } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <HashRouter>
      <GoogleOAuthProvider clientId="158120509573-i5481f7v9go9qe63ohr2v5ni4f9t41ps.apps.googleusercontent.com">
        <Toaster position="top-right" />
        <UserProvider>
          <App />
        </UserProvider>
      </GoogleOAuthProvider>
    </HashRouter>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
