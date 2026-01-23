import { defineConfig } from 'rollup';
import terser from '@rollup/plugin-terser';

export default defineConfig({
    input: 'src/AnimeCursor.js',
    output: [
        {
            file: 'dist/anime-cursor.esm.js',
            format: 'esm'
        },
        {
            file: 'dist/anime-cursor.umd.js',
            format: 'umd',
            name: 'AnimeCursor'
        },
        {
            file: 'dist/anime-cursor.umd.min.js',
            format: 'umd',
            name: 'AnimeCursor',
            plugins: [terser()]
        }
    ]
});
