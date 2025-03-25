import mongoose from "mongoose";

const Theme = new mongoose.Schema({
    description: {
        type: String,
        required: true,
    },
    color: {
        type: String,
        required: true,
    },
    slowingDown: {
        type: Number,
        required: true,
    },
    fontSize: {
        type: Number,
        required: true,
    },
    subtitle: {
        type: Boolean,
        default: false,
    },
}, {
    timestamps: false,
});

const UserSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        lowercase: true,
        required: true,
        unique: true
    },
    passwordHash: {
        type: String,
        // select: false,
        required: true,
    },
    supervisor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    class: {
        type: Number,
        required: false,
        default: 0,
        min: 0,
        max: 4,
    },
    special: {
        type: Boolean,
        default: false,
    },
    theme: {
        type: Theme,
        required: false, //()=>this.special
    }
}, {
    timestamps: true,
});

export default mongoose.model('User', UserSchema);