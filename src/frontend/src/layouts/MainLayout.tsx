import { Outlet } from 'react-router-dom';
import MainHeader from '@/components/header/MainHeader';

const MainLayout = () => {
  return (
    <div className="min-h-screen ">
      <MainHeader
        setProduct={function (product: number | null): void {
          throw new Error('Function not implemented.');
        }}
      />
      <main className="flex-1 p-4">
        <Outlet />
      </main>
    </div>
  );
};

export default MainLayout;
