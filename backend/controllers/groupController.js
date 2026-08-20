import mongoose from 'mongoose';
import StudyGroup from '../models/StudyGroup.js';
import User from '../models/User.js';

export const createGroup = async (req, res) => {
  try {
    const {
      groupName,
      subject,
      description,
      date,
      time,
      location,
      meetingLink,
      maxMembers,
    } = req.body;

    if (!groupName || !subject || !description || !location) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    const creator = await User.findById(req.user._id);
    if (!creator) {
      return res.status(404).json({ message: 'User not found' });
    }

    const duplicate = await StudyGroup.findOne({
      groupName: groupName.trim(),
      subject: subject.trim(),
      createdBy: req.user._id,
      date: date || '',
      time: time || '',
    });
    if (duplicate) {
      return res.status(409).json({
        message: 'A group with the same name, subject, date, and time already exists.',
      });
    }

    const group = await StudyGroup.create({
      groupName,
      subject,
      description,
      date: date || '',
      time: time || '',
      location,
      meetingLink: meetingLink || '',
      maxMembers: maxMembers || 8,
      createdBy: req.user._id,
      creatorName: creator.fullName,
      members: [req.user._id],
    });

    await group.populate('createdBy', 'fullName email');
    await group.populate('members', 'fullName email');

    res.status(201).json({
      success: true,
      message: 'Group created successfully',
      group: {
        ...group.toObject(),
        groupId: group._id.toString(),
      },
    });
  } catch (error) {
    console.error('Create group error:', error);
    res.status(500).json({ message: 'Server error while creating group' });
  }
};

export const getGroups = async (req, res) => {
  try {
    const { subject, search, sort = 'newest' } = req.query;

    let query = { status: 'active' };

    if (subject && subject !== 'All Subjects') {
      query.subject = subject;
    }

    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [
        { groupName: searchRegex },
        { subject: searchRegex },
        { description: searchRegex },
      ];
    }

    let sortOption = { createdAt: -1 };
    if (sort === 'popular') {
      sortOption = { 'members.0': -1, createdAt: -1 };
    } else if (sort === 'available') {
      sortOption = { maxMembers: -1, createdAt: -1 };
    }

    const groups = await StudyGroup.find(query)
      .sort(sortOption)
      .populate('createdBy', 'fullName email')
      .populate('members', 'fullName email');

    const formattedGroups = groups.map((g) => ({
      ...g.toObject(),
      groupId: g._id.toString(),
      currentMembers: g.members.length,
    }));

    res.status(200).json({
      success: true,
      count: formattedGroups.length,
      groups: formattedGroups,
    });
  } catch (error) {
    console.error('Get groups error:', error);
    res.status(500).json({ message: 'Server error while fetching groups' });
  }
};

export const getGroup = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid group ID' });
    }

    const group = await StudyGroup.findById(id)
      .populate('createdBy', 'fullName email')
      .populate('members', 'fullName email');

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    res.status(200).json({
      success: true,
      group: {
        ...group.toObject(),
        groupId: group._id.toString(),
        currentMembers: group.members.length,
      },
    });
  } catch (error) {
    console.error('Get group error:', error);
    res.status(500).json({ message: 'Server error while fetching group' });
  }
};

export const updateGroup = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      groupName,
      subject,
      description,
      date,
      time,
      location,
      meetingLink,
      maxMembers,
    } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid group ID' });
    }

    const group = await StudyGroup.findById(id);
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    if (group.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to edit this group' });
    }

    if (groupName !== undefined) group.groupName = groupName;
    if (subject !== undefined) group.subject = subject;
    if (description !== undefined) group.description = description;
    if (date !== undefined) group.date = date;
    if (time !== undefined) group.time = time;
    if (location !== undefined) group.location = location;
    if (meetingLink !== undefined) group.meetingLink = meetingLink;
    if (maxMembers !== undefined) {
      if (maxMembers < 2) return res.status(400).json({ message: 'Min 2 members required' });
      if (maxMembers < group.members.length) {
        return res.status(400).json({
          message: `Max members cannot be less than current members (${group.members.length})`,
        });
      }
      group.maxMembers = maxMembers;
    }

    const updatedGroup = await group.save();
    await updatedGroup.populate('createdBy', 'fullName email');
    await updatedGroup.populate('members', 'fullName email');

    res.status(200).json({
      success: true,
      message: 'Group updated successfully',
      group: {
        ...updatedGroup.toObject(),
        groupId: updatedGroup._id.toString(),
        currentMembers: updatedGroup.members.length,
      },
    });
  } catch (error) {
    console.error('Update group error:', error);
    res.status(500).json({ message: 'Server error while updating group' });
  }
};

export const deleteGroup = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid group ID' });
    }

    const group = await StudyGroup.findById(id);
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    if (group.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this group' });
    }

    await StudyGroup.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Group deleted successfully',
    });
  } catch (error) {
    console.error('Delete group error:', error);
    res.status(500).json({ message: 'Server error while deleting group' });
  }
};

export const joinGroup = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid group ID' });
    }

    const group = await StudyGroup.findById(id);
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    if (group.members.map((m) => m.toString()).includes(userId.toString())) {
      return res.status(400).json({ message: 'You are already a member of this group' });
    }

    if (group.members.length >= group.maxMembers) {
      return res.status(400).json({ message: 'This group is already full' });
    }

    const updated = await StudyGroup.findOneAndUpdate(
      {
        _id: id,
        members: { $ne: userId },
        $expr: { $lt: [{ $size: '$members' }, '$maxMembers'] },
      },
      { $addToSet: { members: userId } },
      { new: true }
    )
      .populate('createdBy', 'fullName email')
      .populate('members', 'fullName email');

    if (!updated) {
      return res
        .status(400)
        .json({ message: 'Could not join. Group may be full or you are already a member.' });
    }

    res.status(200).json({
      success: true,
      message: 'Successfully joined the group',
      group: {
        ...updated.toObject(),
        groupId: updated._id.toString(),
        currentMembers: updated.members.length,
      },
    });
  } catch (error) {
    console.error('Join group error:', error);
    res.status(500).json({ message: 'Server error while joining group' });
  }
};

export const leaveGroup = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid group ID' });
    }

    const group = await StudyGroup.findById(id);
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    if (group.createdBy.toString() === userId.toString()) {
      return res
        .status(400)
        .json({ message: "Group creator cannot leave the group. Delete the group instead." });
    }

    if (!group.members.map((m) => m.toString()).includes(userId.toString())) {
      return res.status(400).json({ message: 'You are not a member of this group' });
    }

    const updated = await StudyGroup.findByIdAndUpdate(
      id,
      { $pull: { members: userId } },
      { new: true }
    )
      .populate('createdBy', 'fullName email')
      .populate('members', 'fullName email');

    res.status(200).json({
      success: true,
      message: 'You have left the group',
      group: {
        ...updated.toObject(),
        groupId: updated._id.toString(),
        currentMembers: updated.members.length,
      },
    });
  } catch (error) {
    console.error('Leave group error:', error);
    res.status(500).json({ message: 'Server error while leaving group' });
  }
};

export const getDashboardStats = async (req, res) => {
  try {
    const userId = req.user._id;

    const allGroups = await StudyGroup.find({ status: 'active' });

    const created = allGroups.filter(
      (g) => g.createdBy.toString() === userId.toString()
    ).length;

    const joined = allGroups.filter((g) => {
      const isCreator = g.createdBy.toString() === userId.toString();
      const isMember = g.members
        .map((m) => m.toString())
        .includes(userId.toString());
      return isMember && !isCreator;
    }).length;

    const available = allGroups.filter((g) => {
      const isCreator = g.createdBy.toString() === userId.toString();
      const isMember = g.members
        .map((m) => m.toString())
        .includes(userId.toString());
      return !isCreator && !isMember && g.members.length < g.maxMembers;
    }).length;

    const upcoming = created + joined;

    res.status(200).json({
      success: true,
      stats: {
        groupsCreated: created,
        groupsJoined: joined,
        availableGroups: available,
        upcomingSessions: upcoming,
        totalGroups: allGroups.length,
      },
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ message: 'Server error while fetching stats' });
  }
};

export const getPublicStats = async (req, res) => {
  try {
    const [totalGroups, totalUsers] = await Promise.all([
      StudyGroup.countDocuments({ status: 'active' }),
      User.countDocuments({}),
    ]);

    res.status(200).json({
      success: true,
      stats: {
        totalGroups,
        totalUsers,
      },
    });
  } catch (error) {
    console.error('Public stats error:', error);
    res.status(200).json({
      success: true,
      stats: { totalGroups: 0, totalUsers: 0 },
    });
  }
};
