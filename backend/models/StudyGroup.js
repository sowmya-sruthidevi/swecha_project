import mongoose from 'mongoose';

const studyGroupSchema = new mongoose.Schema(
  {
    groupName: {
      type: String,
      required: [true, 'Group name is required'],
      trim: true,
      minlength: [3, 'Group name must be at least 3 characters'],
    },
    subject: {
      type: String,
      required: [true, 'Subject is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      minlength: [10, 'Description must be at least 10 characters'],
    },
    date: {
      type: String,
      default: '',
    },
    time: {
      type: String,
      default: '',
    },
    location: {
      type: String,
      required: [true, 'Location is required'],
      trim: true,
    },
    meetingLink: {
      type: String,
      default: '',
      trim: true,
    },
    maxMembers: {
      type: Number,
      required: [true, 'Max members is required'],
      min: [2, 'Minimum 2 members required'],
      max: [50, 'Maximum 50 members allowed'],
      default: 8,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    status: {
      type: String,
      enum: ['active', 'archived'],
      default: 'active',
    },
    creatorName: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

studyGroupSchema.pre('save', function (next) {
  if (this.isNew && this.createdBy) {
    if (!this.members.includes(this.createdBy)) {
      this.members.push(this.createdBy);
    }
  }
  next();
});

const StudyGroup = mongoose.model('StudyGroup', studyGroupSchema);

export default StudyGroup;
