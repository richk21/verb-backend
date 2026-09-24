import Notification, { NotificationType } from '../models/Notification';

interface CreateNotificationParams {
  userId: string;
  orgId: string;
  type: NotificationType;
  message: string;
  link: string;
}

/**
 * Same fire-and-forget-but-logged pattern as logAction — a notification
 * failure should never block the operation that triggered it.
 */
export const createNotification = async (params: CreateNotificationParams): Promise<void> => {
  try {
    await Notification.create(params);
  } catch (err) {
    console.error('[notifications] Failed to create notification:', err);
  }
};
