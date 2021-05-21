var express = require('express');
const fs = require('fs')
var cal = require("../jsmodules/createics")
var mainMods = require("../jsmodules/DCBBOOKINGS/mainjsmodules_For_DCBOOKINGS")
var router = express.Router();
var moment = require('moment');
var updateUsersCal = require("../jsmodules/DCBBOOKINGS/updateUserCalendars")
var cron = require('node-schedule');

var rule = new cron.RecurrenceRule();
rule.hour = 2;
rule.minute = 0;

var j = cron.scheduleJob(rule, function(){
    console.log("Testing Calendar Update...")
    if(updateUsersCal.allUserUpdateFinished()){
        updateUsersCal.updateCalendar()
    }
    else{
        console.log("Calendar currently under update process already.")
    }
});

/* GET home page. */
router.get('/', function(req, res, next) {
   //res.render('index', { title: 'DCBBOOKINGS ICS Subscription Service' });
    updateUsersCal.cleanUpFiles.calendars.users();
    updateUsersCal.cleanUpFiles.calendars.Room();
    res.send("DCBBOOKINGS ICS Subscription Service");
});

router.get('/api/calendarsubscription/:calname/:resostype', function(req, res, next) {
    res.set('Content-Type', 'text/calendar;charset=utf-8');
    res.set('Content-Disposition', 'attachment; filename="'+req.params.calname+'.ics"');
    //res.send(fs.readFileSync('./Calendars/DCBBOOKINGS/'+req.params.resostype+'/'+req.params.calname+'.ics', 'utf8'));
    res.send(fs.readFileSync('../Calendars/DCBBOOKINGS/'+req.params.resostype+'/'+req.params.calname+'.ics', 'utf8'));

});
router.post('/api/createCalendar/submitData', function (req, res, next){

    var allperiods = req.body.newSched;
    var thirtyMinBooks = req.body.thirtyMinBooks;
    var ownerEmail = req.body.ownerEmail;
    var calName = req.body.calName;
    var ResosType = req.body.ResosType;
    var permaSched = req.body.permaSched;
    var currentWeek = req.body.currentWeek;
    var currentWeekBeginning = req.body.currentWeekBeginning
    var calJsonArray = [];

    var bookedVal;
    var unbookedVal;
    var lessonVal;
    var lockedVal;
    var pendingVal;

    if(!thirtyMinBooks)//normal headers
    {
        bookedVal = "booked";
        lockedVal = "locked";
        lessonVal = "lesson";
        unbookedVal = "unbooked";
        pendingVal = "pending";
    }
    else
    {
        bookedVal = "bkd";
        lockedVal = "lck";
        lessonVal = "lsn";
        unbookedVal = "unb";
        pendingVal = "pnd";
    }

    //creating Calendar from permanent schedule

    var intendedDayCoorx;
    var intendedPeriodCoory;
    var intendedWeek; //Week1 Week2 or Week1Week2
    var arrayOfLsnLock = []; //[[lesson or locked, [x,y], week1 or week2, byWho ]]
    for(var i =0; i<permaSched.length; i++){
        if(i == 0){
            intendedWeek = "Week1"
        }
        else{
            intendedWeek = "Week2"
        }
        for(var j = 0; j<permaSched[i].length; j++){
            intendedDayCoorx = j;
            for(var k=0; k<permaSched[i][j].length; k++){
                intendedPeriodCoory = k;
                var tempObj;
                if(permaSched[i][j][k][0] != unbookedVal){
                    tempObj = []
                    tempObj.push(permaSched[i][j][k][0])
                    tempObj.push([intendedDayCoorx,intendedPeriodCoory])
                    tempObj.push(intendedWeek)
                    tempObj.push(permaSched[i][j][k][1])
                    arrayOfLsnLock.push(tempObj)
                }
            }
        }
    }

    for(var i = 0; i < arrayOfLsnLock.length; i++){
        var tempStart = [];
        var rootDate = moment("01012018", 'DDMMYYYY').toDate(); //All Permanent Schedules will begin generation on this date on the calendar
        var dayDifference = mainMods.DifferenceInDays(rootDate, mainMods.transformYYYYMMDDtoDate(mainMods.transformCurrentWeek(currentWeekBeginning).toString()));
        var weekDifference = dayDifference/7;
        var recurrence = "";
        var INTERVAL = "2";
        var startDayObj = mainMods.getDateFromDay(rootDate, arrayOfLsnLock[i][1]);
        var title = mainMods.getPeriodName(thirtyMinBooks, arrayOfLsnLock[i][1]) + ", " + arrayOfLsnLock[i][0];
        var description = arrayOfLsnLock[i][0];
        var durationArray = []; //[startHour, startMin, duration]
        var durationMinJSON;
        var tempjsonstring = "";
        if(!thirtyMinBooks){
            durationArray = mainMods.gettimeFromCoorOneHourPeriods(arrayOfLsnLock[i][1])
        }
        else{
            durationArray = mainMods.gettimeFromCoorThirtyMinPeriods(arrayOfLsnLock[i][1])
        }
        durationMinJSON = "{\"minutes\":" + durationArray[2].toString()+ "}"
        var ownerJSON = "{\"name\": \""+ownerEmail.substr(0, ownerEmail.indexOf("@"))+"\", \"email\":\""+ownerEmail+"\"}"
        var attendeeJSON = "{\"name\": \""+arrayOfLsnLock[i][3].substr(0, arrayOfLsnLock[i][3].indexOf("@"))+"\", \"email\":\""+arrayOfLsnLock[i][3]+"\",\"rsvp\": true, \"partstat\": \"ACCEPTED\", \"role\": \"REQ-PARTICIPANT\"}"
        var alarm = [JSON.stringify({
            action: 'audio',
            trigger: {hours:0,minutes:15,before:true},
            repeat: 0,
            attachType:'VALUE=URI'
        })];

        if(weekDifference % 2 == 0){
            if(currentWeek == 1){
                if(arrayOfLsnLock[i][2] == "Week2"){
                    startDayObj = moment(startDayObj).add(7, 'days');
                }
            }
            if(currentWeek == 2){
                if(arrayOfLsnLock[i][2] == "Week1"){
                    startDayObj = moment(startDayObj).add(7, 'days');
                }
            }
        }
        else{
            if(currentWeek == 1){
                if(arrayOfLsnLock[i][2] == "Week1"){
                    startDayObj = moment(startDayObj).add(7, 'days');
                }
            }
            if(currentWeek == 2){
                if(arrayOfLsnLock[i][2] == "Week2"){
                    startDayObj = moment(startDayObj).add(7, 'days');
                }
            }
        }
        //moment(startDayObj).format("YYYY")
        tempStart = [moment(startDayObj).format("YYYY"), moment(startDayObj).format("M"), moment(startDayObj).format("D"), durationArray[0], durationArray[1]]
        recurrence = "\"recurrenceRule\":\"FREQ=WEEKLY;BYDAY="+mainMods.getDayNameFromCoor(arrayOfLsnLock[i][1])+";INTERVAL="+INTERVAL+";UNTIL="+moment(moment(new Date()).add(5, 'years')).format("YYYYMMDD").toString()+"T160000Z\","

        tempjsonstring = "{\"start\": [" + tempStart + "],\"duration\":"+durationMinJSON+",\"title\":\""+title+"\",\"description\":\""+description+"\",\"url\":\"http://shenyicui.github.io/dcbbookings/Pages/Make_Booking.html\","+recurrence+"\"alarms\":["+alarm+"],\"organizer\":"+ownerJSON+",\"attendees\":["+attendeeJSON+"]}"
        calJsonArray.push(JSON.parse(tempjsonstring));
    }

    //creating Calendar from permanent schedule

    //creating Calendar from userbookings array
    for(var i =0; i < allperiods.length; i++){
        var goAheadAndCreateCal = true;

        if(allperiods[i][0] == bookedVal || allperiods[i][0] == pendingVal) {
            for (var j = 0; j < arrayOfLsnLock.length; j++) { //ensuring what you are booking is not interfering with the Perma Schedule
                if ((allperiods[i][4] == arrayOfLsnLock[j][2]) && (allperiods[i][allperiods[i].length - 2][0] == arrayOfLsnLock[j][1][0]) && (allperiods[i][allperiods[i].length - 2][1] == arrayOfLsnLock[j][1][1])) {
                    goAheadAndCreateCal = false;
                }
            }
        }
        if(goAheadAndCreateCal){
            if (allperiods[i][0] == bookedVal || allperiods[i][0] == pendingVal) {
                var tempjsonstring = "";
                var tempStart = []
                var startDateObj = mainMods.transformYYYYMMDDtoDate(mainMods.transformCurrentWeek(allperiods[i][allperiods[i].length - 1]).toString());
                var startDayObj = mainMods.getDateFromDay(startDateObj, allperiods[i][allperiods[i].length - 2]);
                var DayDifference = mainMods.DifferenceInDays(startDateObj, mainMods.transformYYYYMMDDtoDate(mainMods.transformCurrentWeek(currentWeekBeginning).toString()));
                var weekDifference = DayDifference / 7;
                var title = mainMods.getPeriodName(thirtyMinBooks, allperiods[i][allperiods[i].length - 2]) + ", " + allperiods[i][0];
                var description;
                var durationArray = []; //[startHour, startMin, duration]
                var ownerJSON = "{\"name\": \"" + ownerEmail.substr(0, ownerEmail.indexOf("@")) + "\", \"email\":\"" + ownerEmail + "\"}"
                var attendeeJSON = "{\"name\": \"" + allperiods[i][1].substr(0, allperiods[i][1].indexOf("@")) + "\", \"email\":\"" + allperiods[i][1] + "\",\"rsvp\": true, \"partstat\": \"ACCEPTED\", \"role\": \"REQ-PARTICIPANT\"}"
                var durationMinJSON;
                var recurrence = "";
                var alarm = [JSON.stringify({
                    action: 'audio',
                    trigger: {hours: 0, minutes: 15, before: true},
                    repeat: 0,
                    attachType: 'VALUE=URI'
                })];

                if (allperiods[i][allperiods[i].length - 3] == "N.A") {
                    description = "Event " + allperiods[i][0]
                } else {
                    description = "Event " + allperiods[i][0] + " || " + allperiods[i][allperiods[i].length - 3][0] + ": " + allperiods[i][allperiods[i].length - 3][1];
                }
                description += " || By: " + allperiods[i][1]

                if (!thirtyMinBooks) {
                    durationArray = mainMods.gettimeFromCoorOneHourPeriods(allperiods[i][allperiods[i].length - 2])
                } else {
                    durationArray = mainMods.gettimeFromCoorThirtyMinPeriods(allperiods[i][allperiods[i].length - 2])
                }
                durationMinJSON = "{\"minutes\":" + durationArray[2].toString() + "}"

                if (allperiods[i][3] != -1) {
                    var INTERVAL;
                    if (allperiods[i][4] != "Week1Week2") {
                        INTERVAL = "2"
                    }
                    else {
                        INTERVAL = "1"
                    }

                    if (weekDifference % 2 == 0) {
                        if (currentWeek == 1) {
                            if (allperiods[i][4] == "Week2") {
                                startDayObj = moment(startDayObj).add(7, 'days');
                            }
                        }
                        if (currentWeek == 2) {
                            if (allperiods[i][4] == "Week1") {
                                startDayObj = moment(startDayObj).add(7, 'days');
                            }
                        }
                    }
                    else {
                        if (currentWeek == 1) {
                            if (allperiods[i][4] == "Week1") {
                                startDayObj = moment(startDayObj).add(7, 'days');
                            }
                        }
                        if (currentWeek == 2) {
                            if (allperiods[i][4] == "Week2") {
                                startDayObj = moment(startDayObj).add(7, 'days');
                            }
                        }
                    }

                    recurrence = "\"recurrenceRule\":\"FREQ=WEEKLY;BYDAY=" + mainMods.getDayNameFromCoor(allperiods[i][allperiods[i].length - 2]) + ";INTERVAL=" + INTERVAL + ";UNTIL=" + mainMods.transformCurrentWeek(allperiods[i][3][1]).toString() + "T160000Z\","
                }
                tempStart = [moment(startDayObj).format("YYYY"), moment(startDayObj).format("M"), moment(startDayObj).format("D"), durationArray[0], durationArray[1]]
                //FREQ=WEEKLY;BYDAY=MO;INTERVAL=2;UNTIL=20200622T160000Z
                /*{
                    start: startArray, // [year, month, day, start hour, start minute]
                    duration: durationJSON, //{hours: 6, minutes: 30}
                    title: eventTitle, //Period 3, Booked
                    description: description, //optional
                    url: 'http://shenyicui.github.io/dcbbookings/',
                    organizer: { name: adminName, email: adminEmail },
                    alarms: alarm,
                    recurrenceRule: ...,
                    attendees:
                        [
                            { name: attendeeName, email: attendeeEmail, rsvp: true, partstat: 'ACCEPTED', role: 'REQ-PARTICIPANT'}
                        ]

                }*/

                tempjsonstring = "{\"start\": [" + tempStart + "],\"duration\":" + durationMinJSON + ",\"title\":\"" + title + "\",\"description\":\"" + description + "\",\"url\":\"http://shenyicui.github.io/dcbbookings/Pages/Make_Booking.html\"," + recurrence + "\"alarms\":[" + alarm + "],\"organizer\":" + ownerJSON + ",\"attendees\":[" + attendeeJSON + "]}"
                calJsonArray.push(JSON.parse(tempjsonstring));
            }
        }
    }
    //creating Calendar from userbookings array

    cal.createCalDCBResos(calName, ResosType, calJsonArray)
    res.send(calJsonArray);
});

router.get('/api/calendarsubscription/:userID', function(req, res, next) {
    res.set('Content-Type', 'text/calendar;charset=utf-8');
    res.set('Content-Disposition', 'attachment; filename="'+req.params.userID+'.ics"');
    //res.send(fs.readFileSync('./Calendars/DCBBOOKINGS/Users/'+req.params.userID+'.ics', 'utf8'));
    res.send(fs.readFileSync('../Calendars/DCBBOOKINGS/Users/'+req.params.userID+'.ics', 'utf8'));
});



module.exports = router;
