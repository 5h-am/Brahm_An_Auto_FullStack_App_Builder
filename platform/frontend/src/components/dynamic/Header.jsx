import styled from 'styled-components';

const StyledHeader = styled.header`
  background: #1a3a5c;
  color: #ffffff;
  height: 40px;
  padding: 0 16px;
  display: flex;
  align-items: center;
`;

const Title = styled.h1`
  font-size: 15px;
  font-weight: 500;
  margin: 0;
`;

export default function Header({ config = {} }) {
  return (
    <StyledHeader>
      <Title>{config.title || 'Header'}</Title>
    </StyledHeader>
  );
}
