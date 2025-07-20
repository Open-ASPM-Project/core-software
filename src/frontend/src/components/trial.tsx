// src/components/UserList.tsx
import React from 'react';
import { withAPIRequest, WithAPIRequestProps } from '@/hoc/withAPIRequest';
import { Card, CardContent } from '@/components/ui/card';

interface User {
  id: number;
  name: string;
}

interface UserListProps extends WithAPIRequestProps {
  title?: string;
}

const UserList: React.FC<UserListProps> = ({ commonAPIRequest, title = 'Users' }) => {
  const [users, setUsers] = React.useState<User[]>([]);

  React.useEffect(() => {
    commonAPIRequest<User[]>(
      {
        api: '/users',
        method: 'GET',
        showSuccessToast: false,
      },
      (response) => {
        if (response) {
          setUsers(response);
        }
      }
    );
  }, [commonAPIRequest]);

  // Example of a POST request
  const createUser = (userData: Partial<User>) => {
    commonAPIRequest<User>(
      {
        api: '/users',
        method: 'POST',
        data: userData,
        showSuccessToast: true,
        successMessage: 'User created successfully',
        errorMessage: 'Failed to create user',
      },
      (response) => {
        if (response) {
          setUsers((prev) => [...prev, response]);
        }
      }
    );
  };

  return (
    <Card>
      <CardContent>
        {users.map((user) => (
          <div key={user.id}>{user.name}</div>
        ))}
      </CardContent>
    </Card>
  );
};

// Configure and export the wrapped component
export default withAPIRequest({
  baseURL: 'https://api.example.com',
  unauthorizedRedirect: '/auth/login',
})(UserList);
