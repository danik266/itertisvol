import type { IUser } from '@/models/User';

/** Единое публичное представление пользователя для всех auth-роутов. */
export function serializeUser(user: IUser) {
  return {
    _id: user._id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    city: user.city,
    phone: user.phone,
    dob: user.dob,
    accountType: user.accountType,
    entityType: user.entityType,
    orgName: user.orgName,
    activityType: user.activityType,
    address: user.address,
    avatar: user.avatar,
    bio: user.bio,
    socials: user.socials,
    directions: user.directions,
    direction: user.direction,
    scores: user.scores,
    appliedEvents: user.appliedEvents,
    generationHistory: user.generationHistory,
    generationCount: user.generationCount,
    isBlocked: user.isBlocked,
    role: user.role,
  };
}
