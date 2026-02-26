export class SectionNotFoundError extends Error {
	constructor(public sectionName: string) {
		super(`Section "${sectionName}" not found`);
		this.name = "SectionNotFoundError";
	}
}

export function patchSection(
	body: string,
	sectionName: string,
	newContent: string,
	allowCreate: boolean = false,
): string {
	const headingPattern = /^(#{2,})[ \t]+(.+?)[ \t]*$/gm;

	const matches = [...body.matchAll(headingPattern)];

	const targetMatch = matches.find((m) => {
		const title = m[2].trim();
		return title === sectionName;
	});

	if (!targetMatch) {
		if (allowCreate) {
			const newSection = `## ${sectionName}\n\n${newContent}`;
			return body ? `${body}\n\n${newSection}` : newSection;
		}
		throw new SectionNotFoundError(sectionName);
	}

	const headingLevel = targetMatch[1].length;
	const startIndex = targetMatch.index!;
	const headingEndIndex = startIndex + targetMatch[0].length;

	let endIndex = body.length;
	for (const match of matches) {
		const matchLevel = match[1].length;
		if (match.index! > headingEndIndex && matchLevel <= headingLevel) {
			endIndex = match.index!;
			break;
		}
	}

	const beforeSection = body.slice(0, headingEndIndex);
	const afterSection = body.slice(endIndex);

	const trimmedAfter = afterSection.replace(/^\n+/, "");

	if (trimmedAfter) {
		return `${beforeSection}\n\n${newContent}\n\n${trimmedAfter}`;
	} else {
		return `${beforeSection}\n\n${newContent}`;
	}
}
