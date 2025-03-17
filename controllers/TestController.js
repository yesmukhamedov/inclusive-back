import TestModel from "../models/Test.js";
import Progress from "../models/Progress.js";
import User from "../models/User.js";

export const getQuiz = async (req, res) => {
  try {
    res.json(
      await TestModel.aggregate([
        { $match: { collectionName: req.params.collectionName } },
        {
          $sample: {
            size: Math.min(
              parseInt(req.params.count),
              await TestModel.countDocuments({
                collectionName: req.params.collectionName,
              })
            ),
          },
        },
        {
          $project: {
            _id: 1,
            text: 1,
            options: {
              _id: 1,
              text: 1,
            },
          },
        },
      ])
    );
  } catch (err) {
    console.log(err);
    res.status(500).json({
      status: {
        type: "error",
        message: "Жүктеу орындалмады",
        description: "Тесттерді жүктеу кезіндегі қате",
      },
    });
  }
};

export const getCollection = async (req, res) => {
  try {
    res.json(
      await TestModel.find({ collectionName: req.params.collectionName }).sort({
        updatedAt: -1,
      })
    );
  } catch (err) {
    console.log(err);
    res.status(500).json({
      status: {
        type: "error",
        message: "Жүктеу орындалмады",
        description: "Тесттерді жүктеу кезіндегі қате",
      },
    });
  }
};

export const checking = async (req, res) => {
  try {
    const { id, collectionName, questions } = req.body;

    const testResults = [];
    console.log("66=>", id, collectionName, testResults);
    for (const questionData of questions) {
      const { _id, answers } = questionData;
      const question = await TestModel.findById(_id);

      if (!question) {
        return res.status(400).json({
          status: {
            type: "error",
            message: "Қате",
            description: "Ұсынылған жауаптардағы сұрақ _id қате",
          },
        });
      }

      testResults.push({
        ...question,
        options: question?.options?.map((option) => ({
          ...option,
          answer: answers.includes(option.text),
          result: option.truth
            ? answers.includes(option.text)
            : !answers.includes(option.text),
        })),
      });
    }

    const student = await User.findById(id);
    const progress = await Progress.findById(id);
    if (!student) {
      return res.status(404).json({
        status: {
          type: "error",
          message: "Тексеру орындалмады",
          description: "Ұсынылған student _id бойынша қолданушы табылмады",
        },
      });
    } else if (progress) {
      console.log("105=>", id, collectionName, testResults);
      await Progress.findByIdAndUpdate(
        { _id: progress._id },
        {
          $push: {
            quiz: {
              collectionName: collectionName,
              questions: testResults,
            },
          },
        }
      );
    } else {
      console.log("118=>", id, collectionName, testResults);
      await Progress.create({
        _id: id,
        quiz: [
          {
            collectionName: collectionName,
            questions: testResults,
          },
        ],
      });
    }

    res.status(200).json({
      status: {
        type: "success",
        message: "Жауаптар сәтті тексерілді",
        description: "Нәтижелерді жеке парақшадан көре аласыз",
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: {
        type: "error",
        message: "Тексеру орындалмады",
        description: "Тесттерді тексеру кезіндегі қате",
      },
    });
  }
};

export const fetchResult = async (req, res) => {
  try {
    const progress = await Progress.findOne({ _id: req.params._id });
    if (!progress) {
      return res.status(403).json({
        status: {
          type: "info",
          message: "Бұл сіз үшін алғашқы деңгеі сынау",
          description: "Барлық жауаптарыңыз бен деректер жазылатынын ескертеміз. Сәттілік!!",
        },
      });
    }

    const quiz = progress.quiz.find((item) => item.collectionName === req.params.collectionName);
    if (!quiz) {
      return res.status(404).json({
        status: {
          type: "info",
          message: "Тестлеу сәтті жүктелді",
          description: "Сәттілік, сізде 30 минут!!",
        },
      });
    }
    res.json(quiz);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: {
        type: "error",
        message: "Сұрау орындалмады",
        description: "Нәтижелерді сұрау кезіндегі қате",
      },
    });
  }
};

export const fetchProgress = async (req, res) => {
  try {
    const progress = await Progress.findOne({ _id: req.params._id });
    if (!progress) {
      return res.status(404).json({
        status: {
          type: "error",
          message: "Сұрау орындалмады",
          description: "Ұсынылған _id бойынша студент нәтижелері табылмады",
        },
      });
    }

    const totalOptions = progress.quiz.reduce(
      (acc, item) =>
        acc +
        item.questions.reduce(
          (subAcc, subItem) => subAcc + subItem.options.length,
          0
        ),
      0
    );
    const correctAnswers = progress.quiz.reduce((acc, item) => {
      const correct = item.questions.filter((q) =>
        q.options.every((o) => o.result)
      );
      return acc + correct.length;
    }, 0);
    const successPercentage = (correctAnswers / totalOptions) * 100;

    res.json({
      quiz: progress.quiz,
      progress: successPercentage,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: {
        type: "error",
        message: "Сұрау орындалмады",
        description: "Нәтижелерді сұрау кезіндегі қате",
      },
    });
  }
};

export const fetchResults = async (req, res) => {
  try {
    const supervisor = await User.findById(req.params.supervisorId);
    if (!supervisor) {
      return res.status(404).json({
        status: {
          type: "error",
          message: "Сұрау орындалмады",
          description: "Ұсынылған _id бойынша жетекші табылмады",
        },
      });
    }

    const students = await User.find({ supervisor: req.params.supervisorId });
    const results = [];
    for (const student of students) {
      const progress = await Progress.findOne({ _id: student._id });
      if (progress) {
        const quiz = progress.quiz.find(
          (item) => item.collectionName === req.params.collectionName
        );
        const totalOptions = progress.quiz.reduce(
          (acc, item) =>
            acc +
            item.questions.reduce(
              (subAcc, subItem) => subAcc + subItem.options.length,
              0
            ),
          0
        );
        const correctAnswers = progress.quiz.reduce(
          (acc, item) =>
            acc +
            item.questions.reduce(
              (subAcc, subItem) =>
                subAcc +
                subItem.options.filter((option) => option.result).length,
              0
            ),
          0
        );

        const successRate = (correctAnswers / totalOptions) * 100;
        if (quiz) {
          results.push({
            studentId: student._id,
            result: successRate,
            answers: quiz,
          });
        }
      }
    }

    res.json(results);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: {
        type: "error",
        message: "Сұрау орындалмады",
        description: "Нәтижелерді сұрау кезіндегі қате",
      },
    });
  }
};

export const add = async (req, res) => {
  try {
    await TestModel.create(req.body);
    res.json({
      status: {
        type: "success",
        message: "Сәтті орындалды",
        description: "Тест сәтті сақталды",
      },
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      status: {
        type: "error",
        message: "Сақтау орындалмады",
        description: "Тесттерді сақтау кезіндегі қате",
      },
    });
  }
};

export const update = async (req, res) => {
  try {
    if (
      !(await TestModel.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
      }))
    )
      return res.status(404).json({
        status: {
          type: "error",
          message: "Тест табылмады",
          description: "Тест табылмады id: " + req.params.id,
        },
      });
    res.json({
      status: {
        type: "success",
        message: "Сәтті орындалды",
        description: "Тест сәтті өңделді",
      },
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      status: {
        type: "error",
        message: "Өңдеу орындалмады",
        description: "Тестті өңдеу кезіндегі қате",
      },
    });
  }
};

export const remove = async (req, res) => {
  try {
    if (!(await TestModel.findByIdAndDelete(req.params.id)))
      return res.status(404).json({
        status: {
          type: "error",
          message: "Тест табылмады",
          description: "Тест табылмады id: " + req.params.id,
        },
      });
    res.json({
      status: {
        type: "success",
        message: "Сәтті орындалды",
        description: "Тест сәтті өшірілді",
      },
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      status: {
        type: "error",
        message: "Өшіру орындалмады",
        description: "Тестті өшіру кезіндегі қате",
      },
    });
  }
};
