import React, { useRef, useEffect, useState } from "react";
import * as faceapi from "face-api.js";
import Webcam from "react-webcam";
import { useParams } from "react-router-dom";
import {
  setDoc,
  doc,
  collection,
  addDoc,
  getDoc,
  onSnapshot,
  deleteDoc,
} from "firebase/firestore";
import { FIRESTORE } from "../constants/firebase";
import { getDatabase, ref, set } from "firebase/database";
import { CheckCircleOutlined, LoadingOutlined } from "@ant-design/icons";

const EmotionRecognition = () => {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const  uid  = "webrtc_connection";
  const [detectedEmotion, setDetectedEmotion] = useState(null);

  const [roomId, setRoomId] = useState("");
  const [localStream, setLocalStream] = useState(null);
  const [peerConnection, setPeerConnection] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [connection, setConnection] = useState(false);

  const videoConstraints = {
    facingMode: "user",
    width: { ideal: 640 },
    height: { ideal: 480 },
  };

  useEffect(() => {
    const loadModels = async () => {
      await faceapi.loadSsdMobilenetv1Model("/models");
      await faceapi.loadFaceLandmarkModel("/models");
      await faceapi.loadFaceRecognitionModel("/models");
      await faceapi.loadFaceExpressionModel("/models");
    };
    loadModels();
  }, []);

  useEffect(() => {
    if (localStream) {
      createRoom();
    }
  }, [localStream]);

  useEffect(() => {
    const interval = setInterval(async () => {
      if (webcamRef.current && webcamRef.current.video.readyState === 4) {
        const video = webcamRef.current.video;
        const displaySize = {
          width: video.videoWidth,
          height: video.videoHeight,
        };

        const canvas = canvasRef.current;
        canvas.width = displaySize.width;
        canvas.height = displaySize.height;

        faceapi.matchDimensions(canvas, displaySize);

        const detections = await faceapi
          .detectAllFaces(video, new faceapi.SsdMobilenetv1Options())
          .withFaceLandmarks()
          .withFaceExpressions();

        const resizedDetections = faceapi.resizeResults(
          detections,
          displaySize
        );

        const expressions = resizedDetections[0]?.expressions;

        if (expressions) {
          const emotion = Object.keys(expressions).reduce((a, b) =>
            expressions[a] > expressions[b] ? a : b
          );
          setDetectedEmotion(emotion);

          const db = getDatabase();
          const emotionRef = ref(db, "emotions");
          set(emotionRef, {
            emotion: emotion,
            timestamp: new Date().toISOString(),
          });
        }

        const context = canvas.getContext("2d");
        context.clearRect(0, 0, displaySize.width, displaySize.height);
        faceapi.draw.drawDetections(canvas, resizedDetections);
        faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);
        faceapi.draw.drawFaceExpressions(canvas, resizedDetections);
      }
    }, 100);
    return () => clearInterval(interval);
  }, [uid]);

  useEffect(() => {
    const initializeLocalStream = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: videoConstraints,
          audio: false,
        });
        setLocalStream(stream);
      } catch (err) {
        console.error("Error accessing media devices.", err);
      }
    };
    initializeLocalStream();
  }, []);

  const createRoom = async () => {
    const roomRef = doc(FIRESTORE, "rooms", uid);
    const roomSnapshot = await getDoc(roomRef);
    if (roomSnapshot.exists()) {
      await deleteDoc(roomRef);
      console.log(`Pruning in process....`);
    }
    if (!localStream) {
      console.error("Local stream is not initialized.");
      return;
    }
    const pc = new RTCPeerConnection();
    localStream.getTracks().forEach((track) => pc.addTrack(track, localStream));
    pc.onicecandidate = async (event) => {
      if (event.candidate) {
        try {
          const candidateData = {
            candidate: event.candidate.candidate,
            sdpMid: event.candidate.sdpMid,
            sdpMLineIndex: event.candidate.sdpMLineIndex,
          };
          const candidatesRef = collection(roomRef, "callerCandidates");
          await addDoc(candidatesRef, candidateData);
          console.log("ICE candidate added to Firestore");
          setConnection(true);
        } catch (error) {
          console.error("Error adding ICE candidate to Firestore:", error);
        }
      }
    };

    pc.ontrack = (event) => {
      setRemoteStream(event.streams[0]);
    };
    try {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      await setDoc(roomRef, { offer });
      console.log("Offer sent to Firestore");
    } catch (error) {
      console.error("Error creating offer:", error);
    }

    onSnapshot(roomRef, (snapshot) => {
      const data = snapshot.data();
      if (data?.answer) {
        const answer = new RTCSessionDescription(data.answer);
        pc.setRemoteDescription(answer);
      }
    });

    const calleeCandidatesRef = collection(roomRef, "calleeCandidates");
    onSnapshot(calleeCandidatesRef, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
          const candidate = new RTCIceCandidate(change.doc.data());
          pc.addIceCandidate(candidate);
        }
      });
    });

    setPeerConnection(pc);
    setRoomId(roomRef.id);
  };

  return (
    <div className="relative w-full h-full">
      <div className="absolute bottom-10 left-1/2">
        <span
          className={`${
            connection ? "text-green-600" : "text-red-600"
          } text-sm font-serif font-semibold flex gap-2`}
        >
          {connection ? <CheckCircleOutlined /> : <LoadingOutlined />}
          <p>{connection ? "Ready to connect" : "connecting..."}</p>
        </span>
      </div>
      <Webcam
        ref={webcamRef}
        style={{
          position: "absolute",
          top: 120,
          left: 0,
          right: 0,
          bottom: 0,
          width: "100%",
          height: "80%",
          objectFit: "cover",
          transform: "scaleX(-1)",
          borderRadius: "15px",
        }}
        audio={false}
        screenshotFormat="image/jpeg"
      />

      <canvas
        ref={canvasRef}
        style={{
          position: "absolute",
          top: 120,
          left: 0,
          right: 0,
          bottom: 0,
          width: "100%",
          height: "80%",
          pointerEvents: "none",
        }}
      />
    </div>
  );
};

export default EmotionRecognition;
