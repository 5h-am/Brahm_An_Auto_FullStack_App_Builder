import styled from 'styled-components';

const Wrapper = styled.div`
  border: 1px solid ${p => p.theme.divider};
  border-radius: ${p => p.theme.radius || '4px'};
  padding: 16px;
`;

const CardTitle = styled.h3`
  font-size: 14px;
  font-weight: 500;
  margin: 0 0 8px 0;
  color: ${p => p.theme.textPrimary};
`;

const CardBody = styled.p`
  font-size: 13px;
  color: ${p => p.theme.textSecondary};
  margin: 0;
`;

export default function Card({ config = {} }) {
  return (
    <Wrapper>
      <CardTitle>{config.title || 'Card Title'}</CardTitle>
      <CardBody>{config.body || ''}</CardBody>
    </Wrapper>
  );
}
