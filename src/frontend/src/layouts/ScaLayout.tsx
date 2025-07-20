import { Outlet } from 'react-router-dom';
import MainHeader from '@/components/header/MainHeader';
import ScaAppTab from '@/pages/sca-app/components/ScaAppTab';

const ScaLayout = () => {
  return (
    <div className="min-h-screen ">
      <MainHeader
        setProduct={function (product: number | null): void {
          throw new Error('Function not implemented.');
        }}
      />
      <main className="flex-1 p-4">
        <div className="w-full max-w-8xl container mx-auto">
          <ScaAppTab />
        </div>
        <Outlet />
      </main>
    </div>
  );
};

export default ScaLayout;
