/*
 *
 *
 *       Complete the API routing below
 *
 *
 */

'use strict';

var expect = require('chai').expect;
var mongoose = require('mongoose');
var MongoClient = require("mongodb").MongoClient;
var ObjectId = require("mongodb").ObjectId;

const uri = process.env.MONGO_URI;
mongoose.connect(uri, {
  useNewUrlParser: true,
  useCreateIndex: true,
  useUnifiedTopology: true
});

const connection = mongoose.connection;
connection.once('open', () => {
  console.log("MongoDB database connection established successfully");
});

const threadSchema = new mongoose.Schema({
  board: { type: String, required: true },
  text: { type: String, required: true },
  delete_password: { type: String, required: true },
  created_on: { type: Date, default: Date.now },
  bumped_on: { type: Date, default: Date.now },
  reported: { type: Boolean, default: false },
  replies: {
    type: [{
      text: { type: String, required: true },
      delete_password: { type: String, required: true },
      created_on: { type: Date, default: Date.now },
      reported: { type: Boolean, required: true }
    }],
    default: []
  },
  replycount: { type: Number, default: 0 }
});

const Thread = mongoose.model('Thread', threadSchema);

const sanitizeReply = reply => {
  const result = reply.toObject();
  delete result.delete_password;
  delete result.reported;
  return result;
};

const sanitizeThread = thread => {
  const result = thread.toObject();
  result.replycount = result.replies.length;
  result.replies = result.replies.slice(-3).map(reply => {
    const sanitized = { ...reply };
    delete sanitized.delete_password;
    delete sanitized.reported;
    return sanitized;
  });
  return result;
};

module.exports = function (app) {
  app.route('/api/threads/:board')
    .get(async (req, res) => {
      try {
        const threads = await Thread.find(
          { board: req.params.board },
          '-__v -reported -delete_password'
        ).limit(10).sort({ bumped_on: -1 });

        res.json(threads.map(sanitizeThread));
      } catch (error) {
        res.status(500).send('database error');
      }
    })
    .post(async (req, res) => {
      try {
        const thread = await Thread.create({
          board: req.params.board,
          text: req.body.text,
          delete_password: req.body.delete_password
        });
        res.redirect(`/b/${req.params.board}/${thread._id}`);
      } catch (error) {
        res.status(400).send('invalid thread');
      }
    })
    .put(async (req, res) => {
      try {
        const thread = await Thread.findById(req.body.thread_id);
        if (!thread) return res.status(404).send('incorrect thread id');
        thread.reported = true;
        await thread.save();
        res.status(200).send('success');
      } catch (error) {
        res.status(400).send('incorrect thread id');
      }
    })
    .delete(async (req, res) => {
      try {
        const thread = await Thread.findById(req.body.thread_id);
        if (!thread) return res.status(404).send('incorrect id');
        if (thread.delete_password !== req.body.delete_password) {
          return res.status(401).send('incorrect password');
        }
        await Thread.findByIdAndDelete(req.body.thread_id);
        res.status(200).send('success');
      } catch (error) {
        res.status(400).send('incorrect id');
      }
    });

  app.route('/api/replies/:board')
    .get(async (req, res) => {
      try {
        const thread = await Thread.findById(
          req.query.thread_id,
          '-__v -reported -delete_password'
        );
        if (!thread) return res.status(404).send('incorrect thread id');
        res.json(sanitizeThread(thread));
      } catch (error) {
        res.status(400).send('incorrect thread id');
      }
    })
    .post(async (req, res) => {
      try {
        const thread = await Thread.findById(req.body.thread_id);
        if (!thread) return res.status(404).send('incorrect thread id');

        thread.replies.push({
          text: req.body.text,
          delete_password: req.body.delete_password,
          reported: false
        });
        thread.replycount = thread.replies.length;
        thread.bumped_on = Date.now();
        await thread.save();

        res.redirect(`/b/${req.params.board}/${thread._id}`);
      } catch (error) {
        res.status(400).send('incorrect thread id');
      }
    })
    .put(async (req, res) => {
      try {
        const thread = await Thread.findById(req.body.thread_id);
        if (!thread) return res.status(404).send('incorrect thread id');

        const reply = thread.replies.id(req.body.reply_id);
        if (!reply) return res.status(404).send('no id found');

        reply.reported = true;
        await thread.save();
        res.status(200).send('success');
      } catch (error) {
        res.status(404).send('incorrect thread id');
      }
    })
    .delete(async (req, res) => {
      try {
        const thread = await Thread.findById(req.body.thread_id);
        if (!thread) return res.status(404).send('incorrect thread id');

        const reply = thread.replies.id(req.body.reply_id);
        if (!reply) return res.status(404).send('id not found');
        if (reply.delete_password !== req.body.delete_password) {
          return res.status(200).send('incorrect password');
        }

        reply.text = '[deleted]';
        await thread.save();
        res.status(200).send('success');
      } catch (error) {
        res.status(400).send('incorrect thread id');
      }
    });
};
