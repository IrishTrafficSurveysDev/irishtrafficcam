const forever = require('forever-monitor');
const config = require('../../config.json');
const simulation30FPSDetectionsData = require('../../public/static/placeholder/alexeydetections30FPS.json');
const fs = require('fs');
const path = require('path');
const http = require('http');
const killable = require('killable');
const mjpegServer = require('mjpeg-server');
const configHelper = require('../utils/configHelper');

const {
  performance
} = require('perf_hooks');

const rtspURL = 'rtsp://localhost:8020/ds-test';
const ffmpegURL = 'http://localhost:8090/monitoring1.ffm'

let YOLO = {
  isStarting: false,
  isStarted: false,
  isInitialized: false,
  process: null,
  simulationMode: false,
  simulationMJPEGServer: null,
  simulationJSONHTTPStreamServer: null,
  currentVideoParams: ""
};

let ffserver = {
  isStarting: false,
  isStarted: false,
  isInitialized: false,
  process: null,
  simulationMode: false,
};

let ffmpeg = {
  isStarting: false,
  isStarted: false,
  isInitialized: false,
  process: null,
  simulationMode: false,
};

module.exports = {
  init: function(simulationMode, videoParams = null) {

    YOLO.simulationMode = simulationMode;

    if(!YOLO.simulationMode) {


      ffserver.process = new (forever.Monitor)(['ffserver'],{
        max: 1,
        cwd: config.PATH_TO_YOLO,
        silent: true,
        killTree: true
      });

     ffmpeg.process = new (forever.Monitor)(['ffmpeg', '-i', rtspURL, ffmpegURL], {
        max: Number.POSITIVE_INFINITY,
        cwd: config.PATH_TO_YOLO,
        killTree: true,
        silent: true
      });
 
     // for YOLOV4
     //YOLO.process = new (forever.Monitor)(['/opt/nvidia/deepstream/deepstream-5.1/sources/apps/sample_apps/deepstream-app/deepstream-app2', '-c', config.DEEPSTREAM_YOLO_CONFIG_FILENAME], {
    //    max: Number.POSITIVE_INFINITY,
    //    cwd: config.PATH_TO_DEEPSTREAM_YOLO,
    //    killTree: true
   //   });
 
     YOLO.process = new (forever.Monitor)(['../apps/sample_apps/deepstream-app/deepstream-app2', '-c', config.DEEPSTREAM_CONFIG_FILE], {
        max: Number.POSITIVE_INFINITY,
        cwd: config.PATH_TO_YOLO,
        killTree: true
      });

      YOLO.process.on("start", () => {
        console.log('Process YOLO started');
        YOLO.isStarted = true;
        YOLO.isStarting = false;
      });

      YOLO.process.on("restart", () => {
        // Forever 
        console.log("Restart YOLO");
      })

      YOLO.process.on("error", (err) => {
        console.log('Process YOLO error');
        console.log(err);
      });

      YOLO.process.on("exit", (err) => {
        console.log('Process YOLO exit');
        //console.log(err);
      });

      ffserver.process.on("start", () => {
        console.log('Process ffserver started');
        ffserver.isStarted = true;
        ffserver.isStarting = false;
      });

      ffserver.process.on("stop", () => {
        console.log('Process ffserver stopped');
        ffserver.isStarted = false;
      });

      ffserver.process.on("restart", () => {
        // Forever 
        console.log("Restart ffserver");
      })

      ffserver.process.on("error", (err) => {
        console.log('Process ffserve error');
        console.log(err);
      });

      ffserver.process.on("exit", (err) => {
        console.log('Process ffserver exit');
        console.log(err);
      });

      ffmpeg.process.on("start", () => {
        console.log('Process ffmpeg started');
        ffmpeg.isStarted = true;
        ffmpeg.isStarting = false;
      });

      ffmpeg.process.on("stop", () => {
        console.log('Process ffmpeg stopped');
        ffmpeg.isStarted = false;
      });

      ffmpeg.process.on("restart", () => {
        // Forever 
        console.log("Restart ffmpeg");
      })

      ffmpeg.process.on("error", (err) => {
        console.log('Process ffmpeg error');
        console.log(err);
      });

      ffmpeg.process.on("exit", (err) => {
        console.log('Process ffmpeg exit');
        console.log(err);
      });

    }

    console.log('Process YOLO initialized');
    YOLO.isInitialized = true;

    // TODO handle other kind of events
    // https://github.com/foreverjs/forever-monitor#events-available-when-using-an-instance-of-forever-in-nodejs
  },

  getStatus: function() {
    return {
      isStarting: YOLO.isStarting,
      isStarted: YOLO.isStarted
    }
  },

  getVideoParams: function() {
    return YOLO.currentVideoParams;
  },

  start: function() {
    // Do not start it twice
    if(YOLO.isStarted || YOLO.isStarting) {
      console.log('already started');
      return;
    }
    
    YOLO.isStarting = true;

    if(YOLO.simulationMode) {
      setTimeout(() => {
        // Simulate 5s to start yolo
        this.startYOLOSimulation();
      }, 5000);
    } else {
      if(!YOLO.isStarted) {
        YOLO.process.start();
	setTimeout(() => {
          // start ffmpeg after 5s
          ffserver.process.start();
          ffmpeg.process.start();
        }, 5000);
      }
    }
  },

  stop: function() {
    return new Promise((resolve, reject) => {
      if(YOLO.simulationMode && YOLO.simulationServer) {
        YOLO.simulationServer.kill(function () {
          YOLO.isStarted = false;
          resolve();
        });
      } else {
        if(YOLO.isStarted) {
          YOLO.process.once("stop", () => {
            console.log('Process YOLO stopped');
            YOLO.isStarted = false;
            resolve();
          });
          YOLO.process.stop();
	  ffserver.process.stop();
          ffmpeg.process.stop();
        }
      }
    });
  },

  restart() {
    if(!YOLO.simulationMode) {
      console.log('Process YOLO restart');
      this.stop().then(() => {
        this.start();
      });

    } else {
      YOLO.simulationJSONHTTPStreamServer.kill();
      YOLO.simulationMJPEGServer.kill();
      setTimeout(() => {
        this.startYOLOSimulation()
      }, 5000)
    }
  },

  startYOLOSimulation: function() {
    /**
     *   Used in Dev mode for faster development
     *     - Simulate a MJPEG stream on port 8090
     *     - Update opendatacam tracker on each frame
     */
    var frameNb = 16;
    var mjpegReqHandler = null;
    var timer = null;
    var dataThisFrame = [];
    var JSONStreamRes = null;
    
    console.log("Start HTTP JSON Stream server");

    YOLO.simulationJSONHTTPStreamServer = http.createServer(function(req, res) {
      console.log("Got request on JSON Stream server started");
      JSONStreamRes = res;
      // Send one frame on the JSON stream to start things
      JSONStreamRes.write(JSON.stringify(simulation30FPSDetectionsData.find((detection) => detection.frame_id === frameNb)));
    }).listen(configHelper.getJsonStreamPort());


    killable(YOLO.simulationJSONHTTPStreamServer);
    console.log("Start MJPEG server");
    

    YOLO.simulationMJPEGServer = http.createServer(function(req, res) {
      console.log("Got request on MJPEG server");

      if(mjpegReqHandler) {
        mjpegReqHandler.close();
        clearInterval(timer);
      }
      mjpegReqHandler = mjpegServer.createReqHandler(req, res);
      timer = setInterval(() => {
        updateJPG();
        if(JSONStreamRes) {
          JSONStreamRes.write(JSON.stringify(simulation30FPSDetectionsData.find((detection) => detection.frame_id === frameNb)));
        } else {
          console.log("JSONStream connection isn't opened yet");
        }
      }, 34);

      function updateJPG() {
        fs.readFile(path.join(__dirname, '../../public/static/placeholder/frames') + "/" + String(frameNb).padStart(3, '0') + '.jpg', sendJPGData);
        frameNb++;
      }

      function sendJPGData(err, data) {
        if(err) {
          console.log(err);
        }
        mjpegReqHandler.write(data, function() {
          checkIfFinished();
        });
      }

      function checkIfFinished() {
        if (frameNb > 451) {
          // clearInterval(timer);
          // mjpegReqHandler.close();
          console.log('Reset stream');
          frameNb = 16;
        }
      }
    }).listen(configHelper.getMjpegStreamPort());
    killable(YOLO.simulationMJPEGServer);
  },
}
