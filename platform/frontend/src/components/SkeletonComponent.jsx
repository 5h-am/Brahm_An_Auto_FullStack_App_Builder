const SkeletonComponent = ({ height = '60px' }) => (
  <div style={{
    background: '#e5e5e5',
    borderRadius: '4px',
    height,
    width: '100%',
    animation: 'brahm-pulse 1s ease-in-out infinite alternate'
  }} />
);

export default SkeletonComponent;
