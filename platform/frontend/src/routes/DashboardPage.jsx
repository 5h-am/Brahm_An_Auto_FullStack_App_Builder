import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { apiFetch } from '../hooks/useFetch';

const Wrapper = styled.div`
  min-height: 100vh;
  background: ${p => p.theme.shellBg};
  padding: 40px;
`;

const TopBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 40px;
  max-width: 1000px;
  margin-left: auto;
  margin-right: auto;
`;

const LogoRow = styled.div`
  display: flex;
  align-items: center;
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

const SignOutBtn = styled.button`
  padding: 6px 14px;
  border: 1px solid ${p => p.theme.divider};
  background: transparent;
  color: ${p => p.theme.textSecondary};
  font-size: 12px;
  border-radius: 4px;
  cursor: pointer;
  font-family: 'Inter', ${p => p.theme.fontSystem};

  &:active {
    transform: scale(0.98);
  }
`;

const Container = styled.div`
  max-width: 1000px;
  margin: 0 auto;
`;

const SectionTitle = styled.h2`
  font-size: 18px;
  font-weight: 600;
  color: ${p => p.theme.textPrimary};
  margin-bottom: 20px;
  font-family: 'Inter', ${p => p.theme.fontSystem};
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 16px;
  margin-bottom: 40px;
`;

const ProjectCard = styled.div`
  border: 1px solid ${p => p.theme.divider};
  border-radius: 8px;
  padding: 20px;
  cursor: pointer;
  background: ${p => p.theme.shellBg};
  position: relative;
  display: flex;
  flex-direction: column;

  &:active {
    transform: scale(0.98);
  }
`;

const ProjectName = styled.div`
  font-size: 15px;
  font-weight: 500;
  color: ${p => p.theme.textPrimary};
  margin-bottom: 8px;
  font-family: 'Inter', ${p => p.theme.fontSystem};
`;

const ProjectMeta = styled.div`
  font-size: 12px;
  color: ${p => p.theme.textSecondary};
  font-family: 'Inter', ${p => p.theme.fontSystem};
`;

const VersionBadge = styled.span`
  background: #e6f1fb;
  color: #0c447c;
  font-size: 10px;
  border-radius: 4px;
  padding: 2px 6px;
  margin-left: 8px;
`;

const NewProjectBtn = styled.button`
  padding: 10px 20px;
  border: 1px dashed ${p => p.theme.divider};
  background: transparent;
  color: ${p => p.theme.accent};
  font-size: 14px;
  font-weight: 500;
  border-radius: 6px;
  cursor: pointer;
  font-family: 'Inter', ${p => p.theme.fontSystem};

  &:active {
    transform: scale(0.98);
  }
`;

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const ModalBox = styled.div`
  background: ${p => p.theme.shellBg};
  border: 1px solid ${p => p.theme.divider};
  border-radius: 8px;
  padding: 24px;
  width: 360px;
`;

const ModalTitle = styled.div`
  font-size: 15px;
  font-weight: 600;
  color: ${p => p.theme.textPrimary};
  margin-bottom: 16px;
  font-family: 'Inter', ${p => p.theme.fontSystem};
`;

const ModalInput = styled.input`
  width: 100%;
  padding: 10px 12px;
  border: 1px solid ${p => p.theme.divider};
  border-radius: 6px;
  font-size: 14px;
  background: ${p => p.theme.shellBg};
  color: ${p => p.theme.textPrimary};
  outline: none;
  margin-bottom: 16px;
  font-family: 'Inter', ${p => p.theme.fontSystem};

  &:focus {
    border-color: ${p => p.theme.accent};
  }
`;

const ModalBtnRow = styled.div`
  display: flex;
  gap: 8px;
  justify-content: flex-end;
`;

const CancelBtn = styled.button`
  padding: 8px 16px;
  border: 1px solid ${p => p.theme.divider};
  background: transparent;
  color: ${p => p.theme.textPrimary};
  font-size: 13px;
  border-radius: 4px;
  cursor: pointer;
  font-family: 'Inter', ${p => p.theme.fontSystem};

  &:active {
    transform: scale(0.98);
  }
`;

const CreateBtn = styled.button`
  padding: 8px 16px;
  border: none;
  background: ${p => p.theme.accent};
  color: #ffffff;
  font-size: 13px;
  border-radius: 4px;
  cursor: pointer;
  font-family: 'Inter', ${p => p.theme.fontSystem};

  &:active {
    transform: scale(0.98);
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 40px 20px;
  color: ${p => p.theme.textMuted};
  font-size: 14px;
  font-family: 'Inter', ${p => p.theme.fontSystem};
`;

const DeleteBtn = styled.button`
  position: absolute;
  bottom: 20px;
  right: 20px;
  color: #E24B4A;
  border: 1px solid #E24B4A;
  background: transparent;
  height: 26px;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  padding: 0 10px;
  font-family: 'Inter', ${p => p.theme.fontSystem};

  &:hover {
    background: #fef2f2;
  }
`;

const DeleteModalBox = styled.div`
  background: #ffffff;
  border: 1px solid #e5e5e5;
  border-radius: 4px;
  padding: 24px;
  width: 360px;
  max-width: 90vw;
`;

const DeleteTitle = styled.div`
  font-size: 15px;
  font-weight: 500;
  color: #0a0a0a;
`;

const DeleteBody = styled.p`
  font-size: 13px;
  color: #6b6b6b;
  margin-top: 8px;
`;

const DeleteError = styled.div`
  font-size: 12px;
  color: #E24B4A;
  margin-top: 8px;
`;

const DeleteConfirmBtn = styled.button`
  padding: 0 16px;
  border: none;
  background: #E24B4A;
  color: #ffffff;
  font-size: 13px;
  border-radius: 4px;
  cursor: pointer;
  height: 32px;
  font-family: 'Inter', ${p => p.theme.fontSystem};
  opacity: ${p => (p.disabled ? 0.7 : 1)};

  &:active {
    transform: ${p => (p.disabled ? 'none' : 'scale(0.98)')};
  }
`;

export default function DashboardPage() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [projectToDelete, setProjectToDelete] = useState(null);
  const [deleteError, setDeleteError] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    apiFetch('/api/projects')
      .then(r => r.json())
      .then(d => {
        setProjects(d.data || []);
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  }, []);

  async function handleCreate() {
    if (!newName.trim()) return;
    try {
      const res = await apiFetch('/api/projects', {
        method: 'POST',
        body: JSON.stringify({ name: newName.trim() })
      });
      const data = await res.json();
      if (data.success) {
        navigate('/builder/' + data.data.id);
      }
    } catch (err) {
    }
  }

  async function handleSignOut() {
    await apiFetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
    localStorage.removeItem('brahm_access_token');
    navigate('/');
  }

  function formatDate(dateStr) {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  async function handleConfirmDelete() {
    setIsDeleting(true);
    setDeleteError(null);
    try {
      const res = await apiFetch('/api/projects/' + projectToDelete.id, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setDeleteError(data.error || 'Failed to delete project. Please try again.');
        return;
      }
      setProjects(prev => prev.filter(p => p.id !== projectToDelete.id));
      setProjectToDelete(null);
    } catch (err) {
      setDeleteError('Network error. Please check your connection and try again.');
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <Wrapper>
      <TopBar>
        <LogoRow>
          <Wordmark>BRAHM</Wordmark>
          <BetaPill>beta</BetaPill>
        </LogoRow>
        <SignOutBtn id="dashboard-signout" onClick={handleSignOut}>Sign Out</SignOutBtn>
      </TopBar>
      <Container>
        <SectionTitle>Your Projects</SectionTitle>
        {isLoading ? (
          <EmptyState>Loading projects...</EmptyState>
        ) : projects.length === 0 ? (
          <EmptyState>No projects yet. Create one to get started.</EmptyState>
        ) : (
          <Grid>
            {projects.map(p => (
              <ProjectCard key={p.id} id={'project-' + p.id} onClick={() => navigate('/builder/' + p.id)}>
                <ProjectName>
                  {p.name}
                  <VersionBadge>v{p.version || 1}</VersionBadge>
                </ProjectName>
                <ProjectMeta>{formatDate(p.created_at)}</ProjectMeta>
                <DeleteBtn onClick={(e) => {
                  e.stopPropagation();
                  setDeleteError(null);
                  setProjectToDelete(p);
                }}>
                  Delete
                </DeleteBtn>
              </ProjectCard>
            ))}
          </Grid>
        )}
        <NewProjectBtn id="new-project-btn" onClick={() => setShowModal(true)}>+ New Project</NewProjectBtn>
      </Container>
      {showModal && (
        <ModalOverlay onClick={() => setShowModal(false)}>
          <ModalBox onClick={e => e.stopPropagation()}>
            <ModalTitle>New Project</ModalTitle>
            <ModalInput
              id="new-project-name"
              placeholder="Project name"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCreate()}
              autoFocus
            />
            <ModalBtnRow>
              <CancelBtn onClick={() => setShowModal(false)}>Cancel</CancelBtn>
              <CreateBtn id="new-project-create" onClick={handleCreate}>Create</CreateBtn>
            </ModalBtnRow>
          </ModalBox>
        </ModalOverlay>
      )}
      {projectToDelete !== null && (
        <ModalOverlay onClick={() => {
          if (!isDeleting) {
            setProjectToDelete(null);
            setDeleteError(null);
          }
        }}>
          <DeleteModalBox onClick={e => e.stopPropagation()}>
            <DeleteTitle>Delete Project?</DeleteTitle>
            <DeleteBody>This will permanently delete "{projectToDelete.name}" and all its data. This cannot be undone.</DeleteBody>
            {deleteError && <DeleteError>{deleteError}</DeleteError>}
            <ModalBtnRow style={{ marginTop: '24px' }}>
              <CancelBtn onClick={() => { setProjectToDelete(null); setDeleteError(null); }}>Cancel</CancelBtn>
              <DeleteConfirmBtn onClick={handleConfirmDelete} disabled={isDeleting}>
                {isDeleting ? 'Deleting...' : 'Delete'}
              </DeleteConfirmBtn>
            </ModalBtnRow>
          </DeleteModalBox>
        </ModalOverlay>
      )}
    </Wrapper>
  );
}
