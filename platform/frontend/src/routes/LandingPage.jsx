import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: ${p => p.theme.shellBg};
  padding: 40px 20px;
`;

const Container = styled.div`
  max-width: 720px;
  width: 100%;
  text-align: center;
`;

const LogoRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 48px;
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
  font-family: ${p => p.theme.fontSystem};
`;

const Headline = styled.h1`
  font-size: 48px;
  font-weight: 600;
  color: ${p => p.theme.textPrimary};
  margin-bottom: 16px;
  font-family: 'Inter', ${p => p.theme.fontSystem};
  line-height: 1.1;
`;

const Description = styled.p`
  font-size: 16px;
  color: ${p => p.theme.textSecondary};
  line-height: 1.6;
  margin-bottom: 40px;
  max-width: 520px;
  margin-left: auto;
  margin-right: auto;
  font-family: 'Inter', ${p => p.theme.fontSystem};
`;

const ButtonRow = styled.div`
  display: flex;
  gap: 12px;
  justify-content: center;
`;

const GhostButton = styled.button`
  padding: 10px 24px;
  border: 1px solid ${p => p.theme.divider};
  background: transparent;
  color: ${p => p.theme.textPrimary};
  font-size: 14px;
  border-radius: 6px;
  cursor: pointer;
  font-family: 'Inter', ${p => p.theme.fontSystem};
  font-weight: 500;

  &:active {
    transform: scale(0.98);
  }
`;

const FilledButton = styled.button`
  padding: 10px 24px;
  border: none;
  background: ${p => p.theme.accent};
  color: #ffffff;
  font-size: 14px;
  border-radius: 6px;
  cursor: pointer;
  font-family: 'Inter', ${p => p.theme.fontSystem};
  font-weight: 500;

  &:active {
    transform: scale(0.98);
  }
`;

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <Wrapper>
      <Container>
        <LogoRow>
          <Wordmark>BRAHM</Wordmark>
          <BetaPill>beta</BetaPill>
        </LogoRow>
        <Headline>JSON in. Full-stack app out.</Headline>
        <Description>
          Define your application schema in JSON — layouts, entities, and actions — and Brahm generates a working full-stack app with a React frontend, Node.js backend, and PostgreSQL database.
        </Description>
        <ButtonRow>
          <GhostButton id="landing-sign-in" onClick={() => navigate('/auth', { state: { mode: 'login' } })}>Sign In</GhostButton>
          <FilledButton id="landing-create-account" onClick={() => navigate('/auth', { state: { mode: 'register' } })}>Create Account</FilledButton>
        </ButtonRow>
      </Container>
    </Wrapper>
  );
}
