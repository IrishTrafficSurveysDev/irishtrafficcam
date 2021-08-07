# ☘️ Irish Traffic Cam & Deepstream Setup Guide

### 🎬 Introduction

This is an  experimental fork that aims to replace Darknet with the Deepstream SDK in order for increased speed, accuracy and performance for IrishTrafficCam. In order to achieve this, a series of patches and code modifications are required. This documentation will guide you through the necessary steps for implementing Deepstream with IrishTrafficCam.

### 📚 Documentation Layout
- There are 3 essential parts to this guide:
  - Part 1 of this guide will outline the necessary steps needed to flash [Jetpack SDK](https://developer.nvidia.com/embedded/jetpack) onto Jetson TX2, which is required in order to run IrishTrafficCam
  - Part 2 of this guide will outline the necessary steps needed to integrate Deepstream with IrishTrafficCam
  - Part 3 of this guide outlines the necessary steps needed to install & run IrishTrafficCam on a Jetson TX2 without deepstream & with CuDNN enabled

## ⚡️ Part 1 - Flashing Jetpack onto Jetson TX2

- Before you can run IrishTrafficCam on a Jetson TX2, you will need to flash Jetpack onto Jetson TX2, as IrishTrafficCam requires the use of certian libraries that come with Jetpack. This means that in order to flash Jetpack, you will need a **host machine**, as well as a **target machine**(Jetson TX2).

### 💻 Part 1 A): Hardware Requirements
  - **A Host computer** from which you can run the necessary software to flash Jetpack. You **must** ensure that the host machine is running **Ubuntu** with a version of Ubuntu **greater than 16.04 and less than 20.04**. At the time of writing(July 2021), Ubuntu 16.04 has reached end of life, and Jetpack is currently not supported for Ubuntu 20.04. The best Ubuntu version to run is 18.04. If you do not have a Ubuntu machine, please follow the guide on [running Ubuntu on a virutal machine](https://github.com/IrishTrafficSurveysDev/irishtrafficcam/blob/master/Ubuntu-VM-Setup-Guide.md)
  - **Jetson TX2 Developer Kit**([Source](https://developer.nvidia.com/embedded/jetson-tx2-developer-kit#resources))

#### 🔧 Hardware Requirements - Precautions
- Ensure that you purchase the **TX2 Developer Kit** and not Just the TX2 itself, as it includes neccesary hardware additions needed to successfully setup the TX2, such as Antennas and a USB Micro-B to USB A Cable.
- Ensure that both you host and target machines(aka your Ubuntu Machine and your TX2) have internet access either through wifi or ethernet. The software setup requires internet access on both host and target machine for the setup to be successful
- There is no problem if you TX2 is running an older version of Ubuntu(such as 16.04, which was the version my TX2 was running). The whole OS will be wiped out by Jetpack, where you will get the Ubuntu version of your host machine.

### 📦 Part 1 B): Software Requirements
- **Nvidia Jetpack SDK manager**: This is a setup wizard that simplifies the process of flashing Jetpack onto TX2 immensely. To download this software, follow these steps:
  1.  Register for an NVIDIA Developer Account. It's free, and you can sign up [here](https://developer.nvidia.com/login)
  2.  Follow [this](https://developer.nvidia.com/embedded/jetpack) link and make sure to select the **SDK Manager Method** dropdown(See this [image](https://github.com/IrishTrafficSurveysDev/irishtrafficcam/blob/master/SDK-Manager-Option.png))
  3. After you have completed registration, download the file onto your host machine

#### 🔧 Software Requirements - Precautions
- Ensure that your SDK manager is the latest version. This is the ensured by default, but **do not install the SDK manager from the SDK archives**. The SDK manager will block installation as it knows that there is a later version available. As of writing, the latest version of Jetpack is 4.5.1, which was flashed successfully onto the TX2. According to the official OpenDataCam [documentation](https://github.com/opendatacam/opendatacam/blob/master/documentation/jetson/FLASH_JETSON.md), any version above Jetpack 4.3 is supported. However, note that **For Deepstream 5.1, Jetpack 4.5.1 is required**

### 🚀 Part 1 C): Flashing Jetpack onto Jetson TX2
- [This Video](https://www.youtube.com/watch?v=D7lkth34rgM&t=1s) is hands-down the best tutorial for flashing Jetpack onto Jetson TX2. Please follow this video **exactly**, including the fact that the instructor followed the instructions for **manual installation instead of automatic installation**, as automatic installation created some problems with the setup procedure. In summary, follow the video exactly!

## 🎯 Part 2: Integrating Deepstream with IrishTrafficCam

#### 1️⃣ Step 1: Install ffmpeg & patch ffserver

●	 A) Install ffmpeg

    sudo apt-get install ffmpeg
    
●	 B) Clone this specific branch of the repository:

    
    git clone --single-branch --branch deepstream_test https://github.com/IrishTrafficSurveysDev/irishtrafficcam.git
    


●	C) Patch ffserver

    sudo cp -r <PATH_TO_IRISHTRAFFICCAM>/deepstream_patch/ffserver.conf /etc/ffserver.conf
   
#### 2️⃣ Step 2: Install Deepstream

● A) Download Deepstream from this [link](https://developer.nvidia.com/deepstream-download) and make sure to get debian file for Jetson. The version used at the time of writing was Deepstream **5.1**. Note that Deepstream 5.1 **requires** Jetpack 4.5.1

● B) Install Deepstream:

    sudo apt-get update

    sudo apt-get install --fix-broken

    sudo apt-get install \
       	libssl1.0.0 \
    	libgstreamer1.0-0 \
    	gstreamer1.0-tools \
    	gstreamer1.0-plugins-good \
   	gstreamer1.0-plugins-bad \
    	gstreamer1.0-plugins-ugly \
    	gstreamer1.0-libav \
    	libgstrtspserver-1.0-0 \
    	libjansson4=2.11-1

    sudo apt-get install ./<deepstream debian file>.deb
Please refer to the [official docs](https://docs.nvidia.com/metropolis/deepstream/dev-guide/text/DS_Quickstart.html#install-the-deepstream-sdk) for additional methods of installing Deepstream onto a Jetson Device

#### 3️⃣ Step 3: Patch Deepstream - Copy Detection Module

- If you want to have  **video stream** as input for IrishTrafficCam with Deepstream, then run the following command:
```
sudo cp -rv <PATH_TO_OPENDATACAM>/deepstream_patch/deepstream_app_config_yoloV3_tiny_http_rtsp.txt /opt/nvidia/deepstream/deepstream-5.1/sources/objectDetector_Yolo/
cd /opt/nvidia/deepstream/deepstream-5.1/sources/objectDetector_Yolo/
export CUDA_VER=10.2
make -C nvdsinfer_custom_impl_Yolo
  ```
- If you want to have  **a video file** as input for IrishTrafficCam with Deepstream, then:
  - 1. Edit the `deepstream_app_config_yoloV3_tiny_http_uri.txt` file inside the **deepstream_patch** folder and replace the `uri` property(located at the `[source0]` section of the documentation) with the URI of the desired video file 
  -  2. Run the following command:
```
sudo cp -rv <PATH_TO_OPENDATACAM>/deepstream_patch/deepstream_app_config_yoloV3_tiny_http_uri.txt /opt/nvidia/deepstream/deepstream-5.1/sources/objectDetector_Yolo/
cd /opt/nvidia/deepstream/deepstream-5.1/sources/objectDetector_Yolo/
export CUDA_VER=10.2
make -C nvdsinfer_custom_impl_Yolo
  ```
  
 - Download the weights and config files for the models:
 ```
 If you want yolov3-tiny weights & config file:
 
 echo "Downloading yolov3-tiny config and weights files ... "
wget https://raw.githubusercontent.com/pjreddie/darknet/master/cfg/yolov3-tiny.cfg -q --show-progress
wget https://pjreddie.com/media/files/yolov3-tiny.weights -q --show-progress

If you want yolov3 weights & config file:

 echo "Downloading yolov3 config and weights files ... "
wget https://raw.githubusercontent.com/pjreddie/darknet/master/cfg/yolov3.cfg -q --show-progress
wget https://pjreddie.com/media/files/yolov3.weights -q --show-progress
 ```
  
#### 4️⃣ Step 4: Patch Deepstream - Modify Main Application
- A) Add the folowing lines to the file located at: */opt/nvidia/deepstream/deepstream-5.1/sources/apps/sample_apps/deepstream-app/deepstream_app.h*:
```
#include "detection_func.h"
#include "http_stream.h"
```

- B) 
  - *Part 1*:  Add the folowing lines to the file located at: */opt/nvidia/deepstream/deepstream-5.2/sources/apps/sample_apps/deepstream-app/deepstream_app.c*:

```
#define JSON_PORT 8070
#define JSON_TIMEOUT 400000
```
-
  - *Part 2*: Replace the *write_kitti_output* function located inside the same file with the following function:

```
static void
write_kitti_output (AppCtx * appCtx, NvDsBatchMeta * batch_meta)
{
  gchar bbox_file[1024] = { 0 };
  FILE *bbox_params_dump_file = NULL;

  if (!appCtx->config.bbox_dir_path)
  return;

  for (NvDsMetaList * l_frame = batch_meta->frame_meta_list; l_frame != NULL;
    l_frame = l_frame->next) {
  NvDsFrameMeta *frame_meta = l_frame->data;
  send_json(frame_meta, JSON_PORT, JSON_TIMEOUT);
  }
}
```

- C) Locate the file *\opt\nvidia\deepstream\deepstream-5.1\sources\apps\apps-common\src\deepstream_sink_bin.c* and find the following lines:

	  g_object_set (G_OBJECT (bin->sink), "host", "224.224.255.255", "port",
		  config->udp_port, "async", FALSE, "sync", 0, NULL);
        
  - Changes these lines to the following:
	
	    g_object_set (G_OBJECT (bin->sink), "host", "127.0.0.1", "port",
		    config->udp_port, "async", FALSE, "sync", 0, NULL);

- D) Run the following command:
```
sudo cp -r <PATH_TO_IRISHTRAFFICCAM>/deepstream_patch/src_cpp/ /opt/nvidia/deepstream/deepstream-5.1/sources/apps/sample_apps/deepstream-app/
```

- E)
  - *Part 1*: Locate the following file:  */opt/nvidia/deepstream/deepstream-4.0/sources/apps/sample_apps/deepstream-app/Makefile* and Replace all lines after  the line *all: $(APP)* (including that line) with the following:

		CPPSRCDIR   = src_cpp

		SOURCES+= $(wildcard $(CPPSRCDIR)/*.cpp)

		INCLUDES+= $(wildcard $(CPPSRCDIR)/*.h)

		OBJS+= $(SOURCES:$(CPPSRCDIR)/%.cpp=$(CPPSRCDIR)/%.o)

		CFLAGS+= -I $(CPPSRCDIR)

		CXX      = g++
		CXXFLAGS +=  -Wall -ansi -g -std=c++11  -DPLATFORM_TEGRA
		CXXFLAGS+= -I../../apps-common/includes -I../../../includes -I $(CPPSRCDIR) -DDS_VERSION_MINOR=0 -DDS_VERSION_MAJOR=4

		CXXFLAGS+= `pkg-config --cflags $(PKGS)`


		all: $(APP)

		%.o: %.c $(INCS) Makefile
			$(CC) -c -o $@ $(CFLAGS) $<
		%.o: %.cpp $(INCS) Makefile
			$(CXX) -c -o $@ $(CXXFLAGS) $<


		$(APP): $(OBJS) Makefile
			$(CXX) -o $(APP) $(OBJS) $(LIBS)

		clean:
			rm -rf $(OBJS) $(APP)
	-
  - *Part 2*: In the same file, replace the line `APP:= deepstream-app` to `APP:= deepstream-app2`

- F) Build the Deepstream app by following the README located in */opt/nvidia/deepstream/deepstream-5.1/sources/apps/sample_apps/deepstream-app/*

- G) Run deepstream to generate the tensorRT engine:
 - For video stream input:
 ```
 cd /opt/nvidia/deepstream/deepstream-4.0/sources/objectDetector_Yolo/
../apps/sample_apps/deepstream-app/deepstream-app2 -c /opt/nvidia/deepstream/deepstream-4.0/sources/objectDetector_Yolo/deepstream_app_config_yoloV3_tiny_http_rtsp.txt
 ```
 - For video file input:
 ```
 cd /opt/nvidia/deepstream/deepstream-4.0/sources/objectDetector_Yolo/
../apps/sample_apps/deepstream-app/deepstream-app2 -c /opt/nvidia/deepstream/deepstream-4.0/sources/objectDetector_Yolo/deepstream_app_config_yoloV3_tiny_http_uri.txt
 ```
 
 *Expected output (press Q after the build is completed to stop deepstream-app. The output does not have to match as long as no errors occurred):*

	 *** DeepStream: Launched RTSP Streaming at rtsp://localhost:8020/ds-test ***

	Opening in BLOCKING MODE
	0:00:01.038002010  8142   0x557c4e2430 WARN                 nvinfer gstnvinfer.cpp:515:gst_nvinfer_logger:<primary_gie_classifier> NvDsInferContext[UID 1]:useEngineFile(): Failed to read from model engine file
	0:00:01.038094308  8142   0x557c4e2430 INFO                 nvinfer gstnvinfer.cpp:519:gst_nvinfer_logger:<primary_gie_classifier> NvDsInferContext[UID 1]:initialize(): Trying to create engine from model files
	Loading pre-trained weights...
	Loading complete!
	Total Number of weights read : 8858734
		layer               inp_size            out_size       weightPtr
	(1)   conv-bn-leaky     3 x 416 x 416      16 x 416 x 416    496
	(2)   maxpool          16 x 416 x 416      16 x 208 x 208    496
	(3)   conv-bn-leaky    16 x 208 x 208      32 x 208 x 208    5232
	(4)   maxpool          32 x 208 x 208      32 x 104 x 104    5232
	(5)   conv-bn-leaky    32 x 104 x 104      64 x 104 x 104    23920
	(6)   maxpool          64 x 104 x 104      64 x  52 x  52    23920
	(7)   conv-bn-leaky    64 x  52 x  52     128 x  52 x  52    98160
	(8)   maxpool         128 x  52 x  52     128 x  26 x  26    98160
	(9)   conv-bn-leaky   128 x  26 x  26     256 x  26 x  26    394096
	(10)  maxpool         256 x  26 x  26     256 x  13 x  13    394096
	(11)  conv-bn-leaky   256 x  13 x  13     512 x  13 x  13    1575792
	(12)  maxpool         512 x  13 x  13     512 x  13 x  13    1575792
	(13)  conv-bn-leaky   512 x  13 x  13    1024 x  13 x  13    6298480
	(14)  conv-bn-leaky  1024 x  13 x  13     256 x  13 x  13    6561648
	(15)  conv-bn-leaky   256 x  13 x  13     512 x  13 x  13    7743344
	(16)  conv-linear     512 x  13 x  13     255 x  13 x  13    7874159
	(17)  yolo            255 x  13 x  13     255 x  13 x  13    7874159
	(18)  route                  -            256 x  13 x  13    7874159
	(19)  conv-bn-leaky   256 x  13 x  13     128 x  13 x  13    7907439
	(20)  upsample        128 x  13 x  13     128 x  26 x  26        -
	(21)  route                  -            384 x  26 x  26    7907439
	(22)  conv-bn-leaky   384 x  26 x  26     256 x  26 x  26    8793199
	(23)  conv-linear     256 x  26 x  26     255 x  26 x  26    8858734
	(24)  yolo            255 x  26 x  26     255 x  26 x  26    8858734
	Output blob names :
	yolo_17
	yolo_24
	Total number of layers: 50
	Total number of layers on DLA: 0
	Building the TensorRT Engine...
	Building complete!
	0:00:57.905894974  8142   0x557c4e2430 INFO                 nvinfer gstnvinfer.cpp:519:gst_nvinfer_logger:<primary_gie_classifier> NvDsInferContext[UID 1]:generateTRTModel(): Storing the serialized cuda engine to file at /opt/nvidia/deepstream/deepstream-4.0/sources/objectDetector_Yolo/model_b1_fp32.engine
	Deserialize yoloLayerV3 plugin: yolo_17
	Deserialize yoloLayerV3 plugin: yolo_24

	Runtime commands:
			h: Print this help
			q: Quit

			p: Pause
			r: Resume

	NOTE: To expand a source in the 2D tiled display and view object details, left-click on the source.
		To go back to the tiled display, right-click anywhere on the window.


	**PERF: FPS 0 (Avg)
	**PERF: 0.00 (0.00)
	** INFO: <bus_callback:193>: Pipeline ready

	NvMMLiteOpen : Block : BlockType = 4
	** INFO: <bus_callback:179>: Pipeline running

	===== NVMEDIA: NVENC =====
	NvMMLiteBlockCreate : Block : BlockType = 4
	GST_ARGUS: Creating output stream
	CONSUMER: Waiting until producer is connected...
	GST_ARGUS: Available Sensor modes :
	GST_ARGUS: 2592 x 1944 FR = 15.000015 fps Duration = 66666600 ; Analog Gain range min 16.000000, max 128.000000; Exposure Range min 65000, max 60000000;

	GST_ARGUS: 1920 x 1080 FR = 29.999999 fps Duration = 33333334 ; Analog Gain range min 16.000000, max 128.000000; Exposure Range min 60000, max 30000000;

	GST_ARGUS: 1280 x 960 FR = 45.000000 fps Duration = 22222222 ; Analog Gain range min 16.000000, max 128.000000; Exposure Range min 43000, max 20000000;

	GST_ARGUS: 1280 x 720 FR = 59.999999 fps Duration = 16666667 ; Analog Gain range min 16.000000, max 128.000000; Exposure Range min 43000, max 10000000;

	GST_ARGUS: Running with following settings:
	Camera index = 0
	Camera mode  = 3
	Output Stream W = 1280 H = 720
	seconds to Run    = 0
	Frame Rate = 59.999999
	GST_ARGUS: PowerService: requested_clock_Hz=627200000
	GST_ARGUS: Setup Complete, Starting captures for 0 seconds
	GST_ARGUS: Starting repeat capture requests.
	CONSUMER: Producer has connected; continuing.
	H264: Profile = 66, Level = 0
	**PERF: 25.81 (25.81)
	**PERF: 25.75 (25.78)
	**PERF: 25.76 (25.77)
	**PERF: 25.72 (25.76)
	q
	Quitting
	GST_ARGUS: Cleaning up
	CONSUMER: Done Success
	GST_ARGUS: Done Success
	App run successful
	GST_ARGUS:
	PowerServiceHwVic::cleanupResources


## ☄️ Part 3: Installing and running IrishTrafficCam with Deepstream

### 1. Install node.js

```bash
# Install node.js
sudo apt-get install curl
curl -sL https://deb.nodesource.com/setup_12.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### 2. Install Mongodb for Jetson devices (ARM64):

```bash
# Install mongodb

# Detailed doc: https://computingforgeeks.com/how-to-install-latest-mongodb-on-ubuntu-18-04-ubuntu-16-04/
# NB: at time of writing this guide, we install the mongodb package for ubuntu 16.04 as the arm64 version of it isn't available for 18.04
sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv 9DA31620334BD75D9DCB49F368818C72E52529D4
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu xenial/mongodb-org/4.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-4.0.list
sudo apt-get update
sudo apt-get install -y openssl libcurl3 mongodb-org

# Start service
sudo systemctl start mongod

# Enable service on boot
sudo systemctl enable mongod
```

### 3. Install irishtrafficcam


- 🔵 Download source:


    ```bash
    git clone --single-branch --branch deepstream_test https://github.com/IrishTrafficSurveysDev/irishtrafficcam.git
    cd opendatacam
    ```

- 🔵 Modify the `config.json` file appropriately:

``` json

  "OPENDATACAM_VERSION": "3.0.1",
  "PATH_TO_YOLO" : "/opt/nvidia/deepstream/deepstream-5.1/sources/objectDetector_Yolo/",
  "DEEPSTREAM_CONFIG_FILE": "/opt/nvidia/deepstream/deepstream-5.1/sources/objectDetector_Yolo/deepstream_app_config_yoloV3_tiny_http_uri.txt",
  "RECORDINGS_PATH": "/path/to/store/recordings",

```

 
- 🔵 Install  **IrishTrafficCam**

```bash
cd <path/to/irish-traffic-cam>
npm install
npm run build
```

- 🔵 Run **IrishTrafficCam**

```bash
cd <path/to/irish-traffic-cam>
npm run start
```

- 🔵 (optional) Config **IrishTrafficCam** to run on boot

```bash
# install pm2
npm install pm2 -g |

# go to opendatacam/irishtrafficcam folder
cd  <path/to/irish-traffic-cam>
# launch pm2 at startup
# this command gives you instructions to configure pm2 to
# start at ubuntu startup, follow them
sudo pm2 startup

# Once pm2 is configured to start at startup
# Configure pm2 to start the Irish Traffic Cam app
sudo pm2 start npm --name "irishtrafficcam" -- start
sudo pm2 save
```

- 🔵 (optional) Open ports 8080 8090 and 8070 to outside world on cloud deployment machine

```
sudo ufw allow 8080
sudo ufw allow 8090
sudo ufw allow 8070
```

#### ❓ Troulbeshooting

##### ❔ Troubleshooting problems with the `Makefile`
- If you get an error **similar** to the error below when following Part G) of [Step 4 of Patching Deepstream](https://github.com/IrishTrafficSurveysDev/irishtrafficcam/tree/deepstream_test#4%EF%B8%8F%E2%83%A3-step-4-patch-deepstream---modify-main-application) :
``` bash
fatal error: cuda_runtime_api.h: No such file or directory
```
 - Please modify the `Makefile` (located at `/opt/nvidia/deepstream/deepstream-5.1/sources/apps/sample_apps/deepstream-app/`) according to the instructions detailed [here](https://forums.developer.nvidia.com/t/fatal-error-cuda-runtime-api-h-no-such-file-or-directory-when-compiling-with-jetpack-4-5-1/171218).

##### ❔ Troubleshooting problems with running Deepstream
- If you get errors and are stuck at a loop when trying to run IrishTrafficCam with Deepstream, run the following command:
``` bash
sudo systemctl restart nvargus-daemon
```
