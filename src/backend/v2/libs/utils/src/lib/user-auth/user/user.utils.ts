import { User } from '@firewall-backend/entities';
import { UserResponse } from '@firewall-backend/types';

export function mapUserResponse(user?: User): UserResponse | null {
  if (!user) {
    return null;
  }

  return {
    active: user.active,
    addedBy: mapUserResponse(user.addedBy),
    createdAt: user.createdAt,
    role: user.role,
    updatedAt: user.updatedAt,
    updatedBy: mapUserResponse(user.updatedBy),
    userEmail: user.userEmail,
    username: user.username,
    uuid: user.uuid,
  };
}
