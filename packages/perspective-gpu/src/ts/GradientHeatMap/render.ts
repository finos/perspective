import { View } from "@finos/perspective";
import chroma from "chroma-js";

// Number of rows to render per pass
const COL_SELECTION_LENGTH = 100_000;

function typedArrayToWGSLType(arr: any) {
    const name = arr.constructor.name;

    switch (name) {
        case "Float32Array":
        case "Float64Array":
            return "f32";

        case "Uint8Array":
        case "Uint16Array":
        case "Uint32Array":
            return "u32";

        case "Int8Array":
        case "Int16Array":
        case "Int32Array":
            return "i32";

        default:
            throw new Error(`Unknown array type: ${name}`);
    }
}

export function configureGPUContext(
    ctx: GPUCanvasContext,
    device: GPUDevice,
    format: GPUTextureFormat
) {
    ctx.configure({
        device,
        format,
        alphaMode: "premultiplied",
        usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_SRC,
    });
}

export type ColSection<T> = {
    data: T;
    bufferSize: number;
};

export type ViewObject = {
    name: string;
    axisName: string;
    index: number;
    colPath: string;
    colArr: Float32Array; // Typed Array??
    colSections: ColSection<Float32Array>[]; // Typed Array??
    min: number;
    max: number;
    colType: string;
    shaderType: string;
};

const AXIS_NAMES = ["x", "y", "z", "w"];

export async function createViewObjects(view: View): Promise<ViewObject[]> {
    // @ts-ignore
    const colPaths: string[] = await view.column_paths(); // e.g ["Row ID", "Postal Code"]
    const viewSchema = await view.schema(); // e.g { "Row ID": "integer", "Postal Code": "string"}

    const paths = colPaths.slice(0, 2).filter((colPath) => {
        const colType = viewSchema[colPath];
        return colType === "integer" || colType === "float";
    });

    // For now only using the first two columns
    const viewObjects = await Promise.all(
        paths.map(async (colPath, index): Promise<ViewObject> => {
            // TODO: Handle other types, such as "string".
            //       for now only dealing with number columns.
            const colType = viewSchema[colPath];
            // @ts-ignore
            let [colArr, ,] = await view.col_to_js_typed_array(colPath);

            // @ts-ignore // This needs to be added to perspective
            let [min, max] = await view.get_min_max(colPath);

            // There is no support for FLoat64Array in WebGPU
            if (colArr.constructor.name === "Float64Array") {
                colArr = new Float32Array(colArr);
            }

            const sectionsCount = Math.ceil(
                colArr.length / COL_SELECTION_LENGTH
            );

            const colSections: ColSection<Float32Array>[] = [];

            for (let i = 0; i < sectionsCount; i++) {
                const start = i * COL_SELECTION_LENGTH;
                const end = start + COL_SELECTION_LENGTH;
                const data = colArr.slice(start, end);

                colSections.push({
                    data,
                    bufferSize: data.byteLength,
                });
            }

            return {
                name: colPath.toLowerCase().replace(" ", "_"),
                axisName: AXIS_NAMES[index],
                index,
                colPath,
                colArr,
                colSections,
                min,
                max,
                colType,
                shaderType: typedArrayToWGSLType(colArr),
            };
        })
    );

    return viewObjects;
}

type BindGroupCell = {
    colSection: ColSection<Float32Array>;
    min: number;
    max: number;
    buffer: GPUBuffer;
    bindGroupEntry: GPUBindGroupEntry;
};

type BindGroupRow = {
    cells: BindGroupCell[];
    bindGroup: GPUBindGroup;
};

function createRowBindGroupLayout(device: GPUDevice) {
    return device.createBindGroupLayout({
        entries: [
            {
                binding: 0,
                visibility: GPUShaderStage.FRAGMENT,
                buffer: {
                    type: "read-only-storage",
                },
            },
            {
                binding: 1,
                visibility: GPUShaderStage.FRAGMENT,
                buffer: {
                    type: "read-only-storage",
                },
            },
        ],
    });
}

function createBindGroups(
    device: GPUDevice,
    viewObjects: ViewObject[],
    layout: GPUBindGroupLayout
): BindGroupRow[] {
    if (viewObjects.length === 0) {
        return [];
    }

    const colSectionCount = viewObjects[0].colSections.length;

    let rows: BindGroupRow[] = [];
    for (let rowIndex = 0; rowIndex < colSectionCount; rowIndex++) {
        const cells: BindGroupCell[] = viewObjects.map(
            ({ colSections, min, max }, i) => {
                const colSection = colSections[rowIndex];
                const buffer = device.createBuffer({
                    size: colSection.bufferSize,
                    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
                });

                device.queue.writeBuffer(buffer, 0, colSection.data);

                return {
                    colSection,
                    min,
                    max,
                    buffer,
                    bindGroupEntry: {
                        binding: i,
                        resource: {
                            buffer,
                        },
                    },
                };
            }
        );

        let row = {
            cells,
            bindGroup: device.createBindGroup({
                layout,
                entries: cells.map(({ bindGroupEntry }) => bindGroupEntry),
            }),
        };

        rows.push(row);
    }

    return rows;
}

function createShaderSrc(viewObjects: ViewObject[]) {
    const shaderSrc = `
    struct VertexOutput {
        @builtin(position) position : vec4<f32>,
        @location(0) tex_coord : vec2<f32>,
    }

    struct ShaderConfig {
        heat_max: f32,
        point_size: f32,
        intensity: f32,
        canvas_width: f32,
        canvas_height: f32,
    }

    // Bind Groups
    ${viewObjects
        .map(
            ({ axisName, shaderType }, i) =>
                `@group(0) @binding(${i}) var <storage, read> ${axisName}_values: array<${shaderType}>;`
        )
        .join("\n")}

    @group(1) @binding(0) var our_sampler: sampler;
    @group(1) @binding(1) var our_texture: texture_2d<f32>;

    @group(2) @binding(0) var <uniform> shader_config: ShaderConfig;

    fn uv_norm(x: f32, min: f32, max: f32) -> f32 {
        return (x - min) / (max - min);
    }

    fn gradient(w: f32, uv: vec2<f32>) -> vec3<f32> {
        let w_ = pow(clamp(w, 0., 1.) * 3.14159 * .5, .9);
        let c = vec3<f32>(sin(w_), sin(w_ * 2.), cos(w_)) * 1.1;
        return mix(textureSample(our_texture, our_sampler, uv).rgb, c, w_);
    }

    @vertex
    fn vertex_main(
        @builtin(vertex_index) vert_index : u32,
    ) -> VertexOutput {
        let pos1 = array<vec2f, 6>(
          // 1st triangle
          vec2f( -1., -1.),  
          vec2f(  1., -1.), 
          vec2f( -1.,  1.), 
      
          // 2st triangle
          vec2f( -1.,  1.),
          vec2f(  1., -1.),
          vec2f(  1.,  1.),
        );

        var pos2 = array<vec2f, 6>(
          // 1st triangle
          vec2f( 0.0,  1.0),
          vec2f( 1.0,  1.0),
          vec2f( 0.0,  0.0),

          // 2st triangle
          vec2f( 0.0,  0.0),
          vec2f( 1.0,  1.0),
          vec2f( 1.0,  0.0),
        );

        var output: VertexOutput;

        output.position = vec4<f32>(pos1[vert_index], 0., 1.);
        output.tex_coord = pos2[vert_index];

        return output;
    }

    @fragment
    fn frag_main(vo: VertexOutput) -> @location(0) vec4<f32> {
        let resolution = vec2<f32>(shader_config.canvas_width, shader_config.canvas_height);
        
        ${viewObjects
            .map(
                ({ axisName, min, max }) =>
                    `
        let ${axisName}_min = f32(${min}); 
        let ${axisName}_max = f32(${max});`
            )
            .join("\n")}

        ${
            viewObjects.length >= 2
                ? `
        let uv = vo.tex_coord;
        let points_count = arrayLength(&x_values); // u32

        var d = 0.;
        for (var i = 0u; i < points_count; i++) {
            let x = f32(x_values[i]);
            let y = f32(y_values[i]);
            let x_norm = uv_norm(x, x_min, x_max);
            let y_norm = uv_norm(y, y_min, y_max);

            let p = vec2<f32>(x_norm, 1. - y_norm);

            let pd = (1. - length(uv - p.xy) / shader_config.point_size) * shader_config.intensity;

            d += pow(max(0., pd), 2.);
        }

        return vec4<f32>(gradient(d, uv), 1.);
        `
                : `return vec4<f32>(1., 1., 1., 1.);`
        }
    }
    `;

    return shaderSrc;
}

function createPipelineLayout(
    device: GPUDevice,
    rowsBindGroupLayouts: GPUBindGroupLayout
) {
    const group1 = device.createBindGroupLayout({
        entries: [
            {
                binding: 0,
                visibility: GPUShaderStage.FRAGMENT,
                sampler: {},
            },
            {
                binding: 1,
                visibility: GPUShaderStage.FRAGMENT,
                texture: {},
            },
        ],
    });

    const group2 = device.createBindGroupLayout({
        entries: [
            {
                binding: 0,
                visibility: GPUShaderStage.FRAGMENT,
                buffer: {},
            },
        ],
    });

    return device.createPipelineLayout({
        bindGroupLayouts: [rowsBindGroupLayouts, group1, group2],
    });
}

function createPipeline(
    device: GPUDevice,
    shaderSrc: string,
    layout: GPUPipelineLayout
) {
    const pipeline = device.createRenderPipeline({
        layout,
        vertex: {
            module: device.createShaderModule({ code: shaderSrc }),
            entryPoint: "vertex_main",
        },
        fragment: {
            module: device.createShaderModule({ code: shaderSrc }),
            entryPoint: "frag_main",
            targets: [
                {
                    format: navigator.gpu.getPreferredCanvasFormat(),
                    blend: {
                        color: {
                            srcFactor: "src-alpha",
                            dstFactor: "one-minus-src-alpha",
                        },
                        alpha: {
                            srcFactor: "one",
                            dstFactor: "one",
                        },
                    },
                },
            ],
        },
    });

    return pipeline;
}

function createShaderUniformBuffer(device: GPUDevice) {
    const uniformBuffer = device.createBuffer({
        label: "shader_uniform_buffer",
        size: 5 * 4,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    return uniformBuffer;
}

function setShaderUniformBuffer(
    device: GPUDevice,
    buffer: GPUBuffer,
    options: SceneOptions,
    canvasWidth: number,
    canvasHeight: number
) {
    const uniformValues = new Float32Array([
        options.heatMax,
        options.pointSize,
        options.intensity,
        canvasWidth,
        canvasHeight,
    ]);

    device.queue.writeBuffer(buffer, 0, uniformValues);
}

function createShaderUniformBindGroup(
    device: GPUDevice,
    layout: GPUBindGroupLayout,
    buffer: GPUBuffer
) {
    const bindGroup = device.createBindGroup({
        label: "uniform_bind_group",
        layout,
        entries: [
            {
                binding: 0,
                resource: {
                    buffer,
                },
            },
        ],
    });

    return bindGroup;
}

export function clearCompositingTexture(
    device: GPUDevice,
    texture: GPUTexture,
    canvas: HTMLCanvasElement,
    colorArr: [number, number, number, number]
) {
    const data = new Array(canvas.width * canvas.height)
        .fill(0)
        .flatMap(() => colorArr);

    device.queue.writeTexture(
        { texture },
        new Uint8Array(data),
        { bytesPerRow: canvas.width * 4 },
        { width: canvas.width, height: canvas.height }
    );
}

export function createCompositingTexture(
    device: GPUDevice,
    canvas: HTMLCanvasElement,
    backgroundColor: [number, number, number, number]
) {
    const texture = device.createTexture({
        size: [canvas.width, canvas.height],
        format: navigator.gpu.getPreferredCanvasFormat(),
        usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
    });

    clearCompositingTexture(device, texture, canvas, backgroundColor);

    return texture;
}

export function createTextureBindGroup(
    device: GPUDevice,
    layout: GPUBindGroupLayout,
    texture: GPUTexture,
    sampler: GPUSampler
) {
    return device.createBindGroup({
        label: "texture_bind_group",
        layout,
        entries: [
            { binding: 0, resource: sampler },
            { binding: 1, resource: texture.createView() },
        ],
    });
}

export function createSampler(device) {
    return device.createSampler({
        addressModeU: "clamp-to-edge",
        addressModeV: "clamp-to-edge",
        magFilter: "nearest",
    });
}

export function setCanvasDimensions(canvas) {
    const { width, height } = canvas.getBoundingClientRect();

    canvas.width = width;
    canvas.height = height;
}

export type GradientHeatMapScene = {
    adapter: GPUAdapter;
    device: GPUDevice;
    context: GPUCanvasContext;
    format: GPUTextureFormat;
    viewObjects: ViewObject[];
    shaderSrc: string;
    rows: BindGroupRow[];
    rowsBindGroupLayout: GPUBindGroupLayout;
    texture: GPUTexture;
    textureBindGroup: GPUBindGroup;
    shaderUniformBuffer: GPUBuffer;
    shaderUniformBindGroup: GPUBindGroup;
    pipelineLayout: GPUPipelineLayout;
    pipeline: GPURenderPipeline;
};

export type SceneOptions = {
    heatMax: number;
    pointSize: number;
    intensity: number;
    backgroundColor: [number, number, number, number];
};

export async function createScene(
    canvas: HTMLCanvasElement,
    view: View,
    sceneOptions: SceneOptions
): Promise<GradientHeatMapScene> {
    const viewObjects = await createViewObjects(view);

    const adapter = await navigator.gpu.requestAdapter({
        powerPreference: "high-performance",
    });

    const device = await adapter.requestDevice();
    const format = navigator.gpu.getPreferredCanvasFormat();
    const context = canvas.getContext("webgpu");

    setCanvasDimensions(canvas);
    configureGPUContext(context, device, format);

    const shaderSrc = createShaderSrc(viewObjects);
    const rowsBindGroupLayout = createRowBindGroupLayout(device);
    const rows = createBindGroups(device, viewObjects, rowsBindGroupLayout);
    const pipelineLayout = createPipelineLayout(device, rowsBindGroupLayout);
    const pipeline = createPipeline(device, shaderSrc, pipelineLayout);

    const texture = createCompositingTexture(
        device,
        canvas,
        sceneOptions.backgroundColor
    );
    const sampler = createSampler(device);
    const textureBindGroup = createTextureBindGroup(
        device,
        pipeline.getBindGroupLayout(1),
        texture,
        sampler
    );

    const shaderUniformBuffer = createShaderUniformBuffer(device);

    setShaderUniformBuffer(
        device,
        shaderUniformBuffer,
        sceneOptions,
        canvas.width,
        canvas.height
    );

    const shaderUniformBindGroup = createShaderUniformBindGroup(
        device,
        pipeline.getBindGroupLayout(2),
        shaderUniformBuffer
    );

    const scene = {
        adapter,
        device,
        context,
        format,
        viewObjects,
        shaderSrc,
        rows,
        rowsBindGroupLayout,
        texture,
        textureBindGroup,
        shaderUniformBuffer,
        shaderUniformBindGroup,
        pipelineLayout,
        pipeline,
    };

    return scene;
}

export async function updateScene(
    scene: GradientHeatMapScene,
    view: View,
    sceneOptions: SceneOptions
) {
    const {
        device,
        context,
        shaderUniformBuffer,
        pipelineLayout,
        rowsBindGroupLayout,
    } = scene;

    const viewObjects = await createViewObjects(view);

    if (viewObjects.length < 2) {
        return {
            ...scene,
            viewObjects,
        };
    }

    const shaderSrc = createShaderSrc(viewObjects);
    const pipeline = createPipeline(scene.device, shaderSrc, pipelineLayout);

    const rows = createBindGroups(device, viewObjects, rowsBindGroupLayout);

    const texture = createCompositingTexture(
        device,
        context.canvas as HTMLCanvasElement,
        sceneOptions.backgroundColor
    );
    const sampler = createSampler(device);
    const textureBindGroup = createTextureBindGroup(
        device,
        pipeline.getBindGroupLayout(1),
        texture,
        sampler
    );

    setShaderUniformBuffer(
        device,
        shaderUniformBuffer,
        sceneOptions,
        context.canvas.width,
        context.canvas.height
    );

    return {
        ...scene,
        viewObjects,
        shaderSrc,
        rows,
        texture,
        textureBindGroup,
        pipeline,
    };
}

export function renderScene(
    scene: GradientHeatMapScene,
    sceneOptions: SceneOptions
) {
    const {
        device,
        context,
        viewObjects,
        pipeline,
        textureBindGroup,
        texture,
        shaderUniformBindGroup,
    } = scene;

    if (viewObjects.length < 2) {
        clearScene(scene, sceneOptions);
        return;
    }

    clearCompositingTexture(
        device,
        texture,
        context.canvas as HTMLCanvasElement,
        sceneOptions.backgroundColor
    );

    const encoder = device.createCommandEncoder();

    scene.rows.forEach((row, i) => {
        const renderPassDescriptor: GPURenderPassDescriptor = {
            colorAttachments: [
                {
                    view: context.getCurrentTexture().createView(),
                    clearValue: { r: 0.3, g: 1.0, b: 1.0, a: 1.0 },
                    loadOp: i === 0 ? "clear" : "load",
                    storeOp: "store",
                },
            ],
        };

        const passEncoder = encoder.beginRenderPass(renderPassDescriptor);

        passEncoder.setPipeline(pipeline);

        passEncoder.setBindGroup(0, row.bindGroup);
        passEncoder.setBindGroup(1, textureBindGroup);
        passEncoder.setBindGroup(2, shaderUniformBindGroup);
        passEncoder.draw(6);

        passEncoder.end();

        encoder.copyTextureToTexture(
            { texture: context.getCurrentTexture() },
            { texture },
            {
                width: context.canvas.width,
                height: context.canvas.height,
                depthOrArrayLayers: 1,
            }
        );
    });

    device.queue.submit([encoder.finish()]);
}

export async function clearScene(
    scene: GradientHeatMapScene,
    sceneOptions: SceneOptions
) {
    const { device, context } = scene;
    const encoder = device.createCommandEncoder();

    const renderPassDescriptor: GPURenderPassDescriptor = {
        colorAttachments: [
            {
                view: context.getCurrentTexture().createView(),
                clearValue: chroma(sceneOptions.backgroundColor).gl(),
                loadOp: "clear",
                storeOp: "store",
            },
        ],
    };

    const passEncoder = encoder.beginRenderPass(renderPassDescriptor);

    passEncoder.end();

    device.queue.submit([encoder.finish()]);
}
