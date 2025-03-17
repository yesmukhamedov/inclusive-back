import mongoose from "mongoose";

const ProgressSchema = new mongoose.Schema({
  quiz: {
    type: [
      {
        collectionName: {
          type: String,
          required: true,
        },
        questions: {
          type: [
            {
              _id: {
                type: String,
                required: true,
              },
              text: {
                type: String,
                required: true,
              },
              options: {
                type: [
                  {
                    _id: {
                      type: String,
                      required: true,
                    },
                    text: {
                      type: String,
                      required: true,
                    },
                    truth: {
                      type: Boolean,
                      default: false,
                    },
                    answer: {
                      type: Boolean,
                      default: false,
                    },
                    result: {
                      type: Boolean,
                      default: false,
                    },
                  },
                ],
                default: false,
              },
            },
          ],
          default: false,
        },
      },
    ],
    required: true,
  },
});

export default mongoose.model("Progress", ProgressSchema);
