# ☘️ Irish Traffic Cam - Deepstream Seup

### 🎬 Introduction

This is an  experimental fork that aims to replace Darknet with the Deepstream SDK in order for increased speed, accuracy and performance for IrishTrafficCam. In order to achieve this, a series of patches and code modifications are required. This documentation will guide you through the necessary steps for implementing Deepstream with IrishTrafficCam.

### 📚 Documentation Layout
- There are 2 essential parts to this guide:
  - Part 1 of this guide will outline the necessary steps needed to flash [Jetpack SDK](https://developer.nvidia.com/embedded/jetpack) onto Jetson TX2, which is required in order to run IrishTrafficCam
  - Part 2 of this guide will outline the necessary steps needed to integrate Deepstream with IrishTrafficCam

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
- Ensure that your SDK manager is the latest version. This is the ensured by default, but **do not install the SDK manager from the SDK archives**. The SDK manager will block installation as it knows that there is a later version available. As of writing, the latest version of Jetpack is 4.5.1, which was flashed successfully onto the TX2. According to the official OpenDataCam [documentation](https://github.com/opendatacam/opendatacam/blob/master/documentation/jetson/FLASH_JETSON.md), any version above Jetpack 4.3 is supported.

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

    sudo apt-get install <deepstream debian file>
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
  
