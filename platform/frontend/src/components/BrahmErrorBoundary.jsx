import React from 'react';

class BrahmErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ border: '1px solid #E24B4A', padding: '12px', fontSize: '11px', fontFamily: 'monospace', color: '#E24B4A' }}>
          Component &quot;{this.props.componentType}&quot; failed to render.
        </div>
      );
    }
    return this.props.children;
  }
}

export default BrahmErrorBoundary;
