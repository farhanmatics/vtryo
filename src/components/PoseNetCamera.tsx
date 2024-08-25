import React, { useEffect, useRef } from 'react';
import * as posenet from '@tensorflow-models/posenet';
import '@tensorflow/tfjs';
import '@tensorflow/tfjs-backend-webgl';
import '@tensorflow/tfjs-backend-webgpu';

import * as tf from '@tensorflow/tfjs-core';

const PoseNetCamera: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const setupCamera = async () => {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play();
          };
        }
      }
    };

    const initBackend = async () => {
      if (await tf.setBackend('webgpu').catch(() => false)) {
        console.log('Using WebGPU backend');
      } else if (await tf.setBackend('webgl').catch(() => false)) {
        console.log('Using WebGL backend');
      } else {
        console.log('Using default backend');
      }
      await tf.ready();
      // Continue with loading PoseNet or other code
    };

    const loadPosenet = async () => {
      const net = await posenet.load();

      const detectPose = async () => {
        if (videoRef.current!.videoWidth > 0 && videoRef.current!.videoHeight > 0) {
          const pose = await net.estimateSinglePose(videoRef.current!, {
            flipHorizontal: false,
          });

          console.log('Pose:', pose); // Add this line

          drawCanvas(pose);
        }

        requestAnimationFrame(detectPose);
      };

      detectPose();
    };

    const drawCanvas = (pose: posenet.Pose) => {
      if (!canvasRef.current || !videoRef.current) return;

      const ctx = canvasRef.current.getContext('2d');
      if (!ctx) return;

      // Set canvas size to match video
      canvasRef.current.width = videoRef.current.videoWidth;
      canvasRef.current.height = videoRef.current.videoHeight;

      // Clear the canvas
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

      // Draw the video frame
      ctx.drawImage(
        videoRef.current,
        0,
        0,
        canvasRef.current.width,
        canvasRef.current.height
      );

      // Draw the keypoints and skeleton
      drawKeypoints(pose.keypoints, 0.5, ctx);
      drawSkeleton(pose.keypoints, 0.5, ctx);

      // Draw a line between the shoulders
      drawShoulderLine(pose.keypoints, ctx);
    };

    const drawKeypoints = (
      keypoints: posenet.Keypoint[],
      minConfidence: number,
      ctx: CanvasRenderingContext2D
    ) => {
      keypoints.forEach((keypoint) => {
        if (keypoint.score >= minConfidence) {
          const { y, x } = keypoint.position;
          ctx.beginPath();
          ctx.arc(x, y, 5, 0, 2 * Math.PI);
          ctx.fillStyle = 'red';
          ctx.fill();
        }
      });
    };

    const drawSkeleton = (
      keypoints: posenet.Keypoint[],
      minConfidence: number,
      ctx: CanvasRenderingContext2D
    ) => {
      const adjacentKeyPoints = posenet.getAdjacentKeyPoints(
        keypoints,
        minConfidence
      );

      adjacentKeyPoints.forEach((keypoints) => {
        const { x: x1, y: y1 } = keypoints[0].position;
        const { x: x2, y: y2 } = keypoints[1].position;

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.lineWidth = 2;
        ctx.strokeStyle = 'red';
        ctx.stroke();
      });
    };

    const drawShoulderLine = (
      keypoints: posenet.Keypoint[],
      ctx: CanvasRenderingContext2D
    ) => {
      const leftShoulder = keypoints.find((point) => point.part === 'leftShoulder');
      const rightShoulder = keypoints.find((point) => point.part === 'rightShoulder');

      if (leftShoulder && rightShoulder && leftShoulder.score > 0.5 && rightShoulder.score > 0.5) {
        ctx.beginPath();
        ctx.moveTo(leftShoulder.position.x, leftShoulder.position.y);
        ctx.lineTo(rightShoulder.position.x, rightShoulder.position.y);
        ctx.lineWidth = 4;
        ctx.strokeStyle = 'red';
        ctx.stroke();
      }

      //console.log(keypoints)
    };

    setupCamera();
    initBackend();
    loadPosenet();
  }, []);

  return (
    <div>
      <video ref={videoRef} style={{ display: 'none' }} />
      <canvas
        ref={canvasRef}
        width={640}
        height={480}
        style={{ border: '2px solid black' }}
      />
    </div>
  );
};

export default PoseNetCamera;
