import React from 'react';
import ScaAppTab from './components/ScaAppTab';

type Props = {};

const ScaAppPage = (props: Props) => {
  return (
    <div className="w-full max-w-8xl container mx-auto p-4">
      <ScaAppTab />
    </div>
  );
};

export default ScaAppPage;
