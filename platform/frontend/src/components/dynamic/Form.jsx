import styled from 'styled-components';

const Wrapper = styled.div`
  padding: 16px;
`;

const Field = styled.div`
  margin-bottom: 8px;
`;

const FieldInput = styled.input`
  width: 100%;
  padding: 8px;
  border: 1px solid ${p => p.theme.divider};
  border-radius: 4px;
  font-size: 13px;
  font-family: ${p => p.theme.fontSystem};
`;

const SubmitBtn = styled.button`
  padding: 8px 16px;
  background: ${p => p.theme.accent};
  color: #fff;
  border: none;
  border-radius: 4px;
  font-size: 13px;
  cursor: pointer;
  &:active { transform: scale(0.98); }
`;

export default function Form({ config = {} }) {
  const fields = config.fields || [];
  const submitText = config.submitText || 'Submit';

  return (
    <Wrapper>
      {fields.map(f => (
        <Field key={f}>
          <FieldInput placeholder={f} name={f} />
        </Field>
      ))}
      <SubmitBtn>{submitText}</SubmitBtn>
    </Wrapper>
  );
}
