import { terser } from "rollup-plugin-terser";

export default {
    input: "src/flashload.js",
    output: [
        { file: "src/flashload.min.js", format: "cjs", plugins: [terser()] },
    ],
};