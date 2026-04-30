import styled from 'styled-components';

const StyledButton = styled.button`
  padding: 8px 16px;
  background: ${p => p.theme.accent};
  color: #fff;
  border: none;
  border-radius: 4px;
  font-size: 13px;
  cursor: pointer;
  font-family: ${p => p.theme.fontSystem};
  &:active { transform: scale(0.98); }
`;

export default function Button({ config = {}, onAction }) {
  return (
    <StyledButton onClick={() => onAction && onAction('buttonClick', {})}>
      {config.label || 'Click'}
    </StyledButton>
  );
}
