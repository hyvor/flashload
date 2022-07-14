import { terser } from "rollup-plugin-terser";
import typescript from '@rollup/plugin-typescript';

export default {
    input: "src/index.ts",
    output: [
        {
            file: "dist/flashload.min.js",
            format: "cjs"
        },
    ],
    plugins: [typescript(), terser()]
};