import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { apiFetch } from '../hooks/useFetch';

const Wrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: ${p => p.theme.shellBg};
  padding: 40px 20px;
`;

const Card = styled.div`
  width: 100%;
  max-width: 400px;
  background: ${p => p.theme.shellBg};
  border: 1px solid ${p => p.theme.divider};
  border-radius: 8px;
  padding: 32px;
`;

const LogoRow = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 32px;
`;

const Wordmark = styled.span`
  color: ${p => p.theme.accent};
  font-weight: 500;
  font-size: 15px;
  font-family: ${p => p.theme.fontSystem};
`;

const BetaPill = styled.span`
  background: #e6f1fb;
  color: #0c447c;
  font-size: 11px;
  border-radius: 4px;
  padding: 2px 6px;
  margin-left: 8px;
`;

const TabRow = styled.div`
  display: flex;
  margin-bottom: 24px;
  border-bottom: 1px solid ${p => p.theme.divider};
`;

const Tab = styled.button`
  flex: 1;
  padding: 10px 0;
  border: none;
  background: transparent;
  color: ${p => p.$active ? p.theme.accent : p.theme.textSecondary};
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  border-bottom: 2px solid ${p => p.$active ? p.theme.accent : 'transparent'};
  font-family: 'Inter', ${p => p.theme.fontSystem};

  &:active {
    transform: scale(0.98);
  }
`;

const InputGroup = styled.div`
  margin-bottom: 16px;
`;

const Label = styled.label`
  display: block;
  font-size: 12px;
  color: ${p => p.theme.textSecondary};
  margin-bottom: 6px;
  font-family: 'Inter', ${p => p.theme.fontSystem};
`;

const Input = styled.input`
  width: 100%;
  padding: 10px 12px;
  border: 1px solid ${p => p.theme.divider};
  border-radius: 6px;
  font-size: 14px;
  background: ${p => p.theme.shellBg};
  color: ${p => p.theme.textPrimary};
  outline: none;
  font-family: 'Inter', ${p => p.theme.fontSystem};

  &:focus {
    border-color: ${p => p.theme.accent};
  }
`;

const SubmitButton = styled.button`
  width: 100%;
  padding: 10px;
  border: none;
  background: ${p => p.theme.accent};
  color: #ffffff;
  font-size: 14px;
  font-weight: 500;
  border-radius: 6px;
  cursor: pointer;
  margin-top: 8px;
  font-family: 'Inter', ${p => p.theme.fontSystem};
  opacity: ${p => p.disabled ? 0.6 : 1};

  &:active {
    transform: scale(0.98);
  }
`;

const ErrorMsg = styled.div`
  color: ${p => p.theme.error};
  font-size: 13px;
  margin-bottom: 12px;
  font-family: 'Inter', ${p => p.theme.fontSystem};
`;

const SuccessMsg = styled.div`
  color: ${p => p.theme.success};
  font-size: 13px;
  margin-bottom: 12px;
  font-family: 'Inter', ${p => p.theme.fontSystem};
`;

export default function AuthPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [mode, setMode] = useState(location.state?.mode || 'login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  function switchMode(newMode) {
    setMode(newMode);
    setEmail('');
    setPassword('');
    setError(null);
    setSuccess(null);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsLoading(true);

    try {
      if (mode === 'login') {
        const res = await apiFetch('/api/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || 'Login failed');
          return;
        }
        localStorage.setItem('brahm_access_token', data.accessToken);
        navigate('/dashboard');
      } else {
        const res = await apiFetch('/api/auth/register', {
          method: 'POST',
          body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || 'Registration failed');
          return;
        }
        switchMode('login');
        setSuccess('Account created. Please sign in.');

      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Wrapper>
      <Card>
        <LogoRow>
          <Wordmark>BRAHM</Wordmark>
          <BetaPill>beta</BetaPill>
        </LogoRow>
        <TabRow>
          <Tab id="auth-tab-login" $active={mode === 'login'} onClick={() => switchMode('login')}>Sign In</Tab>
          <Tab id="auth-tab-register" $active={mode === 'register'} onClick={() => switchMode('register')}>Create Account</Tab>
        </TabRow>
        {error && <ErrorMsg>{error}</ErrorMsg>}
        {success && <SuccessMsg>{success}</SuccessMsg>}
        <form onSubmit={handleSubmit}>
          <InputGroup>
            <Label htmlFor="auth-email">Email</Label>
            <Input
              id="auth-email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </InputGroup>
          <InputGroup>
            <Label htmlFor="auth-password">Password</Label>
            <Input
              id="auth-password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              minLength={8}
              required
            />
          </InputGroup>
          <SubmitButton id="auth-submit" type="submit" disabled={isLoading}>
            {isLoading ? 'Loading...' : mode === 'login' ? 'Sign In' : 'Create Account'}
          </SubmitButton>
        </form>
      </Card>
    </Wrapper>
  );
}
