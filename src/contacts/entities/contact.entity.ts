export enum ContactStatus {
  NEW = 'NEW',
  READ = 'READ',
  IN_PROGRESS = 'IN_PROGRESS',
  RESOLVED = 'RESOLVED',
  SPAM = 'SPAM',
}

export interface ContactMessage {
  id: string;
  applicationId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  message: string;
  metadata?: any;
  status: ContactStatus;
  createdAt: string;
  updatedAt: string;
}
