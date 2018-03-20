    //Here memory execute in different thread this portion   
    $(function () {

        var xValStep = 0.1;
        var updateInterval = 100;
        var dataLength = 50;
        var updateFunc0 = func0(100, 0);
        var updateFunc1 = func1(1, 10, 55, 100, 0);
        var updateFunc2 = func2(-0.094, -0.107, 21.428, 10, 200);
        var yMin = -7; // Min, breaking
        var yMax = 7; // Max, acceleration
        var xBreakMin = 1; // Min duration of breaking
        var xBreakMax = 5; // Max duration of breaking
        var xMin = 1; // Min duration of acceleration
        var xMax = 2; // Max duration of acceleration
        acceleration = func3(yMin, yMax, xBreakMin, xBreakMax, xMin, xMax);
        var updateFunc4 = func4(-100, 100);

        function createChart(name, title, updateFunc, xVal, yVal, minimum, maximum) {
            var dps = [];
            var chart = new CanvasJS.Chart(name, {
                exportEnabled: false,
                backgroundColor: "#3e4355",
                animationEnabled: true,
                animationDuration: 3000,
                title: {
                    text: title,
                    fontColor: "white",
                    fontFamily: "sans-serif",
                    fontSize: 20
                },
                axisY: {
                    title: title,
                    includeZero: true,
                    minimum: minimum,
                    maximum: maximum,
                    labelFontColor: "white",
                    titleFontColor: "gray",
                },
                axisX: {
                    title: "Time, sec",
                    includeZero: false,
                    labelFontColor: "white",
                    titleFontColor: "gray",
                },
                data: [{
                    type: "line",
                    lineColor: "#4700cc",
                    markerSize: 5,
                    dataPoints: dps,
                    color: "#38a84a",
                    labelFontColor: "white",
	                }]
            });


            var updateChart = function (count) {
                count = count || 1;
                // count is number of times loop runs to generate random dataPoints.
                for (var j = 0; j < count; j++) {
                    yVal = updateFunc(xVal);
                    dps.push({
                        x: xVal,
                        y: yVal
                    });
                    xVal += xValStep;
                }

                if (dps.length > dataLength) {
                    dps.shift();
                }
                chart.render();
            };
            updateChart(dataLength);
            return setInterval(function () {
                updateChart()
            }, updateInterval);
        }


        interval.push(createChart("chartContainer1", "Speed", updateFunc0, 0, 100, 0, 250));
        interval.push(createChart("chartContainer4", "Pressure", updateFunc1, 0, 100, 0, 1000));
        interval.push(createChart("chartContainer2", "Temperature", updateFunc2, 0, 100, 0, 220));
        interval.push(createChart("chartContainer3", "Acceleration", acceleration, 0, 0, yMin, yMax));
        interval.push(createChart("chartContainer5", "Amplitude", updateFunc4, 0, 0, -120, 120));






    });



    var RoadCondition = [];
    var url = "sim/roads/";
    type = "bad";
    //type="good";
    //type="excellent";
    switch (type) {
        case "bad":
            url += "Route_Bad.json";
            break;
        case "good":
            url += "Route_Good.json";
            break;
        case "excellent":
            url += "Route_Excellent.json";
            break;
    }
    $.get(url, function (data) {
        console.log(data.Id);
        var last = 0;
        $.each(data.Nodes, function (key, value) {
            RoadCondition.push({
                S: last + parseInt(value.Length),
                Angle: value.Angle,
                Type: value.Type
            });
            last = RoadCondition[RoadCondition.length - 1].S;
            console.log(RoadCondition[RoadCondition.length - 1]);
        });
    });

    function getRoadKoef() {
        if (RoadCondition.length == 0) return;
        var r = RoadCondition[0];
        for (var i = 0; i < RoadCondition.length; i++) {
            r = RoadCondition[i];
            if (RoadCondition[i].S > S) break;
        }
        document.getElementById("Road").innerHTML = "Until S=" + r.S + " => Angle=" + r.Angle + " Road type=" + r.Type;
        switch (r.Type) {
            case "0":
                RoadKoef = 1;
                break;
            case "1":
                RoadKoef = 15;
                break;
            case "2":
                RoadKoef = 50;
                break;
        }
        RoadAngle = parseInt(r.Angle);
        //console.log(r);
        //return r;
    }

    var interval = [];
    var acceleration;
    var S = 0;
    var RoadKoef = 1 //- road
    var RoadAngle = 0;

    //var RoadKoef=50; //- offRoad
    var CriticalT = 170;
    var CriticalP = 800;
    var CriticalA = 80;
    var Health = 100;




    var epsi = 0.1;
    var V = 100;
    var Acc = 0;
    var T = 10;
    var P = 100;

    function func0(V0) { // a*sin(b*x) + c*x + d
        return function (x) {
            r = acceleration(x) + V;
            S += r / 10 / 3.6;
            r = r + rand(epsi / 10 * r, -epsi / 10 * r);
            if (r < 0) r = rand(10 * epsi, 0);
            if (r > 200) r = 200 + rand(200 * epsi, -epsi * 200);
            V = r;

            document.getElementById("S").innerHTML = Math.round(S) + "m";
            getRoadKoef();
            return r;
        }
    }
    start1 = false;
    startX1 = -1;
    //PRESSURE
    function func1(a, b, c, min) { // a*sin(b*x) + c*x + d
        return function (x) {
            if (Acc < 0 && V > 10) {
                start1 = true;
                if (startX1 == -1) startX1 = x;
            } else {
                r = -50 + P;
                start1 = false;
                startX1 = -1;
            }
            if (start1) {
                z = x - startX1;
                r = a * Math.sin(b * z) + c * z * RoadKoef + P;
            }
            r = r + rand(epsi * r, -epsi * r);
            if (r < min) r = min + rand(epsi * min, -epsi * min);
            if (r > 900) r = 900 + rand(epsi * 900, -epsi * 900);
            P = r;
            if (P > CriticalP) damageHealth();
            return r;
        }
    }
    var startX2 = -1;
    var stat2 = false;
    //TEMPERATURE
    function func2(a, b, c, min, max) { // a*sin(b*x) + c*x + d
        return function (x) {
            //console.log(T);
            if (Acc < 0 && V > 10) {
                start2 = true;
                if (startX2 == -1) startX2 = x;
            } else {
                r = -6.85 + T;
                start2 = false;
                startX2 = -1;
            }
            if (start2) {
                z = x - startX2;
                //console.log(z);
                r = a * z * z * z + b * z * z + c * z * RoadKoef + T;
            }
            r = r + rand(epsi * r, -epsi * r);
            if (r < min) r = min + rand(200 * epsi, -epsi * 200);
            if (r > max) r = max + rand(max * epsi, -epsi * max);
            T = r;
            if (T > CriticalT) damageHealth();
            return r;
        }
    }
    //ACCELERATION
    function func3(yMin, yMax, xBreakMin, xBreakMax, xMin, xMax) {
        // x - time, minute
        var nextX = 0; // Next time, when the Y percentage will be changed
        var Y = 0; // The percentage
        return function (x) {
            // Check time
            if (nextX < x) {
                // New acceleration
                Y = Math.random() * (yMax - yMin) + yMin;
                // Check breaking
                if (Math.abs(Y) < yMax / 3) {
                    Y = 0;
                } else {
                    if (Y < 0) {
                        duration = Math.floor(Math.random() * (xBreakMax - xBreakMin)) + xBreakMin;
                    } else {
                        duration = Math.floor(Math.random() * (xMax - xMin)) + xMin;
                    }
                }
                nextX += duration; // Set next time
            }
            Acc = Y;

            return Y;
        }
    }
    start4 = false;
    startX4 = -1;
    Amplitude = 0;
    //AMPLITUDE
    function func4(min, max) { // a*sin(b*x) + c*x + d
        return function (x) {
            if (Acc < 0 && V > 10) {
                start4 = true;
                if (startX4 == -1) startX4 = x;
            } else {
                if (Math.abs(Amplitude) > 5) r = Amplitude / 2;
                else r = (Math.random() + Math.random() - 1) * 5;
                start4 = false;
                startX4 = -1;
            }
            if (start4) {
                z = x - startX4;
                r = Amplitude + RoadKoef / 5 * 3 * Math.round(5 + Math.random() * (-10));
            }
            r = r + rand(epsi * 20 * r, -epsi * 20 * r);
            if (r < min) r = min + rand(epsi * min, -epsi * min);
            if (r > max) r = max + rand(epsi * max, -epsi * max);
            Amplitude = r;
            if (Amplitude > CriticalA) damageHealth();
            return r;
        }
    }

    function rand(max, min) {
        return (Math.random() + Math.random() + Math.random() + Math.random() + Math.random()) / 5 * (max - min) + min;
    }

    function stopSimulation() {
        //console.log("stop");
        for (var i = 0; i < interval.length; i++) {
            clearInterval(interval[i]);
        }
    }

    function damageHealth() {
        if (Health > 0) {
            Health -= 0.1;
            document.getElementById("health").innerHTML = Math.round(Health) + "%";
        }
    }
