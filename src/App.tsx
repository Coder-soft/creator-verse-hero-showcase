import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Index from './pages/Index';
import Login from './pages/Login';
import { SessionContextProvider } from './contexts/SessionContext';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <SessionContextProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Index />
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </SessionContextProvider>
  );
}

export default App;