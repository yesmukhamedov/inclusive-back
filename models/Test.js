import mongoose from "mongoose";

const OptionSchema = new mongoose.Schema({
    text: {
        type: String,
        required: true,
    },
    truth: {
        type: Boolean,
        default: false,
    },
}, {
    timestamps: true,
});

const QuestionSchema = new mongoose.Schema({
    collectionName: {
        type: String,
        required: true,
    },
    text: {
        type: String,
        required: true,
    },
    options: {
        type: [OptionSchema],
        required: true,
    },
}, {
    timestamps: true,
});

export default mongoose.model('Test', QuestionSchema);