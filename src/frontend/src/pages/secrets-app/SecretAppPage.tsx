import React from 'react';
import SecretsAppTab from './components/SecretsAppTab';

type Props = {};

const SecretAppPage = (props: Props) => {
  return (
    <div className="w-full max-w-8xl container mx-auto p-4">
      <SecretsAppTab />
    </div>
  );
};

export default SecretAppPage;
