var express = require("express");
const fs = require("fs");
var cal = require("../jsmodules/createics");
var router = express.Router();
var moment = require("moment");
const { dirname } = require("path");
let appDir = dirname(require.main.filename);
var lastIndex = appDir.lastIndexOf("/");
appDir = appDir.substring(0, lastIndex);

/* GET home page. */
router.get("/", function (req, res, next) {
  res.send("CVWO ICS Subscription Service");
});

router.get("/api/calendarsubscription/:calname", function (req, res, next) {
  const file = appDir + "/Calendars/CVWO/Users/" + req.params.calname + ".ics";
  res.download(file);
});

router.post("/api/createCalendar/submitData", function (req, res, next) {
  const taskArray = req.body.data;
  function createTaskCalendar(item) {
    const dateObj = moment(item.dueDate).subtract(30, "minute");
    const year = dateObj.format("YYYY");
    const month = dateObj.format("M");
    const day = dateObj.format("D");
    const startHour = dateObj.format("H");
    const startMinute = dateObj.format("m");
    const start = [year, month, day, startHour, startMinute];
    return {
      start: start, // [year, month, day, start hour, start minute]
      duration: { minutes: 30 }, //{hours: 6, minutes: 30}
      title: item.title + ", (DUE 30 min)", //Period 3, Booked
      description: item.description, //optional
      url: "https://laughing-bassi-1b3575.netlify.app/",
    };
  }
  const taskCalendar = taskArray.map(createTaskCalendar);
  try {
    cal.createCalCVWOTasks(req.body.userName, taskCalendar);
    res.json({
      message: "successfully created calendar for user " + req.body.userName,
    });
  } catch (e) {
    res.status(400).json({ message: e });
  }
});

module.exports = router;
