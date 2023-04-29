import esbuild from 'esbuild'

import { execSync } from 'node:child_process'
import fs from 'node:fs'
import url from 'node:url'
import { join as join_path, dirname, isAbsolute as is_absolute } from 'node:path'

const __filename = url.fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const main = async({ entry_point, argv }) => {
	await build({
		entry_point,
		argv,
	})
}

const build = async({ entry_point, argv }) => {
	const result = await esbuild.build({
		entryPoints: [ entry_point ],
		bundle: true,
		splitting: false,
		treeShaking: true,
		platform: `node`,
		target: `node18`,
		format: `esm`,
		resolveExtensions: [ `.ts`, `.js`, `.json`, `.mjs`, `.cjs` ],
		minify: false,
		// sourcemap: `inline`, // enable this when https://github.com/nodejs/node/issues/46454 gets fixed
		write: false,
		external: [
			// todo: allow this to be passed in via cli args maybe?
			// if it can be done without making it difficult to pass cli args to the real script
		],
		banner: {
			js: `import { createRequire } from 'module'; const require = createRequire(${ JSON.stringify(import.meta.url) });`,
		},
		define: {
			'process.env': JSON.stringify(process.env),
		},
		plugins: [
			{
				name: `import.meta.url`,
				setup({ onLoad }) {
					onLoad({ filter: /\.mjs$/, namespace: `file` }, args => {
						let code = fs.readFileSync(args.path, `utf8`)
						code = code.replace(
							/\bimport\.meta\.url\b/g,
							JSON.stringify(url.pathToFileURL(args.path)),
						)
						return { contents: code }
					})
				},
			},
		],
	})

	const bundled_js_buffer = Buffer.concat(result.outputFiles.map(({ contents }) => contents))

	// My best solution at the moment – references to import.meta.url
	// in .ts files will resolve to the root directory, not the actual directory
	// that contains the TS file
	const bundled_js_string = bundled_js_buffer.toString().replace(
		/\bimport\.meta\.url\b/g,
		JSON.stringify(url.pathToFileURL(__filename)),
	).replace(
		/\bprocess.argv\b/g,
		`(${ JSON.stringify(argv) })`,
	)

	// useful for debugging since the sourcemap isn't working
	// fs.writeFileSync(join_path(__dirname, `build_and_execute.generated.mjs`), bundled_js_string)

	execSync(`node --enable-source-maps --input-type=module`, {
		input: bundled_js_string,
		stdio: [ `pipe`, `inherit`, `inherit` ],
	})
}

const [ node, , entry_point, ...rest ] = process.argv

const argv_entry_point = is_absolute(entry_point)
	? entry_point
	: join_path(__dirname, entry_point)

const argv = [ node, argv_entry_point, ...rest ]

main({ entry_point, argv }).catch(error => {
	console.error(error.message)
	console.error(error.stack)
	process.exit(1)
})
