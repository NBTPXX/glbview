"use client"

// GLB Model Viewer - Air Force One
import { Suspense, useRef, useCallback, useState, useEffect } from "react"
import { Canvas, useThree } from "@react-three/fiber"
import { OrbitControls, Center, useGLTF, Html } from "@react-three/drei"
import type { OrbitControls as OrbitControlsType } from "three-stdlib"
import * as THREE from "three"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"

const MODEL_PATH = "/models/air-force-one.glb"

const CAMERA_VIEWS = {
  front: { position: [0, 0, 20], name: "前视图" },
  side: { position: [20, 0, 0], name: "侧视图" },
  top: { position: [0, 20, 0], name: "顶视图" },
  perspective: { position: [12, 8, 15], name: "透视图" },
} as const

const LoadingSpinner = () => (
  <Html center>
    <div className="w-10 h-10 border-4 border-neutral-300 border-t-neutral-600 rounded-full animate-spin" />
  </Html>
)

interface AirForceOneModelProps {
  onLoaded?: (box: THREE.Box3) => void
}

const AirForceOneModel = ({ onLoaded }: AirForceOneModelProps) => {
  const { scene } = useGLTF(MODEL_PATH)
  const { camera } = useThree()
  
  useEffect(() => {
    const box = new THREE.Box3().setFromObject(scene)
    const size = box.getSize(new THREE.Vector3())
    const center = box.getCenter(new THREE.Vector3())
    
    const maxDim = Math.max(size.x, size.y, size.z)
    const fov = (camera as THREE.PerspectiveCamera).fov * (Math.PI / 180)
    let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2))
    cameraZ *= 1.5
    
    camera.position.set(cameraZ * 0.6, cameraZ * 0.3, cameraZ * 0.8)
    camera.lookAt(center)
    
    if (onLoaded) {
      onLoaded(box)
    }
  }, [scene, camera, onLoaded])
  
  return (
    <Center>
      <primitive object={scene} />
    </Center>
  )
}

interface SceneProps {
  controlsRef: React.RefObject<OrbitControlsType | null>
  onModelLoaded?: (box: THREE.Box3) => void
  rotationAngle: number
  onInteraction?: () => void
}

const Scene = ({ controlsRef, onModelLoaded, rotationAngle, onInteraction }: SceneProps) => {
  const { camera } = useThree()
  const distanceRef = useRef(50)
  const isInitializedRef = useRef(false)
  
  useEffect(() => {
    if (controlsRef.current && isInitializedRef.current) {
      const controls = controlsRef.current
      const angleRad = (rotationAngle * Math.PI) / 180
      
      const currentPos = camera.position.clone()
      distanceRef.current = currentPos.length()
      
      const newX = distanceRef.current * Math.sin(angleRad)
      const newZ = distanceRef.current * Math.cos(angleRad)
      
      camera.position.set(newX, 0, newZ)
      controls.target.set(0, 0, 0)
      controls.update()
    }
  }, [rotationAngle, camera, controlsRef])
  
  const handleModelLoaded = useCallback((box: THREE.Box3) => {
    isInitializedRef.current = true
    if (onModelLoaded) {
      onModelLoaded(box)
    }
  }, [onModelLoaded])
  
  return (
    <>
      <color attach="background" args={["#ffffff"]} />
      <ambientLight intensity={2} />
      <directionalLight position={[10, 10, 5]} intensity={3} />
      <directionalLight position={[-10, 10, -5]} intensity={2} />
      <directionalLight position={[0, -10, 0]} intensity={1} />
      <Suspense fallback={<LoadingSpinner />}>
        <AirForceOneModel onLoaded={handleModelLoaded} />
      </Suspense>
      <OrbitControls
        ref={controlsRef}
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={5}
        maxDistance={200}
        onStart={onInteraction}
      />
    </>
  )
}

export const ModelViewer = () => {
  const controlsRef = useRef<OrbitControlsType>(null)
  const [rotationAngle, setRotationAngle] = useState(45)
  const [sliderVisible, setSliderVisible] = useState(false)
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const showSlider = useCallback(() => {
    setSliderVisible(true)
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current)
    }
    hideTimeoutRef.current = setTimeout(() => {
      setSliderVisible(false)
    }, 5000)
  }, [])

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const threshold = window.innerHeight * 0.85
    if (e.clientY > threshold) {
      showSlider()
    }
  }, [showSlider])

  const handleInteraction = useCallback(() => {
    const isMobile = window.matchMedia("(pointer: coarse)").matches
    if (isMobile) {
      showSlider()
    }
  }, [showSlider])

  useEffect(() => {
    return () => {
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current)
      }
    }
  }, [])

  const handleViewChange = useCallback((view: keyof typeof CAMERA_VIEWS) => {
    if (!controlsRef.current) return
    const { position } = CAMERA_VIEWS[view]
    const controls = controlsRef.current
    const camera = controls.object as THREE.PerspectiveCamera
    
    camera.position.set(position[0], position[1], position[2])
    controls.target.set(0, 0, 0)
    controls.update()
  }, [])

  const handleRotationChange = useCallback((value: number[]) => {
    setRotationAngle(value[0])
    showSlider()
  }, [showSlider])

  return (
    <div 
      className="relative w-full h-screen bg-white"
      onMouseMove={handleMouseMove}
    >
      <Canvas
        camera={{ position: [30, 20, 40], fov: 50 }}
        gl={{ antialias: true }}
      >
        <Scene 
          controlsRef={controlsRef} 
          rotationAngle={rotationAngle}
          onInteraction={handleInteraction}
        />
      </Canvas>
      
      <div className="absolute top-4 left-4 flex gap-2">
        {Object.entries(CAMERA_VIEWS).map(([key, { name }]) => (
          <Button
            key={key}
            variant="outline"
            size="sm"
            onClick={() => handleViewChange(key as keyof typeof CAMERA_VIEWS)}
            className="bg-white/90 backdrop-blur-sm hover:bg-neutral-100"
          >
            {name}
          </Button>
        ))}
      </div>
      
      <div 
        className={`absolute bottom-8 left-1/2 -translate-x-1/2 w-80 bg-white/90 backdrop-blur-sm rounded-lg p-4 shadow-lg transition-all duration-300 ease-in-out ${
          sliderVisible 
            ? "translate-y-0 opacity-100" 
            : "translate-y-full opacity-0 pointer-events-none"
        }`}
      >
        <div className="flex items-center gap-4">
          <span className="text-sm text-neutral-600 whitespace-nowrap">水平旋转</span>
          <Slider
            value={[rotationAngle]}
            onValueChange={handleRotationChange}
            min={0}
            max={360}
            step={1}
            className="flex-1"
          />
          <span className="text-sm text-neutral-500 w-12 text-right">{rotationAngle}°</span>
        </div>
      </div>
    </div>
  )
}

useGLTF.preload(MODEL_PATH)
