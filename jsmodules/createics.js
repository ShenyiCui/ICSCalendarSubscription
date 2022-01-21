const fs = require("fs");
const ics = require("ics");
module.exports = {
  createCalDCBResos: function (calName, type, JSONArray) {
    const event = JSONArray;

    /*{
            start: startArray, // [year, month, day, start hour, start minute]
            duration: durationJSON, //{hours: 6, minutes: 30}
            title: eventTitle, //Period 3, Booked
            description: description, //optional
            url: 'http://shenyicui.github.io/dcbbookings/',
            organizer: { name: adminName, email: adminEmail},
            alarms: alarm,
            attendees:
                [
                    { name: attendeeName, email: attendeeEmail, rsvp: true, partstat: 'ACCEPTED', role: 'REQ-PARTICIPANT'},
                ]

        }*/

    ics.createEvents(event, (error, value) => {
      if (error) {
        console.log(error);
      }
      console.log("./Calendars/DCBBOOKINGS/" + type + "/" + calName + ".ics");
      //fs.writeFileSync('./Calendars/DCBBOOKINGS/'+type+'/'+calName+'.ics', value)
      fs.writeFileSync(
        "../Calendars/DCBBOOKINGS/" + type + "/" + calName + ".ics",
        value
      );
    });

    /*ics.createEvent(event, (error, value) => {
            if (error) {
                console.log(error)
                return
            }
            writeFileSync(`${"./Calendars"}/event.ics`, value)
            //console.log(value)
            // BEGIN:VCALENDAR
            // VERSION:2.0
            // CALSCALE:GREGORIAN
            // PRODID:adamgibbons/ics
            // METHOD:PUBLISH
            // X-PUBLISHED-TTL:PT1H
            // BEGIN:VEVENT
            // UID:d9e5e080-d25e-11e8-806a-e73a41d3e47b
            // SUMMARY:Bolder Boulder
            // DTSTAMP:20181017T204900Z
            // DTSTART:20180530T043000Z
            // DESCRIPTION:Annual 10-kilometer run in Boulder\, Colorado
            // X-MICROSOFT-CDO-BUSYSTATUS:BUSY
            // URL:http://www.bolderboulder.com/
            // GEO:40.0095;105.2669
            // LOCATION:Folsom Field, University of Colorado (finish line)
            // STATUS:CONFIRMED
            // CATEGORIES:10k races,Memorial Day Weekend,Boulder CO
            // ORGANIZER;CN=Admin:mailto:Race@BolderBOULDER.com
            // ATTENDEE;RSVP=TRUE;ROLE=REQ-PARTICIPANT;PARTSTAT=ACCEPTED;CN=Adam Gibbons:mailto:adam@example.com
            // ATTENDEE;RSVP=FALSE;ROLE=OPT-PARTICIPANT;DIR=https://linkedin.com/in/brittanyseaton;CN=Brittany
            //   Seaton:mailto:brittany@example2.org
            // DURATION:PT6H30M
            // END:VEVENT
            // END:VCALENDAR
        })*/
  },
  createcalDCBUser: function (calName, JSONArray) {
    const event = JSONArray;
    ics.createEvents(event, (error, value) => {
      if (error) {
        console.log(error);
      }
      console.log(
        "Calendar Created at: ./Calendars/DCBBOOKINGS/Users/" + calName + ".ics"
      );
      //fs.writeFileSync('./Calendars/DCBBOOKINGS/Users/'+calName+'.ics', value)
      fs.writeFileSync(
        "../Calendars/DCBBOOKINGS/Users/" + calName + ".ics",
        value
      );
    });
  },
  createCalCVWOTasks: function async(calName, JSONArray) {
    const event = JSONArray;
    ics.createEvents(event, (error, value) => {
      if (error) {
        console.log(error);
        throw error;
      }
      console.log(
        "Calendar Created at: ./Calendars/CVWO/Users/" + calName + ".ics"
      );
      //fs.writeFileSync('./Calendars/CVWO/Users/'+calName+'.ics', value)
      fs.writeFileSync("./Calendars/CVWO/Users/" + calName + ".ics", value);
    });
  },
};
