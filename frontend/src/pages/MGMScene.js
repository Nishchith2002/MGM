



import React, { Suspense, useEffect } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls, useGLTF, Text } from "@react-three/drei";
import * as THREE from "three";


function Model() {
  const { scene } = useGLTF("/models/mgm.glb");

  useEffect(() => {
    const box = new THREE.Box3().setFromObject(scene);
    const center = box.getCenter(new THREE.Vector3());

    scene.position.sub(center);   
    scene.position.y = -1.2;      
  }, [scene]);

  scene.scale.setScalar(0.012);   

  return <primitive object={scene} />;
}


function CameraSetup() {
  const { camera } = useThree();

  useEffect(() => {
    camera.position.set(9, 5, 9); 
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
  }, [camera]);

  return null;
}

function Compass3D() {
  const radius = 3.8;  

  return (
    <group>
      {/* LATITUDE RINGS */}
      {[0.25, 0.55, 0.75, 0.9].map((factor, i) => {
        const y = radius * factor;
        const ringRadius = Math.sqrt(radius * radius - y * y);
        const segments = 64;

        const points = [...Array(segments + 1)].map((_, j) => {
          const a = (j / segments) * Math.PI * 2;
          return new THREE.Vector3(
            Math.cos(a) * ringRadius,
            y,
            Math.sin(a) * ringRadius
          );
        });

        return (
          <line key={i}>
            <bufferGeometry attach="geometry" setFromPoints={points} />
            <lineBasicMaterial color="#1a1a1a" transparent opacity={0.3} />
          </line>
        );
      })}

      {/* LONGITUDE LINES */}
      {Array.from({ length: 12 }, (_, i) => {
        const angle = (i / 12) * Math.PI * 2;

        const points = [...Array(33)].map((_, j) => {
          const phi = (j / 32) * (Math.PI / 2);
          return new THREE.Vector3(
            radius * Math.sin(phi) * Math.cos(angle),
            radius * Math.cos(phi),
            radius * Math.sin(phi) * Math.sin(angle)
          );
        });

        return (
          <line key={`lon-${i}`}>
            <bufferGeometry attach="geometry" setFromPoints={points} />
            <lineBasicMaterial color="#1a1a1a" transparent opacity={0.3} />
          </line>
        );
      })}

      {/* DEGREE MARKERS */}
      {Array.from({ length: 12 }, (_, i) => {
        const angle = (i / 12) * Math.PI * 2;
        return (
          <Text
            key={`deg-${i}`}
            position={[
              Math.cos(angle) * (radius + 0.7),
              0,
              Math.sin(angle) * (radius + 0.7)
            ]}
            rotation={[0, -angle, 0]}
            fontSize={0.35}
            color="#1a1a1a"
          >
            {i * 30}°
          </Text>
        );
      })}

      {/* CARDINAL DIRECTIONS */}
      <Text position={[0, 0, radius + 1]} fontSize={0.6} color="#1a1a1a">N</Text>
      <Text position={[0, 0, -radius - 1]} fontSize={0.6} color="#1a1a1a">S</Text>
      <Text
        position={[radius + 1, 0, 0]}
        rotation={[0, Math.PI / 2, 0]}
        fontSize={0.6}
        color="#1a1a1a"
      >
        E
      </Text>
      <Text
        position={[-radius - 1, 0, 0]}
        rotation={[0, -Math.PI / 2, 0]}
        fontSize={0.6}
        color="#1a1a1a"
      >
        W
      </Text>
    </group>
  );
}


export default function Viewer() {
  return (
    <div style={{ width: "100%", height: "100vh" }}>
      <Canvas camera={{ position: [9, 5, 9], fov: 45 }}>
        <color attach="background" args={["#f5f5f5"]} />

        <CameraSetup />

        <ambientLight intensity={1.2} />
        <directionalLight position={[10, 10, 10]} intensity={2} />

        <Suspense fallback={null}>
          <Model />
          <Compass3D />
        </Suspense>

        <OrbitControls
          target={[0, 0, 0]}
          enableRotate={true}
          autoRotate={false}
          // minDistance={8}
          // maxDistance={20}
        />
      </Canvas>
    </div>
  );
}
