const AWS = require('aws-sdk');
const accessKey = "xxx"
const secretAccessKey = 'xxx'
const region = 'xxx'
const calendar = require("../createics");
const mainMods = require("./mainjsmodules_For_DCBOOKINGS")
const moment = require("moment")
const fs = require('fs');

var allRooms; // contains the JSON of all rooms {success, Items or Message. }
var allUsers; // contains the JSON of all users {success, Items or Message. }
var singleUser;  // contains the JSON of single {success, Items or Message. }
var currentWeek; // contains 1 or 2 depending on the currentWeek.
var userUpdateComplete = false;
var allUserUpdateComplete = true;
var allCurrentWeeksandWeekBeginningLog = [] //["WEEK BEGINNING IN STRING FORM", currentWeek integer] and so on,

function bubble_SortJSONMilestoneArray(a,sortValue){
//bubble sort algorithm, used throughout to sort JSON MILESTONE Arrays, sort value is the value inside the json object that will be sorted, secondary sort value will be the second data to be sorted iF the first sort array is equal
    var swapp;
    var n = a.length-1;
    var x=a;
    do {
        swapp = false;
        for (var i=0; i < n; i++)
        {
            if (mainMods.transformCurrentWeek(x[i][sortValue]) > mainMods.transformCurrentWeek(x[i+1][sortValue]))
            {
                var temp = x[i];
                x[i] = x[i+1];
                x[i+1] = temp;
                swapp = true;
            }
        }
        n--;
    } while (swapp);
    return x;
}

var get = {
    allRooms: function(){
        AWS.config.update({
            accessKeyId: accessKey,
            secretAccessKey: secretAccessKey,
            region: region
        });
        const docClient = new AWS.DynamoDB.DocumentClient();
        const params = {
            TableName: "DCBBookings_Rooms"
        };
        docClient.scan(params, function (err, data) {

            if (err) {
                console.log(err)
                allRooms = {success: false, message: err}
            }
            else {
                const { Items } = data;
                //console.log({allRooms: Items});
                allRooms = {success: true, data: Items}
            }
        });
    },
    allUsers: function(){
        AWS.config.update({
            accessKeyId: accessKey,
            secretAccessKey: secretAccessKey,
            region: region
        });
        const docClient = new AWS.DynamoDB.DocumentClient();
        const params = {
            TableName: "DCB_Bookings_User_DB"
        };
        docClient.scan(params, function (err, data) {
            if (err) {
                console.log(err)
                allUsers = {success: false, message: err}
            }
            else {
                const { Items } = data;
                //console.log({allRooms: Items});
                allUsers = {success: true, data: Items}
            }
        });
    },
    user: function(userEmail){
        AWS.config.update({
            accessKeyId: accessKey,
            secretAccessKey: secretAccessKey,
            region: region
        });
        const docClient = new AWS.DynamoDB.DocumentClient();
        const params = {
            TableName: "DCB_Bookings_User_DB",
            FilterExpression: "#Key = :searchAttr",
            ExpressionAttributeNames: {
                "#Key": "email",
            },
            ExpressionAttributeValues: {
                ":searchAttr": userEmail,
            }
        };

        docClient.scan(params, onScan);

        function onScan(err, data) {
            if (err) {
                console.log(err)
                singleUser = {success: false, message: JSON.stringify(err, null, 2)}
            }
            else {
                singleUser = {success: true, data: data}
            }
        }

    },
    currentWeek: function(DateGiven){ //param is a JS date Obj.
        currentWeek = null;
        var sortedDates;
        var foundIndex; //index of the date that is needed.
        var currentDate;

        AWS.config.update({
            accessKeyId: accessKey,
            secretAccessKey: secretAccessKey,
            region: region
        });
        const docClient = new AWS.DynamoDB.DocumentClient();
        const params = {
            TableName: "DCBBookings_WeekMilestones"
        };
        docClient.scan(params, function (err, data) {
            if (err) {
                console.log(err)
                allUsers = {success: false, message: err}
            }
            else {
                const { Items } = data;
                //console.log({allRooms: Items});
                sortedDates = bubble_SortJSONMilestoneArray(Items,"WeekBegining")
                //console.log(sortedDates)
                nextStep();
            }
        });

        function nextStep(){
            for(var i = sortedDates.length-1; i>-1; i--)
            {
                currentDate = new Date(DateGiven);
                //console.log(currentDate)
                //console.log(transformYYYYMMDDtoDate(transformCurrentWeek(sortedDates[i].WeekBegining).toString()))
                //console.log(sortedDates)
                if(Date.parse(currentDate) < Date.parse(mainMods.transformYYYYMMDDtoDate(mainMods.transformCurrentWeek(sortedDates[i].WeekBegining).toString())))
                {
                    foundIndex = i-1;
                }
            }
            if(sortedDates[foundIndex] == null)
            {
                foundIndex = sortedDates.length-1;
            }

            //console.log(foundIndex)
            var daysDiff = mainMods.DifferenceInDays(mainMods.transformYYYYMMDDtoDate(mainMods.transformCurrentWeek(sortedDates[foundIndex].WeekBegining).toString()),DateGiven);
            if(daysDiff < 0)
            {
                daysDiff = daysDiff*-1 -1
            }
            else
            {
                daysDiff = daysDiff-1
            }
            //console.log(daysDiff);

            var numOfWeeksSince = Math.trunc(daysDiff/7);
            var decimal = (daysDiff/7) - numOfWeeksSince;
            decimal = decimal.toFixed(5)
            if(decimal == 0.85714)//if its monday
            {
                numOfWeeksSince+=1;
            }
            var OddOrEvenWeeksSince = numOfWeeksSince % 2;

            if(OddOrEvenWeeksSince == 0) // if odd or even since is 0 it means an even number of weeks have passed so the num of weeks is the same else if its odd the current week will be alternate to the one on the milestone table
            {
                currentWeek = parseInt(sortedDates[foundIndex]["Week"])
                if(currentWeek == 1)
                {
                    currentWeek = 1
                }
                else if(currentWeek == 2)
                {
                    currentWeek = 2
                }
            }
            else if(OddOrEvenWeeksSince == 1)
            {
                currentWeek = parseInt(sortedDates[foundIndex]["Week"])
                if(currentWeek == 1)
                {
                    currentWeek = 2
                }
                else if(currentWeek == 2)
                {
                    currentWeek = 1
                }
            }

            //console.log(sortedDates[foundIndex]['WeekBegining']);
            //console.log(daysDiff);
            //console.log(daysDiff/7)
            //console.log(numOfWeeksSince)
            //console.log(OddOrEvenWeeksSince)
            //console.log(currentWeek)

            return currentWeek;
        }
    }
}

var updateCal = {
    user: function(userEmail){
        userUpdateComplete = false;
        //get.user(userEmail)
        //loop through all rooms and find all user bookings with the same useremail. Apply Same Code as before.
        //generate ics to .Calendars/DCBBOOKINGS/Users/userEmail.ics
        get.allRooms();
        console.log("\n    Calendar update process for user: " + userEmail + " initiated.")
        waitout();
        function waitout() {
            if (allRooms == null) {
                setTimeout(waitout, 1000)
                //console.log("Waiting Out On Data...")
            }
            else{
                if(allRooms.success){
                    //console.log(allRooms.data);


                    var ownerEmail = userEmail;
                    var calName = userEmail;
                    var calJsonArray = [];

                    var totalNoOfIterations = 0; //used to calculate Progress
                    var progressCounter = 0; //used to calculate Progress
                    for(var i =0; i <allRooms.data.length; i++){
                        totalNoOfIterations += allRooms.data[i].BookingSchedule.length;
                    }
                    //console.log("Total Number of iterations: " + totalNoOfIterations)
                    var j = 0;
                    var continueWhileJisLessThan = allRooms.data.length - 1;

                    forLoop1();
                    function forLoop1(){
                        //console.log("in Loop 1, Accessing ALL ROOMS iteration: (" + j + "/" + (continueWhileJisLessThan) + ")")
                        var i =0;
                        var continueWhileIisLessThan = allRooms.data[j].BookingSchedule.length - 1;
                        forLoop();
                        function forLoop(){
                            //console.log("in Loop 2, Accessing Room: "+allRooms.data[j].RoomID+"'s Booking Schedule iteration: (" + i + "/" + (continueWhileIisLessThan) + ")")

                            var allperiods = allRooms.data[j].BookingSchedule;
                            //console.log(allperiods)
                            var thirtyMinBooks = JSON.parse(allRooms.data[j].Min30Periods.toLowerCase());
                            var currentWeekBeginning;

                            if(allperiods[0] != "Empty List"){
                                currentWeekBeginning = allperiods[i][allperiods[i].length-1];
                                //console.log(allperiods[i]);
                                if(allperiods[i][1] === ownerEmail){
                                    //console.log("Booking Belongs to User: "+ userEmail + ".\nAccessing...")
                                    if(allCurrentWeeksandWeekBeginningLog.indexOf(currentWeekBeginning) == -1){//checking cache log to see if it's been recently fetched before, in which case no need to fetch again.
                                        get.currentWeek( mainMods.transformYYYYMMDDtoDate(mainMods.transformCurrentWeek(currentWeekBeginning).toString()) );
                                        waitOutFetchingCurrentWeek();
                                    }
                                    else{
                                        currentWeek = allCurrentWeeksandWeekBeginningLog[allCurrentWeeksandWeekBeginningLog.indexOf(currentWeekBeginning)+1]
                                        //console.log("    current week:"+ currentWeek)
                                        setTimeout(nextStep,250)
                                    }
                                }
                                else{
                                    //console.log("Booking Doesn't Belong to User: "+ userEmail + ".\nMoving to Next Booking...")

                                    callNextLoop();
                                }

                                function waitOutFetchingCurrentWeek(){
                                    if(currentWeek==null){
                                        //console.log("Fetching Current Week...")
                                        setTimeout(waitOutFetchingCurrentWeek,1000)
                                    }
                                    else{
                                        //console.log("Current Week: " + currentWeek)
                                        allCurrentWeeksandWeekBeginningLog.push(currentWeekBeginning);
                                        allCurrentWeeksandWeekBeginningLog.push(currentWeek);
                                        //console.log(allCurrentWeeksandWeekBeginningLog);
                                        nextStep();//start Generation Of Cal.
                                    }
                                }

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
                            }
                            else{
                                callNextLoop();
                            }

                            function nextStep(){
                                if ( (allperiods[i][0] === bookedVal || allperiods[i][0] === pendingVal) ) {
                                    var tempjsonstring = "";
                                    var tempStart = []
                                    var startDateObj = mainMods.transformYYYYMMDDtoDate(mainMods.transformCurrentWeek(allperiods[i][allperiods[i].length - 1]).toString());
                                    var startDayObj = mainMods.getDateFromDay(startDateObj, allperiods[i][allperiods[i].length - 2]);
                                    var DayDifference = mainMods.DifferenceInDays(startDateObj, mainMods.transformYYYYMMDDtoDate(mainMods.transformCurrentWeek(currentWeekBeginning).toString()));
                                    var weekDifference = DayDifference / 7;
                                    var title = allRooms.data[j].RoomID + " " + mainMods.getPeriodName(thirtyMinBooks, allperiods[i][allperiods[i].length - 2]) + ", " + allperiods[i][0];
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
                                    description += " || By: " + allperiods[i][1] + " || In ROOM: " + allRooms.data[j].RoomID;

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
                                    //console.log(tempjsonstring);
                                    calJsonArray.push(JSON.parse(tempjsonstring));
                                }
                                callNextLoop();
                            }

                            function callNextLoop(){
                                progressCounter += 1;
                                var progressString = ""
                                for(var k =0; k<Math.round((progressCounter/totalNoOfIterations)*100); k++ ){
                                    progressString += "+"
                                }
                                for(var k =0; k<100 - Math.round((progressCounter/totalNoOfIterations)*100); k++ ){
                                    progressString += "-"
                                }
                                console.log("    Progress "+ Math.round((progressCounter/totalNoOfIterations)*100) +"%: "+progressString)
                                //console.log("\nProgress: "+ Math.round((progressCounter/totalNoOfIterations)*100) + "%\n")
                                i += 1;
                                if(i <= continueWhileIisLessThan){
                                    forLoop();
                                }
                                else{
                                    j+=1;
                                    if(j <= continueWhileJisLessThan){
                                        forLoop1();
                                    }
                                    else{
                                        //console.log(calJsonArray)
                                        calendar.createcalDCBUser(calName, calJsonArray)
                                        console.log("    Process Complete.\n    User: "+ userEmail+"'s Calendar Updated\n")
                                        userUpdateComplete = true;
                                    }
                                }
                            }
                        }
                    }
                }
                else{
                    console.log(allRooms.message);
                }
            }
        }
    }
}

var allUsersDo = {
    updateCalendar: function(){
        allUserUpdateComplete = false;
        allCurrentWeeksandWeekBeginningLog = [];
        var i = 0;
        var continueWhenIisLessThan = 0;
        var totalNoOfIterations = 0;
        var progressCounter = 0;
        get.allUsers()
        console.log("Starting Calendar Update Procedure for: 'All Users'");
        waitout();
        function waitout(){
            if(allUsers == null){
                setTimeout(waitout,1000)
            }
            else{
                //console.log(allUsers);
                i=0
                continueWhenIisLessThan = allUsers.data.length -1;
                totalNoOfIterations = allUsers.data.length;
                forLoop()
            }
        }

        function forLoop(){
            userUpdateComplete = false;
            //console.log(allUsers)
            updateCal.user(allUsers.data[i].email)
            waitout()
            function waitout(){
                if(!userUpdateComplete){
                    setTimeout(waitout,1000)
                }
                else{
                    callNextLoop();
                }
            }
            function callNextLoop(){
                i+=1;
                progressCounter += 1;
                var progressString = ""
                for(var k =0; k<Math.round((progressCounter/totalNoOfIterations)*100); k++ ){
                    progressString += "+"
                }
                for(var k =0; k<100 - Math.round((progressCounter/totalNoOfIterations)*100); k++ ){
                    progressString += "-"
                }
                console.log("OVERALL Progress "+ Math.round((progressCounter/totalNoOfIterations)*100) +"%: "+progressString)

                if(i<=continueWhenIisLessThan){
                    forLoop()
                }
                else{
                    console.log("\nTime: " + moment(new Date()).format("HH:mm:ss") + " All users calendar updated...")
                    allUserUpdateComplete = true;
                }
            }
        }
    },
    allUserUpdateFinished: function(){
        return allUserUpdateComplete;
    },
    cleanUpFiles:{
        calendars:{
            Room: function(){
                allRooms = null;
                get.allRooms()
                waitOut()
                function waitOut(){
                    if(allRooms){
                        cleanUpRoomFiles();
                    }
                    else{
                        setTimeout(waitOut,1000)
                    }
                }
                function cleanUpRoomFiles(){
                    //console.log(allRooms.data);
                    var arrayOfRooms = [];
                    for(let i =0; i<allRooms.data.length; i++){
                        arrayOfRooms.push(allRooms.data[i].RoomID + " (Room).ics")
                    }
                    fs.readdirSync("./").forEach(file => {
                        console.log(file);
                        if(!arrayOfRooms.includes(file)){
                           /* fs.unlink("./Calendars/DCBBOOKINGS/Room/"+file, (err) => {
                                if (err) {
                                    console.error(err)
                                    return
                                }
                                //file removed
                            })*/
                        }
                    });
                }
            },
            users: function(){
                allUsers = null;
                get.allUsers()
                waitOut()
                function waitOut(){
                    if(allUsers){
                        cleanUpUserFiles();
                        //console.log(allUsers)
                    }
                    else{
                        setTimeout(waitOut,1000)
                    }
                }
                function cleanUpUserFiles(){
                    //console.log(allRooms.data);
                    var arrayOfUsers = [];
                    for(let i =0; i<allUsers.data.length; i++){
                        arrayOfUsers.push(allUsers.data[i].email + ".ics")
                    }
                    fs.readdirSync("./").forEach(file => {
                        console.log(file);
                        if(!arrayOfUsers.includes(file)){
                            /*fs.unlink("./"+file, (err) => {
                                if (err) {
                                    console.error(err)
                                    return
                                }
                                //file removed
                            })*/
                        }
                    });
                }
            },
        },
    }
}
module.exports = allUsersDo;
