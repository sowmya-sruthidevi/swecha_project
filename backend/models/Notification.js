import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    relatedGroupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'StudyGroup',
    },
    type: {
      type: String,
      enum: ['group_created', 'system'],
      default: 'group_created',
    }
  },
  { timestamps: true }
);

export default mongoose.model('Notification', notificationSchema);
