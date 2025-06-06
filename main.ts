import { App, Notice, Plugin, TFile } from 'obsidian';

interface BulletItem {
	content: string;
	count: number;
	sources: string[];
}

export default class PaperCitationCounterPlugin extends Plugin {

	async onload() {
		this.addCommand({
			id: 'count-bullet-items',
			name: 'Count Bullet Items in Papers Folder',
			callback: () => {
				this.countBulletItems();
			}
		});
	}

	onunload() {
		
	}

	async countBulletItems() {
		try {
			const papersFolder = this.app.vault.getAbstractFileByPath('Papers');
			if (!papersFolder) {
				new Notice('Papers folder not found!');
				return;
			}

			const bulletItems = new Map<string, BulletItem>();
			const markdownFiles = this.app.vault.getMarkdownFiles()
				.filter(file => file.path.startsWith('Papers/'));

			console.log('Found markdown files in Papers folder:', markdownFiles.length);
			console.log('Files:', markdownFiles.map(f => f.path));

			for (const file of markdownFiles) {
				console.log('Processing file:', file.path);
				const content = await this.app.vault.read(file);
				console.log('File content length:', content.length);
				
				const fileBulletItems = this.parseBulletItems(content);
				console.log('Bullet items found in', file.path, ':', fileBulletItems.length);
				
				for (const item of fileBulletItems) {
					const key = item.trim();
					
					if (bulletItems.has(key)) {
						const existing = bulletItems.get(key)!;
						existing.count++;
						existing.sources.push(file.basename);
					} else {
						bulletItems.set(key, {
							content: key,
							count: 1,
							sources: [file.basename]
						});
					}
				}
			}

			console.log('Total unique bullet items collected:', bulletItems.size);
			const report = this.generateReport(Array.from(bulletItems.values()));
			await this.createReportFile(report);
			new Notice('Bullet item analysis complete!');
			
		} catch (error) {
			new Notice('Error analyzing bullet items: ' + error.message);
			console.error('Bullet item analysis error:', error);
		}
	}

	parseBulletItems(content: string): string[] {
		const lines = content.split('\n');
		const bulletLines = lines.filter(line => {
			const trimmed = line.trim();
			return trimmed.startsWith('- ') && trimmed.length > 2;
		});
		
		console.log('Raw bullet lines found:', bulletLines.length);
		console.log('Sample bullet lines:', bulletLines.slice(0, 5));
		
		const bulletItems = bulletLines.map(line => {
			return line.trim().substring(2).trim();
		});
		
		return bulletItems;
	}

	generateReport(bulletItems: BulletItem[]): string {
		const sortedItems = bulletItems.sort((a, b) => b.count - a.count);
		const totalUnique = bulletItems.length;
		const totalInstances = bulletItems.reduce((sum, item) => sum + item.count, 0);
		const maxCount = Math.max(...bulletItems.map(item => item.count));
		const multipleItems = bulletItems.filter(item => item.count > 1).length;

		let report = `# Bullet Item Analysis\n`;
		report += `Generated: ${new Date().toISOString().split('T')[0]}\n`;
		report += `Source: Papers folder\n\n`;
		report += `## Most Common Items\n\n`;

		for (let i = 0; i < Math.min(20, sortedItems.length); i++) {
			const item = sortedItems[i];
			report += `${i + 1}. **${item.content}** (${item.count}회)\n`;
			report += `   - Sources: ${item.sources.join(', ')}\n\n`;
		}

		report += `## Statistics\n`;
		report += `- Total unique items: ${totalUnique}\n`;
		report += `- Total item instances: ${totalInstances}\n`;
		report += `- Most frequent: ${maxCount} times\n`;
		report += `- Items appearing multiple times: ${multipleItems}\n`;

		return report;
	}

	async createReportFile(report: string) {
		const fileName = `Bullet Item Analysis ${new Date().toISOString().split('T')[0]}.md`;
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
