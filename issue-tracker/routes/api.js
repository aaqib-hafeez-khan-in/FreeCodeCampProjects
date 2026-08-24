/*
 *
 *
 *       Complete the API routing below
 *
 *
 */

"use strict";

var expect = require("chai").expect;
var MongoClient = require("mongodb");
var ObjectId = require("mongodb").ObjectID;
const mongoose = require("mongoose");

const CONNECTION_STRING = process.env.DATABASE;

module.exports = function(app) {
  let issueSchema = new mongoose.Schema({
    project: {
      type: String,
      required: true,
      select: false
    },
    issue_title: {
      type: String,
      required: true
    },
    issue_text: {
      type: String,
      required: true
    },
    created_by: {
      type: String,
      required: true
    },
    assigned_to: {
      type: String,
      default: ""
    },
    status_text: {
      type: String,
      default: ""
    },
    open: {
      type: Boolean,
      default: true
    },
    created_on: String,
    updated_on: String
  });

  issueSchema.pre("save", function(next) {
    if (!this.created_on) {
      this.created_on = new Date().toISOString();
    }
    this.updated_on = new Date().toISOString();
    next();
  });

  var Issue = mongoose.model("test", issueSchema);

  function required(issue, requiredFields) {
    let errors = [];

    requiredFields.forEach(field => {
      if (!issue[field]) {
        errors.push(field);
      }
    });

    if (errors.length) {
      return "Missing required fields: " + errors.join(", ");
    }
  }

  function populate(source, fields, obj = {}) {
    fields.forEach(field => {
      if (source[field] !== undefined) {
        obj[field] = source[field];
      }
    });
    return obj;
  }

  app
    .route("/api/issues/:project")
    .get(function(req, res) {
      let fields = [
        "issue_title",
        "issue_text",
        "created_by",
        "assigned_to",
        "status_text",
        "open",
        "created_on",
        "updated_on"
      ];
      let query = populate(req.query, fields);
      query.project = req.params.project;

      if (req.query._id) {
        try {
          query._id = ObjectId(req.query._id);
        } catch (err) {
          return res.status(400).send("Invalid _id");
        }
      }

      Issue.find(query, (err, issues) => {
        if (err) {
          return res.status(500).json(err);
        }
        res.json(issues);
      });
    })

    .post(function(req, res) {
      req.body.project = req.params.project;
      let err = required(req.body, [
        "project",
        "issue_title",
        "issue_text",
        "created_by"
      ]);
      if (err) {
        return res.status(400).send(err);
      }

      let fields = [
        "project",
        "issue_title",
        "issue_text",
        "created_by",
        "assigned_to",
        "status_text"
      ];
      let newIssue = new Issue(populate(req.body, fields));
      newIssue.save((err, issue) => {
        if (err) {
          return res.status(500).json(err);
        }
        res.json(issue);
      });
    })

    .put(function(req, res) {
      let project = req.params.project;
      let _id = req.body._id;
      if (!_id) {
        return res.status(400).send("_id error");
      }

      try {
        _id = ObjectId(_id);
      } catch (err) {
        return res.status(400).send("_id error");
      }

      let fields = [
        "issue_title",
        "issue_text",
        "created_by",
        "assigned_to",
        "status_text",
        "open"
      ];
      let query = populate(req.body, fields);
      if (!Object.keys(query).length) {
        return res.status(400).send("No Updated file sent");
      }

      Issue.findOne({ _id, project })
        .then(issue => {
          if (!issue) {
            throw new Error("could not update " + _id);
          }
          issue = populate(query, fields, issue);
          return issue.save();
        })
        .then(() => {
          res.send("succesfully updated");
        })
        .catch(err => {
          res.status(500).send("could not updated " + _id);
        });
    })

    .delete(function(req, res) {
      let project = req.params.project;
      let _id = req.body._id;
      if (!_id) {
        return res.status(400).send("no _id");
      }

      try {
        _id = ObjectId(_id);
      } catch (err) {
        return res.status(400).send("invalid _id");
      }

      Issue.findOneAndDelete({ _id, project }, (err, issue) => {
        if (err) {
          return res.status(500).send("could not delete " + _id);
        }
        if (!issue) {
          return res.status(404).send("could not delete " + _id);
        }
        res.send("deleted " + _id);
      });
    });
};
