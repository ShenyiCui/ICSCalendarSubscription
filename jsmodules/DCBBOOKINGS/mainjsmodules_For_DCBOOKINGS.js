var moment = require('moment');

module.exports = {
    transformYYYYMMDDtoDate:  function (YYYYMMDDS)//transform a string in the form of YYYYMMDD to a date.
    {
        var dateString = YYYYMMDDS;
        var year = dateString.substring(0,4);
        var month = dateString.substring(4,6);
        var day = dateString.substring(6,8);
        var date = new Date(year, month-1, day);
        return date;
    },
    transformCurrentWeek: function (Week) //transforms the current week into a week that can be compared using bubblesort.
    {
        var monthConversion =
            '{"Jan":'+'"01"'+
            ',"Feb":'+'"02"'+
            ',"Mar":'+'"03"'+
            ',"Apr":'+'"04"'+
            ',"May":'+'"05"'+
            ',"Jun":'+'"06"'+
            ',"Jul":'+'"07"'+
            ',"Aug":'+'"08"'+
            ',"Sep":'+'"09"'+
            ',"Oct":'+'"10"'+
            ',"Nov":'+'"11"'+
            ',"Dec":'+'"12"'+'}';
        var monthObj = JSON.parse(monthConversion);
        var newDate = Week.substr(Week.indexOf(" ") + 1); //format Day Month Year

        var dateArray = newDate.split(" ");

        var dateString = dateArray[2] + monthObj[dateArray[1]] + dateArray[0]

        return parseInt(dateString)
    },

    getDateFromDay: function(weekBeginingDateObj, coors){ // transforms a coordinate point on the graph into a date, given that the week begining date object is provided.
        var newDate = moment(weekBeginingDateObj).add(coors[0], 'days');
        return newDate;
    },//returns a date obj

    gettimeFromCoorOneHourPeriods: function(coors){ // transforms a coordinate point on the graph into a time,// will return an array [start hour, start minute, duration in minutes]
        var timeConversion =
            '{"a0":'+'[8,35,55],'+
            '"a1":'+'[9,35,55],'+
            '"a2":'+'[10,30,20],'+
            '"a3":'+'[10,50,55],'+
            '"a4":'+'[11,50,55],'+
            '"a5":'+'[12,45,55],'+
            '"a6":'+'[13,40,55],'+
            '"a7":'+'[14,40,55],'+
            '"a8":'+'[15,35,60],'+
            '"a9":'+'[16,35,85]}';
        var timeConversionObj = JSON.parse(timeConversion);
        return (timeConversionObj["a"+coors[1].toString()]);
    },// will return an array [start hour, start minute, duration in minutes]
    gettimeFromCoorThirtyMinPeriods: function(coors){ // transforms a coordinate point on the graph into a time,// will return an array [start hour, start minute, duration in minutes]
        var timeConversion =
            '{"a0":'+'[8,35,27],'+
            '"a1":'+'[9,2,28],'+ // period 1

            '"a2":'+'[9,35,27],'+ // period 2
            '"a3":'+'[10,2,28],'+

            '"a4":'+'[10,30,20],'+ // break

            '"a5":'+'[10,50,27],'+ // period 3
            ',"a6":'+'[11,17,28],'+

            '"a7":'+'[11,50,27],'+ // period 4
            '"a8":'+'[12,17,28],'+

            '"a9":'+'[12, 45, 27],'+ // lunch
            '"a10":'+'[13, 12, 28],'+

            '"a11":'+'[13, 40, 27],'+ // period 5
            '"a12":'+'[14,07,28],'+

            '"a13":'+'[14,40,27],'+ // period 6
            '"a14":'+'[15,07,28],'+

            '"a15":'+'[15,35,30],'+ // ECA 1
            '"a16":'+'[16,05,30],'+

            '"a17":'+'[16,35,42],'+ // ECA 2
            '"a18":'+'[17,17,43]}';

        var timeConversionObj = JSON.parse(timeConversion);
        return (timeConversionObj["a"+coors[1].toString()]);
    },// will return an array [start hour, start minute, duration in minutes]

    getPeriodName: function(min30,coors){
        var dayConversion;
        if(min30){
            dayConversion =
                "{\"a0\":\"Period 1 [1]\","+
                "\"a1\":\"Period 1 [2]\","+ // period 1

                "\"a2\":\"Period 2 [1]\","+ // period 2
                "\"a3\":\"Period 2 [2]\","+

                "\"a4\":\"Break\","+ // break

                "\"a5\":\"Period 3 [1]\","+ // period 3
                "\"a6\":\"Period 3 [2]\","+

                "\"a7\":\"Period 4 [1]\","+ // period 4
                "\"a8\":\"Period 4 [2]\","+

                "\"a9\":\"Lunch [1]\","+ // lunch
                "\"a10\":\"Lunch [1]\","+

                "\"a11\":\"Period 5 [1]\","+ // period 5
                "\"a12\":\"Period 5 [2]\","+

                "\"a13\":\"Period 6 [1]\","+ // period 6
                "\"a14\":\"Period 6 [2]\","+

                "\"a15\":\"ECA 1 [1]\","+ // ECA 1
                "\"a16\":\"ECA 1 [2]\","+

                "\"a17\":\"ECA 2 [1]\","+ // ECA 2
                "\"a18\":\"ECA 2 [2]\"}";
        }
        else{
            dayConversion = "{\"a0\":\"Period 1\",\"a1\":\"Period 2\",\"a2\":\"Break\",\"a3\":\"Period 3\",\"a4\":\"Period 4\",\"a5\":\"Lunch\",\"a6\":\"Period 5\",\"a7\":\"Period 6\",\"a8\":\"ECA 1\",\"a9\":\"ECA 2\"}";
        }
        return JSON.parse(dayConversion)["a"+coors[1].toString()]
    },
    getDayNameFromCoor : function(coors){
        var dayConversion;
        dayConversion = "{\"a0\":\"MO\",\"a1\":\"TU\",\"a2\":\"WE\",\"a3\":\"TH\",\"a4\":\"FR\"}";

        return JSON.parse(dayConversion)["a"+coors[0].toString()]
    },
    DifferenceInDays: function(firstDate, secondDate) //calculates the difference in days between 2 date objects
    {
        return Math.round((secondDate-firstDate)/(1000*60*60*24));
    }
}