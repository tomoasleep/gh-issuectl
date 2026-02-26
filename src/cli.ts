import yargs from "yargs";

export async function run(args: string[]): Promise<void> {
	await yargs(args)
		.scriptName("gh-issuectl")
		.command(
			"patch [number]",
			"Patch a section in an issue/PR description",
			{
				number: {
					type: "number",
					describe:
						"Issue/PR number (detects from current branch if not provided)",
				},
				section: {
					alias: "s",
					demandOption: true,
					describe: "Section heading to patch",
					type: "string",
				},
				content: {
					alias: "c",
					describe:
						"New content for the section (reads from stdin if not provided)",
					type: "string",
				},
			},
			async (argv) => {
				const { patch } = await import("./commands/patch.js");
				await patch(argv.number, argv.section, argv.content);
			},
		)
		.demandCommand(1)
		.strict()
		.help()
		.parse();
}
