import mongoose from 'mongoose';

const knowledgeChunkSchema = new mongoose.Schema(
  {
    chunkId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    category: {
      type: String,
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    tags: [
      {
        type: String,
        index: true,
      },
    ],
    vector: [
      {
        type: Number,
      },
    ],
  },
  { timestamps: true }
);

// Create compound index for keyword text search as well
knowledgeChunkSchema.index({ title: 'text', content: 'text', tags: 'text' });

export default mongoose.model('KnowledgeChunk', knowledgeChunkSchema);
