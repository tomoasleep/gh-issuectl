import { describe, expect, it } from "bun:test";
import { patchSection, SectionNotFoundError } from "./section";

describe("patchSection", () => {
	it("should replace content of existing section", () => {
		const body = `## What

Old content for What.

## Why

Reason here.`;

		const result = patchSection(body, "What", "New content for What.");

		expect(result).toBe(`## What

New content for What.

## Why

Reason here.`);
	});

	it("should throw SectionNotFoundError when section does not exist", () => {
		const body = `## What

Some content.`;

		expect(() => patchSection(body, "NonExistent", "New content")).toThrow(
			SectionNotFoundError,
		);
	});

	it("should handle section with trailing content only", () => {
		const body = `## What

Content here.`;

		const result = patchSection(body, "What", "Replaced content.");

		expect(result).toBe(`## What

Replaced content.`);
	});

	it("should replace section including subsections", () => {
		const body = `## What

Content for What.

### Details

Details here.

## Why

Reason.`;

		const result = patchSection(body, "What", "New what content.");

		expect(result).toBe(`## What

New what content.

## Why

Reason.`);
	});

	it("should handle ### heading as subsection of ##", () => {
		const body = `## What

Main description.

### Details

Detail content.

## Why

Reason.`;

		const result = patchSection(body, "Details", "Updated details.");

		expect(result).toBe(`## What

Main description.

### Details

Updated details.

## Why

Reason.`);
	});

	it("should handle empty body with section creation when allowCreate is true", () => {
		const body = "";

		const result = patchSection(body, "What", "New content.", true);

		expect(result).toBe(`## What

New content.`);
	});

	it("should preserve exact heading format from original", () => {
		const body = `##  What  

Some content.`;

		const result = patchSection(body, "What", "New content.");

		expect(result).toBe(`##  What  

New content.`);
	});

	it("should match section case-sensitively", () => {
		const body = `## What

Content.`;

		expect(() => patchSection(body, "what", "New content.")).toThrow(
			SectionNotFoundError,
		);
	});
});
