import nodeResolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import terser from '@rollup/plugin-terser';

export default {
	input: './dist/index.js',
	output: {
		name: 'AwayjsView',
		globals: {
			'@awayjs/core': 'AwayjsCore',
			'@awayjs/stage': 'AwayjsStage'
		},
		sourcemap: true,
		format: 'umd',
		file: './bundle/awayjs-view.umd.js'
	},
	external: [
		'@awayjs/core',
		'@awayjs/stage'
	],
	plugins: [
		nodeResolve(),
		commonjs(),
		terser(),
	]
};