import { UserRole } from '@firewall-backend/enums';

export interface UserResponse {
  active: boolean;
  addedBy: UserResponse | null;
  createdAt: Date;
  role: UserRole;
  updatedAt: Date;
  updatedBy: UserResponse | null;
  userEmail: string;
  username: string;
  uuid: string;
}
