import styled from 'styled-components';

const Wrapper = styled.div`
  padding: 16px;
`;

const StyledTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  font-family: ${p => p.theme.fontSystem};
`;

const Th = styled.th`
  text-align: left;
  padding: 8px;
  border-bottom: 1px solid ${p => p.theme.divider};
  color: ${p => p.theme.textSecondary};
  font-weight: 500;
`;

const Td = styled.td`
  padding: 8px;
  border-bottom: 1px solid ${p => p.theme.divider};
  color: ${p => p.theme.textPrimary};
`;

export default function Table({ config = {}, data, isLoading, isError }) {
  const columns = config.columns || [];

  return (
    <Wrapper>
      <StyledTable>
        <thead>
          <tr>{columns.map(c => <Th key={c}>{c}</Th>)}</tr>
        </thead>
        <tbody>
          {isLoading && <tr><Td colSpan={columns.length || 1} style={{ background: '#e5e5e5', height: '32px' }} /></tr>}
          {isError && <tr><Td colSpan={columns.length || 1} style={{ color: '#E24B4A' }}>Error loading data</Td></tr>}
          {Array.isArray(data) && data.map((row, i) => (
            <tr key={i}>{columns.map(c => <Td key={c}>{String(row[c] ?? '')}</Td>)}</tr>
          ))}
        </tbody>
      </StyledTable>
    </Wrapper>
  );
}
