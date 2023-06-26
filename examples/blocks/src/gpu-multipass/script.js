function configCanvas() {
    const { width, height } = canvas.getBoundingClientRect();

    canvas.width = width;
    canvas.height = height;
}

function getPresentationFormat() {
    return navigator.gpu.getPreferredCanvasFormat();
}

function getCanvasAndContext(device) {
    const canvas = document.getElementById("canvas");

    console.log(canvas.getBoundingClientRect());
    const { width, height } = canvas.getBoundingClientRect();
    console.log(width, height);
    canvas.width = width * devicePixelRatio;
    canvas.height = height * devicePixelRatio;

    const ctx = canvas.getContext("webgpu");

    ctx.configure({
        device,
        format: getPresentationFormat(),
        alphaMode: "premultiplied",
    });

    return { canvas, ctx };
}

async function getAdapter() {
    return await navigator.gpu.requestAdapter({
        powerPreference: "high-performance",
    });
}

async function getDevice(adapter) {
    return await adapter.requestDevice();
}

function createShaderSrc() {
    const shaderSrc = `
    struct VertexInput {
      @location(0) position: vec2<f32>,
      @location(1) color: vec4<f32>,
    }
   
    struct VertexOutput {
      @builtin(position) position: vec4<f32>,
      @location(0) color: vec4<f32>,
    }

    @vertex
    fn vert_main(
      vsIn: VertexInput,
    ) -> VertexOutput {
      var output: VertexOutput;

      output.position = vec4<f32>(vsIn.position, 0., 1.);
      output.color = vsIn.color;

      return output;
    }

    @fragment
    fn frag_main(vsOut: VertexOutput) -> @location(0) vec4<f32> {
      return vsOut.color;
    }
   `;

    return shaderSrc;
}

async function createPipeline(device) {
    const code = createShaderSrc();
    const module = device.createShaderModule({ code });
    const pipeline = device.createRenderPipeline({
        layout: "auto",
        vertex: {
            module,
            entryPoint: "vert_main",
            buffers: [
                {
                    arrayStride: 6 * 4, // 8 floats per vertex (x, y, r, g, b, a)
                    attributes: [
                        {
                            // position
                            shaderLocation: 0,
                            offset: 0,
                            format: "float32x2",
                        },
                        {
                            // color
                            shaderLocation: 1,
                            offset: 2 * 4, // 4 floats per vertex, position is 4 floats
                            format: "float32x4",
                        },
                    ],
                },
            ],
        },
        fragment: {
            module,
            entryPoint: "frag_main",
            targets: [
                {
                    format: getPresentationFormat(),
                },
            ],
        },
        primitive: {
            topology: "triangle-list",
        },
    });

    return pipeline;
}

// prettier-ignore
const vertices = [
    // triangle 1, red
    [0.0 , 0.6, 1.0, 0.0, 0.0, 1.0, 
    0.3, -0.3, 1.0, 0.0, 0.0, 1.0, 
    -0.3, -0.3, 1.0, 0.0, 0.0, 1.0, ],

    // triangle 2, green
    [-0.3, 0.3, 0.0, 1.0, 0.0, 1.0, 
    0.3, -0.4, 0.0, 1.0, 0.0, 1.0, 
    0.7, 0.3, 0.0, 1.0, 0.0, 1.0, ],

    // triangle 3, blue
    [-0.3, 0.7, 0.0, 0.0, 1.0, 1.0, 
    0.3, -0.6, 0.0, 0.0, 1.0, 1.0, 
    -0.7, 0.7, 0.0, 0.0, 1.0, 1.0,]
];

const createVertexBuffer = (device) => (vertsArr) => {
    const verts = new Float32Array(vertsArr);
    const vertexBuffer = device.createBuffer({
        size: verts.byteLength,
        usage: GPUBufferUsage.VERTEX,
        mappedAtCreation: true,
    });

    new Float32Array(vertexBuffer.getMappedRange()).set(verts);
    vertexBuffer.unmap();

    return vertexBuffer;
};

function createVertexBuffers(device) {
    return vertices.map(createVertexBuffer(device));
}

export async function init() {
    const adapter = await getAdapter();
    const device = await getDevice(adapter);

    const { canvas, ctx } = getCanvasAndContext(device);
    const pipeline = await createPipeline(device);

    const vertexBuffers = createVertexBuffers(device);

    return {
        device,
        canvas,
        ctx,
        pipeline,
        vertexBuffers,
    };
}

function renderPasses(scene) {
    const { device, ctx, pipeline, vertexBuffers } = scene;
    const commandEncoder = device.createCommandEncoder();

    for (let i = 0; i < vertexBuffers.length; i++) {
        const vertexBuffer = vertexBuffers[i];

        const renderPassDescriptor = {
            colorAttachments: [
                {
                    view: ctx.getCurrentTexture().createView(),
                    clearValue: { r: 0.7, g: 0.7, b: 0.7, a: 1.0 },
                    loadOp: i === 0 ? "clear" : "load",
                    storeOp: "store",
                },
            ],
        };

        const passEncoder =
            commandEncoder.beginRenderPass(renderPassDescriptor);

        passEncoder.setPipeline(pipeline);
        passEncoder.setVertexBuffer(0, vertexBuffer);

        passEncoder.draw(3, 1, 0, 0);

        passEncoder.end();
    }

    device.queue.submit([commandEncoder.finish()]);
}

export async function main() {
    const scene = await init();

    renderPasses(scene);
}

document.addEventListener("DOMContentLoaded", main);
