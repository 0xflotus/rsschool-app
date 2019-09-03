import * as React from 'react';
import { Alert, Button } from 'antd';

class RegistryBanner extends React.Component<any, any> {
  render() {
    return (
      <Alert
        type="info"
        showIcon
        message="New RS School Course is starting and we are looking for mentors!"
        description={
          <Button type="primary" href="/registry/mentor">
            Register as Mentor
          </Button>
        }
      />
    );
  }
}

export { RegistryBanner };
