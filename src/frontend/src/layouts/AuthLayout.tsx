import { Outlet } from 'react-router-dom';

const AuthLayout = () => {
  return (
    <div className=" flex items-center justify-center ">
      <Outlet />
    </div>
  );
};

export default AuthLayout;
