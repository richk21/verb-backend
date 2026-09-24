import Notification from '../Notification';
import Report from '../Report';

describe('Mongo document ID serialization', () => {
  it('exposes id as a virtual for notifications', () => {
    const notification = new Notification({
      userId: 'user-1',
      orgId: '507f1f77bcf86cd799439011',
      type: 'report_published',
      message: 'Published',
      link: '/reports/123',
      read: false,
      createdAt: new Date('2024-01-01T00:00:00.000Z'),
    });

    expect(notification.toJSON()).toMatchObject({
      id: expect.any(String),
      userId: 'user-1',
      type: 'report_published',
    });
    expect(notification.toJSON()).not.toHaveProperty('_id');
  });

  it('keeps report id serialization consistent', () => {
    const report = new Report({
      title: 'Example',
      hashtags: ['one'],
      coverImage: null,
      content: 'Body',
      authorId: 'user-1',
      authorName: 'Jane',
      authorAvatar: '',
      createdAt: new Date('2024-01-01T00:00:00.000Z'),
      orgId: '507f1f77bcf86cd799439011',
      status: 'draft',
    });

    expect(report.toJSON()).toHaveProperty('id');
    expect(report.toJSON()).not.toHaveProperty('_id');
  });
});
