import {useLayoutEffect, useRef} from 'react';
import {useFrame, useThree} from '@react-three/fiber';
import {
  BufferGeometry, DepthTexture, Float32BufferAttribute, HalfFloatType, LinearFilter,
  Mesh, OrthographicCamera, Scene, ShaderMaterial, Vector2, Vector3, WebGLRenderTarget,
} from 'three';

const vertexShader = /* glsl */`
  varying vec2 vUv;
  void main() {
    vUv = position.xy * 0.5 + 0.5;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

// A single nine-tap gather supplies a restrained depth-aware blur and highlight
// glow, avoiding an expensive multi-pass lens simulation on software WebGL.
const fragmentShader = /* glsl */`
  #include <packing>
  uniform sampler2D colorMap;
  uniform sampler2D depthMap;
  uniform vec2 texelSize;
  uniform float cameraNear;
  uniform float cameraFar;
  uniform float focusDistance;
  uniform float focusRange;
  uniform float pixelScale;
  varying vec2 vUv;

  vec3 highlights(vec3 color) {
    float lightness = dot(color, vec3(0.2126, 0.7152, 0.0722));
    return color * smoothstep(1.2, 2.6, lightness);
  }

  void main() {
    float depth = texture2D(depthMap, vUv).x;
    float distanceToCamera = -perspectiveDepthToViewZ(depth, cameraNear, cameraFar);
    float outOfFocus = smoothstep(focusRange, focusRange + 12.0,
      abs(distanceToCamera - focusDistance));
    float radius = mix(1.0, 3.0, outOfFocus) * pixelScale;
    vec2 stepSize = texelSize * radius;
    vec3 center = texture2D(colorMap, vUv).rgb;
    vec3 gathered = center * 0.2;
    vec3 bloom = highlights(center) * 0.2;
    vec2 offsets[8];
    offsets[0] = vec2( 1.0,  0.0);
    offsets[1] = vec2(-1.0,  0.0);
    offsets[2] = vec2( 0.0,  1.0);
    offsets[3] = vec2( 0.0, -1.0);
    offsets[4] = vec2( 0.7071,  0.7071);
    offsets[5] = vec2(-0.7071,  0.7071);
    offsets[6] = vec2( 0.7071, -0.7071);
    offsets[7] = vec2(-0.7071, -0.7071);
    for (int i = 0; i < 8; i++) {
      vec3 sampleColor = texture2D(colorMap,
        clamp(vUv + offsets[i] * stepSize, texelSize * 0.5, vec2(1.0) - texelSize * 0.5)).rgb;
      gathered += sampleColor * 0.1;
      bloom += highlights(sampleColor) * 0.1;
    }
    vec3 color = mix(center, gathered, outOfFocus * 0.65) + bloom * 0.16;
    gl_FragColor = vec4(color, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

type Pipeline = {
  target: WebGLRenderTarget;
  material: ShaderMaterial;
  screenScene: Scene;
  screenCamera: OrthographicCamera;
};

/** Setup precedes Remotion's manual advance; useFrame only submits two passes. */
export function CinematicEffects({target = [0, 1.5, 0]}: {target?: [number, number, number]}) {
  const {gl, scene, camera, size} = useThree();
  const pipeline = useRef<Pipeline | null>(null);
  const worldFocus = useRef(new Vector3(...target));
  useLayoutEffect(() => {
    worldFocus.current.set(...target);
  }, [target[0], target[1], target[2]]);

  useLayoutEffect(() => {
    const resolution = gl.getDrawingBufferSize(new Vector2());
    const width = Math.max(1, resolution.x);
    const height = Math.max(1, resolution.y);
    const renderTarget = new WebGLRenderTarget(width, height, {
      type: HalfFloatType, minFilter: LinearFilter, magFilter: LinearFilter,
      depthBuffer: true, stencilBuffer: false, samples: 0,
    });
    renderTarget.texture.name = 'Cinematic color';
    renderTarget.texture.generateMipmaps = false;
    renderTarget.depthTexture = new DepthTexture(width, height);
    renderTarget.depthTexture.name = 'Cinematic depth';

    const geometry = new BufferGeometry();
    geometry.setAttribute('position', new Float32BufferAttribute([
      -1, -1, 0, 3, -1, 0, -1, 3, 0,
    ], 3));
    const material = new ShaderMaterial({
      vertexShader, fragmentShader, depthTest: false, depthWrite: false,
      toneMapped: true,
      uniforms: {
        colorMap: {value: renderTarget.texture},
        depthMap: {value: renderTarget.depthTexture},
        texelSize: {value: new Vector2(1 / width, 1 / height)},
        cameraNear: {value: camera.near},
        cameraFar: {value: camera.far},
        focusDistance: {value: 6},
        focusRange: {value: 3},
        pixelScale: {value: height / 1080},
      },
    });
    const screenScene = new Scene();
    const triangle = new Mesh(geometry, material);
    triangle.frustumCulled = false;
    screenScene.add(triangle);
    const screenCamera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
    pipeline.current = {target: renderTarget, material, screenScene, screenCamera};
    return () => {
      pipeline.current = null;
      screenScene.remove(triangle);
      geometry.dispose();
      material.dispose();
      renderTarget.depthTexture?.dispose();
      renderTarget.dispose();
    };
  }, [gl, scene, camera, size.width, size.height]);

  useFrame(() => {
    const current = pipeline.current;
    if (!current) return;
    const {uniforms} = current.material;
    uniforms.focusDistance.value = camera.position.distanceTo(worldFocus.current);
    uniforms.cameraNear.value = camera.near;
    uniforms.cameraFar.value = camera.far;
    const previousTarget = gl.getRenderTarget();
    const previousAutoClear = gl.autoClear;
    gl.autoClear = true;
    gl.setRenderTarget(current.target);
    gl.render(scene, camera);
    gl.setRenderTarget(previousTarget);
    gl.render(current.screenScene, current.screenCamera);
    gl.autoClear = previousAutoClear;
  }, 1);
  return null;
}
