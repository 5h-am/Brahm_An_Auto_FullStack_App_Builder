import styled from 'styled-components';

const StyledP = styled.p`
  font-size: 13px;
  color: ${p => p.theme.textPrimary};
  font-family: ${p => p.theme.fontSystem};
  padding: 8px 0;
`;

export default function Text({ config = {} }) {
  return <StyledP>{config.content || ''}</StyledP>;
}
