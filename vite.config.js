import {defineConfig} from 'vite';
export default defineConfig({base:'./',esbuild:{jsx:'automatic'},build:{target:'es2020',outDir:'dist',emptyOutDir:true,assetsInlineLimit:0}});
