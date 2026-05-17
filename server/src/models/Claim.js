const mongoose = require('mongoose');

const CLAIM_STATUSES = ['new', 'verified', 'rejected'];

const claimSchema = new mongoose.Schema(
  {
    claimText: {
      type: String,
      required: true,
      trim: true,
    },
    llmOutputId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    extractedAt: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
    },
    status: {
      type: String,
      required: true,
      enum: CLAIM_STATUSES,
      default: 'new',
      index: true,
    },
    categories: {
      type: [String],
      default: [],
    },
    tags: {
      type: [String],
      default: [],
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

claimSchema.index({ status: 1, extractedAt: -1 });

const Claim = mongoose.model('Claim', claimSchema);

module.exports = { Claim, CLAIM_STATUSES };
