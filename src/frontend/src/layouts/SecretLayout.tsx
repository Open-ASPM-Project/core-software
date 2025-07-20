import { Outlet } from 'react-router-dom';
import MainHeader from '@/components/header/MainHeader';
import SecretsAppTab from '@/pages/secrets-app/components/SecretsAppTab';

const SecretLayout = () => {
  return (
    <div className="min-h-screen ">
      <MainHeader
        setProduct={function (product: number | null): void {
          throw new Error('Function not implemented.');
        }}
      />
      <main className="flex-1 p-4">
        <div className="w-full max-w-8xl container mx-auto">
          <SecretsAppTab />
        </div>
        <Outlet />
      </main>
    </div>
  );
};

export default SecretLayout;
