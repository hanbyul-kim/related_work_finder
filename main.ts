import { App, Notice, Plugin, TFile } from 'obsidian';

interface PaperCitation {
	authors: string;
	year: string;
	title: string;
	count: number;
	sources: string[];
}

export default class PaperCitationCounterPlugin extends Plugin {

	async onload() {
		this.addCommand({
			id: 'count-paper-citations',
			name: 'Count Paper Citations in Papers Folder',
			callback: () => {
				this.countPaperCitations();
			}
		});
	}

	onunload() {
		
	}

	async countPaperCitations() {
		try {
			const papersFolder = this.app.vault.getAbstractFileByPath('Papers');
			if (!papersFolder) {
				new Notice('Papers folder not found!');
				return;
			}

			const citations = new Map<string, PaperCitation>();
			const markdownFiles = this.app.vault.getMarkdownFiles()
				.filter(file => file.path.startsWith('Papers/'));

			console.log('Found markdown files in Papers folder:', markdownFiles.length);
			console.log('Files:', markdownFiles.map(f => f.path));

			for (const file of markdownFiles) {
				console.log('Processing file:', file.path);
				const content = await this.app.vault.read(file);
				console.log('File content length:', content.length);
				
				const fileCitations = this.parseCitationsFromRelatedWork(content);
				console.log('Citations found in', file.path, ':', fileCitations.length);
				
				for (const citation of fileCitations) {
					const key = `${citation.authors}, ${citation.year}`;
					
					if (citations.has(key)) {
						const existing = citations.get(key)!;
						existing.count++;
						existing.sources.push(file.basename);
					} else {
						citations.set(key, {
							...citation,
							count: 1,
							sources: [file.basename]
						});
					}
				}
			}

			console.log('Total unique citations collected:', citations.size);
			const report = this.generateReport(Array.from(citations.values()));
			await this.createReportFile(report);
			new Notice('Paper citation analysis complete!');
			
		} catch (error) {
			new Notice('Error analyzing citations: ' + error.message);
			console.error('Citation analysis error:', error);
		}
	}

	parseCitationsFromRelatedWork(content: string): Omit<PaperCitation, 'count' | 'sources'>[] {
		const relatedWorkMatch = content.match(/## Related work([\s\S]*?)(?=\n## (?!.*Related work)|$)/i);
		if (!relatedWorkMatch) {
			console.log('No Related work section found');
			return [];
		}

		const relatedWorkSection = relatedWorkMatch[1];
		console.log('Related work section found, length:', relatedWorkSection.length);
		console.log('Related work content preview:', JSON.stringify(relatedWorkSection.substring(0, 300)));
		
		const lines = relatedWorkSection.split('\n');
		const bulletLines = lines.filter(line => {
			const trimmed = line.trim();
			return trimmed.startsWith('- ') && trimmed.length > 2;
		});
		
		console.log('Bullet lines in Related work section:', bulletLines.length);
		console.log('Sample bullet lines:', bulletLines.slice(0, 5));
		
		const citations: Omit<PaperCitation, 'count' | 'sources'>[] = [];
		
		for (const line of bulletLines) {
			const match = line.match(/- (.+?), (\d{4}), (.+)/);
			if (match) {
				console.log('Parsed citation:', match[1], match[2], match[3]);
				citations.push({
					authors: match[1].trim(),
					year: match[2].trim(),
					title: match[3].trim()
				});
			} else {
				console.log('Failed to parse line as citation:', line);
			}
		}
		
		console.log('Total citations parsed:', citations.length);
		return citations;
	}

	generateReport(citations: PaperCitation[]): string {
		const sortedCitations = citations.sort((a, b) => b.count - a.count);
		const totalUnique = citations.length;
		const totalInstances = citations.reduce((sum, c) => sum + c.count, 0);
		const maxCitations = Math.max(...citations.map(c => c.count));
		const multipleCitations = citations.filter(c => c.count > 1).length;

		let report = `# Paper Citation Analysis\n`;
		report += `Generated: ${new Date().toISOString().split('T')[0]}\n`;
		report += `Source: Papers folder - Related work sections\n\n`;
		report += `## Most Cited Papers\n\n`;

		for (let i = 0; i < Math.min(20, sortedCitations.length); i++) {
			const citation = sortedCitations[i];
			report += `${i + 1}. **${citation.authors}, ${citation.year}** (${citation.count}회)\n`;
			report += `   - *${citation.title}*\n`;
			report += `   - Sources: ${citation.sources.join(', ')}\n\n`;
		}

		report += `## Statistics\n`;
		report += `- Total unique citations: ${totalUnique}\n`;
		report += `- Total citation instances: ${totalInstances}\n`;
		report += `- Most cited: ${maxCitations} times\n`;
		report += `- Papers with multiple citations: ${multipleCitations}\n`;

		return report;
	}

	async createReportFile(report: string) {
		const fileName = `Paper Citation Analysis ${new Date().toISOString().split('T')[0]}.md`;
		const filePath = fileName;
		
		try {
			await this.app.vault.create(filePath, report);
		} catch (error) {
			if (error.message.includes('already exists')) {
				const existingFile = this.app.vault.getAbstractFileByPath(filePath) as TFile;
				await this.app.vault.modify(existingFile, report);
			} else {
				throw error;
			}
		}
	}
}
