import { UserRole } from '@firewall-backend/enums';
import { User } from '../entities/user.entity';

export const mockUser: User = {
  id: 1,
  uuid: '123e4567-e89b-12d3-a456-426614174000', // Added uuid property
  username: 'test-user',
  hashedPassword: 'hashed-password',
  role: UserRole.User,
  userEmail: 'testuser@example.com',
  createdAt: new Date(),
  updatedAt: new Date(),
  addedByUid: null,
  addedBy: null,
  updatedByUid: null,
  updatedBy: null,
  active: true,
};
