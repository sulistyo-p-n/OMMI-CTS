/*!
 * app
 * Copyright(c) 2023 Sulistyo Ponco Nugroho
 * - Licensed
 */

"use strict";

const fs = require("fs");

const express = require("express");
const app = express();
const http = require("http");
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

const Comm = require("./comm");

class Variable {
  constructor(name) {
    this.name = name;
    this.value = false;
    this.descTrue = "";
    this.descFalse = "";
    this.isAlarm = false;
    this.alarmCondition = true;
    this.alarmActiveTime = null;
    this.alarmResolveTime = null;
  }

  setValue(value) {
    if (this.alarmCondition) {
      if (this.value != value && value == this.alarmCondition) {
        this.alarmActiveTime = new Date(Date.now());
        this.alarmResolveTime = null;
        // console.log(this.alarmActiveTime.toString() + " - Actve - " + (value ? this.descTrue : this.descFalse));
      } else if (
        this.value != value &&
        value != this.alarmCondition &&
        this.alarmActiveTime
      ) {
        this.alarmResolveTime = new Date(Date.now());
        // console.log(this.alarmResolveTime.toString() + " - Resolve - " + (value ? this.descTrue : this.descFalse));
      }
    }
    this.value = value;
  }
}

function getFileText(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

function setConfig(config) {
  for (const source of config.sources) {
    source.fileText = getFileText("./" + source.file);
    delete source.file;

    source.liveVariables = [];
    source.variables = [];
    const rows = source.fileText.split("\n");

    for (let i = 3; i < rows.length; i++) {
      const row = rows[i];
      const columns = row.split(",");

      if (!columns[0]) {
        continue;
      }

      let variable = new Variable(columns[1]);
      variable.isAlarm = columns[6] == "1";
      variable.alarmCondition = columns[7] == "0>1";
      variable.descFalse = columns[2];
      variable.descTrue = columns[3];

      source.variables.push(variable);

      if (!("regions" in config)) {
        config.regions = {};
      }

      if (!columns[1]) {
        continue;
      }

      if (!columns[9]) {
        continue;
      }

      if (!(columns[9] in config.regions)) {
        let liveVariable = new Variable(columns[9] + "-ALIVE");
        liveVariable.isAlarm = true;
        liveVariable.alarmCondition = false;
        liveVariable.descFalse = columns[9] + " disconnected";
        config.regions[columns[9]] = [liveVariable];
        source.liveVariables.push(liveVariable);
      }

      config.regions[columns[9]].push(variable);
    }
  }

  for (const view of config.views) {
    for (const layout of view.layouts) {
      layout.fileText = getFileText("./" + layout.file);
      delete layout.file;
    }
    for (const region of view.regions) {
      region.variables = [];
      if (region.code in config.regions) {
        region.variables = config.regions[region.code];
      }
    }
  }

  for (const receiver of config.receivers) {
    receiver.fileText = getFileText("./" + receiver.file);
    delete receiver.file;
  }

  return config;
}

function DECToBIN(dec) {
  return (dec >>> 0).toString(2);
}

function BINToDEC(bin) {
  return parseInt(bin, 2);
}

function getDecArray(variables, base) {
  let values = [];

  let binString = "";
  let counter = 0;
  for (let i = 0; i < variables.length; i++) {
    let variable = variables[i];
    binString = +variable.value + binString;

    counter++;
    if (counter < base && i != variables.length - 1) continue;

    values.push(BINToDEC(binString));

    binString = "";
    counter = 0;
  }

  return values;
}

function getAlarm(variables) {
  let values = [];
  for (let i = 0; i < variables.length; i++) {
    let variable = variables[i];

    if (variable.alarmActiveTime && !variable.alarmResolveTime) {
      values.push({
        datetime: variable.alarmActiveTime,
        desc: variable.value ? variable.descTrue : variable.descFalse,
      });
    }
  }

  return values;
}

function getRegionDatas(config, regions) {
  let base = 16;
  let values = {};
  for (const region of regions) {
    if (region in config.regions) {
      values[region] = {
        data: getDecArray(config.regions[region], base),
        alarm: getAlarm(config.regions[region]),
      };
    }
  }
  return values;
}

function getViews(config) {
  const miniViews = [];
  for (const view of config.views) {
    miniViews.push({
      code: view.code,
      name: view.name,
    });
  }
  return miniViews;
}

function setSourcesComm() {
  for (let source of config.sources) {
    if (source.commType == "MODBUS-TCP") {
      source.comm = new Comm(
        source.id,
        Comm.TYPE_MODBUS_TCP,
        source.ip,
        source.port,
        source.addr,
        Math.floor(source.variables.length / 16)
      );
    } else if (source.commType == "MODBUS-UDP") {
      source.comm = new Comm(
        source.id,
        Comm.TYPE_MODBUS_UDP,
        source.ip,
        source.port,
        source.addr,
        Math.floor(source.variables.length / 16)
      );
    } else if (source.commType == "MMISERVER-UDP") {
      source.comm = new Comm(source.id, Comm.TYPE_UDP, source.ip, source.port);
    }
  }
}

function listenSourcesComm() {
  for (let source of config.sources) {
    if (source.comm === undefined) continue;

    if (source.commType == "MMISERVER-UDP") continue;

    source.comm.run((data) => {
      if (!data.isConnected)
        console.log(
          new Date(Date.now()).toString() +
            " - " +
            source.ip +
            ":" +
            source.port +
            "/" +
            source.commType +
            " : " +
            data.message
        );

      let base = 16;

      for (let liveVariable of source.liveVariables) {
        liveVariable.setValue(data.isConnected);
      }

      for (let i = 0; i < data.data.length; i++) {
        const binString = DECToBIN(data.data[i]);
        for (let j = 0; j < base; j++) {
          if (j + i * base >= source.variables.length) {
            break;
          }
          if (binString.length > j) {
            source.variables[j + i * base].setValue(
              binString[binString.length - 1 - j] == "1"
            );
          } else {
            source.variables[j + i * base].setValue(false);
          }
        }
      }
    });
  }
}

let config = setConfig(require("./config.json"));

app.use(express.static(__dirname + "/node_modules"));
app.use(express.static(__dirname + "/public"));

app.get("/", function (req, res, next) {
  res.sendFile(__dirname + "/index.html");
});

app.get("/playground", function (req, res, next) {
  res.sendFile(__dirname + "/playground.html");
});

io.on("connection", function (client) {
  console.log(
    new Date(Date.now()).toString() + " - " + client.id + " Client connected"
  );

  client.on("disconnect", function (data) {
    console.log(
      new Date(Date.now()).toString() +
        " - " +
        client.id +
        " Client disconnected"
    );
  });

  client.on("getViews", function (data) {
    const views = getViews(config);
    client.emit("views", views);
  });

  client.on("getView", function (data) {
    const view = config.views[data];
    client.emit("view", view);
  });

  client.on("getDatas", function (data) {
    const datas = getRegionDatas(config, data);
    client.emit("datas", datas);
  });
});

server.listen(4200);

setSourcesComm();
listenSourcesComm();
