import { Timestamp } from 'firebase/firestore';

export interface UserProfile {
  uid: string;
  name: string;
  phone: string;
  role: 'parent' | 'child' | 'guardian';
  familyId?: string;
  profileImage?: string;
  createdAt: Timestamp;
}

export interface Family {
  id: string;
  familyName: string;
  createdBy: string;
  createdAt: Timestamp;
  inviteCode: string;
}

export interface FamilyMember {
  uid: string;
  nickname: string;
  role: 'admin' | 'member';
  joinedAt: Timestamp;
}

export interface UserLocation {
  uid: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
  updatedAt: Timestamp;
}

export interface UserStatus {
  uid: string;
  currentStatus: 'Safe' | 'Reached Home' | 'On the Way' | 'Need Help';
  updatedAt: Timestamp;
}

export interface AppState {
  user: UserProfile | null;
  family: Family | null;
  members: (UserProfile & { memberInfo: FamilyMember })[];
  locations: Record<string, UserLocation>;
  statuses: Record<string, UserStatus>;
  loading: boolean;
}
