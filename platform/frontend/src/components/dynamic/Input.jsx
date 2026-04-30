import styled from 'styled-components';

const Wrapper = styled.div`
  padding: 8px 0;
`;

const StyledLabel = styled.label`
  font-size: 12px;
  color: ${p => p.theme.textSecondary};
  display: block;
  margin-bottom: 4px;
  font-family: ${p => p.theme.fontSystem};
`;

const StyledInput = styled.input`
  width: 100%;
  padding: 8px;
  border: 1px solid ${p => p.theme.divider};
  border-radius: 4px;
  font-size: 13px;
  font-family: ${p => p.theme.fontSystem};
`;

export default function Input({ config = {}, onAction }) {
  return (
    <Wrapper>
      <StyledLabel>{config.name || 'field'}</StyledLabel>
      <StyledInput
        placeholder={config.placeholder || ''}
        onChange={e => onAction && onAction('inputChange', { name: config.name, value: e.target.value })}
      />
    </Wrapper>
  );
}
